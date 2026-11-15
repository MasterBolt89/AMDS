import {
  DashboardResponse,
  DomainDetailResponse,
  SimulationScenarioItem,
  OperationalRiskResponse,
  DomainId,
} from '../types/api';

// 4 Backend Scenarios
export const SCENARIO_1: SimulationScenarioItem = {
  scenario_id: 'nominal_iss_baseline',
  id: 'nominal_iss_baseline',
  name: 'Nominal ISS Baseline Surveillance',
  description:
    'Low Earth Orbit Expedition 74 (Day 42). Real-time ground voice loop active with Houston Flight Surgeon (2s latency). Multi-system physiological baselines nominal.',
  mission_profile: 'ISS_LEO',
  hazards_featured: ['Microgravity Fluid Shift', 'Space Motion Sickness Baseline'],
  astronaut_id: 'astro-101',
};

export const SCENARIO_2: SimulationScenarioItem = {
  scenario_id: 'circadian_drift_and_fatigue_01',
  id: 'circadian_drift_and_fatigue_01',
  name: 'Mars Transit: Autonomous Comm Latency & Circadian Drift',
  description:
    'Deep space transit scenario at Day 185. 12-minute one-way light time latency prevents real-time Flight Surgeon loop. Crew experiences progressive circadian misalignment and immune panel staleness.',
  mission_profile: 'MARS_TRANSIT',
  hazards_featured: ['Sleep Curtailment', 'Autonomic Dysregulation', 'Immune Staleness', 'Deep Space Comm Latency'],
  astronaut_id: 'astro-101',
};

export const SCENARIO_3: SimulationScenarioItem = {
  scenario_id: 'post_action_reassessment_improved',
  id: 'post_action_reassessment_improved',
  name: 'Post-Action Reassessment (Outcome: IMPROVED)',
  description:
    'Mars Transit (Day 187). Clinical protocol acknowledged and executed by Crew Medical Officer 36 hours prior. Follow-up objective sleep measurement shows full recovery to 7.7h (Outcome: IMPROVED).',
  mission_profile: 'MARS_TRANSIT',
  hazards_featured: ['Closed-Loop Reassessment', 'Intervention Recovery Verification'],
  astronaut_id: 'astro-101',
};

export const SCENARIO_4: SimulationScenarioItem = {
  scenario_id: 'eva_operational_incident_with_eclss_drift',
  id: 'eva_operational_incident_with_eclss_drift',
  name: 'EVA Spacewalk Incident with Cabin ECLSS CO2 Spike',
  description:
    'ISS LEO (Day 58). Discrete spacewalker suit thermal fluctuation & forearm fatigue incident logged in risk ledger. Node 2 cabin CO2 rises from 2.1 to 3.8 mmHg following airlock cycle.',
  mission_profile: 'ISS_LEO',
  hazards_featured: ['EVA Musculoskeletal Fatigue', 'Cabin CO2 Scrubber Lag', 'Operational Risk Ledger'],
  astronaut_id: 'astro-101',
};

export const ALL_SCENARIOS: SimulationScenarioItem[] = [
  SCENARIO_1,
  SCENARIO_2,
  SCENARIO_3,
  SCENARIO_4,
];

