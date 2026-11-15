"""Deterministic Database Seeder for Scenario-Driven Demonstrations."""

from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db_models import (
    AstronautModel,
    MetricRecordModel,
    OperationalRiskRecordModel,
    RecommendationModel,
    AssessmentHistoryModel,
)
from app.models.enums import (
    DomainId,
    DataQuality,
    Provenance,
    Modality,
    MissionProfile,
    RecommendationStatus,
    ReassessmentOutcome,
    OperationalRiskEventType,
)


async def seed_scenario(session: AsyncSession, scenario_id: str, astronaut_id: str = "astro-101") -> AstronautModel:
    """Resets and deterministically populates the database with the requested scenario."""
    # Delete existing data for astronaut
    await session.execute(delete(MetricRecordModel).where(MetricRecordModel.astronaut_id == astronaut_id))
    await session.execute(delete(OperationalRiskRecordModel).where(OperationalRiskRecordModel.astronaut_id == astronaut_id))
    await session.execute(delete(RecommendationModel).where(RecommendationModel.astronaut_id == astronaut_id))
    await session.execute(delete(AssessmentHistoryModel).where(AssessmentHistoryModel.astronaut_id == astronaut_id))
    await session.execute(delete(AstronautModel).where(AstronautModel.id == astronaut_id))
    await session.commit()

    ref_time = datetime(2026, 11, 14, 18, 0, 0)

    if scenario_id == "nominal_iss_baseline":
        return await _seed_nominal_iss(session, astronaut_id, ref_time)
    elif scenario_id == "circadian_drift_and_fatigue_01":
        return await _seed_circadian_drift(session, astronaut_id, ref_time)
    elif scenario_id == "post_action_reassessment_improved":
        return await _seed_post_action_improved(session, astronaut_id, ref_time)
    elif scenario_id == "eva_operational_incident_with_eclss_drift":
        return await _seed_eva_incident_eclss(session, astronaut_id, ref_time)
    else:
        # Default fallback to nominal
        return await _seed_nominal_iss(session, astronaut_id, ref_time)


