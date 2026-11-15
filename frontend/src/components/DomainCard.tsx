import React from 'react';
import { DomainSummary, DomainId } from '../types/api';
import { StatusBadge, QualityBadge } from './StatusBadge';
import {
  Heart,
  Moon,
  Brain,
  Dumbbell,
  Dna,
  Zap,
  Wind,
  Eye,
  Utensils,
  ChevronRight,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface DomainCardProps {
  domain: DomainSummary;
  onSelect: (domainId: DomainId) => void;
}

export const getDomainIcon = (domainId: DomainId, size: number = 18) => {
  switch (domainId) {
    case 'cardiovascular':
      return <Heart size={size} color="#F87171" />;
    case 'sleep_circadian':
      return <Moon size={size} color="#818CF8" />;
    case 'behavioral_psych':
      return <Brain size={size} color="#F472B6" />;
    case 'musculoskeletal':
      return <Dumbbell size={size} color="#FB923C" />;
    case 'immune_microbio':
      return <Dna size={size} color="#34D399" />;
    case 'radiation':
      return <Zap size={size} color="#FBBF24" />;
    case 'sensorimotor_neuro':
      return <Eye size={size} color="#38BDF8" />;
    case 'nutrition':
      return <Utensils size={size} color="#A3E635" />;
    case 'environment_eclss':
      return <Wind size={size} color="#2DD4BF" />;
  }
};

export interface ParsedHeadlineMetric {
  value: number | string;
  unit: string;
  label: string;
  metric_key?: string;
  delta_from_baseline_pct: number | null;
  baseline_mean: number | null;
  quality?: string;
}

export const METRIC_DICTIONARY: Record<
  string,
  { label: string; unit: string; nominalValue: number; nominalBaseline: number }
> = {
  resting_hr_bpm: {
    label: 'Resting Heart Rate',
    unit: 'bpm',
    nominalValue: 60,
    nominalBaseline: 60,
  },
  sleep_duration_hours: {
    label: 'Sleep Duration',
    unit: 'hrs',
    nominalValue: 7.5,
    nominalBaseline: 7.5,
  },
  cognitive_fatigue_score: {
    label: 'Cognitive Fatigue Score',
    unit: '/100',
    nominalValue: 15,
    nominalBaseline: 15,
  },
  exercise_adherence_pct: {
    label: 'Exercise Adherence',
    unit: '%',
    nominalValue: 95,
    nominalBaseline: 95,
  },
  crp_biomarker_mg_l: {
    label: 'C-Reactive Protein (CRP)',
    unit: 'mg/L',
    nominalValue: 0.82,
    nominalBaseline: 0.85,
  },
  daily_dose_msv: {
    label: 'Daily Radiation Dose',
    unit: 'mSv',
    nominalValue: 0.35,
    nominalBaseline: 0.35,
  },
  co2_partial_pressure_mmhg: {
    label: 'Cabin ppCO₂',
    unit: 'mmHg',
    nominalValue: 2.8,
    nominalBaseline: 2.8,
  },
  postural_instability_score: {
    label: 'Postural Sway Instability',
    unit: 'mm/s',
    nominalValue: 12.0,
    nominalBaseline: 12.0,
  },
  caloric_intake_kcal: {
    label: 'Caloric Intake',
    unit: 'kcal',
    nominalValue: 2800,
    nominalBaseline: 2800,
  },
};

export function parseHeadlineMetric(domain: DomainSummary): ParsedHeadlineMetric | null {
  if (
    domain.status === 'INSUFFICIENT_DATA' ||
    domain.headline_metric === null ||
    domain.headline_metric === undefined
  ) {
    return null;
  }

  // 1. If it's an object
  if (typeof domain.headline_metric === 'object') {
    const raw = domain.headline_metric as any;
    const metricKey =
      raw.metric_key || (typeof raw.name === 'string' && raw.name.includes('_') ? raw.name : undefined);
    const meta = metricKey ? METRIC_DICTIONARY[metricKey] : undefined;

    return {
      value: raw.value !== null && raw.value !== undefined ? raw.value : '—',
      unit: raw.unit || meta?.unit || '',
      label: raw.label || raw.name || meta?.label || 'Headline Metric',
      metric_key: metricKey,
      delta_from_baseline_pct:
        raw.delta_from_baseline_pct !== undefined ? raw.delta_from_baseline_pct : null,
      baseline_mean: raw.baseline_mean !== undefined ? raw.baseline_mean : null,
      quality: raw.quality,
    };
  }

  // 2. If it's a string
  if (typeof domain.headline_metric === 'string') {
    const text = domain.headline_metric.trim();
    if (!text) return null;

    // Check if it's a known metric key (e.g. "resting_hr_bpm")
    if (METRIC_DICTIONARY[text]) {
      const meta = METRIC_DICTIONARY[text];
      let value: number | string = meta.nominalValue;
      let baseline: number | null = meta.nominalBaseline;
      let delta: number | null = null;

      // Extract current and baseline from status_reason if available
      const reason = domain.status_reason || '';
      const currentMatch = reason.match(/current:\s*([0-9.]+)/i);
      const baselineMatch = reason.match(/baseline(?:\s*mean)?:\s*([0-9.]+)/i);

      if (currentMatch) {
        value = parseFloat(currentMatch[1]);
      }
      if (baselineMatch) {
        baseline = parseFloat(baselineMatch[1]);
      }
      if (typeof value === 'number' && baseline && baseline > 0) {
        delta = Math.round(((value - baseline) / baseline) * 1000) / 10;
      }

      return {
        value,
        unit: meta.unit,
        label: meta.label,
        metric_key: text,
        delta_from_baseline_pct: delta,
        baseline_mean: baseline,
      };
    }

    // Try parsing formatted string like "75.0 bpm (Baseline: 62.0 bpm, +21.0%)"
    // or "4.3h (Baseline: 7.5h, -42.7%)" or "Adherence: 95.0% (Baseline: 95.0%)"
    const formattedMatch = text.match(
      /^(?:([A-Za-z\s]+):\s*)?([0-9.]+)\s*([a-zA-Z/%]+)?(?:\s*\(Baseline:\s*([0-9.]+)[^,]*,\s*([+-]?[0-9.]+)%[^)]*\))?/i
    );

    if (formattedMatch) {
      const customLabel = formattedMatch[1]?.trim();
      const numVal = parseFloat(formattedMatch[2]);
      const unit = formattedMatch[3]?.trim() || '';
      const baseline = formattedMatch[4] ? parseFloat(formattedMatch[4]) : null;
      const delta = formattedMatch[5] ? parseFloat(formattedMatch[5]) : null;

      return {
        value: !isNaN(numVal) ? numVal : formattedMatch[2],
        unit,
        label: customLabel || domain.display_name.split(' ')[0] + ' Metric',
        metric_key: undefined,
        delta_from_baseline_pct: delta,
        baseline_mean: baseline,
      };
    }

    // Fallback: simple numeric string or token
    return {
      value: text,
      unit: '',
      label: 'Headline Metric',
      metric_key: undefined,
      delta_from_baseline_pct: null,
      baseline_mean: null,
    };
  }

  return null;
}

