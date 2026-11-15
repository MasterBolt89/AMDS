import React from 'react';
import { AssessmentStatus, DataQuality, Provenance, EvidenceType } from '../types/api';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, Database, ShieldAlert, Cpu } from 'lucide-react';

interface StatusBadgeProps {
  status: AssessmentStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  labelOverride?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  labelOverride,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'NORMAL':
        return {
          bg: '#064E3B',
          text: '#6EE7B7',
          border: '1px solid #059669',
          icon: <CheckCircle2 size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} color="#10B981" />,
          label: 'NOMINAL',
        };
      case 'ATTENTION':
        return {
          bg: '#451A03',
          text: '#FCD34D',
          border: '1px solid #D97706',
          icon: <AlertTriangle size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} color="#F59E0B" />,
          label: 'ATTENTION',
        };
      case 'CRITICAL':
        return {
          bg: '#450A0A',
          text: '#FCA5A5',
          border: '1px solid #DC2626',
          icon: <AlertOctagon size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} color="#EF4444" />,
          label: 'CRITICAL',
        };
      case 'INSUFFICIENT_DATA':
      default:
        return {
          bg: '#1E293B',
          text: '#94A3B8',
          border: '1px dashed #64748B',
          icon: <HelpCircle size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} color="#94A3B8" />,
          label: 'INSUFFICIENT DATA',
        };
    }
  };

  const config = getBadgeConfig();
  const padding = size === 'sm' ? '2px 6px' : size === 'lg' ? '6px 12px' : '4px 8px';
  const fontSize = size === 'sm' ? '10px' : size === 'lg' ? '13px' : '11px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        backgroundColor: config.bg,
        color: config.text,
        border: config.border,
        borderRadius: '3px',
        padding,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: 'nowrap',
      }}
    >
      {showIcon && config.icon}
      <span>{labelOverride || config.label}</span>
    </span>
  );
};

export const QualityBadge: React.FC<{ quality: DataQuality }> = ({ quality }) => {
  switch (quality) {
    case 'VALID':
      return (
        <span
          style={{
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            color: '#34D399',
            backgroundColor: '#064E3B',
            border: '1px solid #059669',
            padding: '1px 5px',
            borderRadius: '2px',
          }}
        >
          VALID
        </span>
      );
    case 'SUSPECT':
      return (
        <span
          style={{
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            color: '#FBBF24',
            backgroundColor: '#78350F',
            border: '1px solid #D97706',
            padding: '1px 5px',
            borderRadius: '2px',
          }}
        >
          SUSPECT ARTIFACT
        </span>
      );
    case 'MISSING':
      return (
        <span
          style={{
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            color: '#CBD5E1',
            backgroundColor: '#1E293B',
            border: '1px dashed #64748B',
            padding: '1px 5px',
            borderRadius: '2px',
          }}
        >
          MISSING GAP
        </span>
      );
  }
};

export const ProvenanceBadge: React.FC<{ provenance: Provenance }> = ({ provenance }) => {
  const isSimulated = provenance === 'SIMULATED';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace",
        color: isSimulated ? '#F472B6' : '#38BDF8',
        backgroundColor: isSimulated ? '#500724' : '#082F49',
        border: `1px solid ${isSimulated ? '#DB2777' : '#0284C7'}`,
        padding: '3px 8px',
        borderRadius: '3px',
      }}
    >
      {isSimulated ? <Cpu size={12} /> : <Database size={12} />}
      PROVENANCE: {provenance}
    </span>
  );
};

export const EvidenceBadge: React.FC<{ type: EvidenceType }> = ({ type }) => {
  const isDrift = type === 'STATISTICAL_BASELINE_DRIFT';
  return (
    <span
      style={{
        fontSize: '10px',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        color: isDrift ? '#FCD34D' : '#93C5FD',
        backgroundColor: isDrift ? '#451A03' : '#172554',
        border: `1px solid ${isDrift ? '#B45309' : '#1D4ED8'}`,
        padding: '2px 6px',
        borderRadius: '3px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <ShieldAlert size={11} />
      EVIDENCE: {type.replace(/_/g, ' ')}
    </span>
  );
};
