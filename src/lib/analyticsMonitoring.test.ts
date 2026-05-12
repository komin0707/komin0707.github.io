import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OBSERVABILITY_CONTROL_MANIFEST,
  registerPrivacyFriendlyAnalytics,
  trackPrivacyAnalyticsEvent,
  type PrivacyAnalyticsSnapshot,
} from './analyticsMonitoring';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('privacy-friendly analytics and observability controls', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    Reflect.deleteProperty(window, '__ventSimulatorAnalytics');
    delete document.documentElement.dataset.privacyAnalytics;
    delete document.documentElement.dataset.privacyAnalyticsStorage;
  });

  it('records page views, aggregate events, click maps, heat maps, scroll depth, conversions, and funnels', () => {
    const snapshots: PrivacyAnalyticsSnapshot[] = [];
    const handleAnalytics = (event: Event) => {
      snapshots.push((event as CustomEvent<PrivacyAnalyticsSnapshot>).detail);
    };
    window.addEventListener('vent-analytics', handleAnalytics);

    const cleanup = registerPrivacyFriendlyAnalytics({
      featureFlags: { waveformWorker: true },
      storageKey: 'test-analytics',
      variant: 'baseline-a',
    });

    const button = document.createElement('button');
    button.setAttribute('role', 'switch');
    document.body.append(button);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 145, clientY: 220 }));

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 250 });
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1000 });
    window.dispatchEvent(new Event('scroll'));

    trackPrivacyAnalyticsEvent({ conversion: true, funnelStep: 'scenario-started', name: 'scenario_start' });
    cleanup();

    expect(document.documentElement.dataset.privacyAnalytics).toBe('stopped');
    expect(window.__ventSimulatorAnalytics).toMatchObject({
      clickMap: { switch: 1 },
      conversions: { scenario_start: 1 },
      events: { click: 1, page_view: 1, scenario_start: 1, 'scroll-depth': 1 },
      featureFlags: { waveformWorker: true },
      funnel: { 'scenario-started': 1 },
      heatMap: { '1:2': 1 },
      pageViews: 1,
      sessionRecording: 'disabled',
      variant: 'baseline-a',
    });
    expect(window.__ventSimulatorAnalytics?.scrollDepthPercent).toBeGreaterThan(0);
    expect(sessionStorage.getItem('test-analytics')).toContain('"sessionRecording":"disabled"');
    expect(snapshots.length).toBeGreaterThanOrEqual(4);

    button.remove();
    window.removeEventListener('vent-analytics', handleAnalytics);
  });

  it('keeps analytics disabled without browser/runtime consent', () => {
    const cleanup = registerPrivacyFriendlyAnalytics({ enabled: false, storageKey: 'disabled-analytics' });

    expect(cleanup()).toBeUndefined();
    expect(sessionStorage.getItem('disabled-analytics')).toBeNull();
  });

  it('documents Section I analytics, operations, reliability, and Web Vitals coverage', () => {
    const manifest = OBSERVABILITY_CONTROL_MANIFEST;
    const alertsWorkflow = read('.github/workflows/alerts.yml');
    const observabilityRunbook = read('docs/OBSERVABILITY.md');
    const performanceBudget = read('scripts/assert-performance-budget.mjs');
    const lighthouseBudget = read('scripts/assert-lighthouse.mjs');
    const vercelObservability = read('src/lib/vercelObservability.ts');

    expect(manifest.analytics.privacyFriendly).toContain('no cookies');
    expect(manifest.analytics.pageViews).toContain('page view');
    expect(manifest.analytics.eventTracking).toContain('aggregate');
    expect(manifest.analytics.conversionTracking).toContain('conversion');
    expect(manifest.analytics.funnel).toContain('funnel');
    expect(manifest.analytics.heatMap).toContain('100px');
    expect(manifest.analytics.clickMap).toContain('coarse');
    expect(manifest.analytics.scrollDepth).toContain('percentage');
    expect(manifest.analytics.sessionRecording).toContain('disabled');
    expect(manifest.analytics.abTesting).toContain('variant');
    expect(manifest.analytics.featureFlags).toContain('boolean');
    expect(manifest.operations.alerting).toContain('GitHub issue');
    expect(manifest.operations.distributedTracing).toContain('not applicable');
    expect(manifest.operations.onCallRotation).toContain('not applicable');
    expect(manifest.reliability.slo).toContain('99.9%');
    expect(manifest.reliability.availability9999).toContain('stretch');
    expect(manifest.webVitals.lcp).toContain('2.5s');
    expect(manifest.webVitals.fid).toContain('100ms');
    expect(manifest.webVitals.inp).toContain('200ms');
    expect(manifest.webVitals.ttfb).toContain('800ms');
    expect(manifest.webVitals.webPageTest).toContain('95+');
    expect(manifest.webVitals.pageSpeedInsights).toContain('95+');
    expect(alertsWorkflow).toContain('workflow_run:');
    expect(alertsWorkflow).toContain("labels: ['alert', 'ci-failure']");
    expect(observabilityRunbook).toContain('MTTR target');
    expect(performanceBudget).toContain('lcp: 2500');
    expect(performanceBudget).toContain('fid: 100');
    expect(performanceBudget).toContain('cls: 0.1');
    expect(performanceBudget).toContain('tbt: 200');
    expect(lighthouseBudget).toContain('performance: 0.9');
    expect(lighthouseBudget).toContain('speedIndexMs: 5000');
    expect(vercelObservability).toContain('/_vercel/speed-insights/script.js');
  });
});
