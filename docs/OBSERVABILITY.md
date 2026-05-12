# Observability Runbook

This static simulator uses privacy-friendly client metrics and CI/CD evidence. It does not collect user identities, cookies, IP addresses, raw text input, or session recordings.

## Signals

- Real user monitoring: Web Vitals snapshots from `src/lib/realUserMonitoring.ts`.
- Privacy analytics: aggregate page view, event, click-map, heat-map, scroll-depth, conversion, and funnel counters from `src/lib/analyticsMonitoring.ts`.
- Synthetic monitoring: Playwright E2E, Lighthouse, performance-budget scripts, Pages domain checks, and CrUX/PageSpeed probes.
- Error tracking: bounded client error reports from `src/lib/errorTracking.ts` and CSP violation reports from `src/lib/securityControls.ts`.
- Alerts: `.github/workflows/alerts.yml` opens a GitHub issue when CI, CD, preview, or CrUX monitoring workflows fail.

## Reliability Targets

- SLO: 99.9% monthly availability for the production static origin.
- SLA: no contractual SLA; this is an educational static app.
- Error budget: 0.1% monthly unavailability against the SLO.
- MTTR target: restore a production-blocking failure within 4 hours.
- MTBF tracking: measure time between alert issues labeled `ci-failure` or release-blocking incidents.
- 99.99% availability: stretch target only, not a guarantee.

## Incident Response

1. Triage the GitHub alert issue and linked workflow run.
2. Reproduce locally with the failing npm script.
3. Roll back by reverting the release commit or disabling the failed deployment.
4. Re-run CI and the affected monitoring script.
5. Close the alert issue only after the production origin and release gate are green.
6. Write a post-mortem for user-impacting incidents, including cause, detection gap, MTTR, and prevention work.
