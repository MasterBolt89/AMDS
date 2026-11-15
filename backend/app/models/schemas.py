"""Pydantic v2 Schemas for Locked REST API Contract."""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import (
    AssessmentStatus,
    DataQuality,
    DomainCategory,
    DomainId,
    EvidenceType,
    MissionProfile,
    Modality,
    OperationalRiskEventType,
    Provenance,
    ReassessmentOutcome,
    RecommendationStatus,
)
from app.intelligence.cadences import CadencePolicy


# --- Core Astronaut & Mission Context ---

class AstronautSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    callsign: str
    role: str
    mission_day: int


class MissionContext(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    mission_profile: MissionProfile
    one_way_light_time_sec: int
    live_flight_surgeon_available: bool
    support_mode: str
    available_onboard_equipment: list[str]


class DataProvenanceSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    active_provenance: Provenance
    scenario_id: Optional[str] = None
    overall_completeness_pct: float


# --- Domains & Dashboard Summaries ---

class DomainSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    domain_id: DomainId
    domain_category: DomainCategory
    display_name: str
    measurement_scope_notice: str
    status: AssessmentStatus
    completeness_pct: float
    last_updated: Optional[datetime] = None
    headline_metric: str
    status_reason: str
    active_finding_count: int


class FindingEvidence(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    evidence_type: EvidenceType
    is_validated_clinical_threshold: bool
    supporting_metrics: dict[str, Any]
    reference_source: str


class Finding(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    finding_id: str
    severity: str
    is_cross_domain: bool
    involved_domains: list[DomainId]
    title: str
    what_changed: str
    why_it_matters: str
    evidence: FindingEvidence


class ReassessmentTracker(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: RecommendationStatus
    acknowledged_at: Optional[datetime] = None
    action_taken_note: Optional[str] = None
    reassess_after: Optional[datetime] = None
    target_metric: str
    baseline_at_trigger: Optional[float] = None
    latest_followup_value: Optional[float] = None
    outcome: ReassessmentOutcome


class RecommendationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recommendation_id: str
    finding_id: str
    action_summary: str
    consultation_guidance: str
    escalate_when: str
    reassessment: ReassessmentTracker


class DashboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    astronaut: AstronautSummary
    mission_context: MissionContext
    data_provenance_summary: DataProvenanceSummary
    domains: list[DomainSummary]
    findings: list[Finding]
    recommendations: list[RecommendationItem]
    operational_risk_records_count: int


# --- Domain Detail & Time-Series ---

class MetricSeriesPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime
    value: Optional[float]
    quality: DataQuality
    provenance: Provenance
    sensor_id: Optional[str] = None
    note: Optional[str] = None


class DomainMetricBaseline(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    window_label: str
    is_validated_standard: bool
    mean: float
    std_dev: float
    sample_count: int


class DomainMetricDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    metric_name: str
    unit: str
    baseline: DomainMetricBaseline
    series: list[MetricSeriesPoint]


class DomainDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    domain_id: DomainId
    domain_category: DomainCategory
    display_name: str
    status: AssessmentStatus
    measurement_scope_notice: str
    cadence_policy: CadencePolicy
    metrics: list[DomainMetricDetail]


# --- Ingestion Schemas ---

class TelemetryMeasurementItem(BaseModel):
    astronaut_id: str
    domain_id: DomainId
    metric_name: str
    timestamp: datetime
    value: Optional[float] = None
    unit: str
    quality: DataQuality = DataQuality.VALID
    provenance: Provenance = Provenance.ACTUAL_TELEM
    modality: Modality = Modality.OBJECTIVE_SENSOR
    sensor_id: Optional[str] = None
    note: Optional[str] = None


class BatchTelemetryIngestRequest(BaseModel):
    measurements: list[TelemetryMeasurementItem] = Field(..., min_length=1)


class BatchTelemetryResponse(BaseModel):
    ingested_count: int
    rejected_count: int
    reassessment_evaluations: list[dict[str, Any]] = Field(default_factory=list)
    message: str


# --- Assessment History ---

class AssessmentHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime
    domain_id: DomainId
    previous_status: AssessmentStatus
    new_status: AssessmentStatus
    reason: str


class AssessmentHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    astronaut_id: str
    history: list[AssessmentHistoryItem]


# --- Recommendation Acknowledgement ---

class RecommendationAcknowledgeRequest(BaseModel):
    astronaut_id: str
    action_taken_note: str
    acknowledged_at: datetime


class RecommendationAcknowledgeResponse(BaseModel):
    recommendation_id: str
    status: RecommendationStatus
    acknowledged_at: datetime
    reassess_after: datetime
    baseline_at_trigger: Optional[float] = None
    message: str


# --- Operational Risks ---

class OperationalRiskCreateRequest(BaseModel):
    timestamp: datetime
    event_type: OperationalRiskEventType
    severity: str
    description: str
    mitigation_applied: str
    downlink_priority: str = "ROUTINE"


class OperationalRiskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    astronaut_id: str
    timestamp: datetime
    event_type: OperationalRiskEventType
    severity: str
    description: str
    mitigation_applied: str
    downlink_priority: str


# --- Simulation Scenarios ---

class SimulationScenarioItem(BaseModel):
    scenario_id: str
    name: str
    description: str
    mission_profile: MissionProfile
    hazards_featured: list[str]


class SimulationScenarioListResponse(BaseModel):
    scenarios: list[SimulationScenarioItem]


class SimulationLoadRequest(BaseModel):
    scenario_id: str
    astronaut_id: str


# --- Standard Error Envelope ---

class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class ErrorEnvelope(BaseModel):
    error: ErrorDetail

