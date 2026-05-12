import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from './serviceWorkerRegistration';

const originalServiceWorker = navigator.serviceWorker;

describe('service worker registration', () => {
  afterEach(() => {
    if (originalServiceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: originalServiceWorker,
      });
    } else {
      Reflect.deleteProperty(navigator, 'serviceWorker');
    }
  });

  it('does not register when disabled', async () => {
    const register = vi.fn();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    await expect(registerServiceWorker({ enabled: false })).resolves.toBeNull();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers the production service worker when available', async () => {
    const registration = { scope: '/' } as ServiceWorkerRegistration;
    const register = vi.fn<() => Promise<ServiceWorkerRegistration>>().mockResolvedValue(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    await expect(registerServiceWorker()).resolves.toBe(registration);
    expect(register).toHaveBeenCalledWith('/sw.js');
  });
});
