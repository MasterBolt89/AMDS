import React from 'react';
import { DomainSummary, DomainId, DataQuality, Finding, DomainDetailResponse } from '../types/api';
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
  findings?: Finding[];
  detail?: DomainDetailResponse | null;
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
  cardiovascular: 'CARDIO',
  sleep_circadian: 'SLEEP & CIRC',
  behavioral_psych: 'BEHAVIOR',
  musculoskeletal: 'MUSCULO',
  immune_microbio: 'IMMUNE',
  radiation: 'RADIATION',
  sensorimotor_neuro: 'SENSOR',
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
    nominalValue: 62.0,
    nominalBaseline: 62.0,
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
    nominalValue: 15.0,
    nominalBaseline: 15.0,
  },
  exercise_adherence_pct: {
    label: 'Exercise Adherence',
    unit: '%',
    nominalValue: 95.0,
    nominalBaseline: 95.0,
  },
  crp_biomarker_mg_l: {
    label: 'C-Reactive Protein (CRP)',
    unit: 'mg/L',
    nominalValue: 0.82,
    nominalBaseline: 0.82,
  },
  daily_dose_msv: {
    label: 'Daily Radiation Dose',
    unit: 'mSv',
    nominalValue: 0.42,
    nominalBaseline: 0.42,
  },
  co2_partial_pressure_mmhg: {
    label: 'Cabin ppCO₂',
    unit: 'mmHg',
    nominalValue: 2.2,
    nominalBaseline: 2.2,
  },
  postural_instability_score: {
    label: 'Postural Sway Instability',
    unit: 'score',
    nominalValue: 1.5,
    nominalBaseline: 1.5,
  },
  caloric_intake_kcal: {
    label: 'Caloric Intake',
    unit: 'kcal',
    nominalValue: 2800.0,
    nominalBaseline: 2800.0,
  },
};

