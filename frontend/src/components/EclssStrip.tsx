import React from 'react';
import { DomainSummary, DomainId } from '../types/api';
import { Wind, Info } from 'lucide-react';

interface EclssStripProps {
  domain?: DomainSummary;
  isSelected?: boolean;
  onSelect: (domainId: DomainId) => void;
}

const MicroSparkline: React.FC<{ points: number[]; color: string; width?: number; height?: number }> = ({
  points,
  color,
  width = 36,
  height = 14,
}) => {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pts = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * (width - 4) + 2;
      const y = height - 2 - ((p - min) / range) * (height - 4);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', flexShrink: 0 }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
};

export const EclssStrip: React.FC<EclssStripProps> = ({
  domain,
  isSelected = false,
  onSelect,
}) => {
  const isCritical = domain?.status === 'CRITICAL';
  const isAttention = domain?.status === 'ATTENTION';

  // Environmental telemetry values
  const ppO2 = isCritical ? '15.8 kPa' : '20.9 kPa';
  const ppCO2 = isCritical ? '4.8 mmHg' : '2.8 mmHg';
  const totalPressure = isCritical ? '89.2 kPa' : '101.3 kPa';
  const temperature = '21.5 °C';
  const humidity = '44.0%';

  // Sparkline data arrays
  const o2Points = isCritical
    ? [20.9, 20.4, 19.5, 18.2, 16.7, 15.8]
    : [20.8, 20.9, 20.9, 20.8, 20.9, 20.9];
  const o2Color = isCritical ? '#EF4444' : '#34D399';

  const co2Points = isCritical
    ? [2.8, 3.2, 3.7, 4.1, 4.5, 4.8]
    : [2.7, 2.8, 2.7, 2.8, 2.8, 2.8];
  const co2Color = isCritical ? '#FBBF24' : '#38BDF8';

  const tempPoints = [21.4, 21.5, 21.4, 21.5, 21.6, 21.5];
  const tempColor = '#34D399';

  return (
    <div
      data-testid="eclss-strip"
      onClick={() => onSelect('environment_eclss')}
      style={{
        backgroundColor: isSelected ? '#0F172A' : '#0C101A',
        border: `1px solid ${isSelected ? '#38BDF8' : '#1E293B'}`,
        borderRadius: '0px',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        marginBottom: '8px',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#121826';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#0C101A';
      }}
    >
      {/* Full-Width Sky Cobalt (#38BDF8) Header Bar */}
      <div
        style={{
          backgroundColor: '#38BDF8',
          color: '#050608',
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 800,
          letterSpacing: '0.05em',
          fontSize: '10px',
          textTransform: 'uppercase',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Wind size={12} color="#050608" />
          <span>ENVIRONMENTAL & LIFE SUPPORT (ECLSS) — HABITAT ATMOSPHERE</span>
          <div className="tooltip-container" onClick={(e) => e.stopPropagation()}>
            <Info size={10} color="#050608" style={{ cursor: 'help' }} />
            <div className="tooltip-content" style={{ color: '#E2E8F0', border: '1px solid #38BDF8' }}>
              <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '2px' }}>
                ECLSS Scope Notice
              </div>
              {domain?.measurement_scope_notice ||
                'Spacecraft environmental telemetry reflects habitat life-support status, not individual physiological measurements.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              backgroundColor: isCritical ? '#7F1D1D' : '#0284C7',
              color: '#FFFFFF',
              padding: '1px 5px',
              borderRadius: '2px',
              fontSize: '8.5px',
              fontWeight: 800,
            }}
          >
            {isCritical ? '● CRITICAL ANOMALY' : isAttention ? '● ATTENTION' : '● NOMINAL'}
          </span>
          <span style={{ fontSize: '8.5px', color: '#0F172A', fontWeight: 700 }}>
            {isSelected ? '● ACTIVE STREAM' : 'GRAPH →'}
          </span>
        </div>
      </div>

      {/* 5-Metric Telemetry Readouts Grid with Inline Micro-Sparklines */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '6px',
          backgroundColor: '#07090F',
          padding: '4px 10px',
          alignItems: 'center',
        }}
      >
        {/* O2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '6px', borderRight: '1px solid #1E293B' }}>
          <div>
            <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
              Cabin ppO₂
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: isCritical ? '#EF4444' : '#F8FAFC',
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1.2',
              }}
            >
              {ppO2}
            </div>
          </div>
          <MicroSparkline points={o2Points} color={o2Color} />
        </div>

        {/* CO2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '6px', borderRight: '1px solid #1E293B' }}>
          <div>
            <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
              Cabin ppCO₂
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: isCritical ? '#FBBF24' : '#F8FAFC',
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1.2',
              }}
            >
              {ppCO2}
            </div>
          </div>
          <MicroSparkline points={co2Points} color={co2Color} />
        </div>

        {/* Temp */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '6px', borderRight: '1px solid #1E293B' }}>
          <div>
            <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
              Habitat Temp
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#F8FAFC',
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1.2',
              }}
            >
              {temperature}
            </div>
          </div>
          <MicroSparkline points={tempPoints} color={tempColor} />
        </div>

        {/* Total Pressure */}
        <div style={{ paddingRight: '6px', borderRight: '1px solid #1E293B' }}>
          <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            Total Pressure
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: isCritical ? '#EF4444' : '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
              lineHeight: '1.2',
            }}
          >
            {totalPressure}
          </div>
        </div>

        {/* Rel Humidity */}
        <div>
          <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            Rel Humidity
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
              lineHeight: '1.2',
            }}
          >
            {humidity}
          </div>
        </div>
      </div>
    </div>
  );
};
