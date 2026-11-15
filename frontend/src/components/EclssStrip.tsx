import React from 'react';
import { DomainSummary, DomainId } from '../types/api';
import { Wind, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface EclssStripProps {
  domain?: DomainSummary;
  isSelected?: boolean;
  onSelect: (domainId: DomainId) => void;
}

export const EclssStrip: React.FC<EclssStripProps> = ({
  domain,
  isSelected = false,
  onSelect,
}) => {
  const isCritical = domain?.status === 'CRITICAL';
  const isAttention = domain?.status === 'ATTENTION';

  // Environmental metrics reflect nominal vs. incident state
  const ppO2 = isCritical ? '15.8 kPa (-22.5%)' : '20.9 kPa (Nominal)';
  const ppCO2 = isCritical ? '4.8 mmHg (Elevated)' : '2.8 mmHg (Nominal)';
  const totalPressure = isCritical ? '89.2 kPa (Depress Hazard)' : '101.3 kPa (1.0 atm)';
  const temperature = '21.5 °C';
  const humidity = '44.0%';

  const accentColor = isCritical ? '#EF4444' : isAttention ? '#FBBF24' : '#38BDF8';

  return (
    <div
      data-testid="eclss-strip"
      onClick={() => onSelect('environment_eclss')}
      style={{
        backgroundColor: isSelected ? '#0F172A' : '#0C101A',
        border: `1px solid ${isSelected ? accentColor : '#1E293B'}`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: '2px',
        padding: '12px 16px',
        cursor: 'pointer',
        transition: 'all 0.12s ease-in-out',
        marginBottom: '16px',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#121826';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#0C101A';
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wind size={15} color={accentColor} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#F8FAFC',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ENVIRONMENTAL & LIFE SUPPORT (ECLSS) — HABITAT ATMOSPHERE
          </span>
          <div className="tooltip-container" onClick={(e) => e.stopPropagation()}>
            <Info size={12} color="#64748B" style={{ cursor: 'help' }} />
            <div className="tooltip-content">
              <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '2px' }}>
                ECLSS Scope Notice
              </div>
              {domain?.measurement_scope_notice ||
                'Spacecraft environmental telemetry reflects habitat life-support status, not individual physiological measurements.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: accentColor,
            }}
          >
            <span>●</span>
            <span>{isCritical ? 'CRITICAL DRIFT' : isAttention ? 'ATTENTION' : 'NOMINAL ATMOSPHERE'}</span>
          </div>
          <span
            style={{
              fontSize: '10px',
              color: isSelected ? '#38BDF8' : '#64748B',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
            }}
          >
            {isSelected ? '● ACTIVE IN GRAPH' : 'CLICK TO GRAPH →'}
          </span>
        </div>
      </div>

      {/* 5-Metric Telemetry Readouts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
          backgroundColor: '#07090F',
          border: '1px solid #1E293B',
          borderRadius: '2px',
          padding: '8px 12px',
        }}
      >
        <div>
          <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            Cabin ppO₂
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: isCritical ? '#EF4444' : '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {ppO2}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            Cabin ppCO₂
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: isCritical ? '#FBBF24' : '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {ppCO2}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            Total Pressure
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: isCritical ? '#EF4444' : '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalPressure}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            Habitat Temp
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {temperature}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            Rel Humidity
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {humidity}
          </div>
        </div>
      </div>
    </div>
  );
};
