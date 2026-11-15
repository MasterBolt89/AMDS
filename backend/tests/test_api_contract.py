"""Integration Tests for OpenAPI Contract & 9-Domain Endpoints."""

import pytest
from httpx import AsyncClient
from app.models.enums import DomainId


@pytest.mark.asyncio
async def test_openapi_specs_accessible(client: AsyncClient):
    """Verifies that OpenAPI documentation endpoints are exposed."""
    res1 = await client.get("/api/v1/openapi.json")
    assert res1.status_code == 200
    spec = res1.json()
    assert spec["info"]["title"] == "AMDS — Autonomous Medical Decision Support"
    assert "/api/v1/astronauts/{astronaut_id}/dashboard" in spec["paths"]

    res2 = await client.get("/openapi.json")
    assert res2.status_code == 200


@pytest.mark.asyncio
async def test_astronaut_list_and_dashboard(client: AsyncClient):
    """Verifies astronaut listing and the master 9-domain dashboard payload."""
    res_list = await client.get("/api/v1/astronauts")
    assert res_list.status_code == 200
    astros = res_list.json()
    assert len(astros) >= 1
    assert astros[0]["id"] == "astro-101"

    # Fetch dashboard
    res_dash = await client.get("/api/v1/astronauts/astro-101/dashboard")
    assert res_dash.status_code == 200
    dash = res_dash.json()

    # Core structure validation
    assert "astronaut" in dash
    assert "mission_context" in dash
    assert "data_provenance_summary" in dash
    assert "domains" in dash
    assert "findings" in dash
    assert "recommendations" in dash
    assert "operational_risk_records_count" in dash

    # Verify all 9 domains are represented
    domain_ids = [d["domain_id"] for d in dash["domains"]]
    expected_domains = [d.value for d in DomainId]
    for exp in expected_domains:
        assert exp in domain_ids

    # Verify measurement scope notices
    for d in dash["domains"]:
        assert len(d["measurement_scope_notice"]) > 10
        assert d["completeness_pct"] >= 0.0


@pytest.mark.asyncio
async def test_domain_detail_endpoint(client: AsyncClient):
    """Verifies detailed domain metrics, baseline stats, and time-series series points."""
    res = await client.get("/api/v1/astronauts/astro-101/domains/cardiovascular?range=7d")
    assert res.status_code == 200
    data = res.json()

    assert data["domain_id"] == "cardiovascular"
    assert data["domain_category"] == "PERSONAL_HEALTH"
    assert "cadence_policy" in data
    assert len(data["metrics"]) >= 1

    metric = data["metrics"][0]
    assert metric["baseline"]["window_label"] == "Personal Rolling Baseline (14d experimental window)"
    assert metric["baseline"]["is_validated_standard"] is False
    assert len(metric["series"]) >= 1
    assert metric["series"][0]["quality"] in ["VALID", "SUSPECT", "MISSING"]

