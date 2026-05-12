import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type RealUserMetricsSnapshot, registerRealUserMonitoring } from './realUserMonitoring';

const originalPerformanceObserver = globalThis.PerformanceObserver;
const originalSessionStorage = window.sessionStorage;
const OBSERVED_ENTRY_TYPE_COUNT = 4;
const FIRST_CONTENTFUL_PAINT_MS = 128;
const LARGEST_CONTENTFUL_PAINT_MS = 768;
const ACCEPTED_LAYOUT_SHIFT = 0.04;
const RECENT_INPUT_LAYOUT_SHIFT = 0.9;
const LONG_TASK_START_MS = 900;
const LONG_TASK_DURATION_MS = 52;

type ObserverRecord = {
  callback: PerformanceObserverCallback;
  disconnect: ReturnType<typeof vi.fn<() => void>>;
  observedTypes: string[];
};

const observerRecords: ObserverRecord[] = [];

const createEntry = (entryType: string, name: string, startTime: number, duration = 0): PerformanceEntry => ({
  duration,
  entryType,
  name,
  startTime,
  toJSON: () => ({ duration, entryType, name, startTime }),
});

const createLayoutShiftEntry = (value: number, hadRecentInput: boolean): PerformanceEntry =>
  ({
    ...createEntry('layout-shift', '', 0),
    hadRecentInput,
    value,
  }) as PerformanceEntry;

const createLayoutShiftEntryWithoutValue = (): PerformanceEntry =>
  ({
    ...createEntry('layout-shift', '', 0),
    hadRecentInput: false,
  }) as PerformanceEntry;

const createTogglingDurationEntry = (fallbackDuration: number): PerformanceEntry => {
  let reads = 0;
  return {
    entryType: 'longtask',
    name: 'self',
    startTime: LONG_TASK_START_MS,
    toJSON: () => ({ duration: fallbackDuration }),
    get duration() {
      reads += 1;
      return reads === 1 ? Number.NaN : fallbackDuration;
    },
  };
};

const createEntryList = (entries: PerformanceEntry[]): PerformanceObserverEntryList => ({
  getEntries: () => entries,
  getEntriesByName: (name: string, type?: string) =>
    entries.filter((entry) => entry.name === name && (!type || entry.entryType === type)),
  getEntriesByType: (type: string) => entries.filter((entry) => entry.entryType === type),
});

class MockPerformanceObserver implements PerformanceObserver {
  static supportedEntryTypes = ['paint', 'largest-contentful-paint', 'layout-shift', 'longtask'];

  private readonly record: ObserverRecord;

  constructor(callback: PerformanceObserverCallback) {
    this.record = { callback, disconnect: vi.fn<() => void>(), observedTypes: [] };
    observerRecords.push(this.record);
  }

  disconnect(): void {
    this.record.disconnect();
  }

  observe(options?: PerformanceObserverInit): void {
    if (options?.type) {
      this.record.observedTypes.push(options.type);
    }
  }

  takeRecords(): PerformanceEntryList {
    return [];
  }
}

const installMockPerformanceObserver = (): void => {
  Object.defineProperty(globalThis, 'PerformanceObserver', {
    configurable: true,
    value: MockPerformanceObserver,
  });
};

const installPerformanceObserver = (value: typeof PerformanceObserver): void => {
  Object.defineProperty(globalThis, 'PerformanceObserver', {
    configurable: true,
    value,
  });
};

const emitEntries = (entryType: string, entries: PerformanceEntry[]): void => {
  const record = observerRecords.find((candidate) => candidate.observedTypes.includes(entryType));
  expect(record).toBeDefined();

  if (record) {
    record.callback(createEntryList(entries), new MockPerformanceObserver(record.callback));
    observerRecords.pop();
  }
};

function emitWebVitalsEntries(): void {
  emitEntries('paint', [createEntry('paint', 'first-contentful-paint', FIRST_CONTENTFUL_PAINT_MS)]);
  emitEntries('paint', [createEntry('paint', 'other-paint', FIRST_CONTENTFUL_PAINT_MS)]);
  emitEntries('largest-contentful-paint', [
    createEntry('largest-contentful-paint', 'largest-contentful-paint', LARGEST_CONTENTFUL_PAINT_MS),
  ]);
  emitEntries('layout-shift', [
    createLayoutShiftEntry(ACCEPTED_LAYOUT_SHIFT, false),
    createLayoutShiftEntry(RECENT_INPUT_LAYOUT_SHIFT, true),
    createLayoutShiftEntryWithoutValue(),
  ]);
  emitEntries('longtask', [
    createEntry('longtask', 'self', LONG_TASK_START_MS, LONG_TASK_DURATION_MS),
    createTogglingDurationEntry(LONG_TASK_DURATION_MS),
  ]);
}

describe('real user monitoring', () => {
  beforeEach(() => {
    observerRecords.length = 0;
    sessionStorage.clear();
    Reflect.deleteProperty(window, '__ventSimulatorRum');
    delete document.documentElement.dataset.realUserMonitoring;
    installMockPerformanceObserver();
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalPerformanceObserver) {
      Object.defineProperty(globalThis, 'PerformanceObserver', {
        configurable: true,
        value: originalPerformanceObserver,
      });
    } else {
      Reflect.deleteProperty(globalThis, 'PerformanceObserver');
    }

    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: originalSessionStorage,
    });
    sessionStorage.clear();
    Reflect.deleteProperty(window, '__ventSimulatorRum');
    delete document.documentElement.dataset.realUserMonitoring;
    delete document.documentElement.dataset.realUserMonitoringStorage;
  });

  registerWebVitalsObservationTests();
  registerUnsupportedRuntimeTests();
  registerObserverCompatibilityTests();
  registerStorageFailureTests();
});

