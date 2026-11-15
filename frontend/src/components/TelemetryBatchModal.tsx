import React, { useState } from 'react';
import { DomainId, Modality, Provenance, DataQuality, BatchTelemetryIngestRequest } from '../types/api';
import { PlusCircle, X } from 'lucide-react';

interface TelemetryBatchModalProps {
  astronautId: string;
  defaultDomainId?: DomainId;
  defaultMetricId?: string;
  currentMissionDay: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: any) => Promise<void>;
}

export const TelemetryBatchModal: React.FC<TelemetryBatchModalProps> = ({
  astronautId,
  defaultDomainId = 'immune_microbio',
  defaultMetricId = 'crp_biomarker_mg_l',
  currentMissionDay,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [domainId, setDomainId] = useState<DomainId>(defaultDomainId);
  const [metricId, setMetricId] = useState<string>(defaultMetricId || 'crp_biomarker_mg_l');
  const [value, setValue] = useState<string>('0.85');
  const [unit, setUnit] = useState<string>('mg/L');
  const [modality, setModality] = useState<Modality>('LAB_ASSAY');
  const [provenance, setProvenance] = useState<Provenance>('MANUAL_ENTRY');
  const [quality, setQuality] = useState<DataQuality>('VALID');
  const [note, setNote] = useState<string>('Crew-executed rapid saliva biomarker cassette run.');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDomainChange = (newDom: DomainId) => {
    setDomainId(newDom);
    if (newDom === 'immune_microbio') {
      setMetricId('crp_biomarker_mg_l');
      setValue('0.85');
      setUnit('mg/L');
      setModality('LAB_ASSAY');
      setNote('Bio-assay cartridge processed in Node 2 centrifuge.');
    } else if (newDom === 'cardiovascular') {
      setMetricId('resting_hr_bpm');
      setValue('62.0');
      setUnit('bpm');
      setModality('OBJECTIVE_SENSOR');
      setNote('Resting rate verified post-rest.');
    } else if (newDom === 'sleep_circadian') {
      setMetricId('sleep_duration_hours');
      setValue('7.5');
      setUnit('hours');
      setModality('SUBJECTIVE_REPORT');
      setNote('Morning crew subjective sleep report.');
    } else if (newDom === 'environment_eclss') {
      setMetricId('co2_partial_pressure_mmhg');
      setValue('2.2');
      setUnit('mmHg');
      setModality('ENVIRONMENTAL_SENSOR');
      setNote('Handheld air constituent sample verified.');
    } else {
      setMetricId(`${newDom}_metric`);
      setValue('100.0');
      setUnit('pts');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const numVal = parseFloat(value);
      const req: BatchTelemetryIngestRequest = {
        measurements: [
          {
            astronaut_id: astronautId,
            domain_id: domainId,
            metric_name: metricId,
            timestamp: new Date().toISOString(),
            value: isNaN(numVal) ? 0 : numVal,
            unit,
            provenance,
            modality,
            quality,
            note: note.trim() || undefined,
            mission_day: currentMissionDay,
          },
        ],
      };
      await onSubmit(req);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px', maxWidth: '560px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid #1E293B',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} color="#38BDF8" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#F8FAFC', fontFamily: "'JetBrains Mono', monospace" }}>
              Ingest Telemetry / Manual Check-In
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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Target Domain:
              </label>
              <select
                value={domainId}
                onChange={(e) => handleDomainChange(e.target.value as DomainId)}
                style={{
                  width: '100%',
                  backgroundColor: '#0C101A',
                  color: '#F8FAFC',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <option value="immune_microbio">Immune & Microbiome</option>
                <option value="cardiovascular">Cardiovascular</option>
                <option value="sleep_circadian">Sleep & Circadian</option>
                <option value="behavioral_psych">Behavioral & Cognition</option>
                <option value="musculoskeletal">Musculoskeletal</option>
                <option value="radiation">Radiation</option>
                <option value="sensorimotor_neuro">Sensorimotor</option>
                <option value="nutrition">Nutrition</option>
                <option value="environment_eclss">Cabin ECLSS</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Metric Name:
              </label>
              <input
                type="text"
                value={metricId}
                onChange={(e) => setMetricId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0C101A',
                  color: '#F8FAFC',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Measured Value:
              </label>
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0C101A',
                  color: '#F8FAFC',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Unit:
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0C101A',
                  color: '#F8FAFC',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Modality:
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as Modality)}
                style={{
                  width: '100%',
                  backgroundColor: '#0C101A',
                  color: '#F8FAFC',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  padding: '6px',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <option value="LAB_ASSAY">LAB_ASSAY</option>
                <option value="SUBJECTIVE_REPORT">SUBJECTIVE_REPORT</option>
                <option value="OBJECTIVE_SENSOR">OBJECTIVE_SENSOR</option>
                <option value="ENVIRONMENTAL_SENSOR">ENVIRONMENTAL_SENSOR</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Provenance:
              </label>
              <select
                value={provenance}
                onChange={(e) => setProvenance(e.target.value as Provenance)}
                style={{
                  width: '100%',
                  backgroundColor: '#0C101A',
                  color: '#F8FAFC',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  padding: '6px',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <option value="MANUAL_ENTRY">MANUAL_ENTRY</option>
                <option value="ACTUAL_TELEM">ACTUAL_TELEM</option>
                <option value="SIMULATED">SIMULATED</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Data Quality:
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as DataQuality)}
                style={{
                  width: '100%',
                  backgroundColor: '#0C101A',
                  color: '#F8FAFC',
                  border: '1px solid #1E293B',
                  borderRadius: '2px',
                  padding: '6px',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <option value="VALID">VALID</option>
                <option value="SUSPECT">SUSPECT</option>
                <option value="MISSING">MISSING</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
              Clinical / Telemetric Notes:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0C101A',
                color: '#F8FAFC',
                border: '1px solid #1E293B',
                borderRadius: '2px',
                padding: '8px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="aero-btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="aero-btn aero-btn-primary" disabled={submitting}>
              {submitting ? 'Ingesting...' : 'Ingest Telemetry Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
