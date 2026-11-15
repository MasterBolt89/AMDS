"""Operational Risk & Incident Log Endpoints."""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.errors import AppError
from app.models.db_models import AstronautModel, OperationalRiskRecordModel
from app.models.enums import OperationalRiskEventType
from app.models.schemas import (
    OperationalRiskCreateRequest,
    OperationalRiskResponse,
)

router = APIRouter()


@router.get("/astronauts/{astronaut_id}/operational-risks", response_model=list[OperationalRiskResponse])
async def list_operational_risks(
    astronaut_id: str,
    session: AsyncSession = Depends(get_db),
) -> list[OperationalRiskResponse]:
    """Returns all event-based operational incidents (EVA issues, hypoxia, DCS concerns, dynamic load events)."""
    res = await session.execute(select(AstronautModel).where(AstronautModel.id == astronaut_id))
    astronaut = res.scalar_one_or_none()
    if astronaut is None:
        raise AppError(
            code="ASTRONAUT_NOT_FOUND",
            message=f"Astronaut with ID '{astronaut_id}' does not exist.",
            status_code=status.HTTP_404_NOT_FOUND,
            field="astronaut_id",
        )

    risks_res = await session.execute(
        select(OperationalRiskRecordModel)
        .where(OperationalRiskRecordModel.astronaut_id == astronaut_id)
        .order_by(OperationalRiskRecordModel.timestamp.desc())
    )
    records = risks_res.scalars().all()

    return [
        OperationalRiskResponse(
            id=r.id,
            astronaut_id=r.astronaut_id,
            timestamp=r.timestamp,
            event_type=OperationalRiskEventType(r.event_type),
            severity=r.severity,
            description=r.description,
            mitigation_applied=r.mitigation_applied,
            downlink_priority=r.downlink_priority,
        )
        for r in records
    ]


@router.post(
    "/astronauts/{astronaut_id}/operational-risks",
    response_model=OperationalRiskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_operational_risk(
    astronaut_id: str,
    payload: OperationalRiskCreateRequest,
    session: AsyncSession = Depends(get_db),
) -> OperationalRiskResponse:
    """Logs a discrete event-based operational risk incident."""
    res = await session.execute(select(AstronautModel).where(AstronautModel.id == astronaut_id))
    astronaut = res.scalar_one_or_none()
    if astronaut is None:
        raise AppError(
            code="ASTRONAUT_NOT_FOUND",
            message=f"Astronaut with ID '{astronaut_id}' does not exist.",
            status_code=status.HTTP_404_NOT_FOUND,
            field="astronaut_id",
        )

    risk_id = f"RISK-{uuid.uuid4().hex[:8].upper()}"
    record = OperationalRiskRecordModel(
        id=risk_id,
        astronaut_id=astronaut_id,
        timestamp=payload.timestamp,
        event_type=payload.event_type.value,
        severity=payload.severity,
        description=payload.description,
        mitigation_applied=payload.mitigation_applied,
        downlink_priority=payload.downlink_priority,
    )
    session.add(record)
    await session.commit()

    return OperationalRiskResponse(
        id=record.id,
        astronaut_id=record.astronaut_id,
        timestamp=record.timestamp,
        event_type=payload.event_type,
        severity=record.severity,
        description=record.description,
        mitigation_applied=record.mitigation_applied,
        downlink_priority=record.downlink_priority,
    )

