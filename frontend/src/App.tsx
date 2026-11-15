import React, { useState, useEffect } from 'react';
import {
  DashboardResponse,
  DomainDetailResponse,
  DomainId,
  SimulationScenario,
  TelemetryBatchRequest,
  OperationalRiskRecord,
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
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('circadian_drift_and_fatigue_01');
  const [activeDomainDetail, setActiveDomainDetail] = useState<DomainDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState<boolean>(false);
  const [telemetryDefaultDomain, setTelemetryDefaultDomain] = useState<DomainId>('immune_microbio');
  const [telemetryDefaultMetric, setTelemetryDefaultMetric] = useState<string>('imm_iga');
  const [isRisksModalOpen, setIsRisksModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, scens] = await Promise.all([
        apiClient.getDashboard(),
        apiClient.getScenarios(),
      ]);
      setDashboard(dash);
      setScenarios(scens);
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize AMPCS telemetry dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScenarioChange = async (scenarioId: string) => {
    setLoading(true);
    try {
      const updatedDash = await apiClient.loadSimulationScenario(scenarioId);
      setActiveScenarioId(scenarioId);
      setDashboard(updatedDash);
      if (activeDomainDetail) {
        // Refresh domain detail for the new scenario
        const updatedDetail = await apiClient.getDomainDetail(activeDomainDetail.domain_id);
        setActiveDomainDetail(updatedDetail);
      }
      showToast(`Switched scenario to ${scenarioId === 'nominal_iss_leo_02' ? 'ISS LEO Nominal' : 'Mars Transit Deep Space'}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to switch scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDomain = async (domainId: DomainId) => {
    try {
      const detail = await apiClient.getDomainDetail(domainId);
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
        astronaut_id: dashboard.astronaut.id,
        action_taken_note: actionTakenNote,
        acknowledged_at: new Date().toISOString(),
      });
      // Refresh dashboard
      const refreshed = await apiClient.getDashboard(dashboard.astronaut.id);
      setDashboard(refreshed);
      showToast(`Recommendation ${recId} successfully acknowledged & audit logged`);
    } catch (err: any) {
      setError(err?.message || 'Failed to acknowledge recommendation');
    }
  };

  const handleIngestTelemetry = async (req: TelemetryBatchRequest) => {
    try {
      const result = await apiClient.ingestTelemetryBatch(req);
      const refreshedDash = await apiClient.getDashboard();
      setDashboard(refreshedDash);
      if (activeDomainDetail) {
        const refreshedDetail = await apiClient.getDomainDetail(activeDomainDetail.domain_id);
        setActiveDomainDetail(refreshedDetail);
      }
      showToast(`Successfully ingested ${result.ingested_count} telemetry frame(s) into ledger`);
    } catch (err: any) {
      setError(err?.message || 'Failed to ingest telemetry batch');
    }
  };

  const handleLogRisk = async (record: Omit<OperationalRiskRecord, 'id' | 'logged_at'>) => {
    if (!dashboard) return;
    try {
      await apiClient.logOperationalRisk(dashboard.astronaut.id, record);
      const refreshedDash = await apiClient.getDashboard(dashboard.astronaut.id);
      setDashboard(refreshedDash);
      showToast(`Operational risk logged: ${record.risk_name}`);
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
        <button className="aero-btn aero-btn-primary" onClick={loadData}>
          Retry Connection
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  // Separate personal health domains (8) and environmental ECLSS (1)
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
        onSelectScenario={handleScenarioChange}
        onOpenRisks={() => setIsRisksModalOpen(true)}
        onOpenTelemetryModal={() => {
          setTelemetryDefaultDomain('immune_microbio');
          setTelemetryDefaultMetric('imm_iga');
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
              astronautId={dashboard.astronaut.id}
              onAcknowledge={handleAcknowledgeRecommendation}
            />
          </section>
        </main>
      )}

      {/* Ingest Telemetry Modal */}
      <TelemetryBatchModal
        astronautId={dashboard.astronaut.id}
        defaultDomainId={telemetryDefaultDomain}
        defaultMetricId={telemetryDefaultMetric}
        currentMissionDay={dashboard.mission_context.mission_day}
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        onSubmit={handleIngestTelemetry}
      />

      {/* Operational Risks Modal */}
      <OperationalRisksModal
        astronautId={dashboard.astronaut.id}
        currentMissionDay={dashboard.mission_context.mission_day}
        isOpen={isRisksModalOpen}
        onClose={() => setIsRisksModalOpen(false)}
        onLogRisk={handleLogRisk}
        fetchRisks={apiClient.getOperationalRisks}
      />
    </div>
  );
};

export default App;
