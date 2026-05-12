import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SECURITY_CONTROL_MANIFEST,
  registerSecurityViolationMonitoring,
  sanitizePlainTextInput,
} from './securityControls';

const runtimeSourcePattern =
  /\b(?:dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML|eval\s*\(|new Function|document\.cookie|new WebSocket|new EventSource)\b/;

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('security controls', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('sanitizes user-authored plain text before it is rendered back into the UI', () => {
    expect(sanitizePlainTextInput('<script>alert(1)</script>\u0000safe', 12)).toBe('scriptalert(');
  });

  it('records CSP violation events without leaking unsanitized event fields', () => {
    const cleanup = registerSecurityViolationMonitoring();
    const observed = vi.fn();
    window.addEventListener('vent-csp-violation', observed);

    const event = new Event('securitypolicyviolation');
    Object.defineProperties(event, {
      blockedURI: { value: '<img src=x>' },
      documentURI: { value: 'https://example.test/' },
      violatedDirective: { value: "script-src 'self'" },
    });

    document.dispatchEvent(event);
    cleanup();

    expect(observed).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('vent-csp-violations')).toContain('img src=x');
    expect(sessionStorage.getItem('vent-csp-violations')).not.toContain('<img');
  });

  it('defines strict static security headers across supported hosts', () => {
    const headers = read('public/_headers');
    const indexHtml = read('index.html');
    const netlifyConfig = read('netlify.toml');
    const vercelConfig = read('vercel.json');

    for (const source of [headers, netlifyConfig, vercelConfig]) {
      expect(source).toContain("script-src 'self' 'nonce-vent-static'");
      expect(source).toContain("style-src-elem 'self' 'sha256-");
      expect(source).toContain('report-uri /csp-report');
      expect(source).toContain('Cross-Origin-Opener-Policy');
      expect(source).toContain('Cross-Origin-Embedder-Policy');
      expect(source).toContain('Cross-Origin-Resource-Policy');
      expect(source).toContain('Strict-Transport-Security');
      expect(source).toContain('X-Frame-Options');
      expect(source).toContain('X-Content-Type-Options');
      expect(source).toContain('Permissions-Policy');
    }

    expect(indexHtml).toContain('nonce="vent-static"');
  });

  it('documents non-applicable cookie, auth, server, SRI, and traffic-abuse controls', () => {
    expect(SECURITY_CONTROL_MANIFEST.cookiesAndStorage.cookieMinimization).toContain(
      'document.cookie is unused',
    );
    expect(SECURITY_CONTROL_MANIFEST.authentication.jwt).toContain('not applicable');
    expect(SECURITY_CONTROL_MANIFEST.applicationSurface.csrfToken).toContain('not applicable');
    expect(SECURITY_CONTROL_MANIFEST.applicationSurface.serverValidation).toContain('not applicable');
    expect(SECURITY_CONTROL_MANIFEST.trafficAbuse.rateLimiting).toContain('not applicable');
    expect(SECURITY_CONTROL_MANIFEST.headers.sri).toContain('hashed filenames');
    expect(SECURITY_CONTROL_MANIFEST.assurance.dependencyAudit).toContain('npm audit');
    expect(SECURITY_CONTROL_MANIFEST.assurance.licenseAudit).toContain('check:licenses');
    expect(SECURITY_CONTROL_MANIFEST.assurance.sbom).toContain('check:sbom');
  });

  it('keeps high-risk browser injection and network primitives out of runtime source', () => {
    const runtimeFiles = [
      'src/App.tsx',
      'src/main.tsx',
      'src/components/panels/ScenarioInterventionPanel.tsx',
      'src/components/panels/SettingsPanel.tsx',
      'src/simulation/simulationSnapshot.ts',
    ];

    const offenders = runtimeFiles.filter((path) => runtimeSourcePattern.test(read(path)));
    expect(offenders).toEqual([]);
  });
});
