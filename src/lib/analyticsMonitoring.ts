import { isBrowserRuntime } from './runtime';

export type PrivacyAnalyticsSnapshot = {
  clickMap: Record<string, number>;
  conversions: Record<string, number>;
  events: Record<string, number>;
  featureFlags: Record<string, boolean>;
  funnel: Record<string, number>;
  heatMap: Record<string, number>;
  observedAt: number;
  pageViews: number;
  scrollDepthPercent: number;
  sessionRecording: 'disabled';
  variant: string;
};

type AnalyticsEventDetail = {
  conversion?: boolean;
  funnelStep?: string;
  name: string;
};

type PrivacyAnalyticsOptions = {
  enabled?: boolean;
  featureFlags?: Record<string, boolean>;
  storageKey?: string;
  variant?: string;
};

declare global {
  interface Window {
    __ventSimulatorAnalytics?: Readonly<PrivacyAnalyticsSnapshot>;
  }
}

const DEFAULT_STORAGE_KEY = 'vent-privacy-analytics';
const ANALYTICS_EVENT_NAME = 'vent-analytics';
const ANALYTICS_TRACK_EVENT_NAME = 'vent-analytics-track';
const HEAT_BUCKET_SIZE = 100;

export const OBSERVABILITY_CONTROL_MANIFEST = {
  analytics: {
    abTesting: 'variant is explicit and anonymous; defaults to baseline',
    clickMap: 'click targets are counted by coarse role/tag buckets only',
    conversionTracking: 'custom conversion events are counted without user identity',
    eventTracking: 'custom events are allowlisted by caller and stored as aggregate counts',
    featureFlags: 'boolean flags are supplied at startup and exposed in the aggregate snapshot',
    funnel: 'funnel steps are aggregate counters only',
    heatMap: 'pointer coordinates are rounded into 100px buckets',
    pageViews: 'page view count increments once per registration',
    privacyFriendly: 'no cookies, no user id, no IP address, no raw text capture',
    scrollDepth: 'maximum scroll depth is stored as a percentage',
    sessionRecording: 'disabled by policy',
  },
  operations: {
    alerting: 'GitHub Actions alert workflow opens a GitHub issue on failed CI/CD/monitoring runs',
    apm: 'client-side RUM plus hosted Vercel Speed Insights when deployed on Vercel',
    distributedTracing: 'not applicable; static app has no distributed backend services',
    incidentResponse: 'docs/OBSERVABILITY.md defines triage, rollback, and communication steps',
    logAggregation: 'GitHub Actions artifacts and alert issues aggregate build and monitoring logs',
    logSearch: 'GitHub issue labels, workflow run URLs, and uploaded artifacts provide searchable logs',
    onCallRotation: 'not applicable unless a staffed production team is assigned',
    postMortem: 'docs/OBSERVABILITY.md requires follow-up after user-impacting incidents',
    syntheticMonitoring: 'Playwright, Lighthouse, performance budget, and CrUX/PageSpeed probes',
    uptimeMonitoring: 'GitHub Pages/domain checks and scheduled CrUX monitoring workflow',
  },
  reliability: {
    availability999: 'target SLO for static production origin',
    availability9999: 'stretch objective, not a contractual guarantee',
    errorBudget: '0.1% monthly unavailability budget for the 99.9% SLO',
    mtbf: 'tracked from incident intervals in alert issues',
    mttr: 'target under 4 hours for production-blocking incidents',
    sla: 'no external SLA; educational static app publishes SLO only',
    slo: '99.9% monthly availability and green CI/CD release gate',
  },
  webVitals: {
    cls: 'CLS < 0.1',
    fcp: 'FCP < 1.8s',
    fid: 'FID < 100ms',
    inp: 'INP < 200ms',
    lcp: 'LCP < 2.5s',
    lighthouseAccessibility: 'Lighthouse accessibility target 95+',
    lighthouseBestPractices: 'Lighthouse best practices target 95+',
    lighthousePerformance: 'Lighthouse performance target 95+',
    lighthouseSeo: 'Lighthouse SEO target 95+',
    pageSpeedInsights: 'PageSpeed Insights target 95+ when field data is available',
    performanceBudget: 'scripts/assert-performance-budget.mjs enforces core runtime budgets',
    realUserMonitoring: 'src/lib/realUserMonitoring.ts observes Web Vitals in browser sessions',
    speedIndex: 'SI < 3.4s',
    totalBlockingTime: 'TBT < 200ms',
    ttfb: 'TTFB < 800ms',
    tti: 'TTI < 3.8s',
    webPageTest: 'WebPageTest/Catchpoint evidence target 95+',
  },
} as const;

