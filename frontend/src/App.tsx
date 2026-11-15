import React, { useState, useEffect } from 'react';
import {
  DashboardResponse,
  DomainDetailResponse,
  DomainId,
  SimulationScenarioItem,
  AstronautSummary,
  BatchTelemetryIngestRequest,
  OperationalRiskCreateRequest,
} from './types/api';
import { apiClient } from './api/client';
import { Header } from './components/Header';
import { DomainCard } from './components/DomainCard';
import { DomainDetailView } from './components/DomainDetailView';
import { FindingsPanel } from './components/FindingsPanel';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { TelemetryBatchModal } from './components/TelemetryBatchModal';
import { OperationalRisksModal } from './components/OperationalRisksModal';
import { Activity, ShieldCheck, CheckCircle2, Wind } from 'lucide-react';

export const App: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [scenarios, setScenarios] = useState<SimulationScenarioItem[]>([]);
  const [astronauts, setAstronauts] = useState<AstronautSummary[]>([]);
  const [activeAstronautId, setActiveAstronautId] = useState<string>('astro-101');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('nominal_iss_baseline');
  const [activeDomainDetail, setActiveDomainDetail] = useState<DomainDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState<boolean>(false);
  const [telemetryDefaultDomain, setTelemetryDefaultDomain] = useState<DomainId>('immune_microbio');
  const [telemetryDefaultMetric, setTelemetryDefaultMetric] = useState<string>('crp_biomarker_mg_l');
  const [isRisksModalOpen, setIsRisksModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Step 2: Dynamic Astronaut Initialization & Scenario Population on mount
  const initializeApp = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch astronauts dynamically
      const astroList = await apiClient.getAstronauts();
      setAstronauts(astroList);
      const primaryAstronautId = astroList[0]?.id || 'astro-101';
      setActiveAstronautId(primaryAstronautId);

      // 2. Fetch scenarios list from GET /api/v1/simulation/scenarios
      const scenarioList = await apiClient.getScenarios();
      setScenarios(scenarioList);

      // 3. Fetch dashboard for primary astronaut
      const dash = await apiClient.getDashboard(primaryAstronautId);
      setDashboard(dash);

      if (dash.data_provenance_summary?.scenario_id) {
        setActiveScenarioId(dash.data_provenance_summary.scenario_id);
      }
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err?.message || 'Failed to initialize AMPCS telemetry dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const handleSelectAstronaut = async (astronautId: string) => {
    setLoading(true);
    try {
      setActiveAstronautId(astronautId);
      const updatedDash = await apiClient.getDashboard(astronautId);
      setDashboard(updatedDash);
      if (activeDomainDetail) {
        const updatedDetail = await apiClient.getDomainDetail(astronautId, activeDomainDetail.domain_id);
        setActiveDomainDetail(updatedDetail);
      }
      showToast(`Switched crew profile to ${updatedDash.astronaut.callsign} (${astronautId})`);
    } catch (err: any) {
      setError(err?.message || `Failed to switch astronaut profile to ${astronautId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = async (scenarioId: string) => {
    setLoading(true);
    try {
      const updatedDash = await apiClient.loadSimulationScenario(scenarioId, activeAstronautId);
      setActiveScenarioId(scenarioId);
      setDashboard(updatedDash);
      if (activeDomainDetail) {
        const updatedDetail = await apiClient.getDomainDetail(activeAstronautId, activeDomainDetail.domain_id);
        setActiveDomainDetail(updatedDetail);
      }
      const scName = scenarios.find((s) => (s.scenario_id || (s as any).id) === scenarioId)?.name || scenarioId;
      showToast(`Loaded Scenario: ${scName}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to switch scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDomain = async (domainId: DomainId) => {
    try {
      const detail = await apiClient.getDomainDetail(activeAstronautId, domainId);
      setActiveDomainDetail(detail);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || `Failed to fetch domain detail for ${domainId}`);
    }
  };

  const handleAcknowledgeRecommendation = async (recId: string, actionTakenNote: string) => {
    if (!dashboard) return;
    try {
      await apiClient.acknowledgeRecommendation(recId, {
        astronaut_id: activeAstronautId,
        action_taken_note: actionTakenNote,
        acknowledged_at: new Date().toISOString(),
      });
      const refreshed = await apiClient.getDashboard(activeAstronautId);
      setDashboard(refreshed);
      showToast(`Recommendation ${recId} successfully acknowledged & audit logged`);
    } catch (err: any) {
      setError(err?.message || 'Failed to acknowledge recommendation');
    }
  };

  const handleIngestTelemetry = async (req: BatchTelemetryIngestRequest) => {
    try {
      const result = await apiClient.ingestTelemetryBatch(req);
      const refreshedDash = await apiClient.getDashboard(activeAstronautId);
      setDashboard(refreshedDash);
      if (activeDomainDetail) {
        const refreshedDetail = await apiClient.getDomainDetail(activeAstronautId, activeDomainDetail.domain_id);
        setActiveDomainDetail(refreshedDetail);
      }
      showToast(result.message || `Successfully ingested ${result.ingested_count} telemetry measurement(s)`);
    } catch (err: any) {
      setError(err?.message || 'Failed to ingest telemetry batch');
    }
  };

  const handleLogRisk = async (record: OperationalRiskCreateRequest) => {
    try {
      await apiClient.logOperationalRisk(activeAstronautId, record);
      const refreshedDash = await apiClient.getDashboard(activeAstronautId);
      setDashboard(refreshedDash);
      showToast(`Operational risk logged: ${record.description.slice(0, 40)}...`);
    } catch (err: any) {
      setError(err?.message || 'Failed to log operational risk');
    }
  };

  const handleOpenTelemetryForDomain = (domainId: string, metricId: string) => {
    setTelemetryDefaultDomain(domainId as DomainId);
    setTelemetryDefaultMetric(metricId);
    setIsTelemetryModalOpen(true);
  };

  if (loading && !dashboard) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#090D16',
          color: '#38BDF8',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <Activity size={32} className="animate-spin" />
        <div style={{ marginTop: '16px', fontSize: '14px', letterSpacing: '0.08em' }}>
          INITIALIZING NASA AMPCS TELEMETRY STREAM...
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#090D16',
          color: '#EF4444',
          fontFamily: "'JetBrains Mono', monospace",
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>TELEMETRY STREAM ERROR</div>
        <div style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '16px' }}>{error}</div>
        <button className="aero-btn aero-btn-primary" onClick={initializeApp}>
          Retry Connection
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  const personalDomains = dashboard.domains.filter((d) => d.domain_category === 'PERSONAL_HEALTH');
  const environmentalDomains = dashboard.domains.filter((d) => d.domain_category === 'ENVIRONMENTAL_ECLSS');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090D16', color: '#F8FAFC' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#064E3B',
            border: '1px solid #059669',
            color: '#D1FAE5',
            padding: '12px 18px',
            borderRadius: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
            zIndex: 2000,
          }}
        >
          <CheckCircle2 size={16} color="#34D399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Mission Telemetry Header */}
      <Header
        dashboard={dashboard}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        astronauts={astronauts}
        activeAstronautId={activeAstronautId}
        onSelectAstronaut={handleSelectAstronaut}
        onSelectScenario={handleScenarioChange}
        onOpenRisks={() => setIsRisksModalOpen(true)}
        onOpenTelemetryModal={() => {
          setTelemetryDefaultDomain('immune_microbio');
          setTelemetryDefaultMetric('crp_biomarker_mg_l');
          setIsTelemetryModalOpen(true);
        }}
      />

      {/* Main View Router: Detail View vs Command Overview */}
      {activeDomainDetail ? (
        <DomainDetailView
          detail={activeDomainDetail}
          onBack={() => setActiveDomainDetail(null)}
          onOpenTelemetryForDomain={handleOpenTelemetryForDomain}
        />
      ) : (
        <main style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
          {/* Section 1: Personal Health Domains (8) */}
          <section style={{ marginBottom: '32px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                borderBottom: '1px solid #1F2937',
                paddingBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#38BDF8" />
                <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, letterSpacing: '0.04em' }}>
                  PERSONAL HEALTH SURVEILLANCE DOMAINS ({personalDomains.length})
                </h2>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
                PHYSIOLOGICAL & COGNITIVE INTEGRITY
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '16px',
              }}
            >
              {personalDomains.map((dom) => (
                <DomainCard
                  key={dom.domain_id}
                  domain={dom}
                  onSelect={handleSelectDomain}
                />
              ))}
            </div>
          </section>

          {/* Section 2: Environmental & Life Support (ECLSS) */}
          <section style={{ marginBottom: '32px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                borderBottom: '1px solid #1F2937',
                paddingBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wind size={18} color="#2DD4BF" />
                <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, letterSpacing: '0.04em', color: '#2DD4BF' }}>
                  ENVIRONMENTAL & LIFE SUPPORT (ECLSS) ({environmentalDomains.length})
                </h2>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
                HABITAT ATMOSPHERE & SYSTEM INTEGRITY
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '16px',
              }}
            >
              {environmentalDomains.map((dom) => (
                <DomainCard
                  key={dom.domain_id}
                  domain={dom}
                  onSelect={handleSelectDomain}
                />
              ))}
            </div>
          </section>

          {/* Section 3: Cross-Domain Clinical Findings */}
          <section>
            <FindingsPanel
              findings={dashboard.findings}
              onSelectDomain={handleSelectDomain}
            />
          </section>

          {/* Section 4: Closed-Loop Clinical Recommendations */}
          <section>
            <RecommendationsPanel
              recommendations={dashboard.recommendations}
              astronautId={activeAstronautId}
              onAcknowledge={handleAcknowledgeRecommendation}
            />
          </section>
        </main>
      )}

      {/* Ingest Telemetry Modal */}
      <TelemetryBatchModal
        astronautId={activeAstronautId}
        defaultDomainId={telemetryDefaultDomain}
        defaultMetricId={telemetryDefaultMetric}
        currentMissionDay={dashboard.astronaut?.mission_day || dashboard.mission_context?.mission_day || 42}
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        onSubmit={handleIngestTelemetry}
      />

      {/* Operational Risks Modal */}
      <OperationalRisksModal
        astronautId={activeAstronautId}
        currentMissionDay={dashboard.astronaut?.mission_day || dashboard.mission_context?.mission_day || 42}
        isOpen={isRisksModalOpen}
        onClose={() => setIsRisksModalOpen(false)}
        onLogRisk={handleLogRisk}
        fetchRisks={apiClient.getOperationalRisks}
      />
    </div>
  );
};

export default App;
