"""AMDS — Autonomous Medical Decision Support.

NASA Space Apps Challenge 2026.
FastAPI application entrypoint.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.api import api_router
from app.core.database import init_db, AsyncSessionLocal
from app.core.errors import register_error_handlers
from app.seed.loader import seed_scenario


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context: initializes database schema and seeds initial baseline astronaut."""
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_scenario(session, "nominal_iss_baseline", "astro-101")
    yield


app = FastAPI(
    title="AMDS — Autonomous Medical Decision Support",
    description="Autonomous Medical Decision Support: Deterministic Health Intelligence and Multimodal Telemetry System for Long-Duration Space Missions.",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan,
)

# Enable CORS for local Vite and preview origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom error envelope handlers (4xx/5xx)
register_error_handlers(app)

# Include master API router
app.include_router(api_router)


@app.get("/openapi.json", include_in_schema=False)
async def get_root_openapi() -> JSONResponse:
    """Alternative root openapi.json route for tools expecting default root path."""
    return JSONResponse(app.openapi())


@app.get("/health", tags=["Health"])
async def healthcheck() -> dict[str, str]:
    """Basic healthcheck endpoint."""
    return {"status": "HEALTHY", "system": "AMDS_HEALTH_INTELLIGENCE_ENGINE"}

