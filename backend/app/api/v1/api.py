"""Master v1 API Router."""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    astronauts,
    domains,
    telemetry,
    assessments,
    recommendations,
    operational_risks,
    simulation,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(astronauts.router, tags=["Astronauts & Dashboard"])
api_router.include_router(domains.router, tags=["Domains & Time-Series"])
api_router.include_router(telemetry.router, tags=["Telemetry Ingestion"])
api_router.include_router(assessments.router, tags=["Assessment History"])
api_router.include_router(recommendations.router, tags=["Recommendations & Reassessment"])
api_router.include_router(operational_risks.router, tags=["Operational Risks"])
api_router.include_router(simulation.router, tags=["Simulation & Scenarios"])