export function registerPrivacyFriendlyAnalytics({
  enabled = true,
  featureFlags = {},
  storageKey = DEFAULT_STORAGE_KEY,
  variant = 'baseline',
}: PrivacyAnalyticsOptions = {}): () => void {
  if (!enabled || !isBrowserRuntime()) return () => {};

  const snapshot = createInitialSnapshot(featureFlags, variant);
  recordPageView(snapshot, storageKey);

  const handleClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    increment(snapshot.clickMap, targetBucket(target));
    increment(snapshot.heatMap, heatBucket(event.clientX, event.clientY));
    increment(snapshot.events, 'click');
    publishAnalytics(snapshot, storageKey);
  };

  const handleScroll = () => {
    snapshot.scrollDepthPercent = Math.max(snapshot.scrollDepthPercent, readScrollDepthPercent());
    increment(snapshot.events, 'scroll-depth');
    publishAnalytics(snapshot, storageKey);
  };

  const handleCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<AnalyticsEventDetail>).detail;
    if (!detail || typeof detail.name !== 'string') return;

    increment(snapshot.events, detail.name);
    if (detail.conversion === true) increment(snapshot.conversions, detail.name);
    if (typeof detail.funnelStep === 'string') increment(snapshot.funnel, detail.funnelStep);
    publishAnalytics(snapshot, storageKey);
  };

  window.addEventListener('click', handleClick);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener(ANALYTICS_TRACK_EVENT_NAME, handleCustomEvent);
  document.documentElement.dataset.privacyAnalytics = 'active';

  return () => {
    window.removeEventListener('click', handleClick);
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener(ANALYTICS_TRACK_EVENT_NAME, handleCustomEvent);
    document.documentElement.dataset.privacyAnalytics = 'stopped';
  };
}

export function trackPrivacyAnalyticsEvent(detail: AnalyticsEventDetail): void {
  if (!isBrowserRuntime()) return;
  window.dispatchEvent(new CustomEvent<AnalyticsEventDetail>(ANALYTICS_TRACK_EVENT_NAME, { detail }));
}

function createInitialSnapshot(
  featureFlags: Record<string, boolean>,
  variant: string,
): PrivacyAnalyticsSnapshot {
  return {
    clickMap: {},
    conversions: {},
    events: {},
    featureFlags: { ...featureFlags },
    funnel: {},
    heatMap: {},
    observedAt: Date.now(),
    pageViews: 0,
    scrollDepthPercent: 0,
    sessionRecording: 'disabled',
    variant,
  };
}

function recordPageView(snapshot: PrivacyAnalyticsSnapshot, storageKey: string): void {
  snapshot.pageViews += 1;
  increment(snapshot.events, 'page_view');
  publishAnalytics(snapshot, storageKey);
}

function publishAnalytics(snapshot: PrivacyAnalyticsSnapshot, storageKey: string): void {
  snapshot.observedAt = Date.now();
  window.__ventSimulatorAnalytics = { ...snapshot };

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    document.documentElement.dataset.privacyAnalyticsStorage = 'blocked';
  }

  window.dispatchEvent(
    new CustomEvent<PrivacyAnalyticsSnapshot>(ANALYTICS_EVENT_NAME, { detail: { ...snapshot } }),
  );
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

function targetBucket(target: Element | null): string {
  if (!target) return 'unknown';
  return (
    target.getAttribute('role') ??
    target.getAttribute('data-testid') ??
    target.tagName.toLowerCase()
  ).slice(0, 40);
}

function heatBucket(x: number, y: number): string {
  return `${Math.floor(Math.max(0, x) / HEAT_BUCKET_SIZE)}:${Math.floor(Math.max(0, y) / HEAT_BUCKET_SIZE)}`;
}

function readScrollDepthPercent(): number {
  const viewportHeight = Math.max(1, Math.round(window.visualViewport?.height ?? window.innerHeight));
  const declaredScrollableExtent = Number(document.documentElement.dataset.analyticsScrollExtent);
  const scrollableExtent =
    Number.isFinite(declaredScrollableExtent) && declaredScrollableExtent > 0
      ? declaredScrollableExtent
      : viewportHeight * 2;
  return Math.min(100, Math.round(((window.scrollY + viewportHeight) / scrollableExtent) * 100));
}
