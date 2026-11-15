"""Canonical Enums for Astronaut Health Monitoring & Intelligence Engine.

All domain IDs, categories, assessment statuses, provenances, and evidence types
are standardized here to prevent string fragmentation across the API and intelligence layers.
"""

from enum import Enum


class DomainId(str, Enum):
    CARDIOVASCULAR = "cardiovascular"
    SLEEP_CIRCADIAN = "sleep_circadian"
    BEHAVIORAL_PSYCH = "behavioral_psych"
    MUSCULOSKELETAL = "musculoskeletal"
    IMMUNE_MICROBIO = "immune_microbio"
    RADIATION = "radiation"
    ENVIRONMENT_ECLSS = "environment_eclss"
    SENSORIMOTOR_NEURO = "sensorimotor_neuro"
    NUTRITION = "nutrition"


class DomainCategory(str, Enum):
    PERSONAL_HEALTH = "PERSONAL_HEALTH"
    ENVIRONMENTAL_ECLSS = "ENVIRONMENTAL_ECLSS"


class AssessmentStatus(str, Enum):
    NORMAL = "NORMAL"
    ATTENTION = "ATTENTION"
    CRITICAL = "CRITICAL"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class Provenance(str, Enum):
    ACTUAL_TELEM = "ACTUAL_TELEM"
    MANUAL_ENTRY = "MANUAL_ENTRY"
    SIMULATED = "SIMULATED"


class DataQuality(str, Enum):
    VALID = "VALID"
    SUSPECT = "SUSPECT"
    MISSING = "MISSING"


class Modality(str, Enum):
    OBJECTIVE_SENSOR = "OBJECTIVE_SENSOR"
    LAB_ASSAY = "LAB_ASSAY"
    SUBJECTIVE_REPORT = "SUBJECTIVE_REPORT"
    ENVIRONMENTAL_SENSOR = "ENVIRONMENTAL_SENSOR"


class EvidenceType(str, Enum):
    VALIDATED_STANDARD = "VALIDATED_STANDARD"
    STATISTICAL_BASELINE_DRIFT = "STATISTICAL_BASELINE_DRIFT"
    EXPERIMENTAL_HEURISTIC = "EXPERIMENTAL_HEURISTIC"


class ReassessmentOutcome(str, Enum):
    PENDING = "PENDING"
    IMPROVED = "IMPROVED"
    UNCHANGED = "UNCHANGED"
    WORSENED = "WORSENED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class MissionProfile(str, Enum):
    ISS_LEO = "ISS_LEO"
    MARS_TRANSIT = "MARS_TRANSIT"


class RecommendationStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class OperationalRiskEventType(str, Enum):
    HYPOXIA_EVENT = "HYPOXIA_EVENT"
    DCS_CONCERN = "DCS_CONCERN"
    EVA_INJURY_PERFORMANCE = "EVA_INJURY_PERFORMANCE"
    DYNAMIC_LOAD_EVENT = "DYNAMIC_LOAD_EVENT"

