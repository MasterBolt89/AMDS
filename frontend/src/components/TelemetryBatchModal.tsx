import React, { useState } from 'react';
import { DomainId, Modality, Provenance, DataQuality, TelemetryBatchRequest } from '../types/api';
import { PlusCircle, X } from 'lucide-react';

interface TelemetryBatchModalProps {
  astronautId: string;
  defaultDomainId?: DomainId;
  defaultMetricId?: string;
  currentMissionDay: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: TelemetryBatchRequest) => Promise<void>;
}

export const TelemetryBatchModal: React.FC<TelemetryBatchModalProps> = ({
  astronautId,
  defaultDomainId = 'immune_microbio',
  defaultMetricId = 'imm_iga',
  currentMissionDay,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [domainId, setDomainId] = useState<DomainId>(defaultDomainId);
  const [metricId, setMetricId] = useState<string>(defaultMetricId);
  const [value, setValue] = useState<string>('185.0');
  const [unit, setUnit] = useState<string>('ug/mL');
  const [modality, setModality] = useState<Modality>('LAB_ASSAY');
  const [provenance, setProvenance] = useState<Provenance>('MANUAL_ENTRY');
  const [quality, setQuality] = useState<DataQuality>('VALID');
  const [note, setNote] = useState<string>('Crew-executed rapid biomarker cassette run.');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDomainChange = (newDom: DomainId) => {
    setDomainId(newDom);
    if (newDom === 'immune_microbio') {
      setMetricId('imm_iga');
      setValue('185.0');
      setUnit('ug/mL');
      setModality('LAB_ASSAY');
      setNote('Bio-assay cartridge processed in Node 2 centrifuge.');
    } else if (newDom === 'cardiovascular') {
      setMetricId('cv_rhr');
      setValue('62.0');
      setUnit('bpm');
      setModality('OBJECTIVE_SENSOR');
      setNote('Resting rate verified post-rest.');
    } else if (newDom === 'sleep_circadian') {
      setMetricId('slp_duration');
      setValue('7.0');
      setUnit('hrs');
      setModality('SUBJECTIVE_REPORT');
      setNote('Morning crew subjective sleep report.');
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
      const req: TelemetryBatchRequest = {
        astronaut_id: astronautId,
        batch: [
          {
            domain_id: domainId,
            metric_id: metricId,
            value: isNaN(numVal) ? 0 : numVal,
            unit,
            timestamp: new Date().toISOString(),
            mission_day: currentMissionDay,
            provenance,
            modality,
            quality,
            note: note.trim() || undefined,
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
            borderBottom: '1px solid #1F2937',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} color="#38BDF8" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#F8FAFC' }}>
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
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Target Domain:
              </label>
              <select
                value={domainId}
                onChange={(e) => handleDomainChange(e.target.value as DomainId)}
                style={{
                  width: '100%',
                  backgroundColor: '#0D1320',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <option value="cardiovascular">Cardiovascular</option>
                <option value="sleep_circadian">Sleep & Circadian</option>
                <option value="immune_microbio">Immune & Microbiome</option>
                <option value="behavioral_psych">Behavioral & Cognition</option>
                <option value="musculoskeletal">Musculoskeletal</option>
                <option value="radiation">Radiation</option>
                <option value="sensorimotor_neuro">Sensorimotor</option>
                <option value="nutrition">Nutrition</option>
                <option value="environment_eclss">Cabin ECLSS</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Metric Identifier:
              </label>
              <input
                type="text"
                value={metricId}
                onChange={(e) => setMetricId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0D1320',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '4px',
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
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Measured Value:
              </label>
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0D1320',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Unit:
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0D1320',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '4px',
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
              <label style={{ display: 'block', fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Modality:
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as Modality)}
                style={{
                  width: '100%',
                  backgroundColor: '#0D1320',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '11px',
                }}
              >
                <option value="LAB_ASSAY">LAB_ASSAY</option>
                <option value="SUBJECTIVE_REPORT">SUBJECTIVE_REPORT</option>
                <option value="OBJECTIVE_SENSOR">OBJECTIVE_SENSOR</option>
                <option value="ENVIRONMENTAL_SENSOR">ENVIRONMENTAL_SENSOR</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Provenance:
              </label>
              <select
                value={provenance}
                onChange={(e) => setProvenance(e.target.value as Provenance)}
                style={{
                  width: '100%',
                  backgroundColor: '#0D1320',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '11px',
                }}
              >
                <option value="MANUAL_ENTRY">MANUAL_ENTRY</option>
                <option value="ACTUAL_TELEM">ACTUAL_TELEM</option>
                <option value="SIMULATED">SIMULATED</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Data Quality:
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as DataQuality)}
                style={{
                  width: '100%',
                  backgroundColor: '#0D1320',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '11px',
                }}
              >
                <option value="VALID">VALID</option>
                <option value="SUSPECT">SUSPECT</option>
                <option value="MISSING">MISSING</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>
              Clinical / Telemetric Notes:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0D1320',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '4px',
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