async def _seed_nominal_iss(session: AsyncSession, astronaut_id: str, ref_time: datetime) -> AstronautModel:
    astro = AstronautModel(
        id=astronaut_id,
        callsign="Ares-Lead",
        role="Flight Engineer & Science Officer",
        mission_day=42,
        mission_profile="ISS_LEO",
        one_way_light_time_sec=2,
        live_flight_surgeon_available=True,
        support_mode="GROUND_MONITORED",
        available_onboard_equipment='["ARED", "T2_TREADMILL", "CEVIS_CYCLE", "MED_KIT_EXPEDITION", "PORTABLE_CO2_SENSOR"]',
        reference_timestamp=ref_time,
        active_provenance="SIMULATED",
        scenario_id="nominal_iss_baseline",
    )
    session.add(astro)

    records: list[MetricRecordModel] = []

    # 1. Cardiovascular: resting_hr_bpm ~62
    hr_vals = [61, 63, 62, 60, 64, 62, 61, 63, 62, 61, 63, 62, 60, 62, 62]
    for i, val in enumerate(hr_vals):
        t = ref_time - timedelta(hours=(len(hr_vals) - 1 - i) * 2)
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.CARDIOVASCULAR.value,
                metric_name="resting_hr_bpm",
                timestamp=t,
                value=float(val),
                unit="bpm",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
                sensor_id="ECG-CHEST-01",
            )
        )

    # 2. Sleep: sleep_duration_hours ~7.5
    sleep_vals = [7.4, 7.6, 7.3, 7.7, 7.5, 7.4, 7.6, 7.5, 7.3, 7.6, 7.5, 7.4, 7.6, 7.5]
    for i, val in enumerate(sleep_vals):
        t = ref_time - timedelta(days=(len(sleep_vals) - 1 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.SLEEP_CIRCADIAN.value,
                metric_name="sleep_duration_hours",
                timestamp=t,
                value=float(val),
                unit="hours",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
                sensor_id="ACTIGRAPHY-WRIST-01",
            )
        )

    # 3. Behavioral: cognitive_fatigue_score ~2.5
    for i in range(14):
        t = ref_time - timedelta(days=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.BEHAVIORAL_PSYCH.value,
                metric_name="cognitive_fatigue_score",
                timestamp=t,
                value=float(2.0 + (i % 2) * 0.8),
                unit="score_1_10",
                quality="VALID",
                provenance="SIMULATED",
                modality="SUBJECTIVE_REPORT",
            )
        )

    # 4. Musculoskeletal: exercise_adherence_pct ~95
    for i in range(14):
        t = ref_time - timedelta(days=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.MUSCULOSKELETAL.value,
                metric_name="exercise_adherence_pct",
                timestamp=t,
                value=float(94.0 + (i % 3)),
                unit="pct",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
                sensor_id="ARED-TELEMETRY-SYS",
            )
        )

    # 5. Immune: crp_biomarker_mg_l ~0.8 (assays on day -28, -14, -2)
    for days_ago in [28, 14, 2]:
        t = ref_time - timedelta(days=days_ago)
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.IMMUNE_MICROBIO.value,
                metric_name="crp_biomarker_mg_l",
                timestamp=t,
                value=0.82,
                unit="mg/L",
                quality="VALID",
                provenance="SIMULATED",
                modality="LAB_ASSAY",
            )
        )

    # 6. Radiation: daily_dose_msv ~0.42
    for i in range(14):
        t = ref_time - timedelta(days=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.RADIATION.value,
                metric_name="daily_dose_msv",
                timestamp=t,
                value=0.42,
                unit="mSv",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
                sensor_id="CANS-DOSIMETER-01",
            )
        )

    # 7. ECLSS: co2_partial_pressure_mmhg ~2.2
    for i in range(15):
        t = ref_time - timedelta(hours=(14 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.ENVIRONMENT_ECLSS.value,
                metric_name="co2_partial_pressure_mmhg",
                timestamp=t,
                value=2.15 + (i % 3) * 0.05,
                unit="mmHg",
                quality="VALID",
                provenance="SIMULATED",
                modality="ENVIRONMENTAL_SENSOR",
                sensor_id="CABIN-AIR-NODE2",
            )
        )

    # 8. Sensorimotor: postural_instability_score ~1.5
    for i in range(14):
        t = ref_time - timedelta(days=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.SENSORIMOTOR_NEURO.value,
                metric_name="postural_instability_score",
                timestamp=t,
                value=1.5,
                unit="score_1_10",
                quality="VALID",
                provenance="SIMULATED",
                modality="SUBJECTIVE_REPORT",
            )
        )

    # 9. Nutrition: caloric_intake_kcal ~2800
    for i in range(14):
        t = ref_time - timedelta(days=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.NUTRITION.value,
                metric_name="caloric_intake_kcal",
                timestamp=t,
                value=2810.0 + (i % 4) * 20,
                unit="kcal",
                quality="VALID",
                provenance="SIMULATED",
                modality="MANUAL_ENTRY",
            )
        )

    session.add_all(records)
    await session.commit()
    return astro


