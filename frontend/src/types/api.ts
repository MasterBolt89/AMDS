/**
 * NASA AMPCS (Aerospace Medical Prognostics & Clinical Surveillance)
 * Locked /api/v1 TypeScript Contract
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

export type ReassessmentStatus = 'PENDING' | 'ACKNOWLEDGED';

export type ReassessmentOutcome =
  | 'PENDING'
  | 'IMPROVED'
  | 'UNCHANGED'
  | 'WORSENED'
  | 'INSUFFICIENT_DATA';

export type RecommendationWorkflowStep = 'Collect' | 'Assess' | 'Explain' | 'Act' | 'Reassess';

export type OperationalRiskType =
  | 'HYPOXIA'
  | 'DECOMPRESSION_SICKNESS'
  | 'EVA_INJURY'
  | 'REENTRY_LANDING_LOAD';

export interface AstronautInfo {
  id: string;
  callsign: string;
  name: string;
  role: string;
  crew_position: string;
}

export interface MissionContext {
  mission_name: string;
  mission_phase: string;
  mission_day: number;
  one_way_light_time_sec: number;
  live_flight_surgeon_available: boolean;
  active_provenance: Provenance;
}

export interface DataProvenanceSummary {
  active_provenance: Provenance;
  actual_telem_count: number;
  manual_entry_count: number;
  simulated_count: number;
  last_sync_timestamp: string;
}

export interface HeadlineMetric {
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
  status: AssessmentStatus;
  status_reason?: string | null;
  measurement_scope_notice: string;
  headline_metric?: HeadlineMetric | null;
  completeness_pct: number;
  last_updated: string;
}

export interface Citation {
  title: string;
  source: string;
  url?: string;
}

export interface CrossDomainFinding {
  id: string;
  title: string;
  summary: string;
  severity: AssessmentStatus;
  evidence_type: EvidenceType;
  contributing_domains: DomainId[];
  citations: Citation[];
  created_at: string;
}

export interface ReassessmentInfo {
  status: ReassessmentStatus;
  due_mission_day: number;
  expected_window_hours: number;
  outcome: ReassessmentOutcome;
  acknowledged_at?: string | null;
  action_taken_note?: string | null;
}

export interface ClosedLoopRecommendation {
  id: string;
  finding_id?: string;
  domain_id: DomainId;
  title: string;
  action_summary: string;
  escalate_when: string;
  consultation_guidance: string;
  current_step: RecommendationWorkflowStep;
  steps: RecommendationWorkflowStep[];
  reassessment: ReassessmentInfo;
  created_at: string;
}

export interface DashboardResponse {
  astronaut: AstronautInfo;
  mission_context: MissionContext;
  data_provenance_summary: DataProvenanceSummary;
  domains: DomainSummary[];
  findings: CrossDomainFinding[];
  recommendations: ClosedLoopRecommendation[];
  operational_risk_records_count: number;
}

export interface MetricSeriesPoint {
  timestamp: string;
  mission_day: number;
  value: number | null;
  quality: DataQuality;
  provenance: Provenance;
  modality: Modality;
  note?: string | null;
}

export interface MetricBaseline {
  mean: number;
  std_dev: number;
  reference_range_min: number;
  reference_range_max: number;
  unit: string;
  population_reference?: string;
}

export interface MetricDetail {
  id: string;
  name: string;
  unit: string;
  modality: Modality;
  baseline: MetricBaseline;
  series: MetricSeriesPoint[];
}

export interface CadencePolicy {
  expected_frequency_hours: number;
  max_acceptable_gap_hours: number;
  last_sample_elapsed_days: number;
  collection_method: string;
}

export interface DomainDetailResponse {
  domain_id: DomainId;
  domain_category: DomainCategory;
  display_name: string;
  status: AssessmentStatus;
  status_reason?: string | null;
  measurement_scope_notice: string;
  cadence_policy: CadencePolicy;
  metrics: MetricDetail[];
}

export interface TelemetryBatchItem {
  domain_id: DomainId;
  metric_id: string;
  value: number;
  unit: string;
  timestamp: string;
  mission_day: number;
  provenance: Provenance;
  modality: Modality;
  quality: DataQuality;
  note?: string;
}

export interface TelemetryBatchRequest {
  astronaut_id: string;
  batch: TelemetryBatchItem[];
}

export interface AcknowledgeRecommendationRequest {
  astronaut_id: string;
  action_taken_note: string;
  acknowledged_at: string;
}

export interface OperationalRiskRecord {
  id: string;
  astronaut_id: string;
  risk_type: OperationalRiskType;
  risk_name: string;
  severity: AssessmentStatus;
  mitigation_status: string;
  logged_at: string;
  mission_day: number;
  notes: string;
}

export interface AssessmentHistoryItem {
  id: string;
  mission_day: number;
  timestamp: string;
  domain_id: DomainId;
  status: AssessmentStatus;
  headline_value: number | null;
  unit: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  astronaut_id: string;
  mission_context: MissionContext;
}
