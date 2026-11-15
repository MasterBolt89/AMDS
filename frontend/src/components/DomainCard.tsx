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

  const isMetricObject = typeof domain.headline_metric === 'object' && domain.headline_metric !== null;
  const isMetricString = typeof domain.headline_metric === 'string' && domain.headline_metric.trim().length > 0;

  return (
    <div
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

        {/* Headline Metric OR Insufficient Data Explanation */}
        <div
          style={{
            backgroundColor: '#0D1320',
            border: `1px ${borderStyle} ${isInsufficient ? '#334155' : '#1E293B'}`,
            borderRadius: '4px',
            padding: '10px 12px',
            marginBottom: '12px',
          }}
        >
          {isInsufficient ? (
            <div>
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
                {domain.status_reason || 'Biological assay cartridge overdue. Telemetry inputs insufficient for confidence scoring.'}
              </div>
            </div>
          ) : isMetricString ? (
            <div>
              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                Headline Telemetry
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: isAttention ? '#FCD34D' : '#F8FAFC',
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: '1.3',
                }}
              >
                {domain.headline_metric as string}
              </div>
            </div>
          ) : isMetricObject ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{(domain.headline_metric as any).name || 'Metric'}</span>
                {(domain.headline_metric as any).quality && (
                  <QualityBadge quality={(domain.headline_metric as any).quality} />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {(domain.headline_metric as any).value !== null ? (domain.headline_metric as any).value : '—'}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                  {(domain.headline_metric as any).unit}
                </span>
                {(domain.headline_metric as any).delta_from_baseline_pct !== undefined && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: isAttention ? '#F59E0B' : '#34D399',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginLeft: 'auto',
                      fontWeight: 600,
                    }}
                  >
                    {(domain.headline_metric as any).delta_from_baseline_pct > 0 ? `+` : ''}
                    {(domain.headline_metric as any).delta_from_baseline_pct}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              {domain.status_reason || 'No headline metric reported'}
            </div>
          )}
        </div>

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
