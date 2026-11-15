"""Unit Tests for Statistical Baseline Engine & Drift Detection."""

from datetime import datetime, timedelta
import pytest
from app.models.db_models import MetricRecordModel
from app.models.enums import DomainId, AssessmentStatus
from app.intelligence.baseline_engine import compute_metric_baseline, compute_z_score
from app.intelligence.drift_detector import evaluate_domain


def test_zero_variance_protection():
    """Confirms that zero-variance identical samples do not raise ZeroDivisionError."""
    # All values identical (std = 0)
    records = [
        MetricRecordModel(
            astronaut_id="astro-1",
            domain_id=DomainId.CARDIOVASCULAR.value,
            metric_name="resting_hr_bpm",
            timestamp=datetime(2026, 11, 14, 12, 0, 0),
            value=60.0,
            quality="VALID",
            unit="bpm",
        )
        for _ in range(10)
    ]

    baseline = compute_metric_baseline(records)
    assert baseline.mean == 60.0
    assert baseline.std_dev == 0.0
    assert baseline.sample_count == 10
    assert baseline.window_label == "Personal Rolling Baseline (14d experimental window)"
    assert baseline.is_validated_standard is False

    # Value equal to mean: Z = 0
    z_identical = compute_z_score(60.0, baseline.mean, baseline.std_dev)
    assert z_identical == 0.0

    # Value differing from mean when std = 0: uses effective floor without ZeroDivisionError
    z_diff = compute_z_score(65.0, baseline.mean, baseline.std_dev)
    assert z_diff > 0.0


def test_suspect_and_missing_records_filtered_from_baseline():
    """Confirms that SUSPECT, MISSING, and NULL records are excluded from baseline calculations."""
    records = [
        MetricRecordModel(
            astronaut_id="astro-1",
            domain_id=DomainId.SLEEP_CIRCADIAN.value,
            metric_name="sleep_duration_hours",
            timestamp=datetime(2026, 11, 14, 12, 0, 0),
            value=7.0,
            quality="VALID",
            unit="hours",
        ),
        MetricRecordModel(
            astronaut_id="astro-1",
            domain_id=DomainId.SLEEP_CIRCADIAN.value,
            metric_name="sleep_duration_hours",
            timestamp=datetime(2026, 11, 14, 13, 0, 0),
            value=9.0,
            quality="VALID",
            unit="hours",
        ),
        MetricRecordModel(
            astronaut_id="astro-1",
            domain_id=DomainId.SLEEP_CIRCADIAN.value,
            metric_name="sleep_duration_hours",
            timestamp=datetime(2026, 11, 14, 14, 0, 0),
            value=25.0,  # Extreme outlier
            quality="SUSPECT",
            unit="hours",
        ),
        MetricRecordModel(
            astronaut_id="astro-1",
            domain_id=DomainId.SLEEP_CIRCADIAN.value,
            metric_name="sleep_duration_hours",
            timestamp=datetime(2026, 11, 14, 15, 0, 0),
            value=None,
            quality="MISSING",
            unit="hours",
        ),
    ]

    baseline = compute_metric_baseline(records)
    assert baseline.sample_count == 2
    assert baseline.mean == 8.0  # (7.0 + 9.0) / 2


def test_staleness_and_cadence_evaluation():
    """Confirms that telemetry older than stale_after_hours relative to reference_timestamp evaluates to INSUFFICIENT_DATA."""
    ref_time = datetime(2026, 11, 14, 18, 0, 0)
    # Stale record: 10 hours old (cardiovascular stale_after_hours is 4h)
    records = [
        MetricRecordModel(
            astronaut_id="astro-1",
            domain_id=DomainId.CARDIOVASCULAR.value,
            metric_name="resting_hr_bpm",
            timestamp=ref_time - timedelta(hours=10 + i),
            value=62.0 + (i % 2),
            quality="VALID",
            unit="bpm",
        )
        for i in range(15)
    ]

    ev = evaluate_domain(DomainId.CARDIOVASCULAR, records, reference_timestamp=ref_time)
    assert ev.status == AssessmentStatus.INSUFFICIENT_DATA
    assert "stale" in ev.status_reason.lower()

