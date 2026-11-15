import React, { useState, useEffect } from 'react';
import { OperationalRiskResponse, OperationalRiskEventType, OperationalRiskCreateRequest } from '../types/api';
import { StatusBadge } from './StatusBadge';
import { AlertTriangle, Plus, X } from 'lucide-react';

interface OperationalRisksModalProps {
  astronautId: string;
  currentMissionDay: number;
  isOpen: boolean;
  onClose: () => void;
  onLogRisk: (record: OperationalRiskCreateRequest) => Promise<void>;
  fetchRisks: (astronautId: string) => Promise<OperationalRiskResponse[]>;
}

export const OperationalRisksModal: React.FC<OperationalRisksModalProps> = ({
  astronautId,
  currentMissionDay,
  isOpen,
  onClose,
  onLogRisk,
  fetchRisks,
}) => {
  const [risks, setRisks] = useState<OperationalRiskResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form fields
  const [eventType, setEventType] = useState<OperationalRiskEventType>('EVA_INJURY_PERFORMANCE');
  const [severity, setSeverity] = useState<string>('ATTENTION');
  const [description, setDescription] = useState<string>(
    'Suit cooling loop delta-T micro-fluctuation during EVA; reported acute forearm cramping and glove thermal fatigue.'
  );
  const [mitigationApplied, setMitigationApplied] = useState<string>(
    'Crew assisted airlock repressurization accelerated; oral rehydration and thermal warm compress applied.'
  );
  const [downlinkPriority, setDownlinkPriority] = useState<string>('HIGH');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadRisks = async () => {
    setLoading(true);
    try {
      const data = await fetchRisks(astronautId);
      setRisks(data);
    } catch (e) {
      console.error('Failed to load risks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRisks();
    }
  }, [isOpen, astronautId]);

  if (!isOpen) return null;

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onLogRisk({
        timestamp: new Date().toISOString(),
        event_type: eventType,
        severity,
        description,
        mitigation_applied: mitigationApplied,
        downlink_priority: downlinkPriority,
      });
      setShowAddForm(false);
      await loadRisks();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px', maxWidth: '720px' }}>
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
            <AlertTriangle size={20} color="#F59E0B" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#F8FAFC' }}>
              Operational Mission Risk Ledger ({astronautId})
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action button to open add form */}
        {!showAddForm ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <button
              className="aero-btn aero-btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={14} />
              <span>Log New Operational Risk Event</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleCreateRisk}
            style={{
              backgroundColor: '#0D1320',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8', marginBottom: '12px' }}>
              LOG OPERATIONAL RISK EVENT (POST /api/v1/astronauts/{astronautId}/operational-risks)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                  Risk Event Type:
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as OperationalRiskEventType)}
                  style={{
                    width: '100%',
                    backgroundColor: '#111827',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '6px',
                    fontSize: '12px',
                  }}
                >
                  <option value="EVA_INJURY_PERFORMANCE">EVA Spacewalk / Pressure Suit Injury</option>
                  <option value="HYPOXIA_EVENT">Hypoxia / Atmospheric Gas Excursion</option>
                  <option value="DCS_CONCERN">Decompression Sickness (DCS)</option>
                  <option value="DYNAMIC_LOAD_EVENT">Dynamic High-G Landing / Re-entry Load</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                  Severity:
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#111827',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '6px',
                    fontSize: '12px',
                  }}
                >
                  <option value="NORMAL">NORMAL / RESOLVED</option>
                  <option value="ATTENTION">ATTENTION / MEDIUM</option>
                  <option value="CRITICAL">CRITICAL / HIGH</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                Event Description:
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#111827',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                Mitigation Applied:
              </label>
              <input
                type="text"
                value={mitigationApplied}
                onChange={(e) => setMitigationApplied(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#111827',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="aero-btn"
                onClick={() => setShowAddForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="aero-btn aero-btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Logging...' : 'Save Risk Record'}
              </button>
            </div>
          </form>
        )}

        {/* Risk Records List */}
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
            Loading operational risk ledger...
          </div>
        ) : risks.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#0D1320',
              border: '1px solid #1F2937',
              borderRadius: '4px',
              color: '#94A3B8',
              fontSize: '13px',
            }}
          >
            No active operational risk records logged for this crew member.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {risks.map((r) => {
              const sev = (r.severity || 'ATTENTION').toUpperCase();
              return (
                <div
                  key={r.id}
                  style={{
                    backgroundColor: '#0D1320',
                    border: '1px solid #1F2937',
                    borderLeft:
                      sev === 'CRITICAL' || sev === 'HIGH'
                        ? '3px solid #EF4444'
                        : sev === 'ATTENTION' || sev === 'MEDIUM'
                        ? '3px solid #F59E0B'
                        : '3px solid #10B981',
                    borderRadius: '4px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
                        {r.id}
                      </span>
                      <strong style={{ fontSize: '13px', color: '#F8FAFC' }}>
                        {r.risk_name || r.description?.slice(0, 50) + '...'}
                      </strong>
                      <span
                        style={{
                          fontSize: '10px',
                          backgroundColor: '#1E293B',
                          color: '#93C5FD',
                          padding: '1px 6px',
                          borderRadius: '2px',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {r.event_type || r.risk_type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>
                        {r.timestamp?.slice(0, 10)}
                      </span>
                      <StatusBadge status={sev === 'HIGH' ? 'CRITICAL' : sev === 'MEDIUM' ? 'ATTENTION' : 'NORMAL'} size="sm" />
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#E2E8F0', marginBottom: '4px' }}>
                    {r.description}
                  </div>

                  <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                    <strong style={{ color: '#38BDF8' }}>Mitigation Applied: </strong>
                    {r.mitigation_applied || r.mitigation_status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
