# Runbook

## Build Failure

1. Run `npm ci`.
2. Run `npm run type-check`.
3. Run `npm run lint -- --quiet`.
4. Run `npm run build`.
5. Run `npm run check:phase-gates` when completion evidence or phase reporting needs a single JSON record of the type-check, lint, build, no-raster, bundle-size, and coverage gates. It writes `artifacts/manual-evidence/phase-gate-command-results.json`.

## Bundle Budget Failure

1. Run `npm run build:visualize`.
2. Open `artifacts/bundle-report.html`.
3. Check for new large runtime dependencies or unplanned assets.

## Performance Budget Failure

1. Run `npm run check:performance`.
2. Inspect `artifacts/performance-budget.json`.
3. Fix the failing metric before deployment.

## Chrome UX Report Monitoring

Use `npm run refresh:crux-blocker-evidence` for the normal item 874 evidence loop. It runs the local credential, live-probe, Pages-domain, and CrUX monitoring checks, posts the local blocker update when needed, syncs the remote run and blocker issue snapshot, refreshes the Vitest file list, writes the seven-command CrUX batch artifact, then refreshes completion evidence and verifies consistency. The command exits zero when the evidence refresh is internally consistent, even if item 874 remains blocked by unavailable field data.

1. Run `npm run check:crux-credentials` to verify whether a monitor-usable key source exists without printing secret values. The check writes `artifacts/manual-evidence/chrome-ux-report-credentials.json` and records accepted key names found in local `.env*` files without recording values.
2. Configure one of `CRUX_API_KEY`, `PAGESPEED_API_KEY`, or `GOOGLE_API_KEY` as a repository secret or `github-pages` environment secret when the credential preflight reports `missing`. Local runs also consume those names from `.env.local`, `.env`, `.env.production.local`, or `.env.production`, but remote monitoring still requires a GitHub Actions secret available to the CrUX workflow job.
3. Run `npm run check:pages-domain` to record the connected GitHub Pages production origin in `artifacts/manual-evidence/github-pages-domain.json`. This confirms whether CrUX should target the default `github.io` origin or a configured CNAME. The check passes when the expected origin is connected and records the Pages build status as context, so a temporary rebuild state does not hide the CrUX field-data blocker.
4. Run `npm run check:crux-monitoring` for a quick local CrUX API, PageSpeed API, sitemap, canonical, and robots check.
5. Run `CRUX_CACHE_SCAN=1 npm run check:crux-monitoring` to stream-search the latest public CrUX cache origin list.
6. Run `npm run check:crux-live-probes` for direct CrUX origin/URL record and PageSpeed field-data probes. It writes `artifacts/manual-evidence/crux-live-probe.json` and `artifacts/manual-evidence/pagespeed-live-probe.json`, and exits non-zero when neither API returns field data.
7. Run `npm run update:crux-blocker-issue` after a fresh local monitoring run only when troubleshooting the issue update step directly. The normal refresh command already posts the current local monitoring timestamp, credential result, direct probe result, and Pages domain status to the GitHub blocker issue. The command is idempotent for the current monitoring timestamp.
8. Run `npm run sync:remote-crux-evidence` after a GitHub Actions CrUX Monitoring run only when troubleshooting the remote sync step directly. The normal refresh command already downloads the latest remote run metadata, failed log, Pages domain artifact, monitoring artifact, credential artifact, direct live-probe artifacts, and blocker issue snapshot into `artifacts/manual-evidence/crux-monitoring-run-*`.
9. Inspect `artifacts/manual-evidence/chrome-ux-report-monitoring.json`. The monitor checks both the production origin and homepage URL and writes `artifacts/manual-evidence/chrome-ux-report.json` only when real field data is available.
10. Run `npm run refresh:completion-evidence` after isolated evidence commands only when troubleshooting. The normal CrUX blocker refresh already regenerates `artifacts/completion-audit.json`, refreshes `artifacts/completion-evidence-index.json` and `artifacts/manual-evidence/remaining-external-blockers.json`, and exits non-zero only when consistency fails.
11. Run `npm run check:completion-evidence` to dry-run the evidence refresh and then verify that the refreshed manifests, completion audit, local CrUX artifacts, latest remote CrUX run metadata, remote Pages domain artifact, remote credential artifact, remote direct probe artifacts, and blocker issue credential preflight result agree.
12. Run `npm run check:remaining-blockers` to print the current CrUX unblock status. The report includes the latest local credential probe, local monitoring probe, local direct CrUX/PageSpeed probes, connected Pages production origin, latest remote workflow run URL, remote monitoring artifact, remote direct probes, remote credential result, and blocker issue URL.
13. Inspect `artifacts/manual-evidence/final-blocker-summary.json` when a machine-readable handoff is needed. The `remainingBlocker.latestLocalMonitoring`, `remainingBlocker.latestLocalCredentials`, `remainingBlocker.latestPagesDomain`, and `remainingBlocker.latestRemoteRun` fields mirror the latest local and remote CrUX evidence and are verified by `npm run check:completion-evidence`.
14. If the origin is discoverable but absent from CrUX, keep the item blocked until the production origin has enough real-user Chrome traffic for field-data inclusion.

## Cost Budget Failure

1. Run `npm run build`.
2. Run `npm run check:cost-monitoring`.
3. Inspect `artifacts/cost-monitoring.json`.
4. Reduce generated artifacts or update the deployment cost assumption before release approval.

## Accessibility Failure

1. Run `npm run test:e2e`.
2. Review the axe violation in the Playwright output.
3. Fix semantic HTML or ARIA before suppressing anything.

## Rollback

Use the static hosting provider's previous deployment artifact. For GitHub Pages, run the CD workflow manually, pass the last known good commit SHA, tag, or branch in the `ref` input, and approve the `production` environment deployment after the build and budget checks pass.

## Release Promotion

1. Merge to `main` to trigger the automatic staging deployment.
2. Review the staging URL, `static-build-<sha>` artifact, and `cost-monitoring-<sha>` artifact.
3. Run the CD workflow manually with the reviewed `ref`.
4. Approve the `production` environment only after staging and preview evidence match the release checklist.

## Security Audit

1. Run `npm audit --audit-level=moderate`.
2. Run `npm run check:licenses`.
3. Run `npm run check:sbom`.
4. Review `docs/SECURITY_REVIEW.md` before release.

## On-call Procedure

1. Start an incident when production is unavailable, an accessibility-critical path fails, a release artifact exceeds the bundle budget, or privacy/security telemetry indicates a release risk.
2. Assign a single incident lead and record the start time, affected version, user impact, and current mitigation in the release notes or incident tracker.
3. Triage with `npm run test:e2e`, `npm run check:bundle-size`, `npm run check:cost-monitoring`, and the latest deployment dashboard before changing production.
4. Escalate to the release owner for rollback approval when mitigation is not available within 30 minutes.
5. Close the incident only after the failing check is green, the deployed artifact is verified, and follow-up tasks are documented.

## Alert Channel

CI, CD, and Preview workflow failures are routed through `.github/workflows/alerts.yml`. The alert workflow opens a GitHub Issue labeled `alert` and `ci-failure` with the failing workflow name, branch, commit, and run URL. Treat that issue as the on-call handoff record until an external Slack or PagerDuty integration is configured.

## Continuity

Use `docs/OPERATIONS_CONTINUITY.md` for backup assumptions, recovery objectives, and disaster recovery steps.
