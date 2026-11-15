import {
  AstronautSummary,
  BatchTelemetryIngestRequest,
  BatchTelemetryResponse,
  ClosedLoopRecommendation,
  DashboardResponse,
  DomainDetailResponse,
  DomainId,
  OperationalRiskCreateRequest,
  OperationalRiskResponse,
  RecommendationAcknowledgeRequest,
  RecommendationAcknowledgeResponse,
  SimulationScenarioItem,
  TelemetryBatchRequest,
} from '../types/api';
import {
  ALL_SCENARIOS,
  INITIAL_RISK_RECORDS_SCENARIO_4,
  buildDashboardForScenario,
  buildDomainDetailsForScenario,
} from '../mocks/mockData';

// Environment variable configuration
// VITE_USE_MOCK defaults to true unless explicitly 'false'
const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
const rawUseMock = metaEnv.VITE_USE_MOCK;
export const USE_MOCK: boolean = rawUseMock !== 'false';
export const API_BASE_URL: string = metaEnv.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Stateful In-Memory Mock Adapter Supporting All 4 Scenarios & Dynamic Astronaut
 */
export class StatefulMockAdapter {
  private currentScenarioId: string = 'nominal_iss_baseline';
  private currentAstronautId: string = 'astro-101';
  private dashboard!: DashboardResponse;
  private domainDetails!: Record<DomainId, DomainDetailResponse>;
  private riskRecords: OperationalRiskResponse[] = [];

  constructor() {
    this.resetToScenario('nominal_iss_baseline', 'astro-101');
  }

  public resetToScenario(scenarioId: string, astronautId: string = 'astro-101'): DashboardResponse {
    this.currentScenarioId = scenarioId;
    this.currentAstronautId = astronautId;
    this.dashboard = buildDashboardForScenario(scenarioId);
    this.dashboard.astronaut.id = astronautId;
    this.domainDetails = buildDomainDetailsForScenario(scenarioId);

    if (scenarioId === 'eva_operational_incident_with_eclss_drift') {
      this.riskRecords = JSON.parse(JSON.stringify(INITIAL_RISK_RECORDS_SCENARIO_4));
    } else {
      this.riskRecords = [];
    }
    this.dashboard.operational_risk_records_count = this.riskRecords.length;

    return JSON.parse(JSON.stringify(this.dashboard));
  }

  public getAstronauts(): AstronautSummary[] {
    return [
      {
        id: this.currentAstronautId,
        callsign: 'Ares-Lead',
        role: this.dashboard?.astronaut?.role || 'Flight Engineer & Science Officer',
        mission_day: this.dashboard?.astronaut?.mission_day || 42,
      },
    ];
  }

  public getDashboard(astronautId?: string): DashboardResponse {
    if (astronautId && astronautId !== this.currentAstronautId) {
      this.currentAstronautId = astronautId;
      this.dashboard.astronaut.id = astronautId;
    }
    return JSON.parse(JSON.stringify(this.dashboard));
  }

  public getDomainDetail(astronautId: string, domainId: DomainId): DomainDetailResponse {
    const detail = this.domainDetails[domainId];
    if (!detail) {
      throw new Error(`Domain ${domainId} not found`);
    }
    return JSON.parse(JSON.stringify(detail));
  }

  public getScenarios(): SimulationScenarioItem[] {
    return ALL_SCENARIOS;
  }

  public acknowledgeRecommendation(
    recId: string,
    payload: RecommendationAcknowledgeRequest
  ): RecommendationAcknowledgeResponse {
    const rec = this.dashboard.recommendations.find(
      (r) => r.recommendation_id === recId || (r as any).id === recId
    );
    if (!rec) {
      throw new Error(`Recommendation ${recId} not found`);
    }
    rec.reassessment.status = 'ACKNOWLEDGED';
    rec.reassessment.acknowledged_at = payload.acknowledged_at;
    rec.reassessment.action_taken_note = payload.action_taken_note;
    rec.current_step = 'Reassess';

    return {
      recommendation_id: recId,
      status: 'ACKNOWLEDGED',
      acknowledged_at: payload.acknowledged_at,
      reassess_after: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      baseline_at_trigger: 4.3,
      message: 'Recommendation acknowledged and intervention protocol logged.',
    };
  }