// Helper to construct domain summaries
function buildDomainSummaries(scenarioId: string) {
  const isCircadian = scenarioId === 'circadian_drift_and_fatigue_01';
  const isPostAction = scenarioId === 'post_action_reassessment_improved';
  const isEva = scenarioId === 'eva_operational_incident_with_eclss_drift';

  return [
    {
      domain_id: 'sleep_circadian' as DomainId,
      domain_category: 'PERSONAL_HEALTH' as const,
      display_name: 'Sleep & Circadian Alignment',
      measurement_scope_notice:
        'Actigraphy and sleep logs track sleep duration and circadian phase shifts; they do not assess micro-arousals or cognitive sleep architecture.',
      status: isCircadian ? ('ATTENTION' as const) : ('NORMAL' as const),
      completeness_pct: 95,
      last_updated: '2026-11-14T07:15:00Z',
      headline_metric: isCircadian
        ? '4.3h (Baseline: 7.5h, -42.7%)'
        : isPostAction
        ? '7.7h (Baseline: 7.5h, +2.7% - Recovered)'
        : '7.5h (Baseline: 7.5h, 0.0%)',
      status_reason: isCircadian
        ? 'Sleep duration dropped to 4.3h for consecutive sleep windows'
        : 'Circadian phase alignment within nominal baseline limits',
      active_finding_count: isCircadian ? 1 : 0,
    },
    {
      domain_id: 'cardiovascular' as DomainId,
      domain_category: 'PERSONAL_HEALTH' as const,
      display_name: 'Cardiovascular & Hemodynamics',
      measurement_scope_notice:
        'Biometric chest patch monitors resting heart rate and rhythm; stroke volume and vascular remodeling require scheduled ultrasound protocols.',
      status: isCircadian ? ('ATTENTION' as const) : ('NORMAL' as const),
      completeness_pct: 98,
      last_updated: '2026-11-14T08:00:00Z',
      headline_metric: isCircadian ? '75.0 bpm (Baseline: 62.0 bpm, +21.0%)' : '62.0 bpm (Baseline: 62.0 bpm, 0.0%)',
      status_reason: isCircadian ? 'Resting heart rate statistical baseline drift (Z > 5)' : 'Autonomic tone within nominal reference limits',
      active_finding_count: isCircadian ? 1 : 0,
    },
    {
      domain_id: 'behavioral_psych' as DomainId,
      domain_category: 'PERSONAL_HEALTH' as const,
      display_name: 'Behavioral Health & Cognition',
      measurement_scope_notice:
        'Self-report mood surveys and Psychomotor Vigilance Tests (PVT) index acute alertness; they do not replace formal clinical psychiatric evaluation.',
      status: isCircadian ? ('ATTENTION' as const) : ('NORMAL' as const),
      completeness_pct: 92,
      last_updated: '2026-11-14T11:30:00Z',
      headline_metric: isCircadian ? 'Fatigue: 36.0 /100 (Baseline: 15.0 /100, +140.0%)' : 'Fatigue: 15.0 /100 (Baseline: 15.0 /100, 0.0%)',
      status_reason: isCircadian ? 'Elevated subjective cognitive fatigue score' : 'Cognitive speed and psychomotor vigilance nominal',
      active_finding_count: isCircadian ? 1 : 0,
    },
    {
      domain_id: 'musculoskeletal' as DomainId,
      domain_category: 'PERSONAL_HEALTH' as const,
      display_name: 'Musculoskeletal & Bone Mineral',
      measurement_scope_notice:
        'Daily ARED/T2 resistive force logs track exercise volume; they do not measure trabecular bone mineral density or muscle fiber atrophy directly.',
      status: 'NORMAL' as const,
      completeness_pct: 100,
      last_updated: '2026-11-14T14:00:00Z',
      headline_metric: 'Adherence: 95.0% (Baseline: 95.0%, 0.0%)',
      status_reason: 'Resistive workout adherence meeting prescribed protocol',
      active_finding_count: 0,
    },
    {
      domain_id: 'immune_microbio' as DomainId,
      domain_category: 'PERSONAL_HEALTH' as const,
      display_name: 'Immune System & Microbiome',
      measurement_scope_notice:
        'Wearables do not directly measure immune competence or cytokine expression; requires dedicated bio-sample cartridge assays.',
      status: isCircadian ? ('INSUFFICIENT_DATA' as const) : ('NORMAL' as const),
      completeness_pct: isCircadian ? 32 : 100,
      last_updated: isCircadian ? '2026-10-28T09:00:00Z' : '2026-11-14T09:00:00Z',
      headline_metric: isCircadian ? null : 'CRP: 0.82 mg/L (Baseline: 0.82 mg/L, 0.0%)',
      status_reason: isCircadian
        ? 'Periodic saliva/blood biomarker panel overdue (expected every 14 days; last sample 420h ago).'
        : 'Biomarker panel cadence current and validated',
      active_finding_count: 0,
    },
    {
      domain_id: 'radiation' as DomainId,
      domain_category: 'PERSONAL_HEALTH' as const,
      display_name: 'Radiation & Bio-dosimetry',
      measurement_scope_notice:
        'Active silicon dosimeters measure ambient ionizing radiation flux; personalized tissue damage requires cytogenetic translocation assays.',
      status: 'NORMAL' as const,
      completeness_pct: 100,
      last_updated: '2026-11-14T16:00:00Z',
      headline_metric: isCircadian || isPostAction ? 'Daily: 1.45 mSv (Baseline: 1.45 mSv, 0.0%)' : 'Daily: 0.42 mSv (Baseline: 0.42 mSv, 0.0%)',
      status_reason: 'Cumulative ionizing radiation exposure within mission career limits',
      active_finding_count: 0,
    },
    {
      domain_id: 'sensorimotor_neuro' as DomainId,
      domain_category: 'PERSONAL_HEALTH' as const,
      display_name: 'Sensorimotor & Neurovestibular',
      measurement_scope_notice:
        'Dynamic balance and visual tracking test vestibular adaptation; intracranial fluid shifts and SANS require fundoscopy and OCT scans.',
      status: 'NORMAL' as const,
      completeness_pct: 95,
      last_updated: '2026-11-13T19:00:00Z',
      headline_metric: 'Postural Sway: 1.5 score (Baseline: 1.5 score, +0.0%)',
      status_reason: 'Neurovestibular dynamic tracking nominal',
      active_finding_count: 0,
    },
    {
      domain_id: 'nutrition' as DomainId,
      domain_category: 'PERSONAL_HEALTH' as const,
      display_name: 'Nutrition & Metabolic Hydration',
      measurement_scope_notice:
        'Barcoded food intake logs and mass measurement track macronutrient supply; micronutrient absorption requires blood laboratory assay.',
      status: 'NORMAL' as const,
      completeness_pct: 98,
      last_updated: '2026-11-14T12:00:00Z',
      headline_metric: 'Caloric: 2800 kcal (Baseline: 2800 kcal, 0.0%)',
      status_reason: 'Macronutrient caloric intake and hydration target achieved',
      active_finding_count: 0,
    },
    {
      domain_id: 'environment_eclss' as DomainId,
      domain_category: 'ENVIRONMENTAL_ECLSS' as const,
      display_name: 'Cabin Environmental & ECLSS',
      measurement_scope_notice:
        'Atmospheric telemetry reflects Node 2 bulk cabin air; localized dead zones and individual mask expiratory gases are monitored independently.',
      status: isEva ? ('ATTENTION' as const) : ('NORMAL' as const),
      completeness_pct: 100,
      last_updated: '2026-11-14T17:30:00Z',
      headline_metric: isEva ? 'CO2: 3.8 mmHg (Baseline: 2.1 mmHg, +81.0%)' : 'CO2: 2.2 mmHg (Baseline: 2.2 mmHg, 0.0%)',
      status_reason: isEva
        ? 'Node 2 partial pressure CO2 excursion following airlock outer hatch repressurization cycle'
        : 'Cabin atmosphere, O2, pressure, and CO2 scrubbing nominal',
      active_finding_count: isEva ? 1 : 0,
    },
  ];
}

