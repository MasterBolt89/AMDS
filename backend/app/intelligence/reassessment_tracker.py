"""Closed-Loop Reassessment Tracker.

Implements deterministic evaluation of astronaut interventions.
Evaluates outcomes as PENDING, IMPROVED, UNCHANGED, WORSENED, or INSUFFICIENT_DATA
using the astronaut's reference_timestamp and valid follow-up telemetry.
"""

from datetime import datetime
from typing import Optional
from app.models.enums import ReassessmentOutcome, RecommendationStatus
from app.models.db_models import RecommendationModel, MetricRecordModel


def evaluate_reassessment_outcome(
    rec: RecommendationModel,
    reference_timestamp: datetime,
    metric_records: list[MetricRecordModel],
    baseline_mean: float,
    baseline_std: float,
    epsilon: float = 1e-6,
) -> ReassessmentOutcome:
    """Evaluates the outcome of an acknowledged recommendation.

    - If not acknowledged or reference_timestamp < reassess_after -> PENDING
    - If reference_timestamp >= reassess_after and no valid follow-up after acknowledged_at -> INSUFFICIENT_DATA
    - If follow-up exists:
        Compares distance from baseline mean at trigger vs follow-up.
    """
    if rec.status not in ["ACKNOWLEDGED", "RESOLVED"] or rec.acknowledged_at is None:
        return ReassessmentOutcome.PENDING

    if rec.reassess_after is None or reference_timestamp < rec.reassess_after:
        return ReassessmentOutcome.PENDING

    # Find valid measurements for target_metric after acknowledged_at
    followup_records = [
        r for r in metric_records
        if r.metric_name == rec.target_metric
        and r.timestamp > rec.acknowledged_at
        and r.quality == "VALID"
        and r.value is not None
    ]

    if not followup_records:
        return ReassessmentOutcome.INSUFFICIENT_DATA

    # Take the latest valid follow-up
    latest_followup = max(followup_records, key=lambda x: x.timestamp)
    rec.latest_followup_value = latest_followup.value

    # Evaluate distance shift
    trigger_val = rec.baseline_at_trigger if rec.baseline_at_trigger is not None else baseline_mean
    eff_std = max(baseline_std, 1.0, epsilon)  # At least 1.0 or effective std for unit scaling

    d_initial = abs(trigger_val - baseline_mean)
    d_followup = abs(latest_followup.value - baseline_mean)

    # Outcome thresholds: 0.5 sigma improvement / worsening
    improvement_margin = 0.5 * eff_std

    if d_followup < d_initial - improvement_margin:
        return ReassessmentOutcome.IMPROVED
    elif d_followup > d_initial + improvement_margin:
        return ReassessmentOutcome.WORSENED
    else:
        return ReassessmentOutcome.UNCHANGED
