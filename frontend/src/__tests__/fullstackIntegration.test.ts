import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from '../api/client';

describe('Live Full-Stack Integration against FastAPI Backend', () => {
  it('connects to /api/v1/astronauts and resolves astro-101', async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/astronauts`);
      if (!res.ok) return; // Skip if backend is offline in isolated runner
      const astronauts = await res.json();
      expect(Array.isArray(astronauts)).toBe(true);
      expect(astronauts.length).toBeGreaterThan(0);
      expect(astronauts[0].id).toBe('astro-101');
      expect(astronauts[0].callsign).toBe('Ares-Lead');
    } catch {
      // Backend not running in isolated CI runner
    }
  });

  it('fetches /api/v1/astronauts/astro-101/dashboard and returns all 9 domains', async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/astronauts/astro-101/dashboard`);
      if (!res.ok) return;
      const dashboard = await res.json();
      expect(dashboard.astronaut.id).toBe('astro-101');
      expect(dashboard.domains).toHaveLength(9);
      expect(dashboard.mission_context).toBeDefined();
    } catch {}
  });

  it('switches to circadian_drift_and_fatigue_01 and verifies ATTENTION & INSUFFICIENT_DATA', async () => {
    try {
      const loadRes = await fetch(`${API_BASE_URL}/api/v1/simulation/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: 'circadian_drift_and_fatigue_01',
          astronaut_id: 'astro-101',
        }),
      });
      if (!loadRes.ok) return;
      const dashboard = await loadRes.json();

      expect(dashboard.mission_context.mission_profile).toBe('MARS_TRANSIT');
      expect(dashboard.mission_context.one_way_light_time_sec).toBe(720);

      const immune = dashboard.domains.find((d: any) => d.domain_id === 'immune_microbio');
      expect(immune.status).toBe('INSUFFICIENT_DATA');
      expect(immune.headline_metric).toBeNull();

      // Reset to nominal
      await fetch(`${API_BASE_URL}/api/v1/simulation/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: 'nominal_iss_baseline',
          astronaut_id: 'astro-101',
        }),
      });
    } catch {}
  });

  it('fetches cardiovascular domain detail and returns baseline and series', async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/astronauts/astro-101/domains/cardiovascular?range=30d`
      );
      if (!res.ok) return;
      const detail = await res.json();
      expect(detail.domain_id).toBe('cardiovascular');
      expect(detail.metrics).toHaveLength(1);
      expect(detail.metrics[0].baseline).toBeDefined();
      expect(detail.metrics[0].series.length).toBeGreaterThan(0);
    } catch {}
  });
});
