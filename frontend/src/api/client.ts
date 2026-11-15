import {
  AcknowledgeRecommendationRequest,
  ClosedLoopRecommendation,
  DashboardResponse,
  DomainDetailResponse,
  DomainId,
  OperationalRiskRecord,
  SimulationScenario,
  TelemetryBatchRequest,
} from '../types/api';
import {
  INITIAL_DASHBOARD_SCENARIO_1,
  INITIAL_DASHBOARD_SCENARIO_2,
  INITIAL_RISK_RECORDS,
  SCENARIO_1,
  SCENARIO_2,
  getInitialDomainDetails,
} from '../mocks/mockData';

// Environment variable configuration
// VITE_USE_MOCK defaults to true when unset or not explicitly 'false'
const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
const rawUseMock = metaEnv.VITE_USE_MOCK;
export const USE_MOCK: boolean = rawUseMock === undefined || rawUseMock === '' || rawUseMock === 'true';
export const API_BASE_URL: string = metaEnv.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Stateful In-Memory Mock Adapter
 */
class StatefulMockAdapter {
  private currentScenarioId: string = 'circadian_drift_and_fatigue_01';
  private dashboard!: DashboardResponse;
  private domainDetails!: Record<DomainId, DomainDetailResponse>;
  private riskRecords!: OperationalRiskRecord[];

  constructor() {
    this.resetToScenario('circadian_drift_and_fatigue_01');
  }

  public resetToScenario(scenarioId: string): DashboardResponse {
    this.currentScenarioId = scenarioId;
    if (scenarioId === 'nominal_iss_leo_02') {
      this.dashboard = JSON.parse(JSON.stringify(INITIAL_DASHBOARD_SCENARIO_2));
      this.domainDetails = getInitialDomainDetails('nominal_iss_leo_02');
      this.riskRecords = [];
    } else {
      this.dashboard = JSON.parse(JSON.stringify(INITIAL_DASHBOARD_SCENARIO_1));
      this.domainDetails = getInitialDomainDetails('circadian_drift_and_fatigue_01');
      this.riskRecords = JSON.parse(JSON.stringify(INITIAL_RISK_RECORDS));
    }
    this.dashboard.operational_risk_records_count = this.riskRecords.length;
    return JSON.parse(JSON.stringify(this.dashboard));
  }

  public getDashboard(): DashboardResponse {
    return JSON.parse(JSON.stringify(this.dashboard));
  }

  public getDomainDetail(domainId: DomainId): DomainDetailResponse {
    const detail = this.domainDetails[domainId];
    if (!detail) {
      throw new Error(`Domain ${domainId} not found`);
    }
    return JSON.parse(JSON.stringify(detail));
  }

  public getScenarios(): SimulationScenario[] {
    return [SCENARIO_1, SCENARIO_2];
  }

  public acknowledgeRecommendation(
    recId: string,
    payload: AcknowledgeRecommendationRequest
  ): ClosedLoopRecommendation {
    const rec = this.dashboard.recommendations.find((r) => r.id === recId);
    if (!rec) {
      throw new Error(`Recommendation ${recId} not found`);
    }
    rec.reassessment.status = 'ACKNOWLEDGED';
    rec.reassessment.acknowledged_at = payload.acknowledged_at;
    rec.reassessment.action_taken_note = payload.action_taken_note;
    rec.current_step = 'Reassess';

    return JSON.parse(JSON.stringify(rec));
  }

  public ingestTelemetryBatch(payload: TelemetryBatchRequest): {
    success: boolean;
    ingested_count: number;
    updated_metrics: string[];
  } {
    const updatedMetrics: string[] = [];

    for (const item of payload.batch) {
      const domainDetail = this.domainDetails[item.domain_id];
      if (domainDetail) {
        let metric = domainDetail.metrics.find((m) => m.id === item.metric_id);
        if (!metric) {
          metric = {
            id: item.metric_id,
            name: item.metric_id,
            unit: item.unit,
            modality: item.modality,
            baseline: {
              mean: item.value,
              std_dev: 1,
              reference_range_min: item.value * 0.8,
              reference_range_max: item.value * 1.2,
              unit: item.unit,
            },
            series: [],
          };
          domainDetail.metrics.push(metric);
        }

        metric.series.push({
          timestamp: item.timestamp,
          mission_day: item.mission_day,
          value: item.value,
          quality: item.quality,
          provenance: item.provenance,
          modality: item.modality,
          note: item.note,
        });

        // Update domain summary in dashboard
        const domSummary = this.dashboard.domains.find((d) => d.domain_id === item.domain_id);
        if (domSummary) {
          const deltaPct = metric.baseline.mean
            ? Math.round(((item.value - metric.baseline.mean) / metric.baseline.mean) * 1000) / 10
            : 0;

          if (!domSummary.headline_metric) {
            domSummary.headline_metric = {
              name: metric.name,
              value: item.value,
              unit: item.unit,
              baseline_mean: metric.baseline.mean,
              delta_from_baseline_pct: deltaPct,
              quality: item.quality,
            };
          } else {
            domSummary.headline_metric.value = item.value;
            domSummary.headline_metric.quality = item.quality;
            domSummary.headline_metric.delta_from_baseline_pct = deltaPct;
          }
          domSummary.completeness_pct = 100;
          domSummary.last_updated = item.timestamp;

          if (domSummary.status === 'INSUFFICIENT_DATA') {
            domSummary.status = 'NORMAL';
            domSummary.status_reason = null;
            domainDetail.status = 'NORMAL';
            domainDetail.status_reason = null;
            domainDetail.cadence_policy.last_sample_elapsed_days = 0.0;
          }
        }
        updatedMetrics.push(item.metric_id);
      }
    }

    if (payload.batch[0]?.provenance === 'MANUAL_ENTRY') {
      this.dashboard.data_provenance_summary.manual_entry_count += payload.batch.length;
    } else {
      this.dashboard.data_provenance_summary.actual_telem_count += payload.batch.length;
    }

    return {
      success: true,
      ingested_count: payload.batch.length,
      updated_metrics: updatedMetrics,
    };
  }