function registerWebVitalsObservationTests(): void {
  it('observes Web Vitals entries and publishes snapshots', () => {
    const events: RealUserMetricsSnapshot[] = [];
    const handleRumEvent = (event: Event): void => {
      events.push((event as CustomEvent<RealUserMetricsSnapshot>).detail);
    };

    window.addEventListener('vent-simulator-rum', handleRumEvent);
    const cleanup = registerRealUserMonitoring({ storageKey: 'test-rum' });

    expect(document.documentElement.dataset.realUserMonitoring).toBe('active');
    expect(observerRecords.flatMap((record) => record.observedTypes)).toEqual([
      'paint',
      'largest-contentful-paint',
      'layout-shift',
      'longtask',
    ]);

    emitWebVitalsEntries();

    expect(window.__ventSimulatorRum).toMatchObject({
      cumulativeLayoutShift: ACCEPTED_LAYOUT_SHIFT,
      firstContentfulPaint: FIRST_CONTENTFUL_PAINT_MS,
      largestContentfulPaint: LARGEST_CONTENTFUL_PAINT_MS,
      longTaskTotal: LONG_TASK_DURATION_MS * 2,
    });
    expect(sessionStorage.getItem('test-rum')).toContain('"largestContentfulPaint":768');
    expect(events.at(-1)).toMatchObject({ longTaskTotal: LONG_TASK_DURATION_MS * 2 });

    cleanup();

    expect(
      observerRecords
        .slice(0, OBSERVED_ENTRY_TYPE_COUNT)
        .every((record) => record.disconnect.mock.calls.length === 1),
    ).toBe(true);
    expect(document.documentElement.dataset.realUserMonitoring).toBe('stopped');
    window.removeEventListener('vent-simulator-rum', handleRumEvent);
  });
}

function registerUnsupportedRuntimeTests(): void {
  it('returns a no-op cleanup outside browser runtime', () => {
    const originalWindow = window;
    const originalDocument = document;

    Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: undefined });

    try {
      const cleanup = registerRealUserMonitoring();

      expect(cleanup()).toBeUndefined();
    } finally {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
      Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument });
    }
  });

  it('does not register observers when disabled', () => {
    const cleanup = registerRealUserMonitoring({ enabled: false, storageKey: 'disabled-rum' });

    expect(observerRecords).toHaveLength(0);
    expect(sessionStorage.getItem('disabled-rum')).toBeNull();
    expect(document.documentElement.dataset.realUserMonitoring).toBe('unsupported');

    cleanup();
  });

  it('reports unsupported when PerformanceObserver is unavailable', () => {
    Reflect.deleteProperty(globalThis, 'PerformanceObserver');

    const cleanup = registerRealUserMonitoring({ storageKey: 'missing-observer-rum' });

    expect(observerRecords).toHaveLength(0);
    expect(sessionStorage.getItem('missing-observer-rum')).toBeNull();
    expect(document.documentElement.dataset.realUserMonitoring).toBe('unsupported');

    cleanup();
  });
}

function registerObserverCompatibilityTests(): void {
  it('publishes an unsupported snapshot when no entry types are observable', () => {
    class NoEntryPerformanceObserver extends MockPerformanceObserver {
      static supportedEntryTypes = [];
    }

    installPerformanceObserver(NoEntryPerformanceObserver);

    const cleanup = registerRealUserMonitoring({ storageKey: 'no-entry-rum' });

    expect(observerRecords).toHaveLength(0);
    expect(document.documentElement.dataset.realUserMonitoring).toBe('unsupported');
    expect(sessionStorage.getItem('no-entry-rum')).toContain('"longTaskTotal":0');

    cleanup();
  });

  it('treats malformed supported entry type metadata as unsupported', () => {
    class MalformedEntryTypesPerformanceObserver extends MockPerformanceObserver {
      static supportedEntryTypes = undefined as unknown as string[];
    }

    installPerformanceObserver(MalformedEntryTypesPerformanceObserver);

    const cleanup = registerRealUserMonitoring({ storageKey: 'malformed-entry-rum' });

    expect(observerRecords).toHaveLength(0);
    expect(document.documentElement.dataset.realUserMonitoring).toBe('unsupported');
    expect(sessionStorage.getItem('malformed-entry-rum')).toContain('"firstContentfulPaint":null');

    cleanup();
  });

  it('marks partial support when observer registration throws', () => {
    class ThrowingPerformanceObserver extends MockPerformanceObserver {
      observe(): void {
        throw new Error('unsupported observer options');
      }
    }

    installPerformanceObserver(ThrowingPerformanceObserver);

    const cleanup = registerRealUserMonitoring({ storageKey: 'partial-rum' });

    expect(document.documentElement.dataset.realUserMonitoring).toBe('unsupported');
    expect(sessionStorage.getItem('partial-rum')).toContain('"cumulativeLayoutShift":0');

    cleanup();
  });
}

function registerStorageFailureTests(): void {
  it('marks storage as blocked when session storage rejects snapshots', () => {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        clear: () => undefined,
        getItem: () => null,
        key: () => null,
        length: 0,
        removeItem: () => undefined,
        setItem: () => {
          throw new Error('storage blocked');
        },
      } satisfies Storage,
    });

    const cleanup = registerRealUserMonitoring({ storageKey: 'blocked-rum' });

    expect(document.documentElement.dataset.realUserMonitoringStorage).toBe('blocked');
    expect(window.__ventSimulatorRum).toMatchObject({ longTaskTotal: 0 });

    cleanup();
  });
}
