import React from 'react';
import { Finding, DomainId } from '../types/api';
import { StatusBadge, EvidenceBadge } from './StatusBadge';
import { GitMerge, BookOpen, AlertTriangle } from 'lucide-react';

interface FindingsPanelProps {
  findings: Finding[];
  onSelectDomain?: (domainId: DomainId) => void;
}

export const FindingsPanel: React.FC<FindingsPanelProps> = ({ findings, onSelectDomain }) => {
  return (
    <div
      style={{
        backgroundColor: '#0C101A',
        border: '1px solid #1E293B',
        borderRadius: '2px',
        padding: '10px 12px',
        marginBottom: 0,
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '6px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GitMerge size={14} color="#38BDF8" />
          <h2
            style={{
              fontSize: '11px',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            CROSS-DOMAIN FINDINGS & ACTION QUEUE ({findings.length})
          </h2>
        </div>
        <div
          style={{
            fontSize: '8.5px',
            color: '#64748B',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
          }}
        >
          MULTI-MODAL SYNTHESIS
        </div>
      </div>

      {findings.length === 0 ? (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '10.5px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          No active cross-domain prognostic alerts. All telemetry cross-correlations nominal.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {findings.map((f) => {
            const fId = f.finding_id || (f as any).id;
            const evidenceType =
              f.evidence?.evidence_type || (f as any).evidence_type || 'STATISTICAL_BASELINE_DRIFT';
            const refSource = f.evidence?.reference_source || 'NASA Human Research Program (HRP)';
            const severity = (f.severity || 'ATTENTION').toUpperCase() as any;

            const isCritical = severity === 'CRITICAL';
            const isAttention = severity === 'ATTENTION';
            const borderAccent = isCritical ? '#EF4444' : isAttention ? '#FBBF24' : '#34D399';

            return (
              <div
                key={fId}
                style={{
                  backgroundColor: '#07090F',
                  border: '1px solid #1E293B',
                  borderLeft: `3px solid ${borderAccent}`,
                  borderRadius: '2px',
                  padding: '8px 10px',
                }}
              >
                {/* Finding ID, Title & Pills */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '4px',
                    marginBottom: '5px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9.5px',
                        color: '#38BDF8',
                        fontWeight: 700,
                        backgroundColor: '#0C101A',
                        padding: '1px 5px',
                        border: '1px solid #1E293B',
                        borderRadius: '2px',
                      }}
                    >
                      {fId}
                    </span>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#F8FAFC' }}>
                      {f.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <EvidenceBadge type={evidenceType} />
                    <StatusBadge status={severity} size="sm" />
                  </div>
                </div>

                {/* What Changed */}
                <div style={{ fontSize: '10.5px', color: '#CBD5E1', lineHeight: '1.35', marginBottom: '4px' }}>
                  <span style={{ color: '#94A3B8', fontWeight: 700 }}>WHAT CHANGED: </span>
                  {f.what_changed || f.summary}
                </div>

                {/* Why It Matters */}
                <div
                  style={{
                    fontSize: '10px',
                    color: '#94A3B8',
                    lineHeight: '1.35',
                    backgroundColor: '#0C101A',
                    padding: '5px 7px',
                    borderLeft: `2px solid ${borderAccent}`,
                    borderRadius: '2px',
                    marginBottom: '5px',
                  }}
                >
                  <span style={{ color: '#F8FAFC', fontWeight: 700 }}>WHY IT MATTERS: </span>
                  {f.why_it_matters}
                </div>

                {/* Reference Citation */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '8.5px',
                    color: '#64748B',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <BookOpen size={9} color="#64748B" />
                  <span>REF: {refSource}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
