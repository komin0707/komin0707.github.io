import { afterEach, describe, expect, it } from 'vitest';
import { reportApplicationError, type ApplicationErrorReport } from './errorTracking';

describe('application error tracking', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('stores bounded error reports and emits monitoring events', () => {
    const events: ApplicationErrorReport[] = [];
    const handleErrorEvent = (event: Event): void => {
      events.push((event as CustomEvent<ApplicationErrorReport>).detail);
    };

    window.addEventListener('vent-error', handleErrorEvent);

    const report = reportApplicationError(new Error('render failed'), 'r');

    expect(report).toMatchObject({
      message: 'render failed',
      source: 'r',
    });
    expect(sessionStorage.getItem('vent-errors')).toContain('"message":"render failed"');
    expect(events.at(-1)).toMatchObject({ source: 'r' });

    window.removeEventListener('vent-error', handleErrorEvent);
  });

  it('returns reports without browser globals', () => {
    const originalWindow = window;
    const originalDocument = document;

    Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: undefined });

    try {
      expect(reportApplicationError('worker failed', 'w')).toEqual({
        message: 'worker failed',
        source: 'w',
      });
    } finally {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
      Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument });
    }
  });
});
