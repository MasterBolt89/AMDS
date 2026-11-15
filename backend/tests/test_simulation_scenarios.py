"""Integration Tests for the 4 Deterministic Simulation Scenarios."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_scenario_1_nominal_iss_baseline(client: AsyncClient):
    """Scenario 1: Nominal ISS - All 9 domains NORMAL, 0 active findings."""
    res = await client.post(
        "/api/v1/simulation/load",
        json={"scenario_id": "nominal_iss_baseline", "astronaut_id": "astro-101"},
    )
    assert res.status_code == 200
    dash = res.json()

    assert dash["mission_context"]["mission_profile"] == "ISS_LEO"
    assert dash["mission_context"]["live_flight_surgeon_available"] is True
    assert len(dash["findings"]) == 0

    for domain in dash["domains"]:
        assert domain["status"] == "NORMAL", f"Domain {domain['domain_id']} should be NORMAL"


@pytest.mark.asyncio
async def test_scenario_2_circadian_drift_and_fatigue(client: AsyncClient):
    """Scenario 2: Mars Transit - Cross-domain ATTENTION, overdue immune INSUFFICIENT_DATA, SUSPECT/MISSING markers."""
    res = await client.post(
        "/api/v1/simulation/load",
        json={"scenario_id": "circadian_drift_and_fatigue_01", "astronaut_id": "astro-101"},
    )
    assert res.status_code == 200
    dash = res.json()

    assert dash["mission_context"]["mission_profile"] == "MARS_TRANSIT"
    assert dash["mission_context"]["live_flight_surgeon_available"] is False

    # Check cross-domain finding
    finding_ids = [f["finding_id"] for f in dash["findings"]]
    assert "FINDING-CROSS-CIRCADIAN-AUTONOMIC-FATIGUE" in finding_ids

    # Check evidence metadata
    cross_finding = next(f for f in dash["findings"] if f["finding_id"] == "FINDING-CROSS-CIRCADIAN-AUTONOMIC-FATIGUE")
    assert cross_finding["evidence"]["evidence_type"] == "STATISTICAL_BASELINE_DRIFT"
    assert cross_finding["evidence"]["is_validated_clinical_threshold"] is False

    # Check immune domain status is INSUFFICIENT_DATA due to stale lab record
    immune_domain = next(d for d in dash["domains"] if d["domain_id"] == "immune_microbio")
    assert immune_domain["status"] == "INSUFFICIENT_DATA"
    assert "stale" in immune_domain["status_reason"].lower()

    # Check that SUSPECT and MISSING points are present in sleep time series
    detail_res = await client.get("/api/v1/astronauts/astro-101/domains/sleep_circadian?range=30d")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    qualities = [p["quality"] for p in detail["metrics"][0]["series"]]
    assert "SUSPECT" in qualities
    assert "MISSING" in qualities


@pytest.mark.asyncio
async def test_scenario_3_post_action_reassessment_improved(client: AsyncClient):
    """Scenario 3: Closed-loop intervention follow-up evaluates to IMPROVED."""
    res = await client.post(
        "/api/v1/simulation/load",
        json={"scenario_id": "post_action_reassessment_improved", "astronaut_id": "astro-101"},
    )
    assert res.status_code == 200
    dash = res.json()

    assert len(dash["recommendations"]) >= 1
    sleep_rec = next(r for r in dash["recommendations"] if r["recommendation_id"] == "REC-SLEEP_CIRCADIAN-01")
    assert sleep_rec["reassessment"]["status"] == "ACKNOWLEDGED"
    assert sleep_rec["reassessment"]["outcome"] == "IMPROVED"
    assert sleep_rec["reassessment"]["latest_followup_value"] == 7.7


@pytest.mark.asyncio
async def test_scenario_4_eva_operational_incident_with_eclss_drift(client: AsyncClient):
    """Scenario 4: EVA operational incident logged under /operational-risks with ECLSS CO2 drift."""
    res = await client.post(
        "/api/v1/simulation/load",
        json={"scenario_id": "eva_operational_incident_with_eclss_drift", "astronaut_id": "astro-101"},
    )
    assert res.status_code == 200
    dash = res.json()

    assert dash["operational_risk_records_count"] >= 1

    # Verify operational risks endpoint
    risks_res = await client.get("/api/v1/astronauts/astro-101/operational-risks")
    assert risks_res.status_code == 200
    risks = risks_res.json()
    assert len(risks) >= 1
    assert risks[0]["event_type"] == "EVA_INJURY_PERFORMANCE"

    # Verify ECLSS domain has ATTENTION status while personal health domains remain distinct
    eclss_domain = next(d for d in dash["domains"] if d["domain_id"] == "environment_eclss")
    assert eclss_domain["status"] == "ATTENTION"
    assert "co2" in eclss_domain["headline_metric"].lower()