export function parseHeadlineMetric(
  domain: DomainSummary,
  findings?: Finding[],
  detail?: DomainDetailResponse | null
): ParsedHeadlineMetric | null {
  if (
    domain.status === 'INSUFFICIENT_DATA' ||
    domain.headline_metric === null ||
    domain.headline_metric === undefined
  ) {
    return null;
  }

  let parsed: ParsedHeadlineMetric | null = null;

  // 1. If it's an object
  if (typeof domain.headline_metric === 'object') {
    const raw = domain.headline_metric as any;
    const metricKey =
      raw.metric_key || (typeof raw.name === 'string' && raw.name.includes('_') ? raw.name : undefined);
    const meta = metricKey ? METRIC_DICTIONARY[metricKey] : undefined;

    let unit = raw.unit || meta?.unit || '';
    if (unit === '/') unit = '/100';
    if (unit === 'score_1_10') unit = 'score';

    parsed = {
      value: raw.value !== null && raw.value !== undefined ? raw.value : '—',
      unit,
      label: raw.label || raw.name || meta?.label || 'Headline Metric',
      metric_key: metricKey,
      delta_from_baseline_pct:
        raw.delta_from_baseline_pct !== undefined ? raw.delta_from_baseline_pct : null,
      baseline_mean: raw.baseline_mean !== undefined ? raw.baseline_mean : null,
      quality: raw.quality,
    };
  } else if (typeof domain.headline_metric === 'string') {
    // 2. If it's a string
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

      // Check for delta: X.XX in status_reason (e.g. delta: 11.93 bpm or delta: 2.76 hours)
      const deltaMatch = reason.match(/delta:\s*([+-]?[0-9.]+)/i);
      if (deltaMatch && currentMatch === null) {
        const deltaVal = parseFloat(deltaMatch[1]);
        if (reason.toLowerCase().includes('above')) {
          value = Math.round((baseline + deltaVal) * 100) / 100;
        } else if (reason.toLowerCase().includes('below')) {
          value = Math.round(Math.max(0, baseline - deltaVal) * 100) / 100;
        }
      }

      if (typeof value === 'number' && baseline && baseline > 0) {
        delta = Math.round(((value - baseline) / baseline) * 1000) / 10;
      }

      parsed = {
        value,
        unit: meta.unit,
        label: meta.label,
        metric_key: text,
        delta_from_baseline_pct: delta,
        baseline_mean: baseline,
      };
    } else {
      const formattedMatch = text.match(
        /^(?:([A-Za-z\s]+):\s*)?([0-9.]+)\s*([a-zA-Z0-9_/%]+)?(?:\s*\(Baseline:\s*([0-9.]+)[^,]*,\s*([+-]?[0-9.]+)%[^)]*\))?/i
      );

      if (formattedMatch) {
        const customLabel = formattedMatch[1]?.trim();
        const numVal = parseFloat(formattedMatch[2]);
        let unit = formattedMatch[3]?.trim() || '';
        if (unit === '/') unit = '/100';
        if (unit === 'score_1_10') unit = 'score';
        const baseline = formattedMatch[4] ? parseFloat(formattedMatch[4]) : null;
        const delta = formattedMatch[5] ? parseFloat(formattedMatch[5]) : null;

        parsed = {
          value: !isNaN(numVal) ? numVal : formattedMatch[2],
          unit,
          label: customLabel || domain.display_name.split(' ')[0] + ' Metric',
          metric_key: undefined,
          delta_from_baseline_pct: delta,
          baseline_mean: baseline,
        };
      } else {
        parsed = {
          value: text,
          unit: '',
          label: 'Headline Metric',
          metric_key: undefined,
          delta_from_baseline_pct: null,
          baseline_mean: null,
        };
      }
    }
  }

  if (!parsed) return null;

  if (parsed.unit === '/') parsed.unit = '/100';
  if (parsed.unit === 'score_1_10') parsed.unit = 'score';
  if (domain.domain_id === 'behavioral_psych' && (parsed.unit === '' || parsed.unit === '/')) {
    parsed.unit = '/100';
  }
  if (domain.domain_id === 'sensorimotor_neuro' && (parsed.unit === '' || parsed.unit === 'score_1_10')) {
    parsed.unit = 'score';
  }

  // Sync active observation drift from findings if present and domain is ATTENTION or delta is 0
  if (findings && findings.length > 0) {
    const finding = findings.find((f) => {
      const idMatch = f.finding_id?.toLowerCase().includes(domain.domain_id);
      const invMatch = f.involved_domains?.includes(domain.domain_id);
      const suppMatch = f.evidence?.supporting_metrics?.[domain.domain_id] !== undefined;
      return idMatch || invMatch || suppMatch;
    });

    if (finding) {
      // 1. Check supporting_metrics
      const sm = finding.evidence?.supporting_metrics?.[domain.domain_id];
      if (sm && typeof sm.current_value === 'number') {
        parsed.value = sm.current_value;
      }
      // 2. Check what_changed text
      if (finding.what_changed) {
        const cMatch = finding.what_changed.match(/current:\s*([0-9.]+)/i);
        const bMatch = finding.what_changed.match(/baseline(?:\s*mean)?:\s*([0-9.]+)/i);
        if (cMatch) parsed.value = parseFloat(cMatch[1]);
        if (bMatch) parsed.baseline_mean = parseFloat(bMatch[1]);
      }
      if (typeof parsed.value === 'number' && parsed.baseline_mean && parsed.baseline_mean > 0) {
        parsed.delta_from_baseline_pct =
          Math.round(((parsed.value - parsed.baseline_mean) / parsed.baseline_mean) * 1000) / 10;
      }
    }
  }

  // Also sync from active domain detail if matching domain
  if (detail && detail.domain_id === domain.domain_id && detail.metrics?.[0]) {
    const m = detail.metrics[0];
    const validPts = (m.series || []).filter((p) => p.quality === 'VALID' && p.value !== null);
    if (validPts.length > 0) {
      const latest = validPts[validPts.length - 1];
      if (latest.value !== null) {
        parsed.value = latest.value;
      }
    }
    if (m.baseline?.mean) {
      parsed.baseline_mean = m.baseline.mean;
    }
    if (typeof parsed.value === 'number' && parsed.baseline_mean && parsed.baseline_mean > 0) {
      parsed.delta_from_baseline_pct =
        Math.round(((parsed.value - parsed.baseline_mean) / parsed.baseline_mean) * 1000) / 10;
    }
  }

  return parsed;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  isSelected = false,
  onSelect,
  findings,
  detail,
}) => {
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
  const parsed = parseHeadlineMetric(domain, findings, detail);

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
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
        minHeight: '88px',
        outline: isSelected ? '2px solid #38BDF8' : '1px solid #1E293B',
        boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
        zIndex: isSelected ? 2 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#151D2C';
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

      <div
        style={{
          padding: '5px 8px 6px 8px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        {/* Header Row: Locked Left Title + Tooltip, Locked Right Status Dot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
            marginBottom: '2px',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0, overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: isSelected ? '#38BDF8' : '#F1F5F9',
                letterSpacing: '0.02em',
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

          {/* Locked Status Badge on the right */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10.5px',
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

        {/* Center: Large 28px Tabular Monospace Reading OR Insufficient Data Gap */}
        {parsed === null ? (
          <div
            data-testid="insufficient-data-notice"
            style={{
              backgroundColor: '#07090F',
              border: '1px dashed #475569',
              borderRadius: '2px',
              padding: '3px 6px',
              margin: 'auto 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#94A3B8',
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: '2px',
              }}
            >
              <AlertCircle size={11} color="#94A3B8" />
              SURVEILLANCE GAP DETECTED
            </div>
            <div
              style={{
                fontSize: '9.5px',
                color: '#CBD5E1',
                lineHeight: '1.25',
                fontStyle: 'italic',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
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
            {/* Primary Tabular Reading & Unit */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span
                data-testid="headline-value"
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: isCritical ? '#EF4444' : isAttention ? '#FBBF24' : '#F8FAFC',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: '1.05',
                }}
              >
                {parsed.value}
              </span>
              {parsed.unit && (
                <span
                  data-testid="headline-unit"
                  style={{
                    fontSize: '11.5px',
                    color: '#94A3B8',
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {parsed.unit}
                </span>
              )}
            </div>

            {/* Metric Label Line */}
            <div
              data-testid="headline-label"
              style={{
                color: '#94A3B8',
                fontSize: '10.5px',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.02em',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '1px',
              }}
              title={parsed.label}
            >
              {parsed.label}
            </div>

            {/* Delta & Baseline Info Line */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                columnGap: '6px',
                rowGap: '2px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#64748B',
                marginTop: '2px',
                lineHeight: '1.25',
              }}
            >
              {parsed.delta_from_baseline_pct !== null && (
                <span
                  data-testid="headline-delta"
                  style={{
                    color: isAttention ? '#FBBF24' : '#34D399',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {parsed.delta_from_baseline_pct >= 0 ? '+' : ''}
                  {parsed.delta_from_baseline_pct.toFixed(1)}% vs baseline
                </span>
              )}
              {parsed.baseline_mean !== null && (
                <>
                  <span style={{ color: '#475569' }}>·</span>
                  <span
                    data-testid="headline-baseline"
                    style={{ color: '#94A3B8', whiteSpace: 'nowrap' }}
                  >
                    Baseline: {parsed.baseline_mean} {parsed.unit}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
