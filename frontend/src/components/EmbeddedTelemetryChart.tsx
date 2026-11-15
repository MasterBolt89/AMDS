import React, { useState, useMemo } from 'react';
import {
  DomainDetailResponse,
  DomainSummary,
  DomainMetricDetail,
  MetricSeriesPoint,
} from '../types/api';
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
import { Sliders, Activity, Maximize2, AlertTriangle, Info } from 'lucide-react';

interface EmbeddedTelemetryChartProps {
  detail: DomainDetailResponse | null;
  summary?: DomainSummary;
  onExpand?: () => void;
  onOpenTelemetryModal?: (domainId: string, metricId: string) => void;
}

export const EmbeddedTelemetryChart: React.FC<EmbeddedTelemetryChartProps> = ({
  detail,
  summary,
  onExpand,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'mission'>('7d');
  const [includeSuspectOutliers, setIncludeSuspectOutliers] = useState<boolean>(false);

  const metric: DomainMetricDetail | undefined = detail?.metrics[0];
  const metricName = metric?.metric_name || 'telemetry_stream';
  const unit = metric?.unit || '';

  // Calculate relative mission day boundaries
  const allDays = (metric?.series || []).map((s: MetricSeriesPoint) => s.mission_day || 42);
  const maxMissionDay = allDays.length > 0 ? Math.max(...allDays) : 84;

  const filteredSeries = useMemo(() => {
    if (!metric?.series) return [];
    if (timeRange === '7d') {
      return metric.series.filter((s: MetricSeriesPoint) => (s.mission_day || 42) >= maxMissionDay - 7);
    }
    if (timeRange === '30d') {
      return metric.series.filter((s: MetricSeriesPoint) => (s.mission_day || 42) >= maxMissionDay - 30);
    }
    return metric.series;
  }, [metric, timeRange, maxMissionDay]);

  const { yMin, yMax, hasSuspectOutlier } = useMemo(() => {
    if (!metric) return { yMin: 0, yMax: 100, hasSuspectOutlier: false };

    const baseline = metric.baseline;
    const baseMean = baseline.mean;
    const baseStdDev = baseline.std_dev;
    const baseMin2Sigma = baseMean - 2 * baseStdDev;
    const baseMax2Sigma = baseMean + 2 * baseStdDev;

    const validValues = filteredSeries
      .filter((pt: MetricSeriesPoint) => pt.quality === 'VALID' && pt.value !== null)
      .map((pt: MetricSeriesPoint) => pt.value as number);

    const suspectValues = filteredSeries
      .filter((pt: MetricSeriesPoint) => pt.quality === 'SUSPECT' && pt.value !== null)
      .map((pt: MetricSeriesPoint) => pt.value as number);

    const hasOutlier = suspectValues.length > 0;

    if (includeSuspectOutliers) {
      const allValues = filteredSeries
        .filter((pt: MetricSeriesPoint) => pt.value !== null)
        .map((pt: MetricSeriesPoint) => pt.value as number);

      const minVal = allValues.length > 0 ? Math.min(...allValues, baseMin2Sigma) : baseMin2Sigma;
      const maxVal = allValues.length > 0 ? Math.max(...allValues, baseMax2Sigma) : baseMax2Sigma;
      const padding = (maxVal - minVal) * 0.15 || 5;

      return {
        yMin: Math.floor(minVal - padding),
        yMax: Math.ceil(maxVal + padding),
        hasSuspectOutlier: hasOutlier,
      };
    } else {
      const minVal = validValues.length > 0 ? Math.min(...validValues, baseMin2Sigma) : baseMin2Sigma;
      const maxVal = validValues.length > 0 ? Math.max(...validValues, baseMax2Sigma) : baseMax2Sigma;
      const padding = (maxVal - minVal) * 0.15 || 4;

      return {
        yMin: Math.floor(minVal - padding),
        yMax: Math.ceil(maxVal + padding),
        hasSuspectOutlier: hasOutlier,
      };
    }
  }, [metric, filteredSeries, includeSuspectOutliers]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    return filteredSeries.map((pt: MetricSeriesPoint) => {
      let timeLabel = pt.timestamp;
      try {
        const d = new Date(pt.timestamp);
        timeLabel = `D${pt.mission_day || 42} ${d.getUTCHours().toString().padStart(2, '0')}:00`;
      } catch {}

      return {
        timestamp: pt.timestamp,
        timeLabel,
        mission_day: pt.mission_day,
        value: pt.value,
        quality: pt.quality,
        note: pt.note,
        isSuspect: pt.quality === 'SUSPECT',
      };
    });
  }, [filteredSeries]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    if (payload.quality === 'SUSPECT') {
      return (
        <svg x={cx - 7} y={cy - 7} width={14} height={14} viewBox="0 0 24 24">
          <polygon
            points="12 2 22 20 2 20"
            fill="#FBBF24"
            stroke="#78350F"
            strokeWidth="2"
          />
        </svg>
      );
    }
    return <circle cx={cx} cy={cy} r={3} fill="#34D399" stroke="#080B12" strokeWidth={1} />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: '#07090F',
            border: `1px solid ${data.isSuspect ? '#FBBF24' : '#38BDF8'}`,
            borderRadius: '2px',
            padding: '8px 12px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ color: '#94A3B8', fontSize: '10px', marginBottom: '2px' }}>
            {data.timeLabel} ({data.timestamp})
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: data.isSuspect ? '#FBBF24' : '#F8FAFC' }}>
              {data.value !== null ? `${data.value} ${unit}` : 'MISSING (No Signal)'}
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: data.isSuspect ? '#FBBF24' : data.quality === 'MISSING' ? '#EF4444' : '#34D399',
              }}
            >
              [{data.quality}]
            </span>
          </div>
          {data.note && (
            <div
              style={{
                marginTop: '4px',
                fontSize: '10px',
                color: '#CBD5E1',
                borderLeft: '2px solid #FBBF24',
                paddingLeft: '6px',
                fontStyle: 'italic',
              }}
            >
              {data.note}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (!detail || !metric) {
    return (
      <div
        style={{
          backgroundColor: '#0C101A',
          border: '1px solid #1E293B',
          borderRadius: '2px',
          padding: '24px',
          textAlign: 'center',
          color: '#64748B',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
        }}
      >
        <Activity size={24} style={{ margin: '0 auto 8px', color: '#38BDF8' }} />
        SELECT A DOMAIN TO VIEW EMBEDDED HIGH-RESOLUTION TELEMETRY
      </div>
    );
  }

  const baseline = metric.baseline;

  return (
    <div
      style={{
        backgroundColor: '#0C101A',
        border: '1px solid #1E293B',
        borderRadius: '2px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Gradient Definitions */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="telemetryGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={15} color="#34D399" />
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#34D399',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              LIVE TECHNICAL — HEALTH TELEMETRY:
            </span>
            <span
              style={{
                marginLeft: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#F8FAFC',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {detail.display_name} ({metricName})
            </span>
          </div>
        </div>

        {/* Controls: Range Selector + Outlier Toggle + Expand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Outlier Toggle */}
          {hasSuspectOutlier && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                color: includeSuspectOutliers ? '#FBBF24' : '#94A3B8',
                cursor: 'pointer',
                backgroundColor: '#07090F',
                border: `1px solid ${includeSuspectOutliers ? '#FBBF24' : '#1E293B'}`,
                padding: '3px 8px',
                borderRadius: '2px',
              }}
            >
              <input
                type="checkbox"
                checked={includeSuspectOutliers}
                onChange={(e) => setIncludeSuspectOutliers(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#FBBF24' }}
              />
              <span>Outliers in Axis Scale</span>
            </label>
          )}

          {/* Range Selector */}
          <div style={{ display: 'flex', backgroundColor: '#07090F', borderRadius: '2px', border: '1px solid #1E293B' }}>
            {(['7d', '30d', 'mission'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  background: timeRange === r ? '#1E293B' : 'transparent',
                  color: timeRange === r ? '#38BDF8' : '#64748B',
                  border: 'none',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Full Screen / Deep View Button */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="aero-btn"
              style={{ padding: '3px 8px', fontSize: '10px' }}
              title="Expand Deep Clinical View"
            >
              <Maximize2 size={11} />
              <span>Deep View</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Time-Series LineChart */}
      <div style={{ width: '100%', height: '220px', backgroundColor: '#07090F', borderRadius: '2px', padding: '6px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#1E293B" strokeDasharray="2 2" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#475569"
              tick={{ fill: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
              tickLine={{ stroke: '#1E293B' }}
            />
            <YAxis
              domain={[yMin, yMax]}
              stroke="#475569"
              tick={{ fill: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
              tickLine={{ stroke: '#1E293B' }}
              unit={` ${unit}`}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Baseline Mean Reference Line */}
            {baseline && (
              <ReferenceLine
                y={baseline.mean}
                stroke="#38BDF8"
                strokeDasharray="4 4"
                label={{
                  value: `Mean ${baseline.mean}`,
                  fill: '#38BDF8',
                  fontSize: 8,
                  position: 'right',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            )}

            {/* Baseline +2 Sigma Reference Line */}
            {baseline && (
              <ReferenceLine
                y={baseline.mean + 2 * baseline.std_dev}
                stroke="#FBBF24"
                strokeDasharray="2 2"
                label={{
                  value: `+2σ ${Math.round((baseline.mean + 2 * baseline.std_dev) * 10) / 10}`,
                  fill: '#FBBF24',
                  fontSize: 8,
                  position: 'right',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            )}

            {/* Strictly enforce connectNulls={false} so MISSING values break the line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#telemetryGradient)"
              strokeWidth={2}
              connectNulls={false}
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: '#38BDF8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Scope Notice Banner */}
      <div
        style={{
          fontSize: '10px',
          color: '#94A3B8',
          lineHeight: '1.35',
          backgroundColor: '#07090F',
          borderLeft: '2px solid #38BDF8',
          padding: '6px 10px',
          borderRadius: '2px',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span style={{ color: '#38BDF8', fontWeight: 800 }}>SCOPE NOTICE: </span>
        {detail.measurement_scope_notice ||
          summary?.measurement_scope_notice ||
          'Telemetry stream reflects acute sensor inputs. Does not substitute for complete diagnostic assays.'}
      </div>
    </div>
  );
};
