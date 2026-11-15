"""Statistical Baseline Engine with Zero-Variance & Quality Guards.

Calculates individualized statistical baselines using valid non-suspect historical points.
Implements the 14-day experimental rolling window and zero-variance protection.
"""

import math
from typing import Optional
from app.models.schemas import DomainMetricBaseline
from app.models.db_models import MetricRecordModel


def compute_metric_baseline(
    records: list[MetricRecordModel],
    min_samples: int = 5,
) -> DomainMetricBaseline:
    """Compute mean, sample standard deviation, and sample count for valid records.

    Filters out SUSPECT and MISSING entries.
    Applies zero-variance protection and labels with the 14d experimental window notice.
    """
    valid_values = [
        r.value for r in records
        if r.quality == "VALID" and r.value is not None
    ]

    n = len(valid_values)
    if n == 0:
        return DomainMetricBaseline(
            window_label="Personal Rolling Baseline (14d experimental window)",
            is_validated_standard=False,
            mean=0.0,
            std_dev=0.0,
            sample_count=0,
        )

    mean = sum(valid_values) / n

    if n > 1:
        variance = sum((x - mean) ** 2 for x in valid_values) / (n - 1)
        std_dev = math.sqrt(variance)
    else:
        std_dev = 0.0

    return DomainMetricBaseline(
        window_label="Personal Rolling Baseline (14d experimental window)",
        is_validated_standard=False,
        mean=round(mean, 2),
        std_dev=round(std_dev, 2),
        sample_count=n,
    )


def compute_z_score(
    value: float,
    mean: float,
    std_dev: float,
    epsilon: float = 1e-6,
) -> float:
    """Computes Z-score with zero-variance protection.

    If std_dev is below epsilon, guards against ZeroDivisionError:
    If value equals mean (within epsilon), Z = 0.0; otherwise uses effective std_dev floor.
    """
    effective_sigma = max(std_dev, epsilon)
    delta = value - mean
    if abs(delta) < epsilon:
        return 0.0
    return round(delta / effective_sigma, 2)

