import React from 'react';
import { DashboardResponse, SimulationScenarioItem, AstronautSummary } from '../types/api';
import { ProvenanceBadge } from './StatusBadge';
import { Radio, Clock, User, AlertTriangle, PlusCircle, Activity } from 'lucide-react';

interface HeaderProps {
  dashboard: DashboardResponse;
  scenarios: SimulationScenarioItem[];
  activeScenarioId: string;
  astronauts: AstronautSummary[];
  activeAstronautId: string;
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
        backgroundColor: '#0A0F1D',
        borderBottom: '1px solid #1F2937',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Top Banner: System Branding & Scenario Switcher */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '12px',
              letterSpacing: '0.12em',
              padding: '3px 8px',
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            NASA AMPCS
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em', color: '#F8FAFC' }}>
              AEROSPACE MEDICAL PROGNOSTICS & SURVEILLANCE
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Autonomous Clinical Decision Support System • Locked Contract /api/v1
            </div>
          </div>
        </div>

        {/* Action Controls, Astronaut Profile & Scenario Switcher */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <button
            className="aero-btn"
            onClick={onOpenTelemetryModal}
            style={{ borderColor: '#0284C7', color: '#38BDF8' }}
            title="Log manual subjective check-in or rapid biomarker sample"
          >
            <PlusCircle size={14} />
            <span>Ingest Telemetry</span>
          </button>

          <button
            className="aero-btn"
            onClick={onOpenRisks}
            style={{
              borderColor: operational_risk_records_count > 0 ? '#D97706' : '#334155',
              color: operational_risk_records_count > 0 ? '#FCD34D' : '#CBD5E1',
            }}
            title="View operational risk records"
          >
            <AlertTriangle size={14} />
            <span>Operational Risks</span>
            <span
              style={{
                backgroundColor: operational_risk_records_count > 0 ? '#78350F' : '#1E293B',
                color: operational_risk_records_count > 0 ? '#FDE68A' : '#94A3B8',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {operational_risk_records_count}
            </span>
          </button>

          {/* Astronaut Selector (if multiple) */}
          {astronauts.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                Crew:
              </span>
              <select
                value={activeAstronautId}
                onChange={(e) => onSelectAstronaut(e.target.value)}
                style={{
                  backgroundColor: '#111827',
                  color: '#38BDF8',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '12px',
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

          {/* Scenario Switcher (All 4 Scenarios) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
              Scenario:
            </span>
            <select
              value={activeScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              style={{
                backgroundColor: '#111827',
                color: '#E2E8F0',
                border: '1px solid #374151',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '300px',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '8px',
          backgroundColor: '#0D1320',
          border: '1px solid #1F2937',
          borderRadius: '4px',
          padding: '8px 12px',
          alignItems: 'center',
        }}
      >
        {/* Subject Astronaut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={15} color="#38BDF8" />
          <div>
            <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Crew Subject</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', fontFamily: "'JetBrains Mono', monospace" }}>
              {astronaut.callsign} <span style={{ fontSize: '11px', fontWeight: 400, color: '#94A3B8' }}>({astronaut.id})</span>
            </div>
          </div>
        </div>

        {/* Mission Profile & Day */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={15} color="#A78BFA" />
          <div>
            <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Mission Profile</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0', fontFamily: "'JetBrains Mono', monospace" }}>
              {mission_context.mission_profile} • DAY {astronaut.mission_day || mission_context.mission_day || 42}
            </div>
          </div>
        </div>

        {/* Communication Latency */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={15} color="#FBBF24" />
          <div>
            <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>OWLT Latency</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FBBF24', fontFamily: "'JetBrains Mono', monospace" }}>
              {mission_context.one_way_light_time_sec}s <span style={{ fontSize: '10px', fontWeight: 400, color: '#94A3B8' }}>({latencyMin} min)</span>
            </div>
          </div>
        </div>

        {/* Flight Surgeon Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={15} color={isSurgeonLive ? '#10B981' : '#F59E0B'} />
          <div>
            <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Surgeon Link</div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isSurgeonLive ? '#34D399' : '#FCD34D',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {isSurgeonLive ? 'LIVE VOICE LOOP' : 'DELAYED / ASYNC PROTOCOL'}
            </div>
          </div>
        </div>

        {/* Data Provenance Badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <ProvenanceBadge provenance={provenance} />
        </div>
      </div>
    </header>
  );
};