  public ingestTelemetryBatch(payload: BatchTelemetryIngestRequest | TelemetryBatchRequest): BatchTelemetryResponse {
    const measurements =
      (payload as BatchTelemetryIngestRequest).measurements ||
      (payload as TelemetryBatchRequest).batch?.map((b) => ({
        astronaut_id: (payload as TelemetryBatchRequest).astronaut_id || 'astro-101',
        domain_id: b.domain_id,
        metric_name: b.metric_name || b.metric_id,
        timestamp: b.timestamp,
        value: b.value,
        unit: b.unit,
        quality: b.quality,
        provenance: b.provenance,
        modality: b.modality,
        note: b.note,
      })) ||
      [];

    let ingested = 0;

    for (const item of measurements) {
      const domainDetail = this.domainDetails[item.domain_id];
      if (domainDetail) {
        let metric = domainDetail.metrics.find(
          (m) => m.metric_name === item.metric_name || (m as any).id === item.metric_name
        );
        if (!metric) {
          metric = {
            metric_name: item.metric_name,
            unit: item.unit,
            modality: item.modality || 'LAB_ASSAY',
            baseline: {
              window_label: 'Dynamic Baseline',
              is_validated_standard: true,
              mean: item.value ?? 0,
              std_dev: 1,
              sample_count: 5,
              reference_range_min: (item.value ?? 0) * 0.8,
              reference_range_max: (item.value ?? 0) * 1.2,
              unit: item.unit,
            },
            series: [],
          };
          domainDetail.metrics.push(metric);
        }

        metric.series.push({
          timestamp: item.timestamp,
          mission_day: item.mission_day || this.dashboard.astronaut.mission_day,
          value: item.value,
          quality: item.quality || 'VALID',
          provenance: item.provenance || 'MANUAL_ENTRY',
          modality: item.modality || 'LAB_ASSAY',
          note: item.note,
        });

        const domSummary = this.dashboard.domains.find((d) => d.domain_id === item.domain_id);
        if (domSummary) {
          domSummary.completeness_pct = 100;
          domSummary.last_updated = item.timestamp;
          domSummary.headline_metric = `${item.value} ${item.unit}`;

          if (domSummary.status === 'INSUFFICIENT_DATA') {
            domSummary.status = 'NORMAL';
            domSummary.status_reason = 'Telemetry updated; biomarker cadence validated';
            domainDetail.status = 'NORMAL';
            domainDetail.status_reason = null;
            domainDetail.cadence_policy.last_sample_elapsed_days = 0.0;
          }
        }
        ingested++;
      }
    }

    return {
      ingested_count: ingested,
      rejected_count: 0,
      message: `Successfully ingested ${ingested} telemetry measurement(s).`,
    };
  }

  public logOperationalRisk(
    astronautId: string,
    record: OperationalRiskCreateRequest
  ): OperationalRiskResponse {
    const newRecord: OperationalRiskResponse = {
      id: `RISK-${Date.now()}`,
      astronaut_id: astronautId,
      timestamp: record.timestamp || new Date().toISOString(),
      event_type: record.event_type,
      severity: record.severity,
      description: record.description,
      mitigation_applied: record.mitigation_applied,
      downlink_priority: record.downlink_priority || 'ROUTINE',
      risk_type: record.event_type,
      risk_name: record.description,
      mission_day: this.dashboard.astronaut.mission_day,
      notes: record.description,
      mitigation_status: record.mitigation_applied,
    };
    this.riskRecords.unshift(newRecord);
    this.dashboard.operational_risk_records_count = this.riskRecords.length;
    return JSON.parse(JSON.stringify(newRecord));
  }

