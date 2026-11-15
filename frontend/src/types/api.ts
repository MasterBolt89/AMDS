/**
 * NASA AMPCS (Aerospace Medical Prognostics & Clinical Surveillance)
 * Locked /api/v1 TypeScript Contract & OpenAPI Schema Parity
 */

export type DomainId =
  | 'cardiovascular'
  | 'sleep_circadian'
  | 'behavioral_psych'
  | 'musculoskeletal'
  | 'immune_microbio'
  | 'radiation'
  | 'environment_eclss'
  | 'sensorimotor_neuro'
  | 'nutrition';

export type DomainCategory = 'PERSONAL_HEALTH' | 'ENVIRONMENTAL_ECLSS';

export type AssessmentStatus = 'NORMAL' | 'ATTENTION' | 'CRITICAL' | 'INSUFFICIENT_DATA';

export type Provenance = 'ACTUAL_TELEM' | 'MANUAL_ENTRY' | 'SIMULATED';

export type DataQuality = 'VALID' | 'SUSPECT' | 'MISSING';

export type Modality =
  | 'OBJECTIVE_SENSOR'
  | 'LAB_ASSAY'
  | 'SUBJECTIVE_REPORT'
  | 'ENVIRONMENTAL_SENSOR';

export type EvidenceType =
  | 'VALIDATED_STANDARD'
  | 'STATISTICAL_BASELINE_DRIFT'
  | 'EXPERIMENTAL_HEURISTIC';

export type RecommendationStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export type ReassessmentStatus = 'PENDING' | 'ACKNOWLEDGED' | 'ACTIVE' | 'RESOLVED';

export type ReassessmentOutcome =
  | 'PENDING'
  | 'IMPROVED'
  | 'UNCHANGED'
  | 'WORSENED'
  | 'INSUFFICIENT_DATA';

export type RecommendationWorkflowStep = 'Collect' | 'Assess' | 'Explain' | 'Act' | 'Reassess';

export type MissionProfile = 'ISS_LEO' | 'MARS_TRANSIT';

export type OperationalRiskEventType =
  | 'HYPOXIA_EVENT'
  | 'DCS_CONCERN'
  | 'EVA_INJURY_PERFORMANCE'
  | 'DYNAMIC_LOAD_EVENT';

// Legacy / alias type support
export type OperationalRiskType = OperationalRiskEventType | string;

export interface AstronautSummary {
  id: string;
  callsign: string;
  role: string;
  mission_day: number;
}

// AstronautInfo alias for backward-compatibility
export interface AstronautInfo extends AstronautSummary {
  name?: string;
  crew_position?: string;
}

export interface MissionContext {
  mission_profile: MissionProfile;
  one_way_light_time_sec: number;
  live_flight_surgeon_available: boolean;
  support_mode: string;
  available_onboard_equipment: string[];
  mission_name?: string;
  mission_phase?: string;
  mission_day?: number;
  active_provenance?: Provenance;
}

export interface DataProvenanceSummary {
  active_provenance: Provenance;
  scenario_id?: string | null;
  overall_completeness_pct: number;
  actual_telem_count?: number;
  manual_entry_count?: number;
  simulated_count?: number;
  last_sync_timestamp?: string;
}

export interface HeadlineMetricObject {
  name: string;
  value: number | null;
  unit: string;
  baseline_mean: number | null;
  delta_from_baseline_pct: number | null;
  quality: DataQuality;
}

export interface DomainSummary {
  domain_id: DomainId;
  domain_category: DomainCategory;
  display_name: string;
  measurement_scope_notice: string;
  status: AssessmentStatus;
  completeness_pct: number;
  last_updated?: string | null;
  headline_metric: string | HeadlineMetricObject | null;
  status_reason: string | null;
  active_finding_count?: number;
}

export interface Citation {
  title: string;
  source: string;
  url?: string;
}

export interface FindingEvidence {
  evidence_type: EvidenceType;
  is_validated_clinical_threshold: boolean;
  supporting_metrics: Record<string, any>;
  reference_source: string;
}

export interface Finding {
  finding_id: string;
  id?: string; // alias
  severity: string;
  is_cross_domain: boolean;
  involved_domains: DomainId[];
  contributing_domains?: DomainId[]; // alias
  title: string;
  what_changed: string;
  why_it_matters: string;
  summary?: string; // alias
  evidence: FindingEvidence;
  citations?: Citation[];
  created_at?: string;
}

export type CrossDomainFinding = Finding;

export interface ReassessmentTracker {
  status: RecommendationStatus | string;
  due_mission_day: number;
  reassess_window_hours: number;
  expected_window_hours?: number; // alias
  outcome: ReassessmentOutcome;
  action_taken_note?: string | null;
  acknowledged_at?: string | null;
  baseline_at_trigger?: number | null;
  latest_followup_value?: number | null;
}

