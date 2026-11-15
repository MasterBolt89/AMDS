import React from 'react';
import { DomainSummary, DomainId, Finding, DomainDetailResponse } from '../types/api';
import { Wind, Info } from 'lucide-react';

interface EclssStripProps {
  domain?: DomainSummary;
  isSelected?: boolean;
  onSelect: (domainId: DomainId) => void;
  findings?: Finding[];
  detail?: DomainDetailResponse | null;
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
  findings,
  detail,
}) => {
  const isCritical = domain?.status === 'CRITICAL';
  const isAttention = domain?.status === 'ATTENTION';

  // Environmental telemetry values with live scenario binding
  let liveCo2Val = 2.2;
  if (detail && detail.domain_id === 'environment_eclss') {
    const co2Metric = (detail as any).current_metrics?.find((m: any) => m.metric_name?.includes('co2'));
    if (co2Metric && typeof co2Metric.value === 'number') {
      liveCo2Val = co2Metric.value;
    } else if (detail.metrics?.[0]?.series && detail.metrics[0].series.length > 0) {
      const series = detail.metrics[0].series;
      const last = series[series.length - 1];
      if (last && typeof last.value === 'number') {
        liveCo2Val = last.value;
      }
    }
  } else if (typeof domain?.headline_metric === 'string') {
    const match = domain.headline_metric.match(/([\d.]+)\s*mmHg/i);
    if (match) {
      liveCo2Val = parseFloat(match[1]);
    }
  } else if (domain?.headline_metric && typeof domain.headline_metric === 'object') {
    const raw = domain.headline_metric as any;
    if (typeof raw.value === 'number') {
      liveCo2Val = raw.value;
    }
  } else if (findings && findings.length > 0) {
    const eclssFinding = findings.find(
      (f) =>
        f.involved_domains?.includes('environment_eclss') ||
        f.finding_id?.toLowerCase().includes('eclss')
    );
    if (eclssFinding) {
      const match =
        eclssFinding.what_changed?.match(/([\d.]+)\s*mmHg/i) ||
        eclssFinding.title?.match(/([\d.]+)\s*mmHg/i);
      if (match) {
        liveCo2Val = parseFloat(match[1]);
      } else if (isAttention) {
        liveCo2Val = 3.8;
      }
    }
  } else if (isAttention) {
    liveCo2Val = 3.8;
  }

  if (isAttention && liveCo2Val < 3.0) {
    liveCo2Val = 3.8;
  }

  const ppO2 = isCritical ? '15.8 kPa' : '20.9 kPa';
  const ppCO2 = `${liveCo2Val.toFixed(1)} mmHg`;
  const totalPressure = isCritical ? '89.2 kPa' : '101.3 kPa';
  const temperature = '21.5 °C';
  const humidity = '44.0%';

  // Sparkline data arrays
  const o2Points = isCritical
    ? [20.9, 20.4, 19.5, 18.2, 16.7, 15.8]
    : [20.8, 20.9, 20.9, 20.8, 20.9, 20.9];
  const o2Color = isCritical ? '#EF4444' : '#34D399';

  const isCo2Elevated = liveCo2Val >= 3.0;
  const co2Points = isCritical
    ? [2.8, 3.2, 3.7, 4.1, 4.5, 4.8]
    : isCo2Elevated
    ? [2.1, 2.2, 2.3, 3.2, 3.6, liveCo2Val]
    : [2.1, 2.2, 2.1, 2.2, 2.2, liveCo2Val];
  const co2Color = isCritical ? '#EF4444' : isCo2Elevated ? '#FBBF24' : '#38BDF8';
  const co2TextColor = isCritical ? '#EF4444' : isCo2Elevated ? '#FBBF24' : '#F8FAFC';

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
          letterSpacing: '0.04em',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              backgroundColor: isCritical ? '#7F1D1D' : '#0284C7',
              color: '#FFFFFF',
              padding: '1px 5px',
              borderRadius: '2px',
              fontSize: '9.5px',
              fontWeight: 800,
            }}
          >
            {isCritical ? '● CRITICAL ANOMALY' : isAttention ? '● ATTENTION' : '● NOMINAL'}
          </span>
          <span style={{ fontSize: '9px', color: '#0F172A', fontWeight: 700 }}>
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
          padding: '4px 8px',
          alignItems: 'center',
        }}
      >
        {/* O2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '4px', borderRight: '1px solid #1E293B' }}>
          <div>
            <div style={{ fontSize: '9.5px', color: '#94A3B8', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
              Cabin ppO₂
            </div>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: isCritical ? '#EF4444' : '#F8FAFC',
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1.15',
              }}
            >
              {ppO2}
            </div>
          </div>
          <MicroSparkline points={o2Points} color={o2Color} width={30} height={12} />
        </div>

        {/* CO2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '4px', borderRight: '1px solid #1E293B' }}>
          <div>
            <div style={{ fontSize: '9.5px', color: '#94A3B8', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
              Cabin ppCO₂
            </div>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: co2TextColor,
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1.15',
              }}
            >
              {ppCO2}
            </div>
          </div>
          <MicroSparkline points={co2Points} color={co2Color} width={30} height={12} />
        </div>

        {/* Temp */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '4px', borderRight: '1px solid #1E293B' }}>
          <div>
            <div style={{ fontSize: '9.5px', color: '#94A3B8', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
              Habitat Temp
            </div>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: '#F8FAFC',
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1.15',
              }}
            >
              {temperature}
            </div>
          </div>
          <MicroSparkline points={tempPoints} color={tempColor} width={30} height={12} />
        </div>

        {/* Total Pressure */}
        <div style={{ paddingRight: '4px', borderRight: '1px solid #1E293B' }}>
          <div style={{ fontSize: '9.5px', color: '#94A3B8', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            Total Pressure
          </div>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 800,
              color: isCritical ? '#EF4444' : '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
              lineHeight: '1.15',
            }}
          >
            {totalPressure}
          </div>
        </div>

        {/* Rel Humidity */}
        <div>
          <div style={{ fontSize: '9.5px', color: '#94A3B8', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            Rel Humidity
          </div>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
              lineHeight: '1.15',
            }}
          >
            {humidity}
          </div>
        </div>
      </div>
    </div>
  );
};