  public getOperationalRisks(astronautId: string): OperationalRiskResponse[] {
    return JSON.parse(JSON.stringify(this.riskRecords.filter((r) => r.astronaut_id === astronautId)));
  }
}

const mockAdapter = new StatefulMockAdapter();

/**
 * Unified API Client
 * Seamlessly interfaces with live FastAPI /api/v1 backend or in-memory mock adapter.
 */
export const apiClient = {
  isMockActive(): boolean {
    return USE_MOCK;
  },

  async getAstronauts(): Promise<AstronautSummary[]> {
    if (USE_MOCK) {
      return mockAdapter.getAstronauts();
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/astronauts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch astronauts`);
    return res.json();
  },

  async getDashboard(astronautId: string = 'astro-101'): Promise<DashboardResponse> {
    if (USE_MOCK) {
      return mockAdapter.getDashboard(astronautId);
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/astronauts/${astronautId}/dashboard`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch dashboard for ${astronautId}`);
    return res.json();
  },

  async getDomainDetail(
    astronautId: string = 'astro-101',
    domainId: DomainId,
    range: string = '30d'
  ): Promise<DomainDetailResponse> {
    if (USE_MOCK) {
      return mockAdapter.getDomainDetail(astronautId, domainId);
    }
    const res = await fetch(
      `${API_BASE_URL}/api/v1/astronauts/${astronautId}/domains/${domainId}?range=${range}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch domain detail for ${domainId}`);
    return res.json();
  },

  async getScenarios(): Promise<SimulationScenarioItem[]> {
    if (USE_MOCK) {
      return mockAdapter.getScenarios();
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/simulation/scenarios`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch scenarios`);
    const data = await res.json();
    return data.scenarios || data;
  },

  async loadSimulationScenario(scenarioId: string, astronautId: string = 'astro-101'): Promise<DashboardResponse> {
    if (USE_MOCK) {
      return mockAdapter.resetToScenario(scenarioId, astronautId);
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/simulation/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, astronaut_id: astronautId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load scenario ${scenarioId}`);
    return res.json();
  },

  async acknowledgeRecommendation(
    recId: string,
    payload: RecommendationAcknowledgeRequest
  ): Promise<RecommendationAcknowledgeResponse> {
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

  async ingestTelemetryBatch(
    payload: BatchTelemetryIngestRequest | TelemetryBatchRequest
  ): Promise<BatchTelemetryResponse> {
    if (USE_MOCK) {
      return mockAdapter.ingestTelemetryBatch(payload);
    }

    // Ensure format matches BatchTelemetryIngestRequest { measurements: [...] }
    let body: BatchTelemetryIngestRequest;
    if ((payload as BatchTelemetryIngestRequest).measurements) {
      body = payload as BatchTelemetryIngestRequest;
    } else {
      const p = payload as TelemetryBatchRequest;
      body = {
        measurements: (p.batch || []).map((b) => ({
          astronaut_id: p.astronaut_id || 'astro-101',
          domain_id: b.domain_id,
          metric_name: b.metric_name || b.metric_id,
          timestamp: b.timestamp,
          value: b.value,
          unit: b.unit,
          quality: b.quality,
          provenance: b.provenance,
          modality: b.modality,
          note: b.note,
        })),
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/telemetry/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to ingest telemetry batch`);
    return res.json();
  },

  async logOperationalRisk(
    astronautId: string = 'astro-101',
    record: OperationalRiskCreateRequest
  ): Promise<OperationalRiskResponse> {
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

  async getOperationalRisks(astronautId: string = 'astro-101'): Promise<OperationalRiskResponse[]> {
    if (USE_MOCK) {
      return mockAdapter.getOperationalRisks(astronautId);
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/astronauts/${astronautId}/operational-risks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch operational risks`);
    return res.json();
  },
};
