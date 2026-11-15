import React from 'react';
import { CrossDomainFinding, DomainId } from '../types/api';
import { StatusBadge, EvidenceBadge } from './StatusBadge';
import { GitMerge, BookOpen, ExternalLink } from 'lucide-react';
import { getDomainIcon } from './DomainCard';

interface FindingsPanelProps {
  findings: CrossDomainFinding[];
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
          {findings.map((f) => (
            <div
              key={f.id}
              style={{
                backgroundColor: '#0D1320',
                border: '1px solid #1F2937',
                borderLeft: f.severity === 'ATTENTION' ? '3px solid #F59E0B' : f.severity === 'CRITICAL' ? '3px solid #EF4444' : '3px solid #10B981',
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
                    {f.id}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    {f.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EvidenceBadge type={f.evidence_type} />
                  <StatusBadge status={f.severity} size="sm" />
                </div>
              </div>

              {/* Summary description */}
              <p
                style={{
                  fontSize: '13px',
                  color: '#CBD5E1',
                  lineHeight: '1.5',
                  margin: '0 0 12px 0',
                }}
              >
                {f.summary}
              </p>

              {/* Contributing Domains */}
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
                {f.contributing_domains.map((domId) => (
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

              {/* NASA HRP Citations */}
              {f.citations && f.citations.length > 0 && (
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
                      marginBottom: '6px',
                    }}
                  >
                    <BookOpen size={12} />
                    <span>NASA HUMAN RESEARCH PROGRAM (HRP) CLINICAL EVIDENCE:</span>
                  </div>
                  {f.citations.map((cite, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '11px',
                        color: '#94A3B8',
                        lineHeight: '1.4',
                        marginBottom: idx === f.citations.length - 1 ? 0 : '4px',
                      }}
                    >
                      • <strong style={{ color: '#E2E8F0' }}>{cite.title}</strong> — <em>{cite.source}</em>
                      {cite.url && (
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: '#38BDF8',
                            marginLeft: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={10} style={{ marginLeft: '2px' }} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
