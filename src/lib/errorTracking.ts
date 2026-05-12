import { isBrowserRuntime } from './runtime';

export type ApplicationErrorSource = 'm' | 'r' | 'u' | 'w';

export type ApplicationErrorReport = {
  message: string;
  source: ApplicationErrorSource;
};

const DEFAULT_STORAGE_KEY = 'vent-errors';
const ERROR_EVENT_NAME = 'vent-error';

/** Records a bounded client-side error report and emits it for monitoring integrations. */
export function reportApplicationError(
  error: unknown,
  source: ApplicationErrorSource = 'm',
): ApplicationErrorReport {
  const report: ApplicationErrorReport = {
    message: error instanceof Error ? error.message : String(error),
    source,
  };

  if (!isBrowserRuntime()) {
    return report;
  }

  try {
    window.sessionStorage.setItem(
      DEFAULT_STORAGE_KEY,
      `${window.sessionStorage.getItem(DEFAULT_STORAGE_KEY) ?? ''}\n${JSON.stringify(report)}`.slice(-4096),
    );
  } catch {
    // Monitoring events still dispatch when browser storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent<ApplicationErrorReport>(ERROR_EVENT_NAME, { detail: report }));

  return report;
}
