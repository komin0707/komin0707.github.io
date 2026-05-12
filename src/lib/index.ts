export { reportApplicationError } from './errorTracking';
export type { ApplicationErrorReport, ApplicationErrorSource } from './errorTracking';
export {
  OBSERVABILITY_CONTROL_MANIFEST,
  registerPrivacyFriendlyAnalytics,
  trackPrivacyAnalyticsEvent,
} from './analyticsMonitoring';
export type { PrivacyAnalyticsSnapshot } from './analyticsMonitoring';
export { EDUCATIONAL_VALUE_MANIFEST } from './educationFramework';
export type { ScenarioLearningObjective } from './educationFramework';
export {
  APP_COPY,
  LOCALE_OPTIONS,
  LOCALIZATION_DETAIL_RULES,
  LOCALIZATION_MEDICAL_STANDARDS,
  MEDICAL_GLOSSARY_BY_LOCALE,
  LOCALIZED_DOCUMENTATION_SET,
  REGIONAL_COMPLIANCE_REFERENCES,
  SUPPORTED_LOCALES,
  TRANSLATION_WORKFLOW,
  UNIT_SYSTEMS,
  detectBrowserLocale,
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedNumber,
  formatLocalizedTime,
  localeDirection,
  nextLocale,
  resolveLocale,
  sortLocalized,
} from './i18n';
export type { AppLocale, UnitSystem } from './i18n';
export { isBrowserRuntime } from './runtime';
export { PERFORMANCE_OPTIMIZATION_MANIFEST } from './performanceOptimization';
export { registerRealUserMonitoring } from './realUserMonitoring';
export type { RealUserMetricsSnapshot } from './realUserMonitoring';
export {
  SECURITY_CONTROL_MANIFEST,
  registerSecurityViolationMonitoring,
  sanitizePlainTextInput,
} from './securityControls';
export type { CspViolationReport } from './securityControls';
export { registerServiceWorker } from './serviceWorkerRegistration';
export { isVercelDeploymentRuntime, registerVercelObservability } from './vercelObservability';
