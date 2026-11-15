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
import { EclssStrip } from './components/EclssStrip';
import { EmbeddedTelemetryChart } from './components/EmbeddedTelemetryChart';
import { DomainDetailView } from './components/DomainDetailView';
import { FindingsPanel } from './components/FindingsPanel';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { TelemetryBatchModal } from './components/TelemetryBatchModal';
import { OperationalRisksModal } from './components/OperationalRisksModal';
import { Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [scenarios, setScenarios] = useState<SimulationScenarioItem[]>([]);
  const [astronauts, setAstronauts] = useState<AstronautSummary[]>([]);
  const [activeAstronautId, setActiveAstronautId] = useState<string>('astro-101');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('nominal_iss_baseline');

  // Master-Detail Console State
  const [selectedDomainId, setSelectedDomainId] = useState<DomainId>('cardiovascular');
  const [activeDomainDetail, setActiveDomainDetail] = useState<DomainDetailResponse | null>(null);
  const [isDetailExpanded, setIsDetailExpanded] = useState<boolean>(false);

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

  const initializeApp = async () => {
    setLoading(true);
    setError(null);
    try {
      const astroList = await apiClient.getAstronauts();
      setAstronauts(astroList);
      const primaryAstronautId = astroList[0]?.id || 'astro-101';
      setActiveAstronautId(primaryAstronautId);

      const scenarioList = await apiClient.getScenarios();
      setScenarios(scenarioList);

      const dash = await apiClient.getDashboard(primaryAstronautId);
      setDashboard(dash);

      if (dash.data_provenance_summary?.scenario_id) {
        setActiveScenarioId(dash.data_provenance_summary.scenario_id);
      }

      // Preload active domain telemetry for bottom chart
      try {
        const detail = await apiClient.getDomainDetail(primaryAstronautId, 'cardiovascular');
        setActiveDomainDetail(detail);
      } catch (err) {
        console.warn('Initial domain detail load error:', err);
      }
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err?.message || 'Failed to initialize flight-surgeon console');
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

      const updatedDetail = await apiClient.getDomainDetail(astronautId, selectedDomainId);
      setActiveDomainDetail(updatedDetail);

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

      const updatedDetail = await apiClient.getDomainDetail(activeAstronautId, selectedDomainId);
      setActiveDomainDetail(updatedDetail);

      const scName =
        scenarios.find((s) => (s.scenario_id || (s as any).id) === scenarioId)?.name || scenarioId;
      showToast(`Loaded Scenario: ${scName}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to switch scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDomain = async (domainId: DomainId) => {
    setSelectedDomainId(domainId);
    try {
      const detail = await apiClient.getDomainDetail(activeAstronautId, domainId);
      setActiveDomainDetail(detail);
    } catch (err: any) {
      console.error(`Failed to fetch domain detail for ${domainId}`, err);
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

      const refreshedDetail = await apiClient.getDomainDetail(activeAstronautId, selectedDomainId);
      setActiveDomainDetail(refreshedDetail);

      showToast(
        result.message || `Successfully ingested ${result.ingested_count} telemetry measurement(s)`
      );
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
          backgroundColor: '#080B12',
          color: '#38BDF8',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <Activity size={28} className="animate-spin" />
        <div style={{ marginTop: '12px', fontSize: '12px', letterSpacing: '0.08em' }}>
          INITIALIZING NASA FLIGHT-SURGEON COMMAND CONSOLE...
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
          backgroundColor: '#080B12',
          color: '#EF4444',
          fontFamily: "'JetBrains Mono', monospace",
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px' }}>
          COMMAND CONSOLE CONNECTION ERROR
        </div>
        <div style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '14px' }}>{error}</div>
        <button className="aero-btn aero-btn-primary" onClick={initializeApp}>
          Retry Connection
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  const personalDomains = dashboard.domains.filter((d) => d.domain_category === 'PERSONAL_HEALTH');
  const environmentalDomains = dashboard.domains.filter(
    (d) => d.domain_category === 'ENVIRONMENTAL_ECLSS'
  );
  const activeSummary = dashboard.domains.find((d) => d.domain_id === selectedDomainId);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080B12', color: '#F8FAFC' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            backgroundColor: '#064E3B',
            border: '1px solid #059669',
            color: '#D1FAE5',
            padding: '8px 14px',
            borderRadius: '2px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            zIndex: 2000,
          }}
        >
          <CheckCircle2 size={14} color="#34D399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Mission Telemetry Header (Compact py-2) */}
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

      {/* Main View Router: Full Expanded Deep View vs Option 2 Master-Detail Asymmetric Split Pane */}
      {isDetailExpanded && activeDomainDetail ? (
        <DomainDetailView
          detail={activeDomainDetail}
          onBack={() => setIsDetailExpanded(false)}
          onOpenTelemetryForDomain={handleOpenTelemetryForDomain}
        />
      ) : (
        <main
          style={{
            padding: '10px 14px',
            maxWidth: '1600px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 62%) minmax(0, 38%)',
            gap: '12px',
            alignItems: 'start',
          }}
        >
          {/* ========================================================================= */}
          {/* LEFT PANE (62% Width): 9-Domain Matrix + Embedded Live Telemetry Chart */}
          {/* ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Section 1 Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                borderBottom: '1px solid #1E293B',
                paddingBottom: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#38BDF8" />
                <h2
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#F8FAFC',
                  }}
                >
                  PERSONAL HEALTH SURVEILLANCE MATRIX ({personalDomains.length})
                </h2>
              </div>
              <div
                style={{
                  fontSize: '8.5px',
                  color: '#64748B',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                }}
              >
                2×4 FLUSH HAIRLINE INSTRUMENT GRID
              </div>
            </div>

            {/* 1. Top 2x4 True Flush Hairline Grid (gap-0, shared 1px #1E293B border) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                backgroundColor: '#1E293B',
                gap: '1px',
                border: '1px solid #1E293B',
                marginBottom: '10px',
              }}
            >
              {personalDomains.map((dom) => (
                <DomainCard
                  key={dom.domain_id}
                  domain={dom}
                  isSelected={selectedDomainId === dom.domain_id}
                  onSelect={handleSelectDomain}
                />
              ))}
            </div>

            {/* 2. Middle Full-Width ENVIRONMENT_ECLSS Strip (Sky Cobalt Header + Sparklines) */}
            <EclssStrip
              domain={environmentalDomains[0]}
              isSelected={selectedDomainId === 'environment_eclss'}
              onSelect={handleSelectDomain}
            />

            {/* 3. Bottom Embedded Live Telemetry Graph (min-h-[210px], Above-the-Fold) */}
            <EmbeddedTelemetryChart
              detail={activeDomainDetail}
              summary={activeSummary}
              onExpand={() => setIsDetailExpanded(true)}
              onOpenTelemetryModal={handleOpenTelemetryForDomain}
            />
          </div>

          {/* ========================================================================= */}
          {/* RIGHT PANE (38% Width, Pinned Height): Findings & Streamlined Protocol Queue */}
          {/* ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Top Section: Cross-Domain Findings & Action Queue */}
            <FindingsPanel findings={dashboard.findings} onSelectDomain={handleSelectDomain} />

            {/* Bottom Section: Recommended Protocol & Escalation Trigger */}
            <RecommendationsPanel
              recommendations={dashboard.recommendations}
              astronautId={activeAstronautId}
              onAcknowledge={handleAcknowledgeRecommendation}
            />
          </div>
        </main>
      )}

      {/* Ingest Telemetry Modal */}
      <TelemetryBatchModal
        astronautId={activeAstronautId}
        defaultDomainId={telemetryDefaultDomain}
        defaultMetricId={telemetryDefaultMetric}
        currentMissionDay={
          dashboard.astronaut?.mission_day || dashboard.mission_context?.mission_day || 42
        }
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        onSubmit={handleIngestTelemetry}
      />

      {/* Operational Risks Modal */}
      <OperationalRisksModal
        astronautId={activeAstronautId}
        currentMissionDay={
          dashboard.astronaut?.mission_day || dashboard.mission_context?.mission_day || 42
        }
        isOpen={isRisksModalOpen}
        onClose={() => setIsRisksModalOpen(false)}
        onLogRisk={handleLogRisk}
        fetchRisks={apiClient.getOperationalRisks}
      />
    </div>
  );
};

export default App;
