import { isBrowserRuntime } from './runtime';

export type CspViolationReport = {
  blockedUri: string;
  directive: string;
  documentUri: string;
};

const CSP_EVENT_NAME = 'vent-csp-violation';
const CSP_STORAGE_KEY = 'vent-csp-violations';
const PLAIN_TEXT_DANGEROUS_PATTERN = /[<>"'`]/g;

export const SECURITY_CONTROL_MANIFEST = {
  applicationSurface: {
    cors: 'connect-src self only; no cross-origin API calls',
    csrfSameSite: 'not applicable; no cookies or authenticated mutation endpoints',
    csrfToken: 'not applicable; static app has no server-side sessions or mutations',
    outputEncoding: 'React text rendering, no dangerouslySetInnerHTML in runtime source',
    serverValidation: 'not applicable; no server-side request handlers',
    xssDefense: 'strict script CSP, React escaping, snapshot JSON parsing, and plain-text sanitization',
  },
  assurance: {
    auditLog:
      'client securitypolicyviolation events are bounded in sessionStorage and dispatched as custom events',
    dependencyAudit: 'CI runs npm audit --audit-level=moderate',
    licenseAudit: 'CI runs npm run check:licenses',
    penetrationTesting: 'required before adding authentication, APIs, uploads, or server persistence',
    sbom: 'CI runs npm run check:sbom',
    vulnerabilityScanning: 'Dependabot plus npm audit in CI',
  },
  authentication: {
    jwt: 'not applicable; no token auth',
    oauth2: 'optional and not enabled',
    openIdConnect: 'optional and not enabled',
    passkey: 'optional and not enabled',
    passwordHashing: 'not applicable; no passwords',
    passwordPolicy: 'not applicable; no passwords',
    twoFactor: 'optional and not enabled',
    webAuthn: 'optional and not enabled',
  },
  cookiesAndStorage: {
    cookieMinimization: 'document.cookie is unused in runtime source',
    httpOnlyCookies: 'not applicable; no cookies',
    indexedDbEncryption: 'not applicable; IndexedDB is unused',
    localStorageEncryption:
      'not required; localStorage stores only user-triggered non-sensitive simulator snapshots',
    sameSiteCookies: 'not applicable; no cookies',
    secureCookies: 'not applicable; no cookies',
    sessionStorageEncryption: 'not required; sessionStorage stores bounded diagnostics only',
  },
  headers: {
    contentSecurityPolicy: 'strict same-origin CSP with nonce, style hash, report-uri, and report-to',
    coep: 'Cross-Origin-Embedder-Policy require-corp',
    coop: 'Cross-Origin-Opener-Policy same-origin',
    corp: 'Cross-Origin-Resource-Policy same-origin',
    hsts: 'Strict-Transport-Security max-age=31536000 includeSubDomains preload',
    permissionsPolicy: 'camera, microphone, geolocation, payment, usb denied',
    referrerPolicy: 'strict-origin-when-cross-origin',
    sri: 'not attached to service-worker-swapped first-party chunks; hashed filenames and same-origin CSP cover integrity',
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
  },
  trafficAbuse: {
    botDetection: 'not applicable; no forms that submit to a server',
    ddosDefense: 'delegated to static hosting/CDN',
    rateLimiting: 'not applicable; no server API',
    recaptcha: 'not applicable; no public server-side form',
  },
} as const;

export function sanitizePlainTextInput(value: string, maxLength = 120): string {
  return [...value]
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint > 31 && codePoint !== 127;
    })
    .join('')
    .replace(PLAIN_TEXT_DANGEROUS_PATTERN, '')
    .slice(0, maxLength);
}

export function registerSecurityViolationMonitoring(): () => void {
  if (!isBrowserRuntime()) return () => {};

  const handleViolation = (event: Event) => {
    const report = toCspViolationReport(event);

    try {
      window.sessionStorage.setItem(
        CSP_STORAGE_KEY,
        `${window.sessionStorage.getItem(CSP_STORAGE_KEY) ?? ''}\n${JSON.stringify(report)}`.slice(-4096),
      );
    } catch {
      document.documentElement.dataset.securityStorage = 'blocked';
    }

    window.dispatchEvent(new CustomEvent<CspViolationReport>(CSP_EVENT_NAME, { detail: report }));
  };

  document.addEventListener('securitypolicyviolation', handleViolation);
  return () => document.removeEventListener('securitypolicyviolation', handleViolation);
}

function readStringProperty(event: Event, key: string): string {
  const value = (event as unknown as Record<string, unknown>)[key];
  return typeof value === 'string' ? sanitizePlainTextInput(value, 240) : '';
}

function toCspViolationReport(event: Event): CspViolationReport {
  return {
    blockedUri: readStringProperty(event, 'blockedURI'),
    directive: readStringProperty(event, 'violatedDirective'),
    documentUri: readStringProperty(event, 'documentURI'),
  };
}