async def _seed_circadian_drift(session: AsyncSession, astronaut_id: str, ref_time: datetime) -> AstronautModel:
    astro = AstronautModel(
        id=astronaut_id,
        callsign="Ares-Lead",
        role="Commander",
        mission_day=185,
        mission_profile="MARS_TRANSIT",
        one_way_light_time_sec=720,
        live_flight_surgeon_available=False,
        support_mode="AUTONOMOUS_EARTH_INDEPENDENT",
        available_onboard_equipment='["ARED", "T2_TREADMILL", "CEVIS_CYCLE", "AUTONOMOUS_CLINICAL_CONSOLE", "DOSIMETRY_CANS"]',
        reference_timestamp=ref_time,
        active_provenance="SIMULATED",
        scenario_id="circadian_drift_and_fatigue_01",
    )
    session.add(astro)

    records: list[MetricRecordModel] = []

    # 1. Cardiovascular: Baseline ~62 bpm (std ~2.0), recent 24h jumps to 74 bpm (Z > 5)
    hr_vals = [61, 62, 60, 63, 62, 61, 63, 62, 61, 62, 64, 62, 68, 72, 75]
    for i, val in enumerate(hr_vals):
        t = ref_time - timedelta(hours=(len(hr_vals) - 1 - i) * 2)
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.CARDIOVASCULAR.value,
                metric_name="resting_hr_bpm",
                timestamp=t,
                value=float(val),
                unit="bpm",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
                sensor_id="ECG-CHEST-01",
            )
        )

    # 2. Sleep: Baseline ~7.5h (std ~0.4), last 3 days drop: 5.2, 4.8, 4.3 (Z < -7)
    # Also include 1 SUSPECT and 1 MISSING point to demonstrate data quality markers!
    sleep_vals = [7.5, 7.6, 7.4, 7.5, 7.7, 7.5, None, 14.5, 7.6, 7.4, 7.5, 5.2, 4.8, 4.3]
    for i, val in enumerate(sleep_vals):
        t = ref_time - timedelta(days=(len(sleep_vals) - 1 - i))
        if val is None:
            quality = "MISSING"
            v = None
            note = "Actigraphy sensor battery depleted during sleep interval"
        elif val > 12.0:
            quality = "SUSPECT"
            v = val
            note = "Optical sensor displaced; motion artifact detected"
        else:
            quality = "VALID"
            v = val
            note = None

        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.SLEEP_CIRCADIAN.value,
                metric_name="sleep_duration_hours",
                timestamp=t,
                value=v,
                unit="hours",
                quality=quality,
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
                sensor_id="ACTIGRAPHY-WRIST-01",
                note=note,
            )
        )

    # 3. Behavioral: Cognitive fatigue baseline ~2.5, rises to 7.0 (Z > 5)
    fatigue_vals = [2.0, 2.5, 2.0, 3.0, 2.5, 2.0, 3.0, 2.5, 3.0, 2.5, 3.0, 5.0, 6.5, 7.0]
    for i, val in enumerate(fatigue_vals):
        t = ref_time - timedelta(days=(len(fatigue_vals) - 1 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.BEHAVIORAL_PSYCH.value,
                metric_name="cognitive_fatigue_score",
                timestamp=t,
                value=float(val),
                unit="score_1_10",
                quality="VALID",
                provenance="SIMULATED",
                modality="SUBJECTIVE_REPORT",
            )
        )

    # 4. Musculoskeletal: nominal
    for i in range(14):
        t = ref_time - timedelta(days=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.MUSCULOSKELETAL.value,
                metric_name="exercise_adherence_pct",
                timestamp=t,
                value=92.0,
                unit="pct",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
                sensor_id="ARED-SYS",
            )
        )

    # 5. Immune: Stale! Last assay was 420 hours ago (> 336h threshold) -> INSUFFICIENT_DATA
    # Includes historical baseline assays so N >= 2 is met, cleanly demonstrating the staleness trigger
    for h in [600, 500, 420]:
        t_stale = ref_time - timedelta(hours=h)
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.IMMUNE_MICROBIO.value,
                metric_name="crp_biomarker_mg_l",
                timestamp=t_stale,
                value=0.85,
                unit="mg/L",
                quality="VALID",
                provenance="SIMULATED",
                modality="LAB_ASSAY",
                note="Saliva sample collection kit depleted; pending deep-space replenishment protocol",
            )
        )

    # 6. Radiation: nominal
    for i in range(14):
        t = ref_time - timedelta(days=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.RADIATION.value,
                metric_name="daily_dose_msv",
                timestamp=t,
                value=1.45,  # Higher in Mars transit, but steady baseline
                unit="mSv",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
                sensor_id="CANS-DOSIMETER-01",
            )
        )

    # 7. ECLSS: nominal
    for i in range(14):
        t = ref_time - timedelta(hours=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.ENVIRONMENT_ECLSS.value,
                metric_name="co2_partial_pressure_mmhg",
                timestamp=t,
                value=2.4,
                unit="mmHg",
                quality="VALID",
                provenance="SIMULATED",
                modality="ENVIRONMENTAL_SENSOR",
                sensor_id="CABIN-AIR-NODE1",
            )
        )

    # 8. Sensorimotor: nominal
    for i in range(14):
        t = ref_time - timedelta(days=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.SENSORIMOTOR_NEURO.value,
                metric_name="postural_instability_score",
                timestamp=t,
                value=1.8,
                unit="score_1_10",
                quality="VALID",
                provenance="SIMULATED",
                modality="SUBJECTIVE_REPORT",
            )
        )

    # 9. Nutrition: nominal
    for i in range(14):
        t = ref_time - timedelta(days=(13 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.NUTRITION.value,
                metric_name="caloric_intake_kcal",
                timestamp=t,
                value=2780.0,
                unit="kcal",
                quality="VALID",
                provenance="SIMULATED",
                modality="MANUAL_ENTRY",
            )
        )

    session.add_all(records)
    await session.commit()
    return astro