export function buildDashboardForScenario(scenarioId: string): DashboardResponse {
  const isNominal = scenarioId === 'nominal_iss_baseline';
  const isCircadian = scenarioId === 'circadian_drift_and_fatigue_01';
  const isPostAction = scenarioId === 'post_action_reassessment_improved';
  const isEva = scenarioId === 'eva_operational_incident_with_eclss_drift';

  const missionDay = isCircadian ? 185 : isPostAction ? 187 : isEva ? 58 : 42;
  const isMars = isCircadian || isPostAction;

  return {
    astronaut: {
      id: 'astro-101',
      callsign: 'Ares-Lead',
      role: isEva ? 'EV1 - Lead Spacewalker' : isMars ? 'Commander' : 'Flight Engineer & Science Officer',
      mission_day: missionDay,
    },
    mission_context: {
      mission_profile: isMars ? 'MARS_TRANSIT' : 'ISS_LEO',
      one_way_light_time_sec: isMars ? 720 : 2,
      live_flight_surgeon_available: !isMars,
      support_mode: isMars ? 'AUTONOMOUS_EARTH_INDEPENDENT' : 'GROUND_MONITORED',
      available_onboard_equipment: isMars
        ? ['ARED', 'T2_TREADMILL', 'CEVIS_CYCLE', 'AUTONOMOUS_CLINICAL_CONSOLE', 'DOSIMETRY_CANS']
        : ['ARED', 'T2_TREADMILL', 'CEVIS_CYCLE', 'MED_KIT_EXPEDITION', 'PORTABLE_CO2_SENSOR'],
      active_provenance: 'SIMULATED',
    },
    data_provenance_summary: {
      active_provenance: 'SIMULATED',
      scenario_id: scenarioId,
      overall_completeness_pct: isCircadian ? 88.5 : 98.2,
      actual_telem_count: isMars ? 12400 : 15800,
      manual_entry_count: 52,
      simulated_count: 14200,
      last_sync_timestamp: '2026-11-14T17:45:00Z',
    },
    domains: buildDomainSummaries(scenarioId),
    findings: isCircadian
      ? [
          {
            finding_id: 'fnd-904',
            severity: 'ATTENTION',
            is_cross_domain: true,
            involved_domains: ['sleep_circadian', 'cardiovascular', 'behavioral_psych'],
            title: 'Autonomic & Circadian Desynchrony with Elevated Resting Heart Rate',
            what_changed:
              'Sleep duration dropped to 4.3h over consecutive windows, correlating with sympathetic tone drift (+21.0% resting HR to 75 bpm) and cognitive fatigue rating rising to 7.0/10.',
            why_it_matters:
              'Autonomic fatigue and circadian misalignment elevate the risk of operational errors during critical mission execution.',
            evidence: {
              evidence_type: 'STATISTICAL_BASELINE_DRIFT',
              is_validated_clinical_threshold: true,
              supporting_metrics: { resting_hr_bpm: 75, sleep_duration_hours: 4.3, fatigue_score: 7.0 },
              reference_source: 'NASA HRP-47053 Rev E Evidence Book',
            },
          },
        ]
      : isEva
      ? [
          {
            finding_id: 'FINDING-ECLSS-EVA-01',
            severity: 'ATTENTION',
            is_cross_domain: true,
            involved_domains: ['environment_eclss', 'musculoskeletal'],
            title: 'Cabin CO2 Scrubber Lag & Airlock Repressurization Gas Excursion',
            what_changed:
              'Cabin partial pressure CO2 spiked from 2.1 to 3.8 mmHg following 6.5h EVA airlock cycle, coinciding with right forearm thermal cramping.',
            why_it_matters:
              'Transient hypercapnia combined with physical exhaustion delays crew post-EVA recovery and airlock re-entry safety.',
            evidence: {
              evidence_type: 'STATISTICAL_BASELINE_DRIFT',
              is_validated_clinical_threshold: true,
              supporting_metrics: { co2_partial_pressure_mmhg: 3.8 },
              reference_source: 'NASA Flight Rule ECLSS-Node2-CO2-Limits',
            },
          },
        ]
      : isNominal
      ? [
          {
            finding_id: 'fnd-101',
            severity: 'NORMAL',
            is_cross_domain: false,
            involved_domains: ['cardiovascular', 'sleep_circadian'],
            title: 'Nominal Baseline Physiological Stability',
            what_changed: 'All vital signs, circadian rhythms, and exercise compliance are within pre-flight baseline ±1.5 standard deviations.',
            why_it_matters: 'Confirms continuous physiological homeostasis and adaptive stability in microgravity.',
            evidence: {
              evidence_type: 'VALIDATED_STANDARD',
              is_validated_clinical_threshold: true,
              supporting_metrics: { resting_hr_bpm: 62.0, sleep_duration_hours: 7.5 },
              reference_source: 'NASA Standard Measures Evidence Synthesis',
            },
          },
        ]
      : [],
    recommendations: isPostAction
      ? [
          {
            recommendation_id: 'REC-SLEEP_CIRCADIAN-01',
            finding_id: 'FINDING-SLEEP_CIRCADIAN-BASELINE-DRIFT',
            domain_id: 'sleep_circadian',
            title: 'Autonomous Circadian Phase Realignment Protocol',
            action_summary:
              'Enforce scheduled 8-hour sleep block, advance cabin evening dynamic lighting dimming by 30 minutes, and restrict blue-light screen exposure prior to sleep.',
            consultation_guidance:
              'Autonomous Spacecraft Operation (Mars Transit): One-way signal delay is 720s. Execute autonomous crew countermeasures.',
            escalate_when: 'Escalate to Level-2 Medical Protocol if sleep duration remains below 5h.',
            current_step: 'Reassess',
            steps: ['Collect', 'Assess', 'Explain', 'Act', 'Reassess'],
            reassessment: {
              status: 'ACKNOWLEDGED',
              due_mission_day: 187,
              reassess_window_hours: 24,
              outcome: 'IMPROVED',
              action_taken_note:
                'Darkened crew sleep quarters, activated circadian dynamic dimming, took 45-minute scheduled afternoon nap.',
              acknowledged_at: '2026-11-13T06:00:00Z',
              baseline_at_trigger: 4.3,
              latest_followup_value: 7.7,
            },
          },
        ]
      : isCircadian
      ? [
          {
            recommendation_id: 'rec-302',
            finding_id: 'fnd-904',
            domain_id: 'sleep_circadian',
            title: 'Autonomous Circadian Realignment & Workload Mitigation Protocol',
            action_summary:
              '1. Shift scheduled bedtime 45 minutes earlier with 30-min blue-depleted lighting before sleep. 2. Suspend intense cycle ergometer exercise within 4 hours of sleep window. 3. Defer non-critical maintenance.',
            escalate_when:
              'OPERATIONAL ESCALATION CRITERIA: Escalate to Level-2 Medical Protocol if Resting Heart Rate exceeds 78 bpm for >48h, or if Sleep Duration drops below 4.5h for 2 consecutive cycles, or if PVT lapse count exceeds 4 errors per session.',
            consultation_guidance:
              'AUTONOMOUS DELAYED-COMM PROTOCOL: 12.0 min one-way latency (24.0 min round-trip). Flight Surgeon consultation on Earth is asynchronous. Crew Medical Officer (CMO) authorized to execute countermeasures autonomously.',
            current_step: 'Act',
            steps: ['Collect', 'Assess', 'Explain', 'Act', 'Reassess'],
            reassessment: {
              status: 'ACTIVE',
              due_mission_day: 186,
              reassess_window_hours: 48,
              outcome: 'PENDING',
              action_taken_note: null,
              acknowledged_at: null,
            },
          },
        ]
      : [],
    operational_risk_records_count: isEva ? 1 : 0,
  };
}

