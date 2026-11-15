"""Domain Detail & Time-Series Endpoints."""

from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.errors import AppError
from app.models.db_models import AstronautModel, MetricRecordModel
from app.models.enums import DomainId, DataQuality, Provenance
from app.models.schemas import (
    DomainDetailResponse,
    DomainMetricDetail,
    MetricSeriesPoint,
)
from app.intelligence.cadences import DOMAIN_DEFINITIONS
from app.intelligence.baseline_engine import compute_metric_baseline
from app.intelligence.drift_detector import evaluate_domain

router = APIRouter()


@router.get("/astronauts/{astronaut_id}/domains/{domain_id}", response_model=DomainDetailResponse)
async def get_domain_detail(
    astronaut_id: str,
    domain_id: str,
    range: str = Query(default="30d", pattern="^(7d|30d|mission)$"),
    session: AsyncSession = Depends(get_db),
) -> DomainDetailResponse:
    """Returns domain status, scope notice, cadence policy, and detailed metric baselines and time-series points."""
    try:
        domain_enum = DomainId(domain_id)
    except ValueError:
        raise AppError(
            code="INVALID_DOMAIN",
            message=f"Domain '{domain_id}' is not recognized. Must be one of {[d.value for d in DomainId]}.",
            status_code=status.HTTP_404_NOT_FOUND,
            field="domain_id",
        )

    res = await session.execute(select(AstronautModel).where(AstronautModel.id == astronaut_id))
    astronaut = res.scalar_one_or_none()
    if astronaut is None:
        raise AppError(
            code="ASTRONAUT_NOT_FOUND",
            message=f"Astronaut with ID '{astronaut_id}' does not exist.",
            status_code=status.HTTP_404_NOT_FOUND,
            field="astronaut_id",
        )

    defn = DOMAIN_DEFINITIONS[domain_enum]

    # Fetch all records for this astronaut and domain
    records_res = await session.execute(
        select(MetricRecordModel)
        .where(
            MetricRecordModel.astronaut_id == astronaut_id,
            MetricRecordModel.domain_id == domain_enum.value,
        )
        .order_by(MetricRecordModel.timestamp.asc())
    )
    all_domain_records = records_res.scalars().all()

    # Domain evaluation
    ev = evaluate_domain(
        domain_id=domain_enum,
        records=all_domain_records,
        reference_timestamp=astronaut.reference_timestamp,
    )

    # Filter records by requested time range relative to reference_timestamp
    if range == "7d":
        cutoff = astronaut.reference_timestamp - timedelta(days=7)
        filtered_records = [r for r in all_domain_records if r.timestamp >= cutoff]
    elif range == "30d":
        cutoff = astronaut.reference_timestamp - timedelta(days=30)
        filtered_records = [r for r in all_domain_records if r.timestamp >= cutoff]
    else:  # mission
        filtered_records = all_domain_records

    # Group by metric_name
    metrics_by_name: dict[str, list[MetricRecordModel]] = {}
    for r in filtered_records:
        metrics_by_name.setdefault(r.metric_name, []).append(r)

    # If domain has no records yet for headline metric, ensure headline metric is represented
    if defn.headline_metric not in metrics_by_name:
        metrics_by_name[defn.headline_metric] = []

    metric_details: list[DomainMetricDetail] = []
    for m_name, recs in metrics_by_name.items():
        # Baseline is calculated across available valid records (up to 30d)
        all_metric_recs = [r for r in all_domain_records if r.metric_name == m_name]
        baseline = compute_metric_baseline(
            all_metric_recs,
            min_samples=defn.cadence_policy.minimum_valid_samples_for_baseline,
        )

        unit = recs[0].unit if recs else (all_metric_recs[0].unit if all_metric_recs else "units")

        series_points = [
            MetricSeriesPoint(
                timestamp=r.timestamp,
                value=r.value,
                quality=DataQuality(r.quality),
                provenance=Provenance(r.provenance),
                sensor_id=r.sensor_id,
                note=r.note,
            )
            for r in recs
        ]

        metric_details.append(
            DomainMetricDetail(
                metric_name=m_name,
                unit=unit,
                baseline=baseline,
                series=series_points,
            )
        )

    return DomainDetailResponse(
        domain_id=domain_enum,
        domain_category=defn.domain_category,
        display_name=defn.display_name,
        status=ev.status,
        measurement_scope_notice=defn.measurement_scope_notice,
        cadence_policy=defn.cadence_policy,
        metrics=metric_details,
    )
