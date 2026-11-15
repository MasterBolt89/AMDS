import React, { useState } from 'react';
import { DomainDetailResponse, MetricDetail } from '../types/api';
import { StatusBadge, QualityBadge } from './StatusBadge';
import { getDomainIcon } from './DomainCard';
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  Activity,
  PlusCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface DomainDetailViewProps {
  detail: DomainDetailResponse;
  onBack: () => void;
  onOpenTelemetryForDomain: (domainId: string, metricId: string) => void;
}

export const DomainDetailView: React.FC<DomainDetailViewProps> = ({
  detail,
  onBack,
  onOpenTelemetryForDomain,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'mission'>('7d');
  const [selectedMetricId, setSelectedMetricId] = useState<string>(
    detail.metrics[0]?.id || ''
  );

  const selectedMetric: MetricDetail | undefined = detail.metrics.find(
    (m) => m.id === selectedMetricId
  ) || detail.metrics[0];

  // Prepare chart series: filter according to time range if needed
  const chartData = (selectedMetric?.series || []).map((pt) => ({
    timestamp: pt.timestamp,
    mission_day: `Day ${pt.mission_day}`,
    raw_day: pt.mission_day,
    // Keep null for missing so line breaks and doesn't plot zero
    value: pt.value,
    quality: pt.quality,
    note: pt.note,
    provenance: pt.provenance,
    modality: pt.modality,
  }));

  const isInsufficient = detail.status === 'INSUFFICIENT_DATA';

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Back & Header */}
      <div style={{ marginBottom: '20px' }}>
        <button
          className="aero-btn"
          onClick={onBack}
          style={{ marginBottom: '14px', borderColor: '#334155' }}
        >
          <ArrowLeft size={14} />
          <span>Return to Command Overview</span>
        </button>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: '#111827',
            border: '1px solid #1F2937',
            borderRadius: '6px',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                backgroundColor: '#1E293B',
                padding: '10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getDomainIcon(detail.domain_id, 24)}
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#38BDF8',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {detail.domain_category} • {detail.domain_id}
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '2px 0 0 0', color: '#F8FAFC' }}>
                {detail.display_name}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <StatusBadge status={detail.status} size="lg" />
            <button
              className="aero-btn aero-btn-primary"
              onClick={() => onOpenTelemetryForDomain(detail.domain_id, selectedMetric?.id || '')}
            >
              <PlusCircle size={14} />
              <span>Log Domain Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scope Notice Guardrail Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderLeft: '4px solid #38BDF8',
          borderRadius: '4px',
          padding: '14px 18px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#38BDF8',
            marginBottom: '4px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <Info size={16} />
          MEASUREMENT SCOPE NOTICE & CLINICAL BOUNDARIES
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5' }}>
          {detail.measurement_scope_notice}
        </p>
      </div>

      {/* Insufficient Data Callout if applicable */}
      {isInsufficient && (
        <div
          style={{
            backgroundColor: '#1E293B',
            border: '2px dashed #64748B',
            borderRadius: '6px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#F87171',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: '6px',
            }}
          >
            <AlertTriangle size={16} color="#F87171" />
            SURVEILLANCE DEFICIT: INSUFFICIENT DATA
          </div>
          <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: '1.5' }}>
            {detail.status_reason || 'Biomarker panel cadence has lapsed. No automated prognostic inference is generated.'}
          </div>
        </div>
      )}

      {/* Cadence Policy Metadata Card */}
      <div
        className="aero-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Sampling Protocol
          </div>
          <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '2px', fontWeight: 600 }}>
            {detail.cadence_policy.collection_method}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Prescribed Cadence
          </div>
          <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
            Every {detail.cadence_policy.expected_frequency_hours} hours (Max Gap: {detail.cadence_policy.max_acceptable_gap_hours}h)
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Elapsed Since Last Ingestion
          </div>
          <div
            style={{
              fontSize: '12px',
              color: detail.cadence_policy.last_sample_elapsed_days > 14 ? '#F87171' : '#34D399',
              marginTop: '2px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {detail.cadence_policy.last_sample_elapsed_days} days ago
          </div>
        </div>
      </div>

      {/* Metrics Selector & Time Range Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Metric Selector Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {detail.metrics.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMetricId(m.id)}
              style={{
                backgroundColor: selectedMetricId === m.id ? '#1E293B' : '#0D1320',
                border: `1px solid ${selectedMetricId === m.id ? '#38BDF8' : '#1F2937'}`,
                color: selectedMetricId === m.id ? '#38BDF8' : '#94A3B8',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {m.name} ({m.unit})
            </button>
          ))}
        </div>

        {/* Time-Range Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0D1320',
            border: '1px solid #1F2937',
            borderRadius: '4px',
            padding: '2px',
          }}
        >
          {(['7d', '30d', 'mission'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                backgroundColor: timeRange === range ? '#0284C7' : 'transparent',
                color: timeRange === range ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '3px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Panel */}
      {selectedMetric && (
        <div className="aero-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                {selectedMetric.name} Telemetry Trend
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
                Baseline Mean: {selectedMetric.baseline.mean} {selectedMetric.baseline.unit} (Ref Range:{' '}
                {selectedMetric.baseline.reference_range_min} - {selectedMetric.baseline.reference_range_max}{' '}
                {selectedMetric.baseline.unit})
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Modality: <strong style={{ color: '#E2E8F0' }}>{selectedMetric.modality}</strong>
            </div>
          </div>

          <div
            className="aero-well"
            style={{
              padding: '16px 8px 8px 0',
              height: '320px',
              position: 'relative',
            }}
          >
            {chartData.length === 0 ? (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  fontSize: '13px',
                }}
              >
                No telemetry data points available in current observation window.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mission_day"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <YAxis
                    stroke="#64748B"
                    domain={['auto', 'auto']}
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                    unit={` ${selectedMetric.unit}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div
                          style={{
                            backgroundColor: '#0A0F1D',
                            border: '1px solid #334155',
                            borderRadius: '4px',
                            padding: '10px 12px',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#38BDF8',
                              fontFamily: "'JetBrains Mono', monospace",
                              marginBottom: '4px',
                            }}
                          >
                            {data.mission_day} ({data.timestamp.slice(0, 10)})
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            Value:{' '}
                            <strong style={{ color: '#F8FAFC', fontFamily: "'JetBrains Mono', monospace" }}>
                              {data.value !== null ? `${data.value} ${selectedMetric.unit}` : 'MISSING (NULL)'}
                            </strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            Quality: <QualityBadge quality={data.quality} />
                          </div>
                          {data.note && (
                            <div
                              style={{
                                color: data.quality === 'SUSPECT' ? '#FCD34D' : '#94A3B8',
                                fontSize: '11px',
                                marginTop: '4px',
                                maxWidth: '240px',
                                fontStyle: 'italic',
                              }}
                            >
                              Note: {data.note}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {/* Reference line for baseline mean */}
                  <ReferenceLine
                    y={selectedMetric.baseline.mean}
                    stroke="#0284C7"
                    strokeDasharray="4 4"
                    label={{
                      value: `Baseline (${selectedMetric.baseline.mean})`,
                      fill: '#38BDF8',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    connectNulls={false}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.value === null) return null;
                      if (payload.quality === 'SUSPECT') {
                        return (
                          <circle
                            key={`dot-${props.index}`}
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="#F59E0B"
                            stroke="#78350F"
                            strokeWidth={2}
                          />
                        );
                      }
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="#38BDF8"
                          stroke="#0B1329"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Raw Metric Series Table */}
      {selectedMetric && (
        <div className="aero-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              borderBottom: '1px solid #1F2937',
              paddingBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#38BDF8" />
              <h3 style={{ margin: 0, fontSize: '14px', color: '#F8FAFC' }}>
                TELEMETRIC TIME-SERIES LEDGER ({selectedMetric.series.length} ENTRIES)
              </h3>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
              AUDITED TELEMETRY FRAMES
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#0D1320', color: '#94A3B8', borderBottom: '1px solid #1F2937' }}>
                  <th style={{ padding: '8px 12px' }}>Timestamp</th>
                  <th style={{ padding: '8px 12px' }}>Mission Day</th>
                  <th style={{ padding: '8px 12px' }}>Measured Value</th>
                  <th style={{ padding: '8px 12px' }}>Data Quality</th>
                  <th style={{ padding: '8px 12px' }}>Provenance</th>
                  <th style={{ padding: '8px 12px' }}>Modality</th>
                  <th style={{ padding: '8px 12px' }}>Clinical / Sensor Notes</th>
                </tr>
              </thead>
              <tbody>
                {selectedMetric.series.map((pt, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #162032',
                      backgroundColor: idx % 2 === 0 ? '#111827' : '#0D1320',
                    }}
                  >
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#94A3B8' }}>
                      {pt.timestamp.replace('T', ' ').replace('Z', '')}
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                      Day {pt.mission_day}
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        color: pt.value === null ? '#94A3B8' : pt.quality === 'SUSPECT' ? '#FBBF24' : '#F8FAFC',
                      }}
                    >
                      {pt.value !== null ? `${pt.value} ${selectedMetric.unit}` : '— (GAP)'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <QualityBadge quality={pt.quality} />
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#94A3B8' }}>
                      {pt.provenance}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: '#94A3B8' }}>
                      {pt.modality}
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        color: pt.quality === 'SUSPECT' ? '#FCD34D' : '#94A3B8',
                        fontStyle: pt.note ? 'italic' : 'normal',
                      }}
                    >
                      {pt.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
