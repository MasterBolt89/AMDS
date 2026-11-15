"""Telemetry Ingestion & Automatic Reassessment Evaluation."""

from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.errors import AppError
from app.models.db_models import (
    AstronautModel,
    MetricRecordModel,
    RecommendationModel,
    AssessmentHistoryModel,
)
from app.models.enums import DomainId, Provenance, RecommendationStatus
from app.models.schemas import (
    BatchTelemetryIngestRequest,
    BatchTelemetryResponse,
)
from app.intelligence.baseline_engine import compute_metric_baseline
from app.intelligence.reassessment_tracker import evaluate_reassessment_outcome

router = APIRouter()


@router.post("/telemetry/batch", response_model=BatchTelemetryResponse)
async def ingest_telemetry_batch(
    payload: BatchTelemetryIngestRequest,
    session: AsyncSession = Depends(get_db),
) -> BatchTelemetryResponse:
    """Ingests a batch of telemetry measurements with strict provenance, modality, and quality validation.

    Automatically triggers closed-loop reassessment evaluation if an acknowledged intervention's
    reassess_after window has elapsed.
    """
    if not payload.measurements:
        raise AppError(
            code="EMPTY_BATCH",
            message="Telemetry batch must contain at least one measurement.",
            status_code=status.HTTP_400_BAD_REQUEST,
            field="measurements",
        )

    # Validate astronaut existence
    astronaut_ids = {m.astronaut_id for m in payload.measurements}
    astro_res = await session.execute(
        select(AstronautModel).where(AstronautModel.id.in_(astronaut_ids))
    )
    existing_astronauts = {a.id: a for a in astro_res.scalars().all()}

    missing_ids = astronaut_ids - set(existing_astronauts.keys())
    if missing_ids:
        raise AppError(
            code="ASTRONAUT_NOT_FOUND",
            message=f"Astronaut IDs not found: {list(missing_ids)}",
            status_code=status.HTTP_404_NOT_FOUND,
            field="astronaut_id",
        )

    ingested_models: list[MetricRecordModel] = []
    latest_timestamps_by_astro: dict[str, datetime] = {}
    touched_metrics_by_astro: dict[str, set[str]] = {}

    for item in payload.measurements:
        rec = MetricRecordModel(
            astronaut_id=item.astronaut_id,
            domain_id=item.domain_id.value,
            metric_name=item.metric_name,
            timestamp=item.timestamp,
            value=item.value,
            unit=item.unit,
            quality=item.quality.value,
            provenance=item.provenance.value,
            modality=item.modality.value,
            sensor_id=item.sensor_id,
            note=item.note,
        )
        ingested_models.append(rec)

        if item.provenance == Provenance.ACTUAL_TELEM:
            curr_max = latest_timestamps_by_astro.get(item.astronaut_id)
            if curr_max is None or item.timestamp > curr_max:
                latest_timestamps_by_astro[item.astronaut_id] = item.timestamp

        touched_metrics_by_astro.setdefault(item.astronaut_id, set()).add(item.metric_name)

    session.add_all(ingested_models)

    # Update reference_timestamp if ACTUAL_TELEM arrived with newer timestamp
    for a_id, t_max in latest_timestamps_by_astro.items():
        astro = existing_astronauts[a_id]
        if t_max > astro.reference_timestamp:
            astro.reference_timestamp = t_max
            astro.active_provenance = Provenance.ACTUAL_TELEM.value

    await session.flush()

    # Reassessment evaluations for affected astronauts
    reassessment_evaluations: list[dict[str, Any]] = []

    for a_id, astronaut in existing_astronauts.items():
        recs_res = await session.execute(
            select(RecommendationModel).where(
                RecommendationModel.astronaut_id == a_id,
                RecommendationModel.status == RecommendationStatus.ACKNOWLEDGED.value,
            )
        )
        acknowledged_recs = recs_res.scalars().all()

        if not acknowledged_recs:
            continue

        # Fetch recent records for baseline & outcome computation
        all_recs_res = await session.execute(
            select(MetricRecordModel).where(MetricRecordModel.astronaut_id == a_id)
        )
        all_astro_records = all_recs_res.scalars().all()

        for rec in acknowledged_recs:
            target_metric_records = [
                r for r in all_astro_records if r.metric_name == rec.target_metric
            ]
            baseline = compute_metric_baseline(target_metric_records)
            outcome = evaluate_reassessment_outcome(
                rec=rec,
                reference_timestamp=astronaut.reference_timestamp,
                metric_records=all_astro_records,
                baseline_mean=baseline.mean,
                baseline_std=baseline.std_dev,
            )

            rec.outcome = outcome.value
            if outcome.value in ["IMPROVED", "RESOLVED"]:
                rec.status = RecommendationStatus.RESOLVED.value

            reassessment_evaluations.append(
                {
                    "recommendation_id": rec.id,
                    "target_metric": rec.target_metric,
                    "reassess_after": rec.reassess_after.isoformat() if rec.reassess_after else None,
                    "reference_timestamp": astronaut.reference_timestamp.isoformat(),
                    "outcome": outcome.value,
                    "status": rec.status,
                }
            )

    await session.commit()

    return BatchTelemetryResponse(
        ingested_count=len(ingested_models),
        rejected_count=0,
        reassessment_evaluations=reassessment_evaluations,
        message=f"Successfully ingested {len(ingested_models)} telemetry measurements.",
    )

