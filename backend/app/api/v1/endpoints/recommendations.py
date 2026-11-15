"""Recommendation Acknowledgement & Closed-Loop Tracker Endpoints."""

from datetime import timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.errors import AppError
from app.models.db_models import (
    AstronautModel,
    RecommendationModel,
    MetricRecordModel,
)
from app.models.enums import RecommendationStatus, ReassessmentOutcome
from app.models.schemas import (
    RecommendationAcknowledgeRequest,
    RecommendationAcknowledgeResponse,
)

router = APIRouter()


@router.post("/recommendations/{rec_id}/acknowledge", response_model=RecommendationAcknowledgeResponse)
async def acknowledge_recommendation(
    rec_id: str,
    payload: RecommendationAcknowledgeRequest,
    session: AsyncSession = Depends(get_db),
) -> RecommendationAcknowledgeResponse:
    """Acknowledges an active health recommendation, recording the astronaut's intervention (t0)

    and initiating the deterministic reassessment evaluation window.
    """
    res = await session.execute(select(AstronautModel).where(AstronautModel.id == payload.astronaut_id))
    astronaut = res.scalar_one_or_none()
    if astronaut is None:
        raise AppError(
            code="ASTRONAUT_NOT_FOUND",
            message=f"Astronaut with ID '{payload.astronaut_id}' does not exist.",
            status_code=status.HTTP_404_NOT_FOUND,
            field="astronaut_id",
        )

    rec_res = await session.execute(select(RecommendationModel).where(RecommendationModel.id == rec_id))
    rec = rec_res.scalar_one_or_none()

    reassess_window_hours = 24.0
    reassess_after = payload.acknowledged_at + timedelta(hours=reassess_window_hours)

    if rec is None:
        # Create recommendation record on-the-fly if it was generated dynamically by intelligence engine
        target_metric = "resting_hr_bpm"
        if "SLEEP" in rec_id:
            target_metric = "sleep_duration_hours"
        elif "FATIGUE" in rec_id or "PSYCH" in rec_id:
            target_metric = "cognitive_fatigue_score"
        elif "ECLSS" in rec_id or "CO2" in rec_id:
            target_metric = "co2_partial_pressure_mmhg"

        # Lookup trigger value from latest record
        metric_res = await session.execute(
            select(MetricRecordModel)
            .where(
                MetricRecordModel.astronaut_id == payload.astronaut_id,
                MetricRecordModel.metric_name == target_metric,
                MetricRecordModel.quality == "VALID",
            )
            .order_by(MetricRecordModel.timestamp.desc())
        )
        latest_m = metric_res.scalars().first()
        trigger_val = latest_m.value if latest_m else None

        rec = RecommendationModel(
            id=rec_id,
            finding_id=f"FINDING-{rec_id.replace('REC-', '')}",
            astronaut_id=payload.astronaut_id,
            action_summary="Acknowledged autonomous countermeasure",
            consultation_guidance="Operational countermeasure active",
            escalate_when="Escalate if baseline continues to drift",
            status=RecommendationStatus.ACKNOWLEDGED.value,
            target_metric=target_metric,
            reassess_after_hours=reassess_window_hours,
            acknowledged_at=payload.acknowledged_at,
            action_taken_note=payload.action_taken_note,
            reassess_after=reassess_after,
            baseline_at_trigger=trigger_val,
            outcome=ReassessmentOutcome.PENDING.value,
        )
        session.add(rec)
    else:
        rec.status = RecommendationStatus.ACKNOWLEDGED.value
        rec.acknowledged_at = payload.acknowledged_at
        rec.action_taken_note = payload.action_taken_note
        rec.reassess_after = reassess_after
        rec.outcome = ReassessmentOutcome.PENDING.value

    await session.commit()

    return RecommendationAcknowledgeResponse(
        recommendation_id=rec_id,
        status=RecommendationStatus.ACKNOWLEDGED,
        acknowledged_at=payload.acknowledged_at,
        reassess_after=reassess_after,
        baseline_at_trigger=rec.baseline_at_trigger,
        message="Recommendation successfully acknowledged. Closed-loop reassessment window scheduled.",
    )