async def _seed_post_action_improved(session: AsyncSession, astronaut_id: str, ref_time: datetime) -> AstronautModel:
    astro = AstronautModel(
        id=astronaut_id,
        callsign="Ares-Lead",
        role="Commander",
        mission_day=187,
        mission_profile="MARS_TRANSIT",
        one_way_light_time_sec=720,
        live_flight_surgeon_available=False,
        support_mode="AUTONOMOUS_EARTH_INDEPENDENT",
        available_onboard_equipment='["ARED", "T2_TREADMILL", "CEVIS_CYCLE", "AUTONOMOUS_CLINICAL_CONSOLE"]',
        reference_timestamp=ref_time,
        active_provenance="SIMULATED",
        scenario_id="post_action_reassessment_improved",
    )
    session.add(astro)

    # Recommendation acknowledged 36h ago, reassess_after was 24h after ack (12h ago)
    t_ack = ref_time - timedelta(hours=36)
    t_reassess = t_ack + timedelta(hours=24)

    rec = RecommendationModel(
        id="REC-SLEEP_CIRCADIAN-01",
        finding_id="FINDING-SLEEP_CIRCADIAN-BASELINE-DRIFT",
        astronaut_id=astronaut_id,
        action_summary="Enforce scheduled 8-hour sleep block, advance cabin evening dynamic lighting dimming by 30 minutes, and restrict blue-light screen exposure prior to sleep.",
        consultation_guidance="Autonomous Spacecraft Operation (Mars Transit): One-way signal delay is 720s. Execute autonomous crew countermeasures.",
        escalate_when="Escalate if sleep duration remains below 5h.",
        status=RecommendationStatus.ACKNOWLEDGED.value,
        target_metric="sleep_duration_hours",
        reassess_after_hours=24.0,
        acknowledged_at=t_ack,
        action_taken_note="Darkened crew sleep quarters, activated circadian dynamic dimming, took 45-minute scheduled afternoon nap.",
        reassess_after=t_reassess,
        baseline_at_trigger=4.3,
        latest_followup_value=None,  # Evaluator will compute from metric records!
        outcome=ReassessmentOutcome.PENDING.value,
    )
    session.add(rec)

    records: list[MetricRecordModel] = []

    # Historical sleep records (baseline ~7.5h)
    for i in range(14):
        t = ref_time - timedelta(days=(16 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.SLEEP_CIRCADIAN.value,
                metric_name="sleep_duration_hours",
                timestamp=t,
                value=7.5,
                unit="hours",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
            )
        )

    # Initial trigger dip at t_ack - 2h
    records.append(
        MetricRecordModel(
            astronaut_id=astronaut_id,
            domain_id=DomainId.SLEEP_CIRCADIAN.value,
            metric_name="sleep_duration_hours",
            timestamp=t_ack - timedelta(hours=2),
            value=4.3,
            unit="hours",
            quality="VALID",
            provenance="SIMULATED",
            modality="OBJECTIVE_SENSOR",
        )
    )

    # Follow-up measurement after acknowledgment and after reassess_after window (at ref_time - 6h)
    records.append(
        MetricRecordModel(
            astronaut_id=astronaut_id,
            domain_id=DomainId.SLEEP_CIRCADIAN.value,
            metric_name="sleep_duration_hours",
            timestamp=ref_time - timedelta(hours=6),
            value=7.7,  # Fully recovered back to baseline!
            unit="hours",
            quality="VALID",
            provenance="SIMULATED",
            modality="OBJECTIVE_SENSOR",
            note="Post-intervention follow-up sleep measurement",
        )
    )

    # Seed remaining domains with nominal data so dashboard is rich
    await _add_nominal_baseline_records(astronaut_id, ref_time, records)

    session.add_all(records)
    await session.commit()
    return astro


