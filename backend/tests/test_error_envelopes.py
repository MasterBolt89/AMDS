"""Integration Tests for Standard 4xx/5xx Error Envelopes."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_404_error_envelope(client: AsyncClient):
    """Verifies that 404 responses conform to the standard error envelope."""
    res = await client.get("/api/v1/astronauts/nonexistent-crew/dashboard")
    assert res.status_code == 404
    data = res.json()

    assert "error" in data
    assert data["error"]["code"] == "ASTRONAUT_NOT_FOUND"
    assert "nonexistent-crew" in data["error"]["message"]
    assert data["error"]["field"] == "astronaut_id"


@pytest.mark.asyncio
async def test_invalid_domain_404(client: AsyncClient):
    """Verifies that an unrecognized domain returns a standard 404 error envelope."""
    res = await client.get("/api/v1/astronauts/astro-101/domains/telepathy_brainwaves")
    assert res.status_code == 404
    data = res.json()

    assert "error" in data
    assert data["error"]["code"] == "INVALID_DOMAIN"
    assert data["error"]["field"] == "domain_id"


@pytest.mark.asyncio
async def test_422_validation_error_envelope(client: AsyncClient):
    """Verifies that Pydantic 422 validation errors conform to the standard error envelope."""
    res = await client.post(
        "/api/v1/telemetry/batch",
        json={"measurements": "not-a-list"},
    )
    assert res.status_code == 422
    data = res.json()

    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert len(data["error"]["message"]) > 0
    assert data["error"]["field"] == "measurements"


@pytest.mark.asyncio
async def test_invalid_scenario_404(client: AsyncClient):
    """Verifies that an unknown simulation scenario returns a standard error envelope."""
    res = await client.post(
        "/api/v1/simulation/load",
        json={"scenario_id": "nonexistent_scenario", "astronaut_id": "astro-101"},
    )
    assert res.status_code == 404
    data = res.json()

    assert "error" in data
    assert data["error"]["code"] == "INVALID_SCENARIO"
    assert data["error"]["field"] == "scenario_id"

