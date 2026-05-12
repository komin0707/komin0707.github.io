# Operations Continuity

Vent Simulator 2D is a static client application with no production database. Continuity planning focuses on source control, generated artifacts, static hosting, and documented recovery steps.

## Backup Strategy

- Source of truth: repository history and reviewed pull requests.
- Dependency lockfile: `package-lock.json` is committed so `npm ci` can reproduce builds.
- Release artifact: keep the last known good static deployment artifact available in the hosting provider.
- Automated build backup: the CD workflow uploads each `dist` artifact with 30-day retention.
- Generated evidence: keep screenshots, SBOM, bundle reports, and performance budget artifacts under `artifacts/` when they support a release.
- Local recovery: run `npm ci`, `npm run build`, and `npm run test:e2e` from a clean checkout to verify a restored workspace.

## Disaster Recovery

1. Identify the last known good release, commit, or deployment artifact.
2. Disable the failing deployment by rolling back through the hosting provider or GitHub Pages workflow history.
3. Rebuild from the known good commit with `npm ci && npm run build`.
4. Run `npm run type-check`, `npm test`, `npm run test:e2e`, and the budget checks listed in `docs/RUNBOOK.md`.
5. Redeploy the verified `dist` artifact.
6. If the original build is needed, download the `static-build-<sha>` GitHub Actions artifact before it expires.
7. Record the incident, root cause, and any checklist updates in `CHANGELOG.md` or release notes.

## Recovery Objectives

- RTO: restore the previous static deployment within one business hour when hosting access is available.
- RPO: no production user data loss target is needed because the app does not store server-side user data.
- Evidence: retain the CI run, deployment URL, and rollback notes for the release record.

## Scope Limits

Database backups, migration rollback, and secret rotation are not applicable until the app introduces a backend, persistent store, or private deployment secrets.
