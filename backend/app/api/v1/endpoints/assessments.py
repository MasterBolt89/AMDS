"""Assessment History & Status Transition Log Endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.errors import AppError
from app.models.db_models import AstronautModel, AssessmentHistoryModel
from app.models.enums import DomainId, AssessmentStatus
from app.models.schemas import AssessmentHistoryItem, AssessmentHistoryResponse

router = APIRouter()


@router.get("/astronauts/{astronaut_id}/assessments/history", response_model=AssessmentHistoryResponse)
async def get_assessment_history(
    astronaut_id: str,
    session: AsyncSession = Depends(get_db),
) -> AssessmentHistoryResponse:
    """Returns chronological log of domain assessment evaluations and status transitions."""
    res = await session.execute(select(AstronautModel).where(AstronautModel.id == astronaut_id))
    astronaut = res.scalar_one_or_none()
    if astronaut is None:
        raise AppError(
            code="ASTRONAUT_NOT_FOUND",
            message=f"Astronaut with ID '{astronaut_id}' does not exist.",
            status_code=status.HTTP_404_NOT_FOUND,
            field="astronaut_id",
        )

    hist_res = await session.execute(
        select(AssessmentHistoryModel)
        .where(AssessmentHistoryModel.astronaut_id == astronaut_id)
        .order_by(AssessmentHistoryModel.timestamp.desc())
    )
    records = hist_res.scalars().all()

    items = [
        AssessmentHistoryItem(
            timestamp=r.timestamp,
            domain_id=DomainId(r.domain_id),
            previous_status=AssessmentStatus(r.previous_status),
            new_status=AssessmentStatus(r.new_status),
            reason=r.reason,
        )
        for r in records
    ]

    return AssessmentHistoryResponse(
        astronaut_id=astronaut_id,
        history=items,
    )

