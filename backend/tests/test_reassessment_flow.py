"""Integration Tests for Closed-Loop Reassessment Workflow & Edge Cases."""

from datetime import datetime, timedelta
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_acknowledgement_and_reassessment_insufficient_data_edge_case(client: AsyncClient):
    """Refinement 4: Once reference_timestamp >= reassess_after, if no VALID follow-up

    exists after acknowledged_at, outcome evaluates to INSUFFICIENT_DATA.
    """
    # 1. Load circadian drift scenario (reference_timestamp = 2026-11-14 18:00:00)
    await client.post(
        "/api/v1/simulation/load",
        json={"scenario_id": "circadian_drift_and_fatigue_01", "astronaut_id": "astro-101"},
    )

    t0 = datetime(2026, 11, 14, 18, 0, 0)

    # 2. Acknowledge recommendation
    ack_res = await client.post(
        "/api/v1/recommendations/REC-SLEEP_CIRCADIAN-01/acknowledge",
        json={
            "astronaut_id": "astro-101",
            "action_taken_note": "Awaiting sleep schedule window",
            "acknowledged_at": t0.isoformat(),
        },
    )
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["status"] == "ACKNOWLEDGED"

    # 3. Simulate passage of time past reassess_after (t0 + 24h = Nov 15, 18:00:00)
    # Ingesting actual telemetry on Nov 16 with only heart rate data (no sleep records)
    t_future = t0 + timedelta(hours=36)
    ingest_res = await client.post(
        "/api/v1/telemetry/batch",
        json={
            "measurements": [
                {
                    "astronaut_id": "astro-101",
                    "domain_id": "cardiovascular",
                    "metric_name": "resting_hr_bpm",
                    "timestamp": t_future.isoformat(),
                    "value": 62.0,
                    "unit": "bpm",
                    "quality": "VALID",
                    "provenance": "ACTUAL_TELEM",
                    "modality": "OBJECTIVE_SENSOR",
                }
            ]
        },
    )
    assert ingest_res.status_code == 200

    # 4. Fetch dashboard - sleep recommendation should now evaluate to INSUFFICIENT_DATA
    dash_res = await client.get("/api/v1/astronauts/astro-101/dashboard")
    assert dash_res.status_code == 200
    dash = dash_res.json()

    rec = next(r for r in dash["recommendations"] if r["recommendation_id"] == "REC-SLEEP_CIRCADIAN-01")
    assert rec["reassessment"]["status"] == "ACKNOWLEDGED"
    assert rec["reassessment"]["outcome"] == "INSUFFICIENT_DATA"


@pytest.mark.asyncio
async def test_reassessment_recovery_to_improved(client: AsyncClient):
    """Verifies that ingesting valid restorative data past reassess_after transitions outcome to IMPROVED."""
    await client.post(
        "/api/v1/simulation/load",
        json={"scenario_id": "circadian_drift_and_fatigue_01", "astronaut_id": "astro-101"},
    )

    t0 = datetime(2026, 11, 14, 18, 0, 0)

    # Acknowledge
    await client.post(
        "/api/v1/recommendations/REC-SLEEP_CIRCADIAN-01/acknowledge",
        json={
            "astronaut_id": "astro-101",
            "action_taken_note": "Administered 8h sleep protocol",
            "acknowledged_at": t0.isoformat(),
        },
    )

    # Ingest restorative sleep past reassess_after (t0 + 28h = Nov 15, 22:00:00)
    t_followup = t0 + timedelta(hours=28)
    await client.post(
        "/api/v1/telemetry/batch",
        json={
            "measurements": [
                {
                    "astronaut_id": "astro-101",
                    "domain_id": "sleep_circadian",
                    "metric_name": "sleep_duration_hours",
                    "timestamp": t_followup.isoformat(),
                    "value": 7.6,  # Returned to baseline
                    "unit": "hours",
                    "quality": "VALID",
                    "provenance": "ACTUAL_TELEM",
                    "modality": "OBJECTIVE_SENSOR",
                }
            ]
        },
    )

    # Check dashboard
    dash_res = await client.get("/api/v1/astronauts/astro-101/dashboard")
    assert dash_res.status_code == 200
    dash = dash_res.json()

    rec = next(r for r in dash["recommendations"] if r["recommendation_id"] == "REC-SLEEP_CIRCADIAN-01")
    assert rec["reassessment"]["outcome"] == "IMPROVED"
