import { afterEach, describe, expect, it } from 'vitest';
import { isVercelDeploymentRuntime, registerVercelObservability } from './vercelObservability';

describe('Vercel observability registration', () => {
  afterEach(() => {
    document.head.querySelectorAll('script[src^="/_vercel/"]').forEach((script) => script.remove());
  });

  registerRuntimeDetectionTests();
  registerScriptInjectionTests();
});

function registerRuntimeDetectionTests(): void {
  it('detects Vercel deployment runtimes from env or deployment hostnames', () => {
    const originalWindow = window;
    const originalDocument = document;

    expect(isVercelDeploymentRuntime('localhost', 'production')).toBe(true);
    expect(isVercelDeploymentRuntime('localhost', true)).toBe(true);
    expect(isVercelDeploymentRuntime('clinical-sim.vercel.app', '')).toBe(true);
    expect(isVercelDeploymentRuntime('localhost', '')).toBe(false);
    Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: undefined });
    try {
      expect(isVercelDeploymentRuntime(undefined, '')).toBe(false);
    } finally {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
      Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument });
    }
  });
}

function registerScriptInjectionTests(): void {
  it('skips script injection in local production previews', () => {
    const registered = registerVercelObservability();

    expect(registered).toBe(false);
    expect(document.head.querySelectorAll('script[src^="/_vercel/"]')).toHaveLength(0);
  });

  it('skips script injection when disabled even on Vercel deployments', () => {
    const registered = registerVercelObservability(false, true);

    expect(registered).toBe(false);
    expect(document.head.querySelectorAll('script[src^="/_vercel/"]')).toHaveLength(0);
  });

  it('injects analytics and speed insights on Vercel deployments', () => {
    const registered = registerVercelObservability(true, true);
    const scripts = Array.from(document.head.querySelectorAll<HTMLScriptElement>('script[src^="/_vercel/"]'));

    expect(registered).toBe(true);
    expect(scripts.map((script) => script.src)).toEqual([
      'http://localhost:3000/_vercel/insights/script.js',
      'http://localhost:3000/_vercel/speed-insights/script.js',
    ]);
    expect(scripts.every((script) => script.defer)).toBe(true);
  });
}
