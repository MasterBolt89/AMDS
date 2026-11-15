import React from 'react';
import { DomainSummary, DomainId, DataQuality } from '../types/api';
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
  AlertCircle,
  Info,
} from 'lucide-react';

interface DomainCardProps {
  domain: DomainSummary;
  isSelected?: boolean;
  onSelect: (domainId: DomainId) => void;
}

export const getDomainIcon = (domainId: DomainId, size: number = 13) => {
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

export const DOMAIN_SHORT_NAMES: Record<string, string> = {
  cardiovascular: 'CARDIOVASCULAR',
  sleep_circadian: 'SLEEP & CIRCADIAN',
  behavioral_psych: 'BEHAVIORAL PSYCH',
  musculoskeletal: 'MUSCULOSKELETAL',
  immune_microbio: 'IMMUNE MICROBIO',
  radiation: 'RADIATION',
  sensorimotor_neuro: 'SENSORIMOTOR',
  nutrition: 'NUTRITION',
  environment_eclss: 'ECLSS ATMOSPHERE',
};

export interface ParsedHeadlineMetric {
  value: number | string;
  unit: string;
  label: string;
  metric_key?: string;
  delta_from_baseline_pct: number | null;
  baseline_mean: number | null;
  quality?: DataQuality | string;
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

    if (METRIC_DICTIONARY[text]) {
      const meta = METRIC_DICTIONARY[text];
      let value: number | string = meta.nominalValue;
      let baseline: number | null = meta.nominalBaseline;
      let delta: number | null = null;

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

export const DomainCard: React.FC<DomainCardProps> = ({ domain, isSelected = false, onSelect }) => {
  const isInsufficient = domain.status === 'INSUFFICIENT_DATA';
  const isAttention = domain.status === 'ATTENTION';
  const isCritical = domain.status === 'CRITICAL';

  // Distinct 3px top accent bars:
  // Bio-Mint (#34D399): cardiovascular, sleep_circadian, musculoskeletal, immune_microbio, nutrition
  // Sky Cobalt (#38BDF8): behavioral_psych, radiation, sensorimotor_neuro
  // Warm Amber (#FBBF24): Overrides top bar whenever status === "ATTENTION"
  // Alert Red (#EF4444): status === "CRITICAL"
  // Cool Slate (#64748B): status === "INSUFFICIENT_DATA"
  const isSkyCobaltDomain =
    domain.domain_id === 'behavioral_psych' ||
    domain.domain_id === 'radiation' ||
    domain.domain_id === 'sensorimotor_neuro';

  let accentBarColor = isSkyCobaltDomain ? '#38BDF8' : '#34D399';
  if (isCritical) {
    accentBarColor = '#EF4444';
  } else if (isAttention) {
    accentBarColor = '#FBBF24';
  } else if (isInsufficient) {
    accentBarColor = '#64748B';
  }

  const shortName = DOMAIN_SHORT_NAMES[domain.domain_id] || domain.display_name;
  const parsed = parseHeadlineMetric(domain);

  return (
    <div
      data-testid={`domain-card-${domain.domain_id}`}
      onClick={() => onSelect(domain.domain_id)}
      style={{
        backgroundColor: isSelected ? '#111827' : '#0C101A',
        borderRadius: '0px',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'background-color 0.12s ease',
        position: 'relative',
        minHeight: '100px',
        outline: isSelected ? `1px solid ${accentBarColor}` : 'none',
        zIndex: isSelected ? 2 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#121826';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#0C101A';
      }}
    >
      {/* 3px Top Accent Bar */}
      <div
        style={{
          height: '3px',
          width: '100%',
          backgroundColor: accentBarColor,
        }}
      />

      <div style={{ padding: '7px 9px 4px 9px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header Row: Locked Left Title + Tooltip, Locked Right Status Dot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            marginBottom: '3px',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: isSelected ? '#38BDF8' : '#F1F5F9',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={domain.display_name}
            >
              {shortName}
            </span>
            <div className="tooltip-container" onClick={(e) => e.stopPropagation()}>
              <Info size={11} color="#64748B" style={{ cursor: 'help', flexShrink: 0 }} />
              <div className="tooltip-content">
                <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '2px' }}>
                  {domain.display_name} Scope Notice
                </div>
                {domain.measurement_scope_notice}
              </div>
            </div>
          </div>

          {/* Locked Status Badge on the right (whitespace-nowrap) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '9px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              color: isCritical
                ? '#EF4444'
                : isAttention
                ? '#FBBF24'
                : isInsufficient
                ? '#94A3B8'
                : '#34D399',
            }}
          >
            <span>{isInsufficient ? '◌' : '●'}</span>
            <span>
              {isCritical
                ? 'CRITICAL'
                : isAttention
                ? 'ATTENTION'
                : isInsufficient
                ? 'INSUFFICIENT'
                : 'NOMINAL'}
            </span>
          </div>
        </div>

        {/* Center: Large 3XL Tabular Monospace Reading OR Insufficient Data Gap */}
        {parsed === null ? (
          <div
            data-testid="insufficient-data-notice"
            style={{
              backgroundColor: '#07090F',
              border: '1px dashed #475569',
              borderRadius: '0px',
              padding: '4px 6px',
              margin: 'auto 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#94A3B8',
                fontSize: '9.5px',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: '1px',
              }}
            >
              <AlertCircle size={10} color="#94A3B8" />
              SURVEILLANCE GAP DETECTED
            </div>
            <div
              style={{
                fontSize: '9px',
                color: '#CBD5E1',
                lineHeight: '1.25',
                fontStyle: 'italic',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={domain.status_reason || 'Biomarker assay overdue.'}
            >
              {domain.status_reason || 'Biomarker assay overdue.'}
            </div>
          </div>
        ) : (
          <div
            data-testid="headline-telemetry-box"
            style={{
              margin: 'auto 0',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            {/* Primary Tabular Reading & Unit (Large text-3xl font-semibold tabular-nums) */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span
                data-testid="headline-value"
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: isCritical ? '#EF4444' : isAttention ? '#FBBF24' : '#F8FAFC',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: '1.1',
                }}
              >
                {parsed.value}
              </span>
              {parsed.unit && (
                <span
                  data-testid="headline-unit"
                  style={{
                    fontSize: '11px',
                    color: '#94A3B8',
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {parsed.unit}
                </span>
              )}
            </div>

            {/* Single Clean Line Secondary Metadata: RESTING HR · +0% vs baseline · Baseline: 60 bpm */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '9.5px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#64748B',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span
                data-testid="headline-label"
                style={{
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                }}
              >
                {parsed.label}
              </span>
              {parsed.delta_from_baseline_pct !== null && (
                <>
                  <span>·</span>
                  <span
                    data-testid="headline-delta"
                    style={{
                      color: isAttention ? '#FBBF24' : '#34D399',
                      fontWeight: 700,
                    }}
                  >
                    {parsed.delta_from_baseline_pct > 0 ? '+' : ''}
                    {parsed.delta_from_baseline_pct}% vs baseline
                  </span>
                </>
              )}
              {parsed.baseline_mean !== null && (
                <>
                  <span>·</span>
                  <span data-testid="headline-baseline" style={{ color: '#64748B' }}>
                    Baseline: {parsed.baseline_mean} {parsed.unit}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1-Line Compact Completeness Footer */}
      <div
        data-testid="domain-completeness"
        style={{
          borderTop: '1px solid #1E293B',
          padding: '3px 9px',
          backgroundColor: '#080B12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: '#64748B',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span>{isInsufficient ? 'CADENCE OVERDUE' : `${domain.completeness_pct}% COMPLETE`}</span>
        <span style={{ color: isSelected ? '#38BDF8' : '#475569', fontWeight: 600 }}>
          {isSelected ? '● STREAMING' : 'VIEW →'}
        </span>
      </div>
    </div>
  );
};