export function buildDomainDetailsForScenario(scenarioId: string): Record<DomainId, DomainDetailResponse> {
  const isCircadian = scenarioId === 'circadian_drift_and_fatigue_01';
  const isPostAction = scenarioId === 'post_action_reassessment_improved';
  const isEva = scenarioId === 'eva_operational_incident_with_eclss_drift';

  const refDay = isCircadian ? 185 : isPostAction ? 187 : isEva ? 58 : 42;

  return {
    cardiovascular: {
      domain_id: 'cardiovascular',
      domain_category: 'PERSONAL_HEALTH',
      display_name: 'Cardiovascular & Hemodynamics',
      status: isCircadian ? 'ATTENTION' : 'NORMAL',
      measurement_scope_notice:
        'Biometric chest patch monitors resting heart rate and rhythm; stroke volume and vascular remodeling require scheduled ultrasound protocols.',
      cadence_policy: {
        expected_interval_hours: 2,
        stale_after_hours: 8,
        minimum_valid_samples_for_baseline: 10,
        expected_frequency_hours: 2,
        max_acceptable_gap_hours: 8,
        last_sample_elapsed_days: 0.1,
        collection_method: 'Continuous 3-lead biometric patch (telemetric burst)',
      },
      metrics: [
        {
          metric_name: 'resting_hr_bpm',
          unit: 'bpm',
          modality: 'OBJECTIVE_SENSOR',
          baseline: {
            window_label: '30-day Pre-Mission Baseline',
            is_validated_standard: true,
            mean: 62.0,
            std_dev: 2.2,
            sample_count: 60,
            reference_range_min: 55.0,
            reference_range_max: 72.0,
            unit: 'bpm',
          },
          series: isCircadian
            ? [
                { timestamp: '2026-11-08T07:30:00Z', mission_day: refDay - 6, value: 61.0, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-09T07:30:00Z', mission_day: refDay - 5, value: 62.0, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-10T07:30:00Z', mission_day: refDay - 4, value: 61.5, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-11T07:30:00Z', mission_day: refDay - 3, value: 64.0, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-12T07:30:00Z', mission_day: refDay - 2, value: 68.0, quality: 'VALID', provenance: 'SIMULATED' },
                {
                  timestamp: '2026-11-12T15:30:00Z',
                  mission_day: refDay - 2,
                  value: 142.0,
                  quality: 'SUSPECT',
                  provenance: 'SIMULATED',
                  note: 'Transitory motion artifact / post-cycle ergometer cool-down bleed into rest window.',
                },
                {
                  timestamp: '2026-11-13T07:30:00Z',
                  mission_day: refDay - 1,
                  value: null,
                  quality: 'MISSING',
                  provenance: 'SIMULATED',
                  note: 'Sensor contact loss during sleep rotation; telemetric packet dropped.',
                },
                { timestamp: '2026-11-14T17:00:00Z', mission_day: refDay, value: 75.0, quality: 'VALID', provenance: 'SIMULATED' },
              ]
            : [
                { timestamp: '2026-11-08T07:30:00Z', mission_day: refDay - 6, value: 61.2, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-09T07:30:00Z', mission_day: refDay - 5, value: 62.1, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-10T07:30:00Z', mission_day: refDay - 4, value: 61.9, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-11T07:30:00Z', mission_day: refDay - 3, value: 61.5, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-12T07:30:00Z', mission_day: refDay - 2, value: 62.0, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-13T07:30:00Z', mission_day: refDay - 1, value: 61.8, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-14T17:00:00Z', mission_day: refDay, value: 62.0, quality: 'VALID', provenance: 'SIMULATED' },
              ],
        },
      ],
    },
    sleep_circadian: {
      domain_id: 'sleep_circadian',
      domain_category: 'PERSONAL_HEALTH',
      display_name: 'Sleep & Circadian Alignment',
      status: isCircadian ? 'ATTENTION' : 'NORMAL',
      measurement_scope_notice:
        'Actigraphy and sleep logs track sleep duration and circadian phase shifts; they do not assess micro-arousals or cognitive sleep architecture.',
      cadence_policy: {
        expected_interval_hours: 24,
        stale_after_hours: 36,
        minimum_valid_samples_for_baseline: 7,
        expected_frequency_hours: 24,
        max_acceptable_gap_hours: 36,
        last_sample_elapsed_days: 0.3,
        collection_method: 'Continuous Actigraphy Wristband & Morning Sleep Log',
      },
      metrics: [
        {
          metric_name: 'sleep_duration_hours',
          unit: 'hours',
          modality: 'OBJECTIVE_SENSOR',
          baseline: {
            window_label: '30-day Pre-Mission Baseline',
            is_validated_standard: true,
            mean: 7.5,
            std_dev: 0.4,
            sample_count: 30,
            reference_range_min: 6.8,
            reference_range_max: 8.5,
            unit: 'hours',
          },
          series: isCircadian
            ? [
                { timestamp: '2026-11-08T06:45:00Z', mission_day: refDay - 6, value: 7.5, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-09T06:45:00Z', mission_day: refDay - 5, value: 7.4, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-10T06:45:00Z', mission_day: refDay - 4, value: null, quality: 'MISSING', provenance: 'SIMULATED', note: 'Actigraphy sensor battery depleted' },
                { timestamp: '2026-11-11T06:45:00Z', mission_day: refDay - 3, value: 14.5, quality: 'SUSPECT', provenance: 'SIMULATED', note: 'Optical sensor displaced; motion artifact' },
                { timestamp: '2026-11-12T06:45:00Z', mission_day: refDay - 2, value: 5.2, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-13T06:45:00Z', mission_day: refDay - 1, value: 4.8, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-14T06:45:00Z', mission_day: refDay, value: 4.3, quality: 'VALID', provenance: 'SIMULATED' },
              ]
            : isPostAction
            ? [
                { timestamp: '2026-11-08T06:45:00Z', mission_day: refDay - 6, value: 7.5, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-09T06:45:00Z', mission_day: refDay - 5, value: 7.4, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-10T06:45:00Z', mission_day: refDay - 4, value: 7.6, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-11T06:45:00Z', mission_day: refDay - 3, value: 7.5, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-12T07:00:00Z', mission_day: refDay - 2, value: 4.3, quality: 'VALID', provenance: 'SIMULATED', note: 'Initial trigger dip' },
                { timestamp: '2026-11-13T06:45:00Z', mission_day: refDay - 1, value: 6.2, quality: 'VALID', provenance: 'SIMULATED', note: 'Transition recovery sleep cycle' },
                { timestamp: '2026-11-14T07:00:00Z', mission_day: refDay, value: 7.7, quality: 'VALID', provenance: 'SIMULATED', note: 'Post-intervention follow-up sleep measurement' },
              ]
            : [
                { timestamp: '2026-11-08T06:45:00Z', mission_day: refDay - 6, value: 7.5, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-09T06:45:00Z', mission_day: refDay - 5, value: 7.4, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-10T06:45:00Z', mission_day: refDay - 4, value: 7.6, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-11T06:45:00Z', mission_day: refDay - 3, value: 7.3, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-12T06:45:00Z', mission_day: refDay - 2, value: 7.4, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-13T06:45:00Z', mission_day: refDay - 1, value: 7.6, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-14T06:45:00Z', mission_day: refDay, value: 7.5, quality: 'VALID', provenance: 'SIMULATED' },
              ],
        },
      ],
    },
    immune_microbio: {
      domain_id: 'immune_microbio',
      domain_category: 'PERSONAL_HEALTH',
      display_name: 'Immune System & Microbiome',
      status: isCircadian ? 'INSUFFICIENT_DATA' : 'NORMAL',
      status_reason: isCircadian
        ? 'Periodic saliva/blood biomarker panel overdue (expected every 14 days; last sample 420h ago).'
        : null,
      measurement_scope_notice:
        'Wearables do not directly measure immune competence or cytokine expression; requires dedicated bio-sample cartridge assays.',
      cadence_policy: {
        expected_interval_hours: 336,
        stale_after_hours: 336,
        minimum_valid_samples_for_baseline: 2,
        expected_frequency_hours: 336,
        max_acceptable_gap_hours: 336,
        last_sample_elapsed_days: isCircadian ? 17.5 : 2.0,
        collection_method: 'Saliva collection cartridge + capillary blood draw tube',
      },
      metrics: [
        {
          metric_name: 'crp_biomarker_mg_l',
          unit: 'mg/L',
          modality: 'LAB_ASSAY',
          baseline: {
            window_label: 'Cohort Baseline',
            is_validated_standard: true,
            mean: 0.85,
            std_dev: 0.12,
            sample_count: 14,
            reference_range_min: 0.5,
            reference_range_max: 1.5,
            unit: 'mg/L',
          },
          series: isCircadian
            ? [
                {
                  timestamp: '2026-10-28T09:00:00Z',
                  mission_day: refDay - 17,
                  value: 0.85,
                  quality: 'VALID',
                  provenance: 'SIMULATED',
                  note: 'Saliva sample collection kit depleted; pending deep-space replenishment protocol',
                },
              ]
            : [
                { timestamp: '2026-11-12T09:00:00Z', mission_day: refDay - 2, value: 0.82, quality: 'VALID', provenance: 'SIMULATED' },
              ],
        },
      ],
    },
    behavioral_psych: {
      domain_id: 'behavioral_psych',
      domain_category: 'PERSONAL_HEALTH',
      display_name: 'Behavioral Health & Cognition',
      status: isCircadian ? 'ATTENTION' : 'NORMAL',
      measurement_scope_notice:
        'Self-report mood surveys and Psychomotor Vigilance Tests (PVT) index acute alertness; they do not replace formal clinical psychiatric evaluation.',
      cadence_policy: {
        expected_interval_hours: 24,
        stale_after_hours: 48,
        minimum_valid_samples_for_baseline: 7,
        expected_frequency_hours: 24,
        max_acceptable_gap_hours: 48,
        last_sample_elapsed_days: 0.2,
        collection_method: 'Touchscreen PVT 10-minute battery & visual analog survey',
      },
      metrics: [
        {
          metric_name: 'cognitive_fatigue_score',
          unit: '/100',
          modality: 'SUBJECTIVE_REPORT',
          baseline: {
            window_label: 'Pre-flight baseline',
            is_validated_standard: true,
            mean: 15.0,
            std_dev: 1.2,
            sample_count: 14,
            reference_range_min: 0.0,
            reference_range_max: 30.0,
            unit: '/100',
          },
          series: [
            { timestamp: '2026-11-08T11:30:00Z', mission_day: refDay - 6, value: 14.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-09T11:30:00Z', mission_day: refDay - 5, value: 15.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-10T11:30:00Z', mission_day: refDay - 4, value: 14.5, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-11T11:30:00Z', mission_day: refDay - 3, value: 15.5, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-12T11:30:00Z', mission_day: refDay - 2, value: isCircadian ? 26.0 : 15.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-13T11:30:00Z', mission_day: refDay - 1, value: isCircadian ? 32.0 : 14.5, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-14T11:30:00Z', mission_day: refDay, value: isCircadian ? 36.0 : 15.0, quality: 'VALID', provenance: 'SIMULATED' },
          ],
        },
      ],
    },
    musculoskeletal: {
      domain_id: 'musculoskeletal',
      domain_category: 'PERSONAL_HEALTH',
      display_name: 'Musculoskeletal & Bone Mineral',
      status: 'NORMAL',
      measurement_scope_notice:
        'Daily ARED/T2 resistive force logs track exercise volume; they do not measure trabecular bone mineral density or muscle fiber atrophy directly.',
      cadence_policy: {
        expected_interval_hours: 24,
        stale_after_hours: 48,
        minimum_valid_samples_for_baseline: 7,
        expected_frequency_hours: 24,
        max_acceptable_gap_hours: 48,
        last_sample_elapsed_days: 0.2,
        collection_method: 'ARED / T2 exercise telemetry data logger',
      },
      metrics: [
        {
          metric_name: 'exercise_adherence_pct',
          unit: 'pct',
          modality: 'OBJECTIVE_SENSOR',
          baseline: {
            window_label: 'Target Protocol',
            is_validated_standard: true,
            mean: 95.0,
            std_dev: 3.0,
            sample_count: 30,
            reference_range_min: 85.0,
            reference_range_max: 100.0,
            unit: 'pct',
          },
          series: [
            { timestamp: '2026-11-08T14:15:00Z', mission_day: refDay - 6, value: 95.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-09T14:15:00Z', mission_day: refDay - 5, value: 96.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-10T14:15:00Z', mission_day: refDay - 4, value: 94.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-11T14:15:00Z', mission_day: refDay - 3, value: 95.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-12T14:15:00Z', mission_day: refDay - 2, value: 94.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-13T14:15:00Z', mission_day: refDay - 1, value: 95.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-14T14:15:00Z', mission_day: refDay, value: 95.0, quality: 'VALID', provenance: 'SIMULATED' },
          ],
        },
      ],
    },
    radiation: {
      domain_id: 'radiation',
      domain_category: 'PERSONAL_HEALTH',
      display_name: 'Radiation & Bio-dosimetry',
      status: 'NORMAL',
      measurement_scope_notice:
        'Active silicon dosimeters measure ambient ionizing radiation flux; personalized tissue damage requires cytogenetic translocation assays.',
      cadence_policy: {
        expected_interval_hours: 12,
        stale_after_hours: 24,
        minimum_valid_samples_for_baseline: 14,
        expected_frequency_hours: 12,
        max_acceptable_gap_hours: 24,
        last_sample_elapsed_days: 0.1,
        collection_method: 'Crew Passive Dosimeter & Area Radiation Monitor',
      },
      metrics: [
        {
          metric_name: 'daily_dose_msv',
          unit: 'mSv',
          modality: 'OBJECTIVE_SENSOR',
          baseline: {
            window_label: 'Mission Career Limits',
            is_validated_standard: true,
            mean: isCircadian || isPostAction ? 1.45 : 0.42,
            std_dev: 0.1,
            sample_count: 30,
            reference_range_min: 0.0,
            reference_range_max: 3.0,
            unit: 'mSv',
          },
          series: [
            { timestamp: '2026-11-08T16:00:00Z', mission_day: refDay - 6, value: isCircadian || isPostAction ? 1.45 : 0.42, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-09T16:00:00Z', mission_day: refDay - 5, value: isCircadian || isPostAction ? 1.45 : 0.42, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-10T16:00:00Z', mission_day: refDay - 4, value: isCircadian || isPostAction ? 1.45 : 0.42, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-11T16:00:00Z', mission_day: refDay - 3, value: isCircadian || isPostAction ? 1.45 : 0.42, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-12T16:00:00Z', mission_day: refDay - 2, value: isCircadian || isPostAction ? 1.45 : 0.42, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-13T16:00:00Z', mission_day: refDay - 1, value: isCircadian || isPostAction ? 1.45 : 0.42, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-14T16:00:00Z', mission_day: refDay, value: isCircadian || isPostAction ? 1.45 : 0.42, quality: 'VALID', provenance: 'SIMULATED' },
          ],
        },
      ],
    },
    sensorimotor_neuro: {
      domain_id: 'sensorimotor_neuro',
      domain_category: 'PERSONAL_HEALTH',
      display_name: 'Sensorimotor & Neurovestibular',
      status: 'NORMAL',
      measurement_scope_notice:
        'Dynamic balance and visual tracking test vestibular adaptation; intracranial fluid shifts and SANS require fundoscopy and OCT scans.',
      cadence_policy: {
        expected_interval_hours: 72,
        stale_after_hours: 120,
        minimum_valid_samples_for_baseline: 5,
        expected_frequency_hours: 72,
        max_acceptable_gap_hours: 120,
        last_sample_elapsed_days: 0.5,
        collection_method: 'Goggle-based dynamic visual tracking battery',
      },
      metrics: [
        {
          metric_name: 'postural_instability_score',
          unit: 'score',
          modality: 'SUBJECTIVE_REPORT',
          baseline: {
            window_label: 'Pre-flight baseline',
            is_validated_standard: true,
            mean: 1.5,
            std_dev: 0.3,
            sample_count: 14,
            reference_range_min: 1.0,
            reference_range_max: 3.0,
            unit: 'score',
          },
          series: [
            { timestamp: '2026-11-08T10:30:00Z', mission_day: refDay - 6, value: 1.5, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-09T10:30:00Z', mission_day: refDay - 5, value: 1.6, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-10T10:30:00Z', mission_day: refDay - 4, value: 1.4, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-11T10:30:00Z', mission_day: refDay - 3, value: 1.5, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-12T10:30:00Z', mission_day: refDay - 2, value: 1.6, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-13T10:30:00Z', mission_day: refDay - 1, value: 1.5, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-14T10:30:00Z', mission_day: refDay, value: 1.8, quality: 'VALID', provenance: 'SIMULATED' },
          ],
        },
      ],
    },
    nutrition: {
      domain_id: 'nutrition',
      domain_category: 'PERSONAL_HEALTH',
      display_name: 'Nutrition & Metabolic Hydration',
      status: 'NORMAL',
      measurement_scope_notice:
        'Barcoded food intake logs and mass measurement track macronutrient supply; micronutrient absorption requires blood laboratory assay.',
      cadence_policy: {
        expected_interval_hours: 24,
        stale_after_hours: 48,
        minimum_valid_samples_for_baseline: 7,
        expected_frequency_hours: 24,
        max_acceptable_gap_hours: 48,
        last_sample_elapsed_days: 0.3,
        collection_method: 'Barcode food galley scanner & mass measurement device',
      },
      metrics: [
        {
          metric_name: 'caloric_intake_kcal',
          unit: 'kcal',
          modality: 'SUBJECTIVE_REPORT',
          baseline: {
            window_label: 'Prescribed Intake Target',
            is_validated_standard: true,
            mean: 2800.0,
            std_dev: 100.0,
            sample_count: 30,
            reference_range_min: 2500.0,
            reference_range_max: 3100.0,
            unit: 'kcal',
          },
          series: [
            { timestamp: '2026-11-08T12:45:00Z', mission_day: refDay - 6, value: 2800.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-09T12:45:00Z', mission_day: refDay - 5, value: 2820.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-10T12:45:00Z', mission_day: refDay - 4, value: 2810.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-11T12:45:00Z', mission_day: refDay - 3, value: 2790.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-12T12:45:00Z', mission_day: refDay - 2, value: 2810.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-13T12:45:00Z', mission_day: refDay - 1, value: 2790.0, quality: 'VALID', provenance: 'SIMULATED' },
            { timestamp: '2026-11-14T12:45:00Z', mission_day: refDay, value: 2780.0, quality: 'VALID', provenance: 'SIMULATED' },
          ],
        },
      ],
    },
    environment_eclss: {
      domain_id: 'environment_eclss',
      domain_category: 'ENVIRONMENTAL_ECLSS',
      display_name: 'Cabin Environmental & ECLSS',
      status: isEva ? 'ATTENTION' : 'NORMAL',
      measurement_scope_notice:
        'Atmospheric telemetry reflects Node 2 bulk cabin air; localized dead zones and individual mask expiratory gases are monitored independently.',
      cadence_policy: {
        expected_interval_hours: 1,
        stale_after_hours: 2,
        minimum_valid_samples_for_baseline: 24,
        expected_frequency_hours: 1,
        max_acceptable_gap_hours: 2,
        last_sample_elapsed_days: 0.05,
        collection_method: 'MCA (Major Constituent Analyzer) & Atmospheric Sensors',
      },
      metrics: [
        {
          metric_name: 'co2_partial_pressure_mmhg',
          unit: 'mmHg',
          modality: 'ENVIRONMENTAL_SENSOR',
          baseline: {
            window_label: 'Flight Rule Standard',
            is_validated_standard: true,
            mean: 2.1,
            std_dev: 0.15,
            sample_count: 48,
            reference_range_min: 1.5,
            reference_range_max: 3.0,
            unit: 'mmHg',
          },
          series: isEva
            ? [
                { timestamp: '2026-11-08T12:00:00Z', mission_day: refDay - 6, value: 2.1, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-09T12:00:00Z', mission_day: refDay - 5, value: 2.2, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-10T12:00:00Z', mission_day: refDay - 4, value: 2.1, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-11T12:00:00Z', mission_day: refDay - 3, value: 2.0, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-12T12:00:00Z', mission_day: refDay - 2, value: 2.2, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-13T12:00:00Z', mission_day: refDay - 1, value: 2.1, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-14T10:00:00Z', mission_day: refDay, value: 2.3, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-14T15:00:00Z', mission_day: refDay, value: 3.2, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-14T16:00:00Z', mission_day: refDay, value: 3.6, quality: 'VALID', provenance: 'SIMULATED' },
                {
                  timestamp: '2026-11-14T17:00:00Z',
                  mission_day: refDay,
                  value: 3.8,
                  quality: 'VALID',
                  provenance: 'SIMULATED',
                  note: 'Secondary trace carbon dioxide scrubber bed inspection requested',
                },
              ]
            : [
                { timestamp: '2026-11-08T12:00:00Z', mission_day: refDay - 6, value: 2.1, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-09T12:00:00Z', mission_day: refDay - 5, value: 2.2, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-10T12:00:00Z', mission_day: refDay - 4, value: 2.1, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-11T12:00:00Z', mission_day: refDay - 3, value: 2.2, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-12T12:00:00Z', mission_day: refDay - 2, value: 2.1, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-13T12:00:00Z', mission_day: refDay - 1, value: 2.2, quality: 'VALID', provenance: 'SIMULATED' },
                { timestamp: '2026-11-14T17:00:00Z', mission_day: refDay, value: 2.2, quality: 'VALID', provenance: 'SIMULATED' },
              ],
        },
      ],
    },
  };
}

export const INITIAL_RISK_RECORDS_SCENARIO_4: OperationalRiskResponse[] = [
  {
    id: 'RISK-EVA-2026-001',
    astronaut_id: 'astro-101',
    timestamp: '2026-11-14T15:00:00Z',
    event_type: 'EVA_INJURY_PERFORMANCE',
    severity: 'MEDIUM',
    description:
      'Suit cooling loop delta-T micro-fluctuation during 6.5h EVA; astronaut reported acute right forearm cramping and glove thermal fatigue during airlock outer hatch torque closure.',
    mitigation_applied:
      'Crew assisted airlock repressurization accelerated; oral rehydration (750 mL) and thermal warm compress applied. Range of motion intact.',
    downlink_priority: 'HIGH',
    risk_type: 'EVA_INJURY_PERFORMANCE',
    risk_name: 'Suit Cooling Delta-T Fluctuation & Glove Thermal Fatigue',
    mission_day: 58,
    notes: 'Airlock repressurization completed; arm range of motion intact.',
    mitigation_status: 'Oral rehydration (750 mL) and warm compress applied.',
  },
];
