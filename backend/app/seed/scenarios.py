"""Deterministic Seed Scenarios for Judge Demonstrations.

Defines the 4 required scenarios:
1. nominal_iss_baseline
2. circadian_drift_and_fatigue_01
3. post_action_reassessment_improved
4. eva_operational_incident_with_eclss_drift
"""

from datetime import datetime, timezone
from app.models.schemas import SimulationScenarioItem
from app.models.enums import MissionProfile


AVAILABLE_SCENARIOS = [
    SimulationScenarioItem(
        scenario_id="nominal_iss_baseline",
        name="Nominal ISS Orbit Baseline",
        description="Low-latency ISS expedition (2s delay). All 9 health domains within expected personal baseline variances (NORMAL status, 100% data freshness).",
        mission_profile=MissionProfile.ISS_LEO,
        hazards_featured=["Hostile closed environments (nominal)", "Altered gravity (countermeasures active)"],
    ),
    SimulationScenarioItem(
        scenario_id="circadian_drift_and_fatigue_01",
        name="Mars Transit Circadian Drift & Autonomic Fatigue",
        description="High-latency Mars Transit (720s delay, autonomous crew support). Demonstrates cross-domain ATTENTION across sleep, cardiovascular, and behavioral domains, overdue immune lab assay (INSUFFICIENT_DATA), and SUSPECT/MISSING chart telemetry points.",
        mission_profile=MissionProfile.MARS_TRANSIT,
        hazards_featured=["Isolation and confinement", "Distance from Earth", "Sleep and circadian disruption"],
    ),
    SimulationScenarioItem(
        scenario_id="post_action_reassessment_improved",
        name="Closed-Loop Intervention Reassessment (Improved)",
        description="Closed-loop follow-up demonstration. Astronaut acknowledged a circadian rest recommendation; subsequent telemetry ingested past the reassess_after window shows recovery toward baseline (outcome: IMPROVED).",
        mission_profile=MissionProfile.MARS_TRANSIT,
        hazards_featured=["Circadian disruption recovery", "Autonomous intervention feedback"],
    ),
    SimulationScenarioItem(
        scenario_id="eva_operational_incident_with_eclss_drift",
        name="EVA Operational Incident & Life-Support Drift",
        description="Demonstrates separation between habitat environmental telemetry (ECLSS CO2 drift) and discrete event-based operational risk logs (extravehicular suit thermal/pressure incident).",
        mission_profile=MissionProfile.ISS_LEO,
        hazards_featured=["Hostile closed environments", "EVA operational risk"],
    ),
]

