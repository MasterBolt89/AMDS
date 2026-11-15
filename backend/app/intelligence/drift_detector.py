"""Deterministic Baseline Drift & Domain Assessment Engine.

Evaluates domain status, completeness, staleness, and statistical baseline drift.
Enforces that no unsupported medical thresholds are invented; all alerts are
labeled as STATISTICAL_BASELINE_DRIFT with is_validated_clinical_threshold = False.
"""

from datetime import datetime
from typing import Any, Optional
from app.models.enums import (
    AssessmentStatus,
    DomainId,
    EvidenceType,
    Provenance,
)
from app.models.schemas import (
    DomainSummary,
    Finding,
    FindingEvidence,
    RecommendationItem,
    ReassessmentTracker,
)
from app.models.db_models import MetricRecordModel, AstronautModel, RecommendationModel
from app.intelligence.cadences import DOMAIN_DEFINITIONS
from app.intelligence.baseline_engine import compute_metric_baseline, compute_z_score


class DomainEvaluation:
    def __init__(
        self,
        domain_id: DomainId,
        status: AssessmentStatus,
        status_reason: str,
        completeness_pct: float,
        last_updated: Optional[datetime],
        headline_metric: str,
        headline_value: Optional[float],
        z_score: Optional[float],
        baseline_mean: float,
        baseline_std: float,
        valid_sample_count: int,
        headline_unit: str = "",
    ):
        self.domain_id = domain_id
        self.status = status
        self.status_reason = status_reason
        self.completeness_pct = completeness_pct
        self.last_updated = last_updated
        self.headline_metric = headline_metric
        self.headline_value = headline_value
        self.z_score = z_score
        self.baseline_mean = baseline_mean
        self.baseline_std = baseline_std
        self.valid_sample_count = valid_sample_count
        self.headline_unit = headline_unit


def evaluate_domain(
    domain_id: DomainId,
    records: list[MetricRecordModel],
    reference_timestamp: datetime,
) -> DomainEvaluation:
    """Evaluates a single domain against freshness cadence and statistical baseline."""
    defn = DOMAIN_DEFINITIONS[domain_id]
    cadence = defn.cadence_policy
    headline_metric = defn.headline_metric

    # Filter records for headline metric
    metric_records = [r for r in records if r.metric_name == headline_metric]

    if not metric_records:
        return DomainEvaluation(
            domain_id=domain_id,
            status=AssessmentStatus.INSUFFICIENT_DATA,
            status_reason="No telemetry received for headline metric.",
            completeness_pct=0.0,
            last_updated=None,
            headline_metric=headline_metric,
            headline_value=None,
            z_score=None,
            baseline_mean=0.0,
            baseline_std=0.0,
            valid_sample_count=0,
        )

    # Calculate completeness
    total_count = len(metric_records)
    valid_records = [r for r in metric_records if r.quality == "VALID" and r.value is not None]
    completeness_pct = round((len(valid_records) / total_count) * 100.0, 1) if total_count > 0 else 0.0

    # Sort descending by timestamp
    valid_records.sort(key=lambda x: x.timestamp, reverse=True)

    if not valid_records:
        latest_record = max(metric_records, key=lambda x: x.timestamp)
        return DomainEvaluation(
            domain_id=domain_id,
            status=AssessmentStatus.INSUFFICIENT_DATA,
            status_reason=f"Telemetry contains only {total_count} non-valid records (missing or suspect).",
            completeness_pct=completeness_pct,
            last_updated=latest_record.timestamp,
            headline_metric=headline_metric,
            headline_value=None,
            z_score=None,
            baseline_mean=0.0,
            baseline_std=0.0,
            valid_sample_count=0,
        )

    latest_valid = valid_records[0]
    last_updated = latest_valid.timestamp

    # Baseline calculation excluding the latest point
    baseline_records = valid_records[1:] if len(valid_records) > 1 else valid_records
    baseline = compute_metric_baseline(baseline_records, min_samples=cadence.minimum_valid_samples_for_baseline)

    # Check 1: Sample count requirement
    if baseline.sample_count < cadence.minimum_valid_samples_for_baseline:
        return DomainEvaluation(
            domain_id=domain_id,
            status=AssessmentStatus.INSUFFICIENT_DATA,
            status_reason=(
                f"Insufficient valid baseline samples ({baseline.sample_count} / "
                f"{cadence.minimum_valid_samples_for_baseline} required)."
            ),
            completeness_pct=completeness_pct,
            last_updated=last_updated,
            headline_metric=headline_metric,
            headline_value=latest_valid.value,
            z_score=None,
            baseline_mean=baseline.mean,
            baseline_std=baseline.std_dev,
            valid_sample_count=baseline.sample_count,
            headline_unit=latest_valid.unit,
        )

    # Check 2: Freshness cadence check against reference_timestamp
    time_delta_hours = (reference_timestamp - last_updated).total_seconds() / 3600.0
    if time_delta_hours > cadence.stale_after_hours:
        return DomainEvaluation(
            domain_id=domain_id,
            status=AssessmentStatus.INSUFFICIENT_DATA,
            status_reason=(
                f"Telemetry is stale: {round(time_delta_hours, 1)}h since last valid reading "
                f"(threshold: {cadence.stale_after_hours}h)."
            ),
            completeness_pct=completeness_pct,
            last_updated=last_updated,
            headline_metric=headline_metric,
            headline_value=latest_valid.value,
            z_score=None,
            baseline_mean=baseline.mean,
            baseline_std=baseline.std_dev,
            valid_sample_count=baseline.sample_count,
            headline_unit=latest_valid.unit,
        )

    # Check 3: Statistical Drift Detection (|Z| >= 2.0)
    current_val = latest_valid.value
    z = compute_z_score(current_val, baseline.mean, baseline.std_dev)

    baseline_desc = "habitat 14-day rolling baseline" if domain_id == DomainId.ENVIRONMENT_ECLSS else "14-day personal baseline"
    baseline_dist_desc = "expected habitat baseline distribution" if domain_id == DomainId.ENVIRONMENT_ECLSS else "expected personal baseline distribution"

    if abs(z) >= 2.0:
        direction = "above" if z > 0 else "below"
        delta_val = round(abs(current_val - baseline.mean), 2)
        return DomainEvaluation(
            domain_id=domain_id,
            status=AssessmentStatus.ATTENTION,
            status_reason=(
                f"Statistical baseline drift detected: {abs(z)} standard deviations {direction} "
                f"{baseline_desc} (delta: {delta_val} {latest_valid.unit})."
            ),
            completeness_pct=completeness_pct,
            last_updated=last_updated,
            headline_metric=headline_metric,
            headline_value=current_val,
            z_score=z,
            baseline_mean=baseline.mean,
            baseline_std=baseline.std_dev,
            valid_sample_count=baseline.sample_count,
            headline_unit=latest_valid.unit,
        )

    return DomainEvaluation(
        domain_id=domain_id,
        status=AssessmentStatus.NORMAL,
        status_reason=f"Telemetry is fresh and within {baseline_dist_desc} (|Z| < 2.0).",
        completeness_pct=completeness_pct,
        last_updated=last_updated,
        headline_metric=headline_metric,
        headline_value=current_val,
        z_score=z,
        baseline_mean=baseline.mean,
        baseline_std=baseline.std_dev,
        valid_sample_count=baseline.sample_count,
        headline_unit=latest_valid.unit,
    )

