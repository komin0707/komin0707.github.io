import { isBrowserRuntime } from './runtime';

const VERCEL_OBSERVABILITY_SCRIPTS = ['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js'];

/** Returns whether the current browser session is running on a Vercel deployment. */
export function isVercelDeploymentRuntime(
  hostname = isBrowserRuntime() ? window.location.hostname : '',
  vercelEnv: string | boolean | undefined = import.meta.env.VITE_VERCEL_ENV,
): boolean {
  return (
    vercelEnv === true ||
    (typeof vercelEnv === 'string' && vercelEnv.length > 0) ||
    hostname.endsWith('.vercel.app')
  );
}

/** Registers Vercel Analytics and Speed Insights only when their hosted scripts are available. */
export function registerVercelObservability(
  enabled = true,
  isDeploymentRuntime = isVercelDeploymentRuntime(),
): boolean {
  if (!enabled || !isBrowserRuntime() || !isDeploymentRuntime) {
    return false;
  }

  VERCEL_OBSERVABILITY_SCRIPTS.forEach((src) => {
    const script = document.createElement('script');
    script.defer = true;
    script.src = src;
    document.head.append(script);
  });
  return true;
}
