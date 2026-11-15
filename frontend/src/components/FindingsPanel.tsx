import React from 'react';
import { Finding, DomainId } from '../types/api';
import { StatusBadge, EvidenceBadge } from './StatusBadge';
import { GitMerge, BookOpen } from 'lucide-react';
import { getDomainIcon } from './DomainCard';

interface FindingsPanelProps {
  findings: Finding[];
  onSelectDomain?: (domainId: DomainId) => void;
}

export const FindingsPanel: React.FC<FindingsPanelProps> = ({ findings, onSelectDomain }) => {
  return (
    <div className="aero-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          borderBottom: '1px solid #1F2937',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitMerge size={18} color="#38BDF8" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>
            CROSS-DOMAIN CLINICAL FINDINGS ({findings.length})
          </h2>
        </div>
        <div style={{ fontSize: '11px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
          MULTI-MODAL PROGNOSTIC SYNTHESIS
        </div>
      </div>

      {findings.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
          No active cross-domain prognostic alerts. All telemetry cross-correlations nominal.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {findings.map((f) => {
            const fId = f.finding_id || (f as any).id;
            const involved = f.involved_domains || (f as any).contributing_domains || [];
            const evidenceType = f.evidence?.evidence_type || (f as any).evidence_type || 'STATISTICAL_BASELINE_DRIFT';
            const refSource = f.evidence?.reference_source || 'NASA Clinical Flight Rules';
            const severity = (f.severity || 'ATTENTION').toUpperCase() as any;

            return (
              <div
                key={fId}
                style={{
                  backgroundColor: '#0D1320',
                  border: '1px solid #1F2937',
                  borderLeft:
                    severity === 'CRITICAL'
                      ? '3px solid #EF4444'
                      : severity === 'ATTENTION'
                      ? '3px solid #F59E0B'
                      : '3px solid #10B981',
                  borderRadius: '4px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        color: '#38BDF8',
                        fontWeight: 700,
                      }}
                    >
                      {fId}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                      {f.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <EvidenceBadge type={evidenceType} />
                    <StatusBadge status={severity} size="sm" />
                  </div>
                </div>

                {/* What Changed & Why It Matters */}
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5', margin: '0 0 6px 0' }}>
                    {f.what_changed || f.summary}
                  </p>
                  {f.why_it_matters && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#94A3B8',
                        fontStyle: 'italic',
                        backgroundColor: '#111827',
                        padding: '6px 10px',
                        borderRadius: '3px',
                        borderLeft: '2px solid #F59E0B',
                      }}
                    >
                      <strong style={{ color: '#FCD34D' }}>Clinical Consequence: </strong>
                      {f.why_it_matters}
                    </div>
                  )}
                </div>

                {/* Contributing Domains */}
                {involved.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                      Contributing Domains:
                    </span>
                    {involved.map((domId: DomainId) => (
                      <button
                        key={domId}
                        onClick={() => onSelectDomain?.(domId)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '3px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          color: '#E2E8F0',
                          cursor: 'pointer',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {getDomainIcon(domId, 12)}
                        <span>{domId}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* NASA Reference Source / Citations */}
                <div
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid #1F2937',
                    borderRadius: '4px',
                    padding: '8px 12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#38BDF8',
                      fontWeight: 600,
                    }}
                  >
                    <BookOpen size={12} />
                    <span>CLINICAL EVIDENCE STANDARD: {refSource}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
