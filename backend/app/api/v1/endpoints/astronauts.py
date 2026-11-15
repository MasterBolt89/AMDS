"""Astronaut Profile & Master Dashboard Endpoints."""

import json
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.errors import AppError
from app.models.db_models import (
    AstronautModel,
    MetricRecordModel,
    OperationalRiskRecordModel,
    RecommendationModel,
)
from app.models.enums import DomainId, MissionProfile, Provenance
from app.models.schemas import (
    AstronautSummary,
    MissionContext,
    DataProvenanceSummary,
    DashboardResponse,
)
from app.intelligence.cadences import DOMAIN_DEFINITIONS
from app.intelligence.drift_detector import evaluate_domain
from app.intelligence.cross_domain import build_intelligence_report

router = APIRouter()


@router.get("/astronauts", response_model=list[AstronautSummary])
async def list_astronauts(session: AsyncSession = Depends(get_db)) -> list[AstronautSummary]:
    """Lists all active astronauts in the system."""
    res = await session.execute(select(AstronautModel))
    astronauts = res.scalars().all()
    return [AstronautSummary.model_validate(a) for a in astronauts]


@router.get("/astronauts/{astronaut_id}/dashboard", response_model=DashboardResponse)
async def get_astronaut_dashboard(
    astronaut_id: str,
    session: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    """Master Dashboard Overview: Returns the complete 9-domain health status,

    deterministic baseline-drift findings, actionable recommendations, and operational risk metrics.
    """
    res = await session.execute(select(AstronautModel).where(AstronautModel.id == astronaut_id))
    astronaut = res.scalar_one_or_none()
    if astronaut is None:
        raise AppError(
            code="ASTRONAUT_NOT_FOUND",
            message=f"Astronaut with ID '{astronaut_id}' does not exist.",
            status_code=status.HTTP_404_NOT_FOUND,
            field="astronaut_id",
        )

    # Fetch all metric records for astronaut
    rec_res = await session.execute(
        select(MetricRecordModel).where(MetricRecordModel.astronaut_id == astronaut_id)
    )
    records = rec_res.scalars().all()

    # Fetch operational risks count
    risk_count_res = await session.execute(
        select(func.count(OperationalRiskRecordModel.id)).where(
            OperationalRiskRecordModel.astronaut_id == astronaut_id
        )
    )
    operational_risk_records_count = risk_count_res.scalar() or 0

    # Fetch existing recommendations from DB
    db_recs_res = await session.execute(
        select(RecommendationModel).where(RecommendationModel.astronaut_id == astronaut_id)
    )
    db_recommendations = db_recs_res.scalars().all()

    # Evaluate all 9 domains
    records_by_domain: dict[DomainId, list[MetricRecordModel]] = {d: [] for d in DomainId}
    for r in records:
        try:
            domain_enum = DomainId(r.domain_id)
            records_by_domain[domain_enum].append(r)
        except ValueError:
            continue

    evaluations = {
        domain_id: evaluate_domain(
            domain_id=domain_id,
            records=records_by_domain[domain_id],
            reference_timestamp=astronaut.reference_timestamp,
        )
        for domain_id in DomainId
    }

    # Run cross-domain intelligence engine
    domain_summaries, findings, recommendations = build_intelligence_report(
        astronaut=astronaut,
        evaluations=evaluations,
        all_records=records,
        db_recommendations=db_recommendations,
    )

    # Compute overall completeness
    valid_count = sum(1 for r in records if r.quality == "VALID" and r.value is not None)
    total_count = len(records)
    overall_completeness_pct = round((valid_count / total_count) * 100.0, 1) if total_count > 0 else 0.0

    equipment_list = []
    try:
        equipment_list = json.loads(astronaut.available_onboard_equipment)
    except Exception:
        equipment_list = ["ARED", "T2", "CEVIS"]

    return DashboardResponse(
        astronaut=AstronautSummary(
            id=astronaut.id,
            callsign=astronaut.callsign,
            role=astronaut.role,
            mission_day=astronaut.mission_day,
        ),
        mission_context=MissionContext(
            mission_profile=MissionProfile(astronaut.mission_profile),
            one_way_light_time_sec=astronaut.one_way_light_time_sec,
            live_flight_surgeon_available=astronaut.live_flight_surgeon_available,
            support_mode=astronaut.support_mode,
            available_onboard_equipment=equipment_list,
        ),
        data_provenance_summary=DataProvenanceSummary(
            active_provenance=Provenance(astronaut.active_provenance),
            scenario_id=astronaut.scenario_id,
            overall_completeness_pct=overall_completeness_pct,
        ),
        domains=domain_summaries,
        findings=findings,
        recommendations=recommendations,
        operational_risk_records_count=operational_risk_records_count,
    )

