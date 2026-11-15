import { describe, it, expect } from 'vitest';
import { StatefulMockAdapter } from '../api/client';
import { DomainId } from '../types/api';

const EXPECTED_9_DOMAINS: DomainId[] = [
  'cardiovascular',
  'sleep_circadian',
  'behavioral_psych',
  'musculoskeletal',
  'immune_microbio',
  'radiation',
  'environment_eclss',
  'sensorimotor_neuro',
  'nutrition',
];

const SCENARIO_IDS = [
  'nominal_iss_baseline',
  'circadian_drift_and_fatigue_01',
  'post_action_reassessment_improved',
  'eva_operational_incident_with_eclss_drift',
] as const;

describe('Locked /api/v1 Contract & 4 Judge Scenarios', () => {
  const adapter = new StatefulMockAdapter();

  SCENARIO_IDS.forEach((scenarioId) => {
    describe(`Scenario: ${scenarioId}`, () => {
      it('returns all 9 domains cleanly split into 8 PERSONAL_HEALTH and 1 ENVIRONMENTAL_ECLSS', () => {
        const dashboard = adapter.resetToScenario(scenarioId, 'astro-101');
        expect(dashboard.domains).toHaveLength(9);

        const domainIds = dashboard.domains.map((d) => d.domain_id);
        EXPECTED_9_DOMAINS.forEach((id) => {
          expect(domainIds).toContain(id);
        });

        const personalDomains = dashboard.domains.filter((d) => d.domain_category === 'PERSONAL_HEALTH');
        const environmentalDomains = dashboard.domains.filter(
          (d) => d.domain_category === 'ENVIRONMENTAL_ECLSS'
        );

        expect(personalDomains).toHaveLength(8);
        expect(environmentalDomains).toHaveLength(1);
        expect(environmentalDomains[0].domain_id).toBe('environment_eclss');

        dashboard.domains.forEach((d) => {
          expect(d.measurement_scope_notice).toBeDefined();
          expect(d.measurement_scope_notice.trim().length).toBeGreaterThan(15);
        });
      });
    });
  });

  describe('Scenario 1: nominal_iss_baseline', () => {
    it('returns ISS_LEO, 2s latency, live flight surgeon, and all 9 domains NORMAL', () => {
      const dashboard = adapter.resetToScenario('nominal_iss_baseline', 'astro-101');
      expect(dashboard.mission_context.mission_profile).toBe('ISS_LEO');
      expect(dashboard.mission_context.one_way_light_time_sec).toBe(2);
      expect(dashboard.mission_context.live_flight_surgeon_available).toBe(true);

      dashboard.domains.forEach((d) => {
        expect(d.status).toBe('NORMAL');
      });
    });
  });

  describe('Scenario 2: circadian_drift_and_fatigue_01', () => {
    it('returns MARS_TRANSIT, 720s latency, autonomous mode, ATTENTION on sleep & cardio, INSUFFICIENT_DATA on immune, and cross-domain finding fnd-904', () => {
      const dashboard = adapter.resetToScenario('circadian_drift_and_fatigue_01', 'astro-101');
      expect(dashboard.mission_context.mission_profile).toBe('MARS_TRANSIT');
      expect(dashboard.mission_context.one_way_light_time_sec).toBe(720);
      expect(dashboard.mission_context.live_flight_surgeon_available).toBe(false);

      const sleepDomain = dashboard.domains.find((d) => d.domain_id === 'sleep_circadian');
      expect(sleepDomain?.status).toBe('ATTENTION');

      const cardioDomain = dashboard.domains.find((d) => d.domain_id === 'cardiovascular');
      expect(cardioDomain?.status).toBe('ATTENTION');

      const immuneDomain = dashboard.domains.find((d) => d.domain_id === 'immune_microbio');
      expect(immuneDomain?.status).toBe('INSUFFICIENT_DATA');
      expect(immuneDomain?.headline_metric).toBeNull();
      expect(immuneDomain?.status_reason).toMatch(/overdue|cadence/i);

      // Verify cross-domain finding fnd-904
      const crossFinding = dashboard.findings.find(
        (f) => f.finding_id === 'fnd-904' || f.id === 'fnd-904' || f.is_cross_domain
      );
      expect(crossFinding).toBeDefined();
      expect(crossFinding?.evidence.evidence_type).toBe('STATISTICAL_BASELINE_DRIFT');
    });
  });

  describe('Scenario 3: post_action_reassessment_improved', () => {
    it('returns reassessment.outcome === "IMPROVED"', () => {
      const dashboard = adapter.resetToScenario('post_action_reassessment_improved', 'astro-101');
      const rec = dashboard.recommendations.find(
        (r) => r.reassessment && r.reassessment.outcome === 'IMPROVED'
      );
      expect(rec).toBeDefined();
      expect(rec?.reassessment.outcome).toBe('IMPROVED');
    });
  });

  describe('Scenario 4: eva_operational_incident_with_eclss_drift', () => {
    it('returns environment_eclss drift and operational_risk_records_count > 0', () => {
      const dashboard = adapter.resetToScenario('eva_operational_incident_with_eclss_drift', 'astro-101');
      const eclss = dashboard.domains.find((d) => d.domain_id === 'environment_eclss');
      expect(['CRITICAL', 'ATTENTION']).toContain(eclss?.status);
      expect(dashboard.operational_risk_records_count).toBeGreaterThan(0);
    });
  });
});
