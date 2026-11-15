"""Judge Demonstration Simulation Endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.errors import AppError
from app.models.schemas import (
    SimulationScenarioListResponse,
    SimulationLoadRequest,
    DashboardResponse,
)
from app.seed.scenarios import AVAILABLE_SCENARIOS
from app.seed.loader import seed_scenario
from app.api.v1.endpoints.astronauts import get_astronaut_dashboard

router = APIRouter()


@router.get("/simulation/scenarios", response_model=SimulationScenarioListResponse)
async def list_simulation_scenarios() -> SimulationScenarioListResponse:
    """Lists the 4 available deterministic judge demonstration scenarios."""
    return SimulationScenarioListResponse(scenarios=AVAILABLE_SCENARIOS)


@router.post("/simulation/load", response_model=DashboardResponse)
async def load_simulation_scenario(
    payload: SimulationLoadRequest,
    session: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    """Loads a deterministic SIMULATED scenario, resets astronaut baseline telemetry,

    executes the deterministic intelligence engine, and returns the refreshed DashboardResponse.
    """
    valid_scenario_ids = {s.scenario_id for s in AVAILABLE_SCENARIOS}
    if payload.scenario_id not in valid_scenario_ids:
        raise AppError(
            code="INVALID_SCENARIO",
            message=f"Scenario '{payload.scenario_id}' not found. Available: {list(valid_scenario_ids)}",
            status_code=status.HTTP_404_NOT_FOUND,
            field="scenario_id",
        )

    # Seed the database
    await seed_scenario(
        session=session,
        scenario_id=payload.scenario_id,
        astronaut_id=payload.astronaut_id,
    )

    # Return refreshed dashboard
    return await get_astronaut_dashboard(
        astronaut_id=payload.astronaut_id,
        session=session,
    )