export interface RecommendationItem {
  recommendation_id: string;
  id?: string; // alias
  finding_id: string;
  action_summary: string;
  consultation_guidance: string;
  escalate_when: string;
  reassessment: ReassessmentTracker;
  domain_id?: DomainId;
  title?: string;
  current_step?: RecommendationWorkflowStep;
  steps?: RecommendationWorkflowStep[];
  created_at?: string;
}

export type ClosedLoopRecommendation = RecommendationItem;

export interface DashboardResponse {
  astronaut: AstronautSummary;
  mission_context: MissionContext;
  data_provenance_summary: DataProvenanceSummary;
  domains: DomainSummary[];
  findings: Finding[];
  recommendations: RecommendationItem[];
  operational_risk_records_count: number;
}

export interface MetricSeriesPoint {
  timestamp: string;
  value: number | null;
  quality: DataQuality;
  provenance: Provenance;
  sensor_id?: string | null;
  note?: string | null;
  mission_day?: number;
  modality?: Modality;
}

export interface DomainMetricBaseline {
  window_label: string;
  is_validated_standard: boolean;
  mean: number;
  std_dev: number;
  sample_count: number;
  reference_range_min?: number;
  reference_range_max?: number;
  unit?: string;
  population_reference?: string;
}

export interface DomainMetricDetail {
  metric_name: string;
  id?: string; // alias
  name?: string; // alias
  unit: string;
  baseline: DomainMetricBaseline;
  series: MetricSeriesPoint[];
  modality?: Modality;
}

export type MetricDetail = DomainMetricDetail;

export interface CadencePolicy {
  expected_interval_hours: number;
  stale_after_hours: number;
  minimum_valid_samples_for_baseline: number;
  expected_frequency_hours?: number; // alias
  max_acceptable_gap_hours?: number; // alias
  last_sample_elapsed_days?: number; // calculated / populated
  collection_method?: string;
}

export interface DomainDetailResponse {
  domain_id: DomainId;
  domain_category: DomainCategory;
  display_name: string;
  status: AssessmentStatus;
  status_reason?: string | null;
  measurement_scope_notice: string;
  cadence_policy: CadencePolicy;
  metrics: DomainMetricDetail[];
}

export interface TelemetryMeasurementItem {
  astronaut_id: string;
  domain_id: DomainId;
  metric_name: string;
  timestamp: string;
  value: number | null;
  unit: string;
  quality?: DataQuality;
  provenance?: Provenance;
  modality?: Modality;
  sensor_id?: string | null;
  note?: string | null;
  mission_day?: number;
}

export interface BatchTelemetryIngestRequest {
  measurements: TelemetryMeasurementItem[];
}

// Backward compatible alias
export interface TelemetryBatchRequest {
  astronaut_id?: string;
  batch?: any[];
  measurements?: TelemetryMeasurementItem[];
}

export interface BatchTelemetryResponse {
  ingested_count: number;
  rejected_count: number;
  reassessment_evaluations?: any[];
  message: string;
}

export interface RecommendationAcknowledgeRequest {
  astronaut_id: string;
  action_taken_note: string;
  acknowledged_at: string;
}

export type AcknowledgeRecommendationRequest = RecommendationAcknowledgeRequest;

export interface RecommendationAcknowledgeResponse {
  recommendation_id: string;
  status: RecommendationStatus;
  acknowledged_at: string;
  reassess_after: string;
  baseline_at_trigger?: number | null;
  message: string;
}

export interface OperationalRiskCreateRequest {
  timestamp: string;
  event_type: OperationalRiskEventType;
  severity: string;
  description: string;
  mitigation_applied: string;
  downlink_priority?: string;
}

export interface OperationalRiskResponse {
  id: string;
  astronaut_id: string;
  timestamp: string;
  event_type: OperationalRiskEventType;
  severity: string;
  description: string;
  mitigation_applied: string;
  downlink_priority: string;
  // UI aliases
  risk_type?: OperationalRiskEventType;
  risk_name?: string;
  mission_day?: number;
  notes?: string;
  mitigation_status?: string;
}

export type OperationalRiskRecord = OperationalRiskResponse;

export interface SimulationScenarioItem {
  scenario_id: string;
  id?: string; // alias
  name: string;
  description: string;
  mission_profile: MissionProfile;
  hazards_featured: string[];
  astronaut_id?: string;
  mission_context?: MissionContext;
}

export type SimulationScenario = SimulationScenarioItem;

export interface SimulationScenarioListResponse {
  scenarios: SimulationScenarioItem[];
}

export interface SimulationLoadRequest {
  scenario_id: string;
  astronaut_id: string;
}

export interface AssessmentHistoryItem {
  timestamp: string;
  domain_id: DomainId;
  previous_status: AssessmentStatus;
  new_status: AssessmentStatus;
  reason: string;
}

export interface AssessmentHistoryResponse {
  astronaut_id: string;
  history: AssessmentHistoryItem[];
}
