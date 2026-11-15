import React, { useState, useEffect, useRef } from 'react';
import {
  DashboardResponse,
  DomainDetailResponse,
  DomainId,
  SimulationScenarioItem,
  AstronautSummary,
  BatchTelemetryIngestRequest,
  OperationalRiskCreateRequest,
} from './types/api';
import { apiClient, ConnectionState, FORCE_MOCK } from './api/client';
import { Header } from './components/Header';
import { DomainCard } from './components/DomainCard';
import { EclssStrip } from './components/EclssStrip';
import { EmbeddedTelemetryChart } from './components/EmbeddedTelemetryChart';
import { DomainDetailView } from './components/DomainDetailView';
import { FindingsPanel } from './components/FindingsPanel';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { TelemetryBatchModal } from './components/TelemetryBatchModal';
import { OperationalRisksModal } from './components/OperationalRisksModal';
import { Activity, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [scenarios, setScenarios] = useState<SimulationScenarioItem[]>([]);
  const [astronauts, setAstronauts] = useState<AstronautSummary[]>([]);
  const [activeAstronautId, setActiveAstronautId] = useState<string>('astro-101');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('nominal_iss_baseline');
  const [connectionState, setConnectionState] = useState<ConnectionState>(apiClient.getConnectionState());
  const [retryingConnection, setRetryingConnection] = useState<boolean>(false);

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

  useEffect(() => {
    return apiClient.onConnectionStateChange((state) => {
      setConnectionState(state);
    });
  }, []);

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

  const handleRetryConnection = async () => {
    setRetryingConnection(true);
    try {
      const newState = await apiClient.retryConnection();
      setConnectionState(newState);
      if (newState === 'LIVE_BACKEND') {
        showToast('Connected to Live FastAPI Engine on http://127.0.0.1:8000');
        await initializeApp();
      } else {
        showToast('FastAPI backend unreachable at http://127.0.0.1:8000. Remaining in Mock Mode.');
      }
    } catch (err) {
      showToast('Connection attempt failed.');
    } finally {
      setRetryingConnection(false);
    }
  };

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

  const isMockActive = connectionState === 'HARDCODED_MOCK_FALLBACK' || FORCE_MOCK;
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

      {/* Prominent Hardcoded Mock Mode Warning Banner */}
      {isMockActive && (
        <div
          style={{
            backgroundColor: '#78350F',
            borderBottom: '2px solid #F59E0B',
            color: '#FEF3C7',
            padding: '8px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            position: 'sticky',
            top: 0,
            zIndex: 60,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#FBBF24" style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ color: '#FDE68A', letterSpacing: '0.04em' }}>
                HARDCODED MOCK MODE
              </strong>{' '}
              — Live FastAPI backend is not connected. Displaying browser simulation fixtures rather than the Python intelligence engine.
            </span>
          </div>
          <button
            onClick={handleRetryConnection}
            disabled={retryingConnection}
            style={{
              backgroundColor: '#D97706',
              color: '#FFFFFF',
              border: '1px solid #FCD34D',
              borderRadius: '2px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: retryingConnection ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}
            title="Attempt to connect to FastAPI backend at http://127.0.0.1:8000"
          >
            <RefreshCw size={12} className={retryingConnection ? 'animate-spin' : ''} />
            <span>{retryingConnection ? 'Connecting...' : 'Retry Live Connection'}</span>
          </button>
        </div>
      )}

      {/* Persistent Mission Telemetry Header */}
      <Header
        dashboard={dashboard}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        astronauts={astronauts}
        activeAstronautId={activeAstronautId}
        connectionState={connectionState}
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
            width: '100%',
            maxWidth: 'none',
            padding: '8px 12px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 60%) minmax(0, 40%)',
            gap: '12px',
            height: 'calc(100vh - 76px)',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* ========================================================================= */}
          {/* LEFT PANE (60% Width): 9-Domain Matrix + Embedded Live Telemetry Chart */}
          {/* ========================================================================= */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              minWidth: 0,
              gap: '8px',
              justifyContent: 'space-between',
            }}
          >
            {/* Section 1 Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #1E293B',
                paddingBottom: '4px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} color="#38BDF8" />
                <h2
                  style={{
                    fontSize: '12px',
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
                  fontSize: '9.5px',
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
                flexShrink: 0,
              }}
            >
              {personalDomains.map((dom) => (
                <DomainCard
                  key={dom.domain_id}
                  domain={dom}
                  isSelected={selectedDomainId === dom.domain_id}
                  onSelect={handleSelectDomain}
                  findings={dashboard.findings}
                  detail={selectedDomainId === dom.domain_id ? activeDomainDetail : null}
                />
              ))}
            </div>

            {/* 2. Middle Full-Width ENVIRONMENT_ECLSS Strip */}
            <div style={{ flexShrink: 0 }}>
              <EclssStrip
                domain={environmentalDomains[0]}
                isSelected={selectedDomainId === 'environment_eclss'}
                onSelect={handleSelectDomain}
              />
            </div>

            {/* 3. Bottom Embedded Live Telemetry Graph */}
            <div style={{ flex: 1, minHeight: '180px', display: 'flex', flexDirection: 'column' }}>
              <EmbeddedTelemetryChart
                detail={activeDomainDetail}
                summary={activeSummary}
                onExpand={() => setIsDetailExpanded(true)}
                onOpenTelemetryModal={handleOpenTelemetryForDomain}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT PANE (40% Width, Split 50/50): Findings & Protocol Queue */}
          {/* ========================================================================= */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              minWidth: 0,
              gap: '10px',
            }}
          >
            {/* Top 50%: Cross-Domain Findings & Action Queue */}
            <div style={{ flex: '1 1 50%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <FindingsPanel findings={dashboard.findings} onSelectDomain={handleSelectDomain} />
            </div>

            {/* Bottom 50%: Recommended Protocol & Escalation Trigger */}
            <div style={{ flex: '1 1 50%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <RecommendationsPanel
                recommendations={dashboard.recommendations}
                astronautId={activeAstronautId}
                onAcknowledge={handleAcknowledgeRecommendation}
              />
            </div>
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