async def _seed_eva_incident_eclss(session: AsyncSession, astronaut_id: str, ref_time: datetime) -> AstronautModel:
    astro = AstronautModel(
        id=astronaut_id,
        callsign="Ares-Lead",
        role="EV1 - Lead Spacewalker",
        mission_day=58,
        mission_profile="ISS_LEO",
        one_way_light_time_sec=2,
        live_flight_surgeon_available=True,
        support_mode="GROUND_MONITORED",
        available_onboard_equipment='["EMU_SPACESUIT_03", "ARED", "T2_TREADMILL", "CEVIS_CYCLE", "MED_KIT_EXPEDITION"]',
        reference_timestamp=ref_time,
        active_provenance="SIMULATED",
        scenario_id="eva_operational_incident_with_eclss_drift",
    )
    session.add(astro)

    # Operational Risk Record (Discrete incident, separated from daily health modules)
    risk_event = OperationalRiskRecordModel(
        id="RISK-EVA-2026-001",
        astronaut_id=astronaut_id,
        timestamp=ref_time - timedelta(hours=3),
        event_type=OperationalRiskEventType.EVA_INJURY_PERFORMANCE.value,
        severity="MEDIUM",
        description="Suit cooling loop delta-T micro-fluctuation during 6.5h EVA; astronaut reported acute right forearm cramping and glove thermal fatigue during airlock outer hatch torque closure.",
        mitigation_applied="Crew assisted airlock repressurization accelerated; oral rehydration (750 mL) and thermal warm compress applied. Range of motion intact.",
        downlink_priority="HIGH",
    )
    session.add(risk_event)

    records: list[MetricRecordModel] = []

    # ECLSS CO2: Baseline ~2.1 mmHg (std 0.15), rises to 3.8 mmHg in the last 2 hours (Z > 10)
    co2_vals = [2.1, 2.2, 2.1, 2.0, 2.2, 2.1, 2.2, 2.1, 2.0, 2.2, 2.1, 2.3, 3.2, 3.6, 3.8]
    for i, val in enumerate(co2_vals):
        t = ref_time - timedelta(hours=(len(co2_vals) - 1 - i))
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.ENVIRONMENT_ECLSS.value,
                metric_name="co2_partial_pressure_mmhg",
                timestamp=t,
                value=float(val),
                unit="mmHg",
                quality="VALID",
                provenance="SIMULATED",
                modality="ENVIRONMENTAL_SENSOR",
                sensor_id="CABIN-AIR-NODE2",
                note="Secondary trace carbon dioxide scrubber bed inspection requested" if val > 3.0 else None,
            )
        )

    # All personal health domains seeded nominally to emphasize clean separation
    await _add_nominal_baseline_records(astronaut_id, ref_time, records)

    session.add_all(records)
    await session.commit()
    return astro


async def _add_nominal_baseline_records(astronaut_id: str, ref_time: datetime, records: list[MetricRecordModel]) -> None:
    # Cardiovascular
    for i in range(14):
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.CARDIOVASCULAR.value,
                metric_name="resting_hr_bpm",
                timestamp=ref_time - timedelta(hours=(14 - i)),
                value=62.0,
                unit="bpm",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
            )
        )
    # Sleep
    for i in range(14):
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.SLEEP_CIRCADIAN.value,
                metric_name="sleep_duration_hours",
                timestamp=ref_time - timedelta(days=(14 - i)),
                value=7.5,
                unit="hours",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
            )
        )
    # Behavioral
    for i in range(14):
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.BEHAVIORAL_PSYCH.value,
                metric_name="cognitive_fatigue_score",
                timestamp=ref_time - timedelta(days=(14 - i)),
                value=2.5,
                unit="score_1_10",
                quality="VALID",
                provenance="SIMULATED",
                modality="SUBJECTIVE_REPORT",
            )
        )
    # Musculoskeletal
    for i in range(14):
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.MUSCULOSKELETAL.value,
                metric_name="exercise_adherence_pct",
                timestamp=ref_time - timedelta(days=(14 - i)),
                value=95.0,
                unit="pct",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
            )
        )
    # Immune
    for days_ago in [28, 14, 2]:
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.IMMUNE_MICROBIO.value,
                metric_name="crp_biomarker_mg_l",
                timestamp=ref_time - timedelta(days=days_ago),
                value=0.8,
                unit="mg/L",
                quality="VALID",
                provenance="SIMULATED",
                modality="LAB_ASSAY",
            )
        )
    # Radiation
    for i in range(14):
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.RADIATION.value,
                metric_name="daily_dose_msv",
                timestamp=ref_time - timedelta(days=(14 - i)),
                value=0.45,
                unit="mSv",
                quality="VALID",
                provenance="SIMULATED",
                modality="OBJECTIVE_SENSOR",
            )
        )
    # Sensorimotor
    for i in range(14):
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.SENSORIMOTOR_NEURO.value,
                metric_name="postural_instability_score",
                timestamp=ref_time - timedelta(days=(14 - i)),
                value=1.5,
                unit="score_1_10",
                quality="VALID",
                provenance="SIMULATED",
                modality="SUBJECTIVE_REPORT",
            )
        )
    # Nutrition
    for i in range(14):
        records.append(
            MetricRecordModel(
                astronaut_id=astronaut_id,
                domain_id=DomainId.NUTRITION.value,
                metric_name="caloric_intake_kcal",
                timestamp=ref_time - timedelta(days=(14 - i)),
                value=2800.0,
                unit="kcal",
                quality="VALID",
                provenance="SIMULATED",
                modality="MANUAL_ENTRY",
            )
        )
