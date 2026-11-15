import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DomainCard, parseHeadlineMetric } from '../components/DomainCard';
import { DomainSummary } from '../types/api';

describe('DomainCard Component & Headline Metric Parser', () => {
  const onSelectMock = vi.fn();

  describe('parseHeadlineMetric utility', () => {
    it('returns null when status is INSUFFICIENT_DATA', () => {
      const domain: DomainSummary = {
        domain_id: 'immune_microbio',
        domain_category: 'PERSONAL_HEALTH',
        display_name: 'Immune Health',
        measurement_scope_notice: 'Assay surveillance only',
        status: 'INSUFFICIENT_DATA',
        completeness_pct: 35,
        headline_metric: null,
        status_reason: 'Assay overdue by 14 days',
      };
      expect(parseHeadlineMetric(domain)).toBeNull();
    });

    it('parses structured HeadlineMetricObject', () => {
      const domain: DomainSummary = {
        domain_id: 'cardiovascular',
        domain_category: 'PERSONAL_HEALTH',
        display_name: 'Cardiovascular Health',
        measurement_scope_notice: 'ECG patch only',
        status: 'ATTENTION',
        completeness_pct: 100,
        headline_metric: {
          name: 'resting_hr_bpm',
          label: 'Resting Heart Rate',
          value: 68.0,
          unit: 'bpm',
          baseline_mean: 59.5,
          delta_from_baseline_pct: 14.3,
          quality: 'VALID',
        },
        status_reason: 'Resting HR elevated',
      };

      const parsed = parseHeadlineMetric(domain);
      expect(parsed).not.toBeNull();
      expect(parsed?.value).toBe(68.0);
      expect(parsed?.unit).toBe('bpm');
      expect(parsed?.label).toBe('Resting Heart Rate');
      expect(parsed?.baseline_mean).toBe(59.5);
      expect(parsed?.delta_from_baseline_pct).toBe(14.3);
    });

    it('parses formatted string like "75.0 bpm (Baseline: 62.0 bpm, +21.0%)"', () => {
      const domain: DomainSummary = {
        domain_id: 'cardiovascular',
        domain_category: 'PERSONAL_HEALTH',
        display_name: 'Cardiovascular Health',
        measurement_scope_notice: 'ECG patch only',
        status: 'ATTENTION',
        completeness_pct: 95,
        headline_metric: '75.0 bpm (Baseline: 62.0 bpm, +21.0%)',
        status_reason: 'Statistical drift detected',
      };

      const parsed = parseHeadlineMetric(domain);
      expect(parsed).not.toBeNull();
      expect(parsed?.value).toBe(75.0);
      expect(parsed?.unit).toBe('bpm');
      expect(parsed?.baseline_mean).toBe(62.0);
      expect(parsed?.delta_from_baseline_pct).toBe(21.0);
    });

    it('parses raw metric key string with status_reason drift context', () => {
      const domain: DomainSummary = {
        domain_id: 'cardiovascular',
        domain_category: 'PERSONAL_HEALTH',
        display_name: 'Cardiovascular Health',
        measurement_scope_notice: 'ECG patch only',
        status: 'ATTENTION',
        completeness_pct: 100,
        headline_metric: 'resting_hr_bpm',
        status_reason: 'Statistical baseline drift detected: 3.73 standard deviations. Current: 68.0, Baseline: 59.5.',
      };

      const parsed = parseHeadlineMetric(domain);
      expect(parsed).not.toBeNull();
      expect(parsed?.value).toBe(68.0);
      expect(parsed?.unit).toBe('bpm');
      expect(parsed?.label).toBe('Resting Heart Rate');
      expect(parsed?.baseline_mean).toBe(59.5);
      expect(parsed?.delta_from_baseline_pct).toBe(14.3);
    });
  });

  describe('Component Rendering', () => {
    it('renders headline value, unit, label, baseline, and delta in tabular monospace when metric is present', () => {
      const domain: DomainSummary = {
        domain_id: 'cardiovascular',
        domain_category: 'PERSONAL_HEALTH',
        display_name: 'Cardiovascular Health',
        measurement_scope_notice: 'Physiological cardiovascular telemetry.',
        status: 'ATTENTION',
        completeness_pct: 100,
        headline_metric: {
          name: 'resting_hr_bpm',
          label: 'Resting Heart Rate',
          value: 68.0,
          unit: 'bpm',
          baseline_mean: 59.5,
          delta_from_baseline_pct: 14.3,
          quality: 'VALID',
        },
        status_reason: 'Resting HR elevated',
      };

      render(<DomainCard domain={domain} onSelect={onSelectMock} />);

      expect(screen.getByTestId('headline-value')).toHaveTextContent('68');
      expect(screen.getByTestId('headline-unit')).toHaveTextContent('bpm');
      expect(screen.getByTestId('headline-label')).toHaveTextContent(/resting heart rate/i);
      expect(screen.getByTestId('headline-delta')).toHaveTextContent('+14.3% vs baseline');
      expect(screen.getByTestId('headline-baseline')).toHaveTextContent('Baseline: 59.5 bpm');
    });

    it('strictly preserves INSUFFICIENT_DATA safety guardrail: shows surveillance gap notice and never renders 0 or NORMAL', () => {
      const domain: DomainSummary = {
        domain_id: 'immune_microbio',
        domain_category: 'PERSONAL_HEALTH',
        display_name: 'Immune System & Microbiome',
        measurement_scope_notice: 'Assay cartridges required.',
        status: 'INSUFFICIENT_DATA',
        completeness_pct: 32,
        headline_metric: null,
        status_reason: 'Periodic saliva/blood biomarker panel overdue (expected every 14 days; last sample 25 days ago).',
      };

      render(<DomainCard domain={domain} onSelect={onSelectMock} />);

      expect(screen.getByTestId('insufficient-data-notice')).toBeInTheDocument();
      expect(screen.getByText('SURVEILLANCE GAP DETECTED')).toBeInTheDocument();
      expect(
        screen.getByText(/Periodic saliva\/blood biomarker panel overdue/i)
      ).toBeInTheDocument();

      // Ensure zero / NORMAL values are never displayed
      expect(screen.queryByTestId('headline-value')).not.toBeInTheDocument();
      expect(screen.queryByText('NORMAL')).not.toBeInTheDocument();
    });
  });
});
