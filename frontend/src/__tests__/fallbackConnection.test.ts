import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ConnectionState } from '../api/client';

describe('Backend-First Auto-Fallback & Connection State', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes a valid connection state', () => {
    const state = apiClient.getConnectionState();
    expect(['LIVE_BACKEND', 'HARDCODED_MOCK_FALLBACK']).toContain(state);
  });

  it('notifies listeners when connection state changes', async () => {
    let observedState: ConnectionState | null = null;
    const unsubscribe = apiClient.onConnectionStateChange((newState) => {
      observedState = newState;
    });

    // Mock fetch failing to simulate offline backend
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await apiClient.retryConnection();
    expect(observedState).toBe('HARDCODED_MOCK_FALLBACK');
    expect(apiClient.getConnectionState()).toBe('HARDCODED_MOCK_FALLBACK');
    expect(apiClient.isMockActive()).toBe(true);

    unsubscribe();
  });

  it('automatically falls back to mock data when live backend is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    const astronauts = await apiClient.getAstronauts();
    expect(Array.isArray(astronauts)).toBe(true);
    expect(astronauts.length).toBeGreaterThan(0);
    expect(astronauts[0].id).toBe('astro-101');
    expect(apiClient.getConnectionState()).toBe('HARDCODED_MOCK_FALLBACK');

    const dashboard = await apiClient.getDashboard('astro-101');
    expect(dashboard).toBeDefined();
    expect(dashboard.domains).toHaveLength(9);
  });

  it('transitions to LIVE_BACKEND when retryConnection succeeds against /health', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'HEALTHY' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const newState = await apiClient.retryConnection();
    expect(newState).toBe('LIVE_BACKEND');
    expect(apiClient.getConnectionState()).toBe('LIVE_BACKEND');
    expect(apiClient.isMockActive()).toBe(false);
  });
});
