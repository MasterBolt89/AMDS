import React, { useState } from 'react';
import { Finding, DomainId } from '../types/api';
import { StatusBadge, EvidenceBadge } from './StatusBadge';
import { GitMerge, BookOpen } from 'lucide-react';

interface FindingsPanelProps {
  findings: Finding[];
  onSelectDomain?: (domainId: DomainId) => void;
}

export const FindingsPanel: React.FC<FindingsPanelProps> = ({ findings, onSelectDomain }) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const safeIdx = Math.min(activeIdx, Math.max(0, findings.length - 1));
  const f = findings[safeIdx];

  const evidenceType =
    f?.evidence?.evidence_type || (f as any)?.evidence_type || 'STATISTICAL_BASELINE_DRIFT';
  const refSource = f?.evidence?.reference_source || 'NASA Human Research Program (HRP)';
  const severity = ((f?.severity || 'ATTENTION').toUpperCase() as any);

  const isCritical = severity === 'CRITICAL';
  const isAttention = severity === 'ATTENTION';
  const borderAccent = isCritical ? '#EF4444' : isAttention ? '#FBBF24' : '#34D399';

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0C101A',
        border: '1px solid #1E293B',
        borderRadius: '2px',
        padding: '12px 14px',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '8px',
          marginBottom: '10px',
          flexShrink: 0,
          gap: '8px',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <GitMerge size={15} color="#38BDF8" style={{ flexShrink: 0 }} />
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
            title={`CROSS-DOMAIN FINDINGS & ACTION QUEUE (${findings.length})`}
          >
            CROSS-DOMAIN FINDINGS & ACTION QUEUE ({findings.length})
          </h2>
        </div>

        {/* Compact Selector Tabs [1] [2] [3] [4] */}
        {findings.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {findings.map((item, i) => {
              const isSelected = safeIdx === i;
              const sev = (item.severity || 'ATTENTION').toUpperCase();
              const dotColor = sev === 'CRITICAL' ? '#EF4444' : sev === 'ATTENTION' ? '#FBBF24' : '#34D399';
              return (
                <button
                  key={i}
                  onClick={() => {
                    setActiveIdx(i);
                    if (onSelectDomain && item.involved_domains?.[0]) {
                      onSelectDomain(item.involved_domains[0]);
                    }
                  }}
                  style={{
                    backgroundColor: isSelected ? '#1E293B' : '#07090F',
                    border: `1px solid ${isSelected ? '#38BDF8' : '#334155'}`,
                    color: isSelected ? '#38BDF8' : '#94A3B8',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span style={{ color: dotColor, fontSize: '9px' }}>●</span>
                  <span>[{i + 1}]</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {findings.length === 0 || !f ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          No active cross-domain prognostic alerts. All telemetry cross-correlations nominal.
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            backgroundColor: '#07090F',
            border: '1px solid #1E293B',
            borderLeft: `3px solid ${borderAccent}`,
            borderRadius: '2px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Finding Title & Status/Evidence Badges (Clean Human-Readable Title) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
              {f.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <EvidenceBadge type={evidenceType} />
              <StatusBadge status={severity} size="sm" />
            </div>
          </div>

          {/* What Changed */}
          <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.45' }}>
            <span style={{ color: '#94A3B8', fontWeight: 700 }}>WHAT CHANGED: </span>
            {f.what_changed || f.summary}
          </div>

          {/* Why It Matters */}
          <div
            style={{
              fontSize: '12px',
              color: '#CBD5E1',
              lineHeight: '1.45',
              backgroundColor: '#0C101A',
              padding: '8px 12px',
              borderLeft: `2px solid ${borderAccent}`,
              borderRadius: '2px',
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
              gap: '6px',
              fontSize: '11px',
              color: '#64748B',
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: 'auto',
            }}
          >
            <BookOpen size={12} color="#64748B" />
            <span>REF: {refSource}</span>
          </div>
        </div>
      )}
    </div>
  );
};
