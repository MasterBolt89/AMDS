import React, { useState } from 'react';
import { ClosedLoopRecommendation, RecommendationWorkflowStep } from '../types/api';
import {
  ShieldAlert,
  Radio,
  CheckCircle2,
  FileCheck2,
  AlertOctagon,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface RecommendationsPanelProps {
  recommendations: ClosedLoopRecommendation[];
  astronautId: string;
  onAcknowledge: (recId: string, actionTakenNote: string) => Promise<void>;
}

const WORKFLOW_STEPS: RecommendationWorkflowStep[] = ['Collect', 'Assess', 'Explain', 'Act', 'Reassess'];

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  onAcknowledge,
}) => {
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleOpenModal = (rec: ClosedLoopRecommendation) => {
    setSelectedRecId(rec.id);
    setActionNote(
      rec.reassessment.action_taken_note ||
        'Countermeasure initiated: Bedtime shifted 45min earlier, pre-sleep blue-depleted lighting protocol engaged, cycle ergometer rescheduled.'
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
          <ShieldAlert size={18} color="#F59E0B" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>
            CLOSED-LOOP CLINICAL RECOMMENDATIONS ({recommendations.length})
          </h2>
        </div>
        <div style={{ fontSize: '11px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
          PROTOCOL COMPLIANCE & ESCALATION CONTROL
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
          No active clinical recommendations. Current mission surveillance within nominal limits.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {recommendations.map((rec) => {
            const isAcknowledged = rec.reassessment.status === 'ACKNOWLEDGED';

            return (
              <div
                key={rec.id}
                style={{
                  backgroundColor: '#0D1320',
                  border: '1px solid #1F2937',
                  borderRadius: '6px',
                  padding: '20px',
                }}
              >
                {/* Header & Reassessment Status */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        color: '#F59E0B',
                        fontWeight: 700,
                        backgroundColor: '#451A03',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        border: '1px solid #78350F',
                      }}
                    >
                      {rec.id}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                      {rec.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '3px',
                        backgroundColor: isAcknowledged ? '#064E3B' : '#78350F',
                        color: isAcknowledged ? '#6EE7B7' : '#FCD34D',
                        border: `1px solid ${isAcknowledged ? '#059669' : '#D97706'}`,
                      }}
                    >
                      {isAcknowledged ? 'REASSESSMENT ACKNOWLEDGED' : 'ACTION PENDING LOG'}
                    </span>
                  </div>
                </div>

                {/* 5-Step Workflow Visualizer */}
                <div
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid #1F2937',
                    borderRadius: '4px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#64748B',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      marginBottom: '8px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Clinical Workflow State
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      gap: '4px',
                    }}
                  >
                    {WORKFLOW_STEPS.map((step, idx) => {
                      const isCurrent = rec.current_step === step;
                      const isPassed =
                        WORKFLOW_STEPS.indexOf(rec.current_step) >= idx ||
                        (isAcknowledged && step === 'Act');

                      return (
                        <React.Fragment key={step}>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: isCurrent
                                  ? '#0284C7'
                                  : isPassed
                                  ? '#065F46'
                                  : '#1E293B',
                                border: `2px solid ${
                                  isCurrent ? '#38BDF8' : isPassed ? '#10B981' : '#334155'
                                }`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                marginBottom: '4px',
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {idx + 1}
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: isCurrent ? 700 : 500,
                                color: isCurrent ? '#38BDF8' : isPassed ? '#E2E8F0' : '#64748B',
                              }}
                            >
                              {step}
                            </span>
                          </div>
                          {idx < WORKFLOW_STEPS.length - 1 && (
                            <ArrowRight
                              size={12}
                              color={isPassed ? '#10B981' : '#334155'}
                              style={{ marginBottom: '16px' }}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Action Summary */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    Action Summary:
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#E2E8F0',
                      lineHeight: '1.5',
                      backgroundColor: '#111827',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #1F2937',
                    }}
                  >
                    {rec.action_summary}
                  </div>
                </div>

                {/* High-Visibility OPERATIONAL ESCALATION CALLOUT */}
                <div
                  style={{
                    backgroundColor: '#3B0707',
                    border: '2px solid #EF4444',
                    borderRadius: '4px',
                    padding: '12px 16px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#F87171',
                      fontSize: '12px',
                      fontWeight: 800,
                      marginBottom: '4px',
                      letterSpacing: '0.04em',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <AlertOctagon size={15} color="#EF4444" />
                    ESCALATE WHEN (OPERATIONAL ESCALATION CRITERIA):
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#FEE2E2',
                      lineHeight: '1.45',
                      fontWeight: 500,
                    }}
                  >
                    {rec.escalate_when}
                  </div>
                </div>

                {/* Consultation Guidance (Latency Aware) */}
                <div
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid #1E293B',
                    borderLeft: '3px solid #38BDF8',
                    borderRadius: '4px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#38BDF8',
                      marginBottom: '4px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <Radio size={12} color="#38BDF8" />
                    CONSULTATION GUIDANCE (LATENCY-AWARE):
                  </div>
                  <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.45' }}>
                    {rec.consultation_guidance}
                  </div>
                </div>

                {/* Reassessment Metadata & Acknowledge Button */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    backgroundColor: '#111827',
                    border: '1px solid #1F2937',
                    padding: '12px 14px',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} color="#94A3B8" />
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                        Reassessment Due: Sol {rec.reassessment.due_mission_day} ({rec.reassessment.expected_window_hours}h window)
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      Outcome: <strong style={{ color: '#E2E8F0' }}>{rec.reassessment.outcome}</strong>
                    </div>
                  </div>

                  <div>
                    {isAcknowledged ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontSize: '12px' }}>
                        <CheckCircle2 size={14} color="#10B981" />
                        <span>Acknowledged ({rec.reassessment.acknowledged_at?.slice(0, 10)})</span>
                      </div>
                    ) : (
                      <button
                        className="aero-btn aero-btn-primary"
                        onClick={() => handleOpenModal(rec)}
                      >
                        <FileCheck2 size={14} />
                        <span>Acknowledge & Log Action</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* If Acknowledged, show logged note */}
                {isAcknowledged && rec.reassessment.action_taken_note && (
                  <div
                    style={{
                      marginTop: '10px',
                      backgroundColor: '#064E3B20',
                      border: '1px solid #059669',
                      borderRadius: '4px',
                      padding: '8px 12px',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#6EE7B7', fontWeight: 700, textTransform: 'uppercase' }}>
                      Logged Clinical Action Record:
                    </div>
                    <div style={{ fontSize: '12px', color: '#D1FAE5', marginTop: '2px' }}>
                      "{rec.reassessment.action_taken_note}"
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Acknowledge Modal */}
      {selectedRecId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '580px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '1px solid #1F2937',
                paddingBottom: '12px',
              }}
            >
              <FileCheck2 size={20} color="#38BDF8" />
              <h3 style={{ margin: 0, fontSize: '16px', color: '#F8FAFC' }}>
                Acknowledge Clinical Recommendation
              </h3>
            </div>

            <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5', marginBottom: '16px' }}>
              Confirm execution of prescribed countermeasures. This logs a formal clinical audit entry into the
              telemetry ledger and updates the closed-loop tracking state to <strong>REASSESS</strong>.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#CBD5E1',
                  fontWeight: 600,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Action Taken Note / Execution Log:
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  backgroundColor: '#0D1320',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#F8FAFC',
                  padding: '10px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter actions taken by crew / medical officer..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                {submitting ? 'Submitting...' : 'Confirm & Log Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
