"""Domain Cadence & Scope Policies.

Configures expected sampling intervals, staleness criteria, minimum valid samples,
and mandatory scope notices across all 9 domains.
"""

from pydantic import BaseModel
from app.models.enums import DomainId, DomainCategory


class CadencePolicy(BaseModel):
    expected_interval_hours: float
    stale_after_hours: float
    minimum_valid_samples_for_baseline: int


class DomainDefinition(BaseModel):
    domain_id: DomainId
    domain_category: DomainCategory
    display_name: str
    measurement_scope_notice: str
    headline_metric: str
    cadence_policy: CadencePolicy


DOMAIN_DEFINITIONS: dict[DomainId, DomainDefinition] = {
    DomainId.CARDIOVASCULAR: DomainDefinition(
        domain_id=DomainId.CARDIOVASCULAR,
        domain_category=DomainCategory.PERSONAL_HEALTH,
        display_name="Cardiovascular Health",
        measurement_scope_notice="Physiological cardiovascular telemetry. Tracks acute autonomic responses and long-term spaceflight deconditioning. Does not substitute for clinical echocardiography or vascular ultrasound.",
        headline_metric="resting_hr_bpm",
        cadence_policy=CadencePolicy(
            expected_interval_hours=1.0,
            stale_after_hours=4.0,
            minimum_valid_samples_for_baseline=10,
        ),
    ),
    DomainId.SLEEP_CIRCADIAN: DomainDefinition(
        domain_id=DomainId.SLEEP_CIRCADIAN,
        domain_category=DomainCategory.PERSONAL_HEALTH,
        display_name="Sleep & Circadian Rhythm",
        measurement_scope_notice="Sleep architecture, duration, and circadian phase alignment monitoring. Reflects rest intervals and sleep disruption in confined microgravity environments.",
        headline_metric="sleep_duration_hours",
        cadence_policy=CadencePolicy(
            expected_interval_hours=24.0,
            stale_after_hours=48.0,
            minimum_valid_samples_for_baseline=7,
        ),
    ),
    DomainId.BEHAVIORAL_PSYCH: DomainDefinition(
        domain_id=DomainId.BEHAVIORAL_PSYCH,
        domain_category=DomainCategory.PERSONAL_HEALTH,
        display_name="Behavioral & Psychological Wellbeing",
        measurement_scope_notice="Self-reported psychological state, perceived workload, and cognitive performance markers. Subjective wellness tracking to support crew autonomy in isolation.",
        headline_metric="cognitive_fatigue_score",
        cadence_policy=CadencePolicy(
            expected_interval_hours=24.0,
            stale_after_hours=48.0,
            minimum_valid_samples_for_baseline=5,
        ),
    ),
    DomainId.MUSCULOSKELETAL: DomainDefinition(
        domain_id=DomainId.MUSCULOSKELETAL,
        domain_category=DomainCategory.PERSONAL_HEALTH,
        display_name="Musculoskeletal & Physical Activity",
        measurement_scope_notice="Exercise countermeasure adherence and exertion tracking only. Does not directly measure bone mineral density (BMD) or volumetric muscle atrophy.",
        headline_metric="exercise_adherence_pct",
        cadence_policy=CadencePolicy(
            expected_interval_hours=24.0,
            stale_after_hours=48.0,
            minimum_valid_samples_for_baseline=5,
        ),
    ),
    DomainId.IMMUNE_MICROBIO: DomainDefinition(
        domain_id=DomainId.IMMUNE_MICROBIO,
        domain_category=DomainCategory.PERSONAL_HEALTH,
        display_name="Immune & Microbiome Health",
        measurement_scope_notice="Periodic lab assays and biomarker observations. Standard wearable sensors do not directly measure immune competence or latent viral reactivation.",
        headline_metric="crp_biomarker_mg_l",
        cadence_policy=CadencePolicy(
            expected_interval_hours=168.0,
            stale_after_hours=336.0,
            minimum_valid_samples_for_baseline=2,
        ),
    ),
    DomainId.RADIATION: DomainDefinition(
        domain_id=DomainId.RADIATION,
        domain_category=DomainCategory.PERSONAL_HEALTH,
        display_name="Radiation Dosimetry",
        measurement_scope_notice="Personal dosimeter exposure history and dose rate logging (e.g. CANS neutron dosimeter). Tracks cumulative exposure; does not calculate individual cancer probability or diagnose acute radiation sickness.",
        headline_metric="daily_dose_msv",
        cadence_policy=CadencePolicy(
            expected_interval_hours=24.0,
            stale_after_hours=48.0,
            minimum_valid_samples_for_baseline=5,
        ),
    ),
    DomainId.ENVIRONMENT_ECLSS: DomainDefinition(
        domain_id=DomainId.ENVIRONMENT_ECLSS,
        domain_category=DomainCategory.ENVIRONMENTAL_ECLSS,
        display_name="Environmental & Life-Support (ECLSS)",
        measurement_scope_notice="Spacecraft environmental telemetry (cabin CO2, O2, cabin pressure, temperature, relative humidity). Reflects habitat life-support status, not individual physiological measurements.",
        headline_metric="co2_partial_pressure_mmhg",
        cadence_policy=CadencePolicy(
            expected_interval_hours=1.0,
            stale_after_hours=4.0,
            minimum_valid_samples_for_baseline=10,
        ),
    ),
    DomainId.SENSORIMOTOR_NEURO: DomainDefinition(
        domain_id=DomainId.SENSORIMOTOR_NEURO,
        domain_category=DomainCategory.PERSONAL_HEALTH,
        display_name="Sensorimotor & Neurovestibular",
        measurement_scope_notice="Postural equilibrium, vestibular adaptation, and Spaceflight-Associated Neuro-ocular Syndrome (SANS) check-ins. Functional operational screening.",
        headline_metric="postural_instability_score",
        cadence_policy=CadencePolicy(
            expected_interval_hours=24.0,
            stale_after_hours=72.0,
            minimum_valid_samples_for_baseline=5,
        ),
    ),
    DomainId.NUTRITION: DomainDefinition(
        domain_id=DomainId.NUTRITION,
        domain_category=DomainCategory.PERSONAL_HEALTH,
        display_name="Nutrition & Hydration",
        measurement_scope_notice="Nutritional intake, hydration logs, and caloric adherence monitoring for deep space operations.",
        headline_metric="caloric_intake_kcal",
        cadence_policy=CadencePolicy(
            expected_interval_hours=24.0,
            stale_after_hours=48.0,
            minimum_valid_samples_for_baseline=5,
        ),
    ),
}