  public logOperationalRisk(
    astronautId: string,
    record: Omit<OperationalRiskRecord, 'id' | 'logged_at'>
  ): OperationalRiskRecord {
    const newRecord: OperationalRiskRecord = {
      ...record,
      id: `risk-${Date.now()}`,
      astronaut_id: astronautId,
      logged_at: new Date().toISOString(),
    };
    this.riskRecords.unshift(newRecord);
    this.dashboard.operational_risk_records_count = this.riskRecords.length;
    return JSON.parse(JSON.stringify(newRecord));
  }

  public getOperationalRisks(astronautId: string): OperationalRiskRecord[] {
    return JSON.parse(JSON.stringify(this.riskRecords.filter((r) => r.astronaut_id === astronautId)));
  }
}

// Global in-memory adapter instance
const mockAdapter = new StatefulMockAdapter();

/**
 * Unified API Client
 * Seamlessly routes between the stateful in-memory mock adapter and the real live /api/v1 backend.
 */
export const apiClient = {
  isMockActive(): boolean {
    return USE_MOCK;
  },

  async getDashboard(astronautId?: string): Promise<DashboardResponse> {
    if (USE_MOCK) {
      return mockAdapter.getDashboard();
    }
    const url = new URL(`${API_BASE_URL}/api/v1/dashboard`);
    if (astronautId) url.searchParams.append('astronaut_id', astronautId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch dashboard`);
    return res.json();
  },

  async getDomainDetail(domainId: DomainId, astronautId?: string): Promise<DomainDetailResponse> {
    if (USE_MOCK) {
      return mockAdapter.getDomainDetail(domainId);
    }
    const url = new URL(`${API_BASE_URL}/api/v1/domains/${domainId}`);
    if (astronautId) url.searchParams.append('astronaut_id', astronautId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch domain detail`);
    return res.json();
  },

  async getScenarios(): Promise<SimulationScenario[]> {
    if (USE_MOCK) {
      return mockAdapter.getScenarios();
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/scenarios`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch scenarios`);
    return res.json();
  },

  async loadSimulationScenario(scenarioId: string, astronautId?: string): Promise<DashboardResponse> {
    if (USE_MOCK) {
      return mockAdapter.resetToScenario(scenarioId);
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/simulation/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, astronaut_id: astronautId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load scenario`);
    return res.json();
  },

  async acknowledgeRecommendation(
    recId: string,
    payload: AcknowledgeRecommendationRequest
  ): Promise<ClosedLoopRecommendation> {
    if (USE_MOCK) {
      return mockAdapter.acknowledgeRecommendation(recId, payload);
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/recommendations/${recId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to acknowledge recommendation`);
    return res.json();
  },

  async ingestTelemetryBatch(payload: TelemetryBatchRequest): Promise<{
    success: boolean;
    ingested_count: number;
    updated_metrics: string[];
  }> {
    if (USE_MOCK) {
      return mockAdapter.ingestTelemetryBatch(payload);
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/telemetry/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to ingest telemetry batch`);
    return res.json();
  },

  async logOperationalRisk(
    astronautId: string,
    record: Omit<OperationalRiskRecord, 'id' | 'logged_at'>
  ): Promise<OperationalRiskRecord> {
    if (USE_MOCK) {
      return mockAdapter.logOperationalRisk(astronautId, record);
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/astronauts/${astronautId}/operational-risks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to log operational risk`);
    return res.json();
  },

  async getOperationalRisks(astronautId: string): Promise<OperationalRiskRecord[]> {
    if (USE_MOCK) {
      return mockAdapter.getOperationalRisks(astronautId);
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/astronauts/${astronautId}/operational-risks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch operational risks`);
    return res.json();
  },
};
