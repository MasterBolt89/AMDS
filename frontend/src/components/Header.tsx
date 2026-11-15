import React from 'react';
import { DashboardResponse, SimulationScenarioItem, AstronautSummary } from '../types/api';
import { ConnectionState } from '../api/client';
import { ProvenanceBadge } from './StatusBadge';
import { Radio, Clock, User, AlertTriangle, PlusCircle, Activity, Server, Database } from 'lucide-react';

interface HeaderProps {
  dashboard: DashboardResponse;
  scenarios: SimulationScenarioItem[];
  activeScenarioId: string;
  astronauts: AstronautSummary[];
  activeAstronautId: string;
  connectionState?: ConnectionState;
  onSelectAstronaut: (astronautId: string) => void;
  onSelectScenario: (scenarioId: string) => void;
  onOpenRisks: () => void;
  onOpenTelemetryModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dashboard,
  scenarios,
  activeScenarioId,
  astronauts,
  activeAstronautId,
  connectionState = 'LIVE_BACKEND',
  onSelectAstronaut,
  onSelectScenario,
  onOpenRisks,
  onOpenTelemetryModal,
}) => {
  const { astronaut, mission_context, operational_risk_records_count } = dashboard;
  const isSurgeonLive = mission_context.live_flight_surgeon_available;
  const latencyMin = (mission_context.one_way_light_time_sec / 60).toFixed(1);
  const provenance =
    dashboard.data_provenance_summary.active_provenance ||
    mission_context.active_provenance ||
    'SIMULATED';

  return (
    <header
      style={{
        backgroundColor: '#07090F',
        borderBottom: '1px solid #1E293B',
        padding: '6px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Top Banner: System Branding, Actions & Scenario Switcher */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '5px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '11px',
              letterSpacing: '0.1em',
              padding: '2px 6px',
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            NASA AMDS
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.02em', color: '#F8FAFC', lineHeight: '1.2' }}>
              AUTONOMOUS MEDICAL DECISION SUPPORT CONSOLE
            </div>
          </div>

          {/* Engine Connection State Status Badge */}
          {connectionState === 'LIVE_BACKEND' ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#064E3B',
                border: '1px solid #059669',
                color: '#6EE7B7',
                padding: '2px 8px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
              }}
              title="Connected to live Python FastAPI intelligence engine"
            >
              <Server size={11} color="#10B981" />
              <span>LIVE FASTAPI ENGINE</span>
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#78350F',
                border: '1px solid #D97706',
                color: '#FDE68A',
                padding: '2px 8px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
              }}
              title="Operating on in-browser stateful mock simulator"
            >
              <Database size={11} color="#F59E0B" />
              <span>MOCK SIMULATOR</span>
            </div>
          )}
        </div>

        {/* Action Controls & Dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          <button
            className="aero-btn"
            onClick={onOpenTelemetryModal}
            style={{ borderColor: '#0284C7', color: '#38BDF8', padding: '3px 8px', fontSize: '11px' }}
            title="Log manual subjective check-in or rapid biomarker sample"
          >
            <PlusCircle size={12} />
            <span>Ingest Telemetry</span>
          </button>

          <button
            className="aero-btn"
            onClick={onOpenRisks}
            style={{
              borderColor: operational_risk_records_count > 0 ? '#D97706' : '#1E293B',
              color: operational_risk_records_count > 0 ? '#FCD34D' : '#CBD5E1',
              padding: '3px 8px',
              fontSize: '11px',
            }}
            title="View operational risk records"
          >
            <AlertTriangle size={12} />
            <span>Operational Risks</span>
            <span
              style={{
                backgroundColor: operational_risk_records_count > 0 ? '#78350F' : '#1E293B',
                color: operational_risk_records_count > 0 ? '#FDE68A' : '#94A3B8',
                padding: '0 5px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {operational_risk_records_count}
            </span>
          </button>

          {/* Astronaut Selector */}
          {astronauts.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                Crew:
              </span>
              <select
                value={activeAstronautId}
                onChange={(e) => onSelectAstronaut(e.target.value)}
                style={{
                  backgroundColor: '#0C101A',
                  color: '#38BDF8',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  padding: '3px 6px',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {astronauts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.callsign} ({a.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scenario Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
              Scenario:
            </span>
            <select
              value={activeScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              style={{
                backgroundColor: '#0C101A',
                color: '#E2E8F0',
                border: '1px solid #1E293B',
                borderRadius: '2px',
                padding: '3px 6px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '260px',
              }}
            >
              {scenarios.map((sc) => {
                const sId = sc.scenario_id || (sc as any).id;
                return (
                  <option key={sId} value={sId}>
                    {sc.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Telemetry Status Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '6px',
          backgroundColor: '#0C101A',
          border: '1px solid #1E293B',
          borderRadius: '2px',
          padding: '4px 10px',
          alignItems: 'center',
          fontSize: '11px',
        }}
      >
        {/* Subject Astronaut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={12} color="#38BDF8" />
          <span style={{ color: '#94A3B8' }}>Crew:</span>
          <span style={{ fontWeight: 700, color: '#F8FAFC', fontFamily: "'JetBrains Mono', monospace" }}>
            {astronaut.callsign}
          </span>
          <span style={{ fontSize: '10px', color: '#64748B' }}>({astronaut.id})</span>
        </div>

        {/* Mission Day & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={12} color="#34D399" />
          <span style={{ color: '#94A3B8' }}>Phase:</span>
          <span style={{ fontWeight: 700, color: '#F8FAFC', fontFamily: "'JetBrains Mono', monospace" }}>
            {mission_context.mission_profile}
          </span>
          <span style={{ fontSize: '10px', color: '#64748B' }}>MET: Day {astronaut.mission_day}</span>
        </div>

        {/* Latency & Flight Surgeon Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={12} color={isSurgeonLive ? '#34D399' : '#FBBF24'} />
          <span style={{ color: '#94A3B8' }}>Latency:</span>
          <span
            style={{
              fontWeight: 700,
              color: isSurgeonLive ? '#34D399' : '#FBBF24',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {mission_context.one_way_light_time_sec}s ({latencyMin}m)
          </span>
          <span
            style={{
              fontSize: '10px',
              color: isSurgeonLive ? '#34D399' : '#FBBF24',
              fontWeight: 600,
            }}
          >
            {isSurgeonLive ? '● Live Surgeon' : '◌ Autonomous'}
          </span>
        </div>

        {/* Telemetry Stream Mode & Provenance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          <Activity size={12} color="#38BDF8" />
          <span style={{ color: '#94A3B8' }}>Stream:</span>
          <ProvenanceBadge provenance={provenance} />
        </div>
      </div>
    </header>
  );
};
