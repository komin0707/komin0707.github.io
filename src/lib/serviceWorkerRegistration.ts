import { isBrowserRuntime } from './runtime';

type RegisterServiceWorkerOptions = {
  enabled?: boolean;
  scriptUrl?: string;
};

export function registerServiceWorker({
  enabled = true,
  scriptUrl = '/sw.js',
}: RegisterServiceWorkerOptions = {}): Promise<ServiceWorkerRegistration | null> {
  if (!enabled || !isBrowserRuntime() || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  return navigator.serviceWorker.register(scriptUrl);
}
