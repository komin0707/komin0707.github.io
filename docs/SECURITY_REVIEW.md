# Security Review

This review records the baseline security posture for the static educational simulator. It is not a penetration-test report and must be refreshed before any release that adds network APIs, authentication, analytics, file upload, or server-side storage.

## OWASP Top 10 Baseline

| Category | Current assessment | Required control |
| --- | --- | --- |
| A01 Broken Access Control | No authenticated or privileged routes exist. | Re-review before adding accounts, roles, admin routes, or protected content. |
| A02 Cryptographic Failures | No secrets, credentials, PHI, or persisted patient data are processed. | Keep secrets out of `VITE_` variables and configure HTTPS-only hosting. |
| A03 Injection | User-provided snapshot JSON is parsed through structured JSON handling, not executed. | Keep imported JSON as data; do not pass user input to `innerHTML`, `eval`, shell commands, or query builders. |
| A04 Insecure Design | The app carries visible educational-only warnings and no clinical decision workflow. | Preserve the clinical disclaimer and run design review before adding recommendations. |
| A05 Security Misconfiguration | Static security headers are defined in `public/_headers`; CI runs audit and validation scripts. | Confirm host-specific headers after deployment because not every provider reads `_headers`. |
| A06 Vulnerable Components | CI runs `npm audit --audit-level=moderate`, license policy, and SBOM generation. | Review Dependabot PRs and refresh the SBOM before release. |
| A07 Identification and Authentication Failures | No authentication surface exists. | Add threat modeling before introducing identity providers or sessions. |
| A08 Software and Data Integrity Failures | Builds are reproducible through `npm ci`; CI checks formatting, tests, bundle budgets, and SBOM output. | Protect release branches and use reviewed CI artifacts for deployment. |
| A09 Security Logging and Monitoring Failures | No server-side runtime exists to log sensitive events. | Add client error monitoring only with privacy review and consent handling. |
| A10 Server-Side Request Forgery | No server-side request capability exists. | Re-review if proxy endpoints, webhooks, or backend fetchers are added. |

## Regular Audit Cadence

- Every pull request: run CI, including `npm audit --audit-level=moderate`, `npm run check:licenses`, and `npm run check:sbom`.
- Before each release: inspect Dependabot updates, regenerate `artifacts/sbom.json`, and review this OWASP baseline.
- Quarterly: run a manual dependency freshness review with `npm outdated`, verify deployment headers, and search the repository for accidental secrets.
- After any security-sensitive change: update this file and `SECURITY.md` with the new threat model.
- Dependabot is configured in `.github/dependabot.yml` for weekly npm and GitHub Actions update pull requests.

## Release Gate

A release is blocked if any of these fail:

- Moderate or higher dependency vulnerability without a documented exception.
- New data collection path without `docs/PRIVACY.md` updates.
- New network/API surface without OWASP review updates.
- Missing or stale SBOM for the release artifact.