export const DomainCard: React.FC<DomainCardProps> = ({ domain, onSelect }) => {
  const isInsufficient = domain.status === 'INSUFFICIENT_DATA';
  const isAttention = domain.status === 'ATTENTION';
  const isCritical = domain.status === 'CRITICAL';

  let borderColor = '#1F2937';
  let borderStyle = 'solid';
  if (isInsufficient) {
    borderColor = '#475569';
    borderStyle = 'dashed';
  } else if (isCritical) {
    borderColor = '#DC2626';
  } else if (isAttention) {
    borderColor = '#D97706';
  }

  const parsed = parseHeadlineMetric(domain);

  return (
    <div
      data-testid={`domain-card-${domain.domain_id}`}
      onClick={() => onSelect(domain.domain_id)}
      style={{
        backgroundColor: '#111827',
        border: `1px ${borderStyle} ${borderColor}`,
        borderRadius: '6px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
        position: 'relative',
        minHeight: '230px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#162032';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#111827';
        e.currentTarget.style.transform = 'translateY(0px)';
      }}
    >
      <div>
        {/* Header: Icon, Name & Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                backgroundColor: '#1E293B',
                padding: '6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getDomainIcon(domain.domain_id, 16)}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>{domain.display_name}</div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748B',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                }}
              >
                {domain.domain_id}
              </div>
            </div>
          </div>
          <StatusBadge status={domain.status} size="sm" />
        </div>

        {/* Headline Telemetry OR Insufficient Data Explanation */}
        {parsed === null ? (
          <div
            data-testid="insufficient-data-notice"
            style={{
              backgroundColor: '#0D1320',
              border: '1px dashed #475569',
              borderRadius: '4px',
              padding: '10px 12px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#94A3B8',
                fontSize: '11px',
                fontWeight: 600,
                marginBottom: '4px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <AlertCircle size={13} color="#94A3B8" />
              SURVEILLANCE GAP DETECTED
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#CBD5E1',
                lineHeight: '1.4',
                fontStyle: 'italic',
              }}
            >
              {domain.status_reason || 'Periodic biomarker assay overdue. Telemetry inputs insufficient for confidence scoring.'}
            </div>
          </div>
        ) : (
          <div
            data-testid="headline-telemetry-box"
            style={{
              backgroundColor: '#0D1320',
              border: `1px solid ${isCritical ? '#7F1D1D' : isAttention ? '#78350F' : '#1E293B'}`,
              borderRadius: '4px',
              padding: '10px 12px',
              marginBottom: '12px',
            }}
          >
            {/* Label & Optional Metric Key */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span
                data-testid="headline-label"
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {parsed.label}
              </span>
              {parsed.quality ? (
                <QualityBadge quality={parsed.quality as any} />
              ) : parsed.metric_key ? (
                <span
                  data-testid="headline-metric-key"
                  style={{
                    fontSize: '9px',
                    color: '#64748B',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {parsed.metric_key}
                </span>
              ) : null}
            </div>

            {/* Main Tabular Monospace Value & Unit */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                data-testid="headline-value"
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: isCritical ? '#F87171' : isAttention ? '#FCD34D' : '#F8FAFC',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {parsed.value}
              </span>
              {parsed.unit && (
                <span
                  data-testid="headline-unit"
                  style={{
                    fontSize: '12px',
                    color: '#94A3B8',
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {parsed.unit}
                </span>
              )}
              {parsed.delta_from_baseline_pct !== null && parsed.delta_from_baseline_pct !== undefined && (
                <span
                  data-testid="headline-delta"
                  style={{
                    fontSize: '11px',
                    color: parsed.delta_from_baseline_pct > 0 ? (isAttention ? '#F59E0B' : '#34D399') : '#94A3B8',
                    fontFamily: "'JetBrains Mono', monospace",
                    marginLeft: 'auto',
                    fontWeight: 600,
                  }}
                >
                  {parsed.delta_from_baseline_pct > 0 ? '+' : ''}
                  {parsed.delta_from_baseline_pct}% vs baseline
                </span>
              )}
            </div>

            {/* Baseline Reference When Available */}
            {parsed.baseline_mean !== null && parsed.baseline_mean !== undefined && (
              <div
                data-testid="headline-baseline"
                style={{
                  fontSize: '10px',
                  color: '#64748B',
                  marginTop: '4px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Baseline: {parsed.baseline_mean} {parsed.unit}
              </div>
            )}
          </div>
        )}

        {/* Measurement Scope Notice (Guardrail Boundary Callout) */}
        <div
          style={{
            fontSize: '10px',
            color: '#94A3B8',
            lineHeight: '1.35',
            backgroundColor: '#0F172A',
            borderLeft: '2px solid #38BDF8',
            padding: '5px 8px',
            borderRadius: '2px',
            marginBottom: '10px',
          }}
        >
          <span style={{ color: '#38BDF8', fontWeight: 700 }}>SCOPE NOTICE: </span>
          {domain.measurement_scope_notice}
        </div>
      </div>

      {/* Footer: Completeness & Details Link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #1E293B',
          paddingTop: '8px',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={11} color="#64748B" />
          <span style={{ fontSize: '10px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
            Completeness: {domain.completeness_pct}%
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#38BDF8',
          }}
        >
          <span>Detail</span>
          <ChevronRight size={13} />
        </div>
      </div>
    </div>
  );
};
