import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
import { Activity, Maximize2, ShieldAlert, Info } from 'lucide-react';

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
  const [showScopeTooltip, setShowScopeTooltip] = useState<boolean>(false);
  const [popoverPlacement, setPopoverPlacement] = useState<'right' | 'left'>('right');

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePopoverPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 288;
    const margin = 16;
    if (rect.right - popoverWidth < margin) {
      setPopoverPlacement('left');
    } else {
      setPopoverPlacement('right');
    }
  }, []);

  useEffect(() => {
    if (!showScopeTooltip) return;
    updatePopoverPosition();

    const handleResize = () => updatePopoverPosition();
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowScopeTooltip(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showScopeTooltip, updatePopoverPosition]);

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

  const chartData = useMemo(() => {
    return filteredSeries.map((pt: MetricSeriesPoint) => {
      let timeLabel = pt.timestamp;
      let day = pt.mission_day;
      try {
        const d = new Date(pt.timestamp);
        const hrs = d.getUTCHours().toString().padStart(2, '0');
        const mins = d.getUTCMinutes().toString().padStart(2, '0');
        if (!day) {
          const maxDate = filteredSeries.length > 0 ? new Date(filteredSeries[filteredSeries.length - 1].timestamp).getTime() : d.getTime();
          const dayDiff = Math.round((maxDate - d.getTime()) / (24 * 3600 * 1000));
          day = Math.max(1, maxMissionDay - dayDiff);
        }
        timeLabel = `D${day} ${hrs}:${mins}`;
      } catch {}

      return {
        timestamp: pt.timestamp,
        timeLabel,
        mission_day: day || pt.mission_day || maxMissionDay,
        value: pt.value,
        quality: pt.quality,
        note: pt.note,
        isSuspect: pt.quality === 'SUSPECT',
      };
    });
  }, [filteredSeries, maxMissionDay]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    if (payload.quality === 'SUSPECT') {
      return (
        <svg x={cx - 6} y={cy - 6} width={12} height={12} viewBox="0 0 24 24">
          <polygon
            points="12 2 22 20 2 20"
            fill="#FBBF24"
            stroke="#78350F"
            strokeWidth="2"
          />
        </svg>
      );
    }
    return <circle cx={cx} cy={cy} r={2.5} fill="#34D399" stroke="#080B12" strokeWidth={1} />;
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
            padding: '6px 10px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ color: '#94A3B8', fontSize: '9px', marginBottom: '2px' }}>
            {data.timeLabel} ({data.timestamp})
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: data.isSuspect ? '#FBBF24' : '#F8FAFC' }}>
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
                marginTop: '3px',
                fontSize: '9.5px',
                color: '#CBD5E1',
                borderLeft: '2px solid #FBBF24',
                paddingLeft: '5px',
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
          borderRadius: '0px',
          padding: '16px',
          textAlign: 'center',
          color: '#64748B',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Activity size={20} style={{ margin: '0 auto 6px', color: '#38BDF8' }} />
        SELECT A DOMAIN TO VIEW EMBEDDED HIGH-RESOLUTION TELEMETRY
      </div>
    );
  }

  const baseline = metric.baseline;
  const scopeNoticeText =
    detail.measurement_scope_notice ||
    summary?.measurement_scope_notice ||
    'Physiological telemetry tracks acute autonomic responses and spaceflight deconditioning. Does not substitute for comprehensive diagnostic clinical assays.';

  return (
    <div
      style={{
        backgroundColor: '#0C101A',
        border: '1px solid #1E293B',
        borderRadius: '0px',
        padding: '6px 8px 4px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        height: '100%',
        minHeight: 0,
        flex: 1,
        position: 'relative',
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
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '4px',
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        {/* Metric Title: min-w-0 flex-1 truncate */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minWidth: 0,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <Activity size={13} color="#34D399" style={{ flexShrink: 0 }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#34D399',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
                flexShrink: 0,
              }}
            >
              LIVE TELEMETRY:
            </span>
            <span
              style={{
                marginLeft: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#F8FAFC',
                fontFamily: "'JetBrains Mono', monospace",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
              title={`${detail.display_name} (${metricName})`}
            >
              {detail.display_name} ({metricName})
            </span>
            <span
              style={{
                marginLeft: '6px',
                fontSize: '9px',
                color: '#64748B',
                fontFamily: "'JetBrains Mono', monospace",
                flexShrink: 0,
              }}
            >
              [SURVEILLANCE ONLY]
            </span>
          </div>
        </div>

        {/* Controls: Scope Notice Badge + Outlier Toggle + Range Selector + Expand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Epistemic Scope Notice Header Button with interactive hover popover */}
          <div
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={() => setShowScopeTooltip(true)}
            onMouseLeave={() => setShowScopeTooltip(false)}
          >
            <button
              ref={buttonRef}
              onClick={() => setShowScopeTooltip(!showScopeTooltip)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: showScopeTooltip ? '#0284C7' : 'rgba(56, 189, 248, 0.1)',
                border: '1px solid #0284C7',
                color: showScopeTooltip ? '#FFFFFF' : '#38BDF8',
                borderRadius: '2px',
                padding: '2px 6px',
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              title="Click or hover to inspect epistemic diagnostic scope limitations"
            >
              <Info size={10} color={showScopeTooltip ? '#FFFFFF' : '#38BDF8'} />
              <span>SCOPE NOTICE</span>
            </button>
            {showScopeTooltip && (
              <div
                ref={popoverRef}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: popoverPlacement === 'right' ? 0 : 'auto',
                  left: popoverPlacement === 'left' ? 0 : 'auto',
                  width: '288px',
                  maxWidth: 'calc(100vw - 2rem)',
                  backgroundColor: '#07090F',
                  border: '1px solid #38BDF8',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.95)',
                  zIndex: 50,
                  padding: '8px 10px',
                  borderRadius: '2px',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 800,
                    color: '#38BDF8',
                    fontSize: '10px',
                    marginBottom: '4px',
                    letterSpacing: '0.04em',
                  }}
                >
                  <ShieldAlert size={12} color="#38BDF8" />
                  NASA CLINICAL SURVEILLANCE SCOPE NOTICE
                </div>
                <div style={{ fontSize: '10px', color: '#CBD5E1', lineHeight: '1.4' }}>
                  {scopeNoticeText}
                </div>
              </div>
            )}
          </div>

          {hasSuspectOutlier && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '9px',
                fontFamily: "'JetBrains Mono', monospace",
                color: includeSuspectOutliers ? '#FBBF24' : '#94A3B8',
                cursor: 'pointer',
                backgroundColor: '#07090F',
                border: `1px solid ${includeSuspectOutliers ? '#FBBF24' : '#1E293B'}`,
                padding: '1px 5px',
                borderRadius: '2px',
              }}
            >
              <input
                type="checkbox"
                checked={includeSuspectOutliers}
                onChange={(e) => setIncludeSuspectOutliers(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#FBBF24' }}
              />
              <span>Outliers</span>
            </label>
          )}

          <div style={{ display: 'flex', backgroundColor: '#07090F', borderRadius: '2px', border: '1px solid #1E293B' }}>
            {(['7d', '30d', 'mission'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  background: timeRange === r ? '#1E293B' : 'transparent',
                  color: timeRange === r ? '#38BDF8' : '#64748B',
                  border: 'none',
                  padding: '2px 5px',
                  fontSize: '9px',
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

          {onExpand && (
            <button
              onClick={onExpand}
              className="aero-btn"
              style={{ padding: '2px 5px', fontSize: '9px' }}
              title="Expand Deep Clinical View"
            >
              <Maximize2 size={10} />
              <span>Deep View</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Time-Series LineChart (Flexible Height with Absolute Child for Recharts) */}
      <div
        style={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          position: 'relative',
          backgroundColor: '#07090F',
          padding: '2px 4px 0 0',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 12, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="2 2" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#475569"
                tick={{ fill: '#64748B', fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}
                tickLine={{ stroke: '#1E293B' }}
              />
              <YAxis
                domain={[yMin, yMax]}
                stroke="#475569"
                tick={{ fill: '#64748B', fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}
                tickLine={{ stroke: '#1E293B' }}
                unit={` ${unit}`}
                width={46}
              />
              <Tooltip content={<CustomTooltip />} />

              {baseline && (
                <ReferenceLine
                  y={baseline.mean}
                  stroke="#38BDF8"
                  strokeDasharray="4 4"
                  label={{
                    value: `Mean ${baseline.mean}`,
                    fill: '#38BDF8',
                    fontSize: 7.5,
                    position: 'right',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              )}

              {baseline && (
                <ReferenceLine
                  y={baseline.mean + 2 * baseline.std_dev}
                  stroke="#FBBF24"
                  strokeDasharray="2 2"
                  label={{
                    value: `+2σ ${Math.round((baseline.mean + 2 * baseline.std_dev) * 10) / 10}`,
                    fill: '#FBBF24',
                    fontSize: 7.5,
                    position: 'right',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#telemetryGradient)"
                strokeWidth={2}
                connectNulls={false}
                dot={<CustomDot />}
                activeDot={{ r: 4, fill: '#38BDF8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
