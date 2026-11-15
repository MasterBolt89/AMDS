import React, { useState } from 'react';
import { RecommendationItem } from '../types/api';
import {
  ShieldAlert,
  Radio,
  CheckCircle2,
  AlertOctagon,
  Clock,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';

interface RecommendationsPanelProps {
  recommendations: RecommendationItem[];
  astronautId: string;
  onAcknowledge: (recId: string, actionTakenNote: string) => Promise<void>;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  onAcknowledge,
}) => {
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleOpenModal = (rec: RecommendationItem) => {
    const rId = rec.recommendation_id || (rec as any).id;
    setSelectedRecId(rId);
    setActionNote(
      rec.reassessment?.action_taken_note ||
        'Countermeasure initiated: Bedtime shifted 30min earlier, pre-sleep blue-depleted lighting protocol engaged, cycle ergometer rescheduled.'
    );
  };

  const handleConfirmAcknowledge = async () => {
    if (!selectedRecId || !actionNote.trim()) return;
    setSubmitting(true);
    try {
      await onAcknowledge(selectedRecId, actionNote.trim());
      setSelectedRecId(null);
      setActionNote('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0C101A',
        border: '1px solid #1E293B',
        borderRadius: '2px',
        padding: '14px 16px',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '10px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={15} color="#FBBF24" />
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            RECOMMENDED PROTOCOL & ESCALATION TRIGGER ({recommendations.length})
          </h2>
        </div>
        <div
          style={{
            fontSize: '9px',
            color: '#64748B',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
          }}
        >
          CLOSED-LOOP CONTROL
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          No active clinical protocols pending. All surveillance values within nominal limits.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendations.map((rec) => {
            const rId = rec.recommendation_id || (rec as any).id;
            const isAcknowledged =
              rec.reassessment?.status === 'ACKNOWLEDGED' ||
              rec.reassessment?.status === 'RESOLVED';
            const isImproved = rec.reassessment?.outcome === 'IMPROVED';

            return (
              <div
                key={rId}
                style={{
                  backgroundColor: '#07090F',
                  border: isImproved ? '1px solid #059669' : '1px solid #1E293B',
                  borderRadius: '2px',
                  padding: '12px 14px',
                }}
              >
                {/* Header: ID, Title & Outcome Badge */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        color: '#FBBF24',
                        fontWeight: 700,
                        backgroundColor: '#451A03',
                        padding: '1px 6px',
                        border: '1px solid #78350F',
                        borderRadius: '2px',
                      }}
                    >
                      {rId}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                      {rec.title || `Intervention for Finding ${rec.finding_id}`}
                    </span>
                  </div>

                  {isImproved && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '2px',
                        backgroundColor: '#064E3B',
                        color: '#34D399',
                        border: '1px solid #059669',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <TrendingUp size={11} />
                      OUTCOME: IMPROVED
                    </span>
                  )}
                </div>

                {/* Sleek Single-Line Stage Progress Bar (Replacing Large 01-05 Chevron Blocks) */}
                <div
                  style={{
                    backgroundColor: '#0C101A',
                    border: '1px solid #1E293B',
                    borderRadius: '2px',
                    padding: '8px 10px',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      marginBottom: '5px',
                    }}
                  >
                    <span style={{ color: isAcknowledged ? '#34D399' : '#38BDF8' }}>
                      {isAcknowledged ? 'STAGE 5 OF 5: REASSESS' : 'STAGE 4 OF 5: ACT'}
                    </span>
                    <span style={{ color: '#64748B' }}>
                      {isAcknowledged ? '5/5' : '4/5'}
                    </span>
                  </div>
                  {/* Slim 4px Progress Bar */}
                  <div
                    style={{
                      height: '4px',
                      width: '100%',
                      backgroundColor: '#1E293B',
                      borderRadius: '1px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: isAcknowledged ? '100%' : '80%',
                        backgroundColor: isAcknowledged ? '#34D399' : '#38BDF8',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Action Directive */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2px' }}>
                    Clinical Countermeasure Protocol
                  </div>
                  <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.4' }}>
                    {rec.action_summary}
                  </div>
                </div>

                {/* Latency-Aware Consultation Guidance */}
                <div
                  style={{
                    backgroundColor: '#0C101A',
                    borderLeft: '2px solid #38BDF8',
                    padding: '6px 8px',
                    borderRadius: '2px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#38BDF8', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginBottom: '2px' }}>
                    <Radio size={11} />
                    <span>MISSION COMMS PROTOCOL GUIDANCE</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.3' }}>
                    {rec.consultation_guidance}
                  </div>
                </div>

                {/* ESCALATE WHEN Alert Trigger */}
                <div
                  style={{
                    backgroundColor: '#1C0E10',
                    border: '1px solid #7F1D1D',
                    borderLeft: '3px solid #EF4444',
                    padding: '8px 10px',
                    borderRadius: '2px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#EF4444', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", marginBottom: '2px' }}>
                    <AlertOctagon size={12} color="#EF4444" />
                    <span>ESCALATE WHEN:</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#FCA5A5', lineHeight: '1.35', fontWeight: 500 }}>
                    {rec.escalate_when}
                  </div>
                </div>

                {/* Logged Action Note or Interactive Action Button */}
                {isAcknowledged ? (
                  <div
                    style={{
                      backgroundColor: '#064E3B20',
                      border: '1px solid #059669',
                      padding: '8px 10px',
                      borderRadius: '2px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginBottom: '3px' }}>
                      <CheckCircle2 size={12} />
                      <span>ACTION LOGGED & REASSESSMENT ENGAGED</span>
                    </div>
                    {rec.reassessment?.action_taken_note && (
                      <div style={{ color: '#D1FAE5', fontStyle: 'italic', marginBottom: '4px' }}>
                        "{rec.reassessment.action_taken_note}"
                      </div>
                    )}
                    {rec.reassessment?.acknowledged_at && (
                      <div style={{ fontSize: '9px', color: '#6EE7B7', fontFamily: "'JetBrains Mono', monospace" }}>
                        Logged: {new Date(rec.reassessment.acknowledged_at).toUTCString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="aero-btn aero-btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '7px 12px', fontSize: '11px', fontWeight: 700 }}
                    onClick={() => handleOpenModal(rec)}
                  >
                    <FileCheck2 size={13} />
                    <span>Acknowledge & Log Action</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Logging Modal */}
      {selectedRecId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '16px',
          }}
          onClick={() => setSelectedRecId(null)}
        >
          <div
            style={{
              backgroundColor: '#0C101A',
              border: '1px solid #38BDF8',
              borderRadius: '2px',
              padding: '20px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileCheck2 size={18} color="#38BDF8" />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#F8FAFC', fontFamily: "'JetBrains Mono', monospace" }}>
                ACKNOWLEDGE CLINICAL COUNTERMEASURE ({selectedRecId})
              </h3>
            </div>

            <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4', marginBottom: '12px' }}>
              Confirm that the astronaut has initiated or acknowledged this countermeasure. Entering an audit note records the timestamp and engages time-windowed reassessment tracking.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#CBD5E1', fontWeight: 600, marginBottom: '6px' }}>
                Action Taken Note:
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#07090F',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  color: '#F8FAFC',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="aero-btn"
                onClick={() => setSelectedRecId(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="aero-btn aero-btn-primary"
                onClick={handleConfirmAcknowledge}
                disabled={submitting || !actionNote.trim()}
              >
                {submitting ? 'Logging...' : 'Confirm & Log Protocol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
