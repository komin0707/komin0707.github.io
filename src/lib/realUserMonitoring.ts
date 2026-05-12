import { isBrowserRuntime } from './runtime';

export type RealUserMetricsSnapshot = {
  cumulativeLayoutShift: number;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  longTaskTotal: number;
  observedAt: number;
};

type RealUserMonitoringOptions = {
  enabled?: boolean;
  storageKey?: string;
};

type LayoutShiftEntry = PerformanceEntry & {
  hadRecentInput?: boolean;
  value?: number;
};

declare global {
  interface Window {
    __ventSimulatorRum?: Readonly<RealUserMetricsSnapshot>;
  }
}

const DEFAULT_STORAGE_KEY = 'vent-simulator-rum';
const RUM_EVENT_NAME = 'vent-simulator-rum';

const createInitialMetrics = (): RealUserMetricsSnapshot => ({
  cumulativeLayoutShift: 0,
  firstContentfulPaint: null,
  largestContentfulPaint: null,
  longTaskTotal: 0,
  observedAt: Date.now(),
});

const readNumberProperty = (entry: PerformanceEntry, key: string): number | null => {
  const value = (entry as unknown as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const publishMetrics = (metrics: RealUserMetricsSnapshot, storageKey: string): void => {
  metrics.observedAt = Date.now();
  window.__ventSimulatorRum = { ...metrics };

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(metrics));
  } catch {
    document.documentElement.dataset.realUserMonitoringStorage = 'blocked';
  }

  window.dispatchEvent(new CustomEvent<RealUserMetricsSnapshot>(RUM_EVENT_NAME, { detail: { ...metrics } }));
};

const observeEntryType = (
  entryType: string,
  callback: PerformanceObserverCallback,
): PerformanceObserver | null => {
  if (!Array.isArray(PerformanceObserver.supportedEntryTypes)) {
    return null;
  }

  if (!PerformanceObserver.supportedEntryTypes.includes(entryType)) {
    return null;
  }

  try {
    const observer = new PerformanceObserver(callback);
    observer.observe({ type: entryType, buffered: true });
    return observer;
  } catch {
    document.documentElement.dataset.realUserMonitoring = 'partial';
    return null;
  }
};

const createRumObservers = (metrics: RealUserMetricsSnapshot, storageKey: string): PerformanceObserver[] => {
  const paintObserver = observeEntryType('paint', (entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
        publishMetrics(metrics, storageKey);
      }
    }
  });

  const largestContentfulPaintObserver = observeEntryType('largest-contentful-paint', (entryList) => {
    for (const entry of entryList.getEntries()) {
      metrics.largestContentfulPaint = entry.startTime;
      publishMetrics(metrics, storageKey);
    }
  });

  const layoutShiftObserver = observeEntryType('layout-shift', (entryList) => {
    for (const entry of entryList.getEntries() as LayoutShiftEntry[]) {
      if (entry.hadRecentInput === true) {
        continue;
      }

      metrics.cumulativeLayoutShift += entry.value ?? 0;
      publishMetrics(metrics, storageKey);
    }
  });

  const longTaskObserver = observeEntryType('longtask', (entryList) => {
    for (const entry of entryList.getEntries()) {
      metrics.longTaskTotal += readNumberProperty(entry, 'duration') ?? entry.duration;
      publishMetrics(metrics, storageKey);
    }
  });

  return [paintObserver, largestContentfulPaintObserver, layoutShiftObserver, longTaskObserver].filter(
    (observer): observer is PerformanceObserver => observer !== null,
  );
};

export function registerRealUserMonitoring({
  enabled = true,
  storageKey = DEFAULT_STORAGE_KEY,
}: RealUserMonitoringOptions = {}): () => void {
  if (!isBrowserRuntime()) {
    return () => undefined;
  }

  if (!enabled || typeof PerformanceObserver === 'undefined') {
    document.documentElement.dataset.realUserMonitoring = 'unsupported';
    return () => undefined;
  }

  const metrics = createInitialMetrics();
  const observers = createRumObservers(metrics, storageKey);

  document.documentElement.dataset.realUserMonitoring = observers.length > 0 ? 'active' : 'unsupported';
  publishMetrics(metrics, storageKey);

  return () => {
    for (const observer of observers) {
      observer.disconnect();
    }
    document.documentElement.dataset.realUserMonitoring = 'stopped';
  };
}
