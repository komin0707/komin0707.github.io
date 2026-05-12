# Deployment

## Build

```bash
npm run build
```

The build cleans previous `dist` output through `prebuild`, type-checks via `tsc -b`, and emits minified static assets.

## Preview

```bash
npm run preview
```

Preview serves the built app on port `4173`.

## Bundle Budget

The current production JS bundle is expected to stay below `60 KB` gzip. Production builds alias React to `preact/compat` to meet that target while preserving the app's component API.

## Cost Monitoring

```bash
npm run build
npm run check:cost-monitoring
```

The cost monitor writes `artifacts/cost-monitoring.json` with static hosting cost assumptions, artifact storage size, total build bytes, gzip bytes, and estimated CI minutes. The current static deployment target is budgeted at `$0/month`; the check fails if the static hosting estimate or artifact storage budget is exceeded.

## Environment

Required public variables are documented in `.env.example`:

- `VITE_APP_ENV`
- `VITE_ENABLE_DEBUG_PANEL`

`VITE_ENABLE_DEBUG_PANEL=true` enables the gated debug panel. Keep it disabled in production unless a release investigation explicitly requires it.

## Hosting Targets

- Vercel: `vercel.json`
- Netlify: `netlify.toml`
- Cloudflare Pages: `wrangler.toml`
- GitHub Pages: `.github/workflows/cd.yml`

## CD Environments

- Staging deploys automatically from pushes to `main` through the `deploy-staging` job in `.github/workflows/cd.yml`.
- Production deploys only through manual `workflow_dispatch`; the `deploy-production` job targets the protected `production` environment so repository environment approval can gate the release.
- Pull requests run `.github/workflows/preview.yml`, build the static app, enforce raster, bundle, and cost budgets, then publish a `preview-pr-<number>` artifact for review before merge.
- CI, CD, and Preview failures trigger `.github/workflows/alerts.yml`, which opens a GitHub Issue as the alert channel for release/on-call follow-up.
- `.github/workflows/crux-monitoring.yml` runs daily and on demand to check Chrome UX Report field-data availability for `https://komin0707.github.io/`. Configure one optional repository secret or `github-pages` environment secret named `CRUX_API_KEY`, `PAGESPEED_API_KEY`, or `GOOGLE_API_KEY` with Chrome UX Report/PageSpeed API quota; local runs may also read those names from `.env*`. The workflow still records the connected Pages production origin, discoverability, public CrUX-cache evidence, and direct CrUX/PageSpeed live probes without it. Each run uploads Pages domain, monitoring, live-probe, and credential preflight artifacts, then writes the Pages domain, live-probe, and credential preflight results into the open blocker issue when field data remains unavailable.

## Managed HTTPS

The default CD path deploys to GitHub Pages through `.github/workflows/cd.yml`. GitHub Pages supports HTTPS for Pages sites and handles certificate provisioning for correctly configured Pages domains; keep HTTPS enforcement enabled in repository Pages settings.
Reference: <https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https>

## Rollback Deployment

The GitHub Pages CD workflow accepts a manual `ref` input. Provide the last known good commit SHA, tag, or branch to rebuild and redeploy that static artifact through the production approval gate.

## Scope Exceptions

- Image CDN: not applicable while the app ships SVG/CSS visuals and the raster asset check remains enforced.
- Database migrations: not applicable because the production app has no database or server-side persistence.
- Code signing: not applicable because there are no native binaries, installers, or mobile packages.
- Kubernetes orchestration: optional and not used for the default static hosting deployment.
- A/B testing: optional and not enabled because the simulator does not run product experiments or user tracking.

## Container Image

The project includes a static Docker image definition:

```bash
docker build -t vent-simulator-2d .
docker run --rm -p 8080:8080 vent-simulator-2d
```

The image builds with Node 22 and serves the generated `dist` folder through an unprivileged Nginx runtime.

## Cache Policy

Hashed files under `/assets/*` should be served with `Cache-Control: public, max-age=31536000, immutable`.
HTML should be revalidated by the hosting provider so users receive the newest asset manifest.

## Secrets

The app only uses public `VITE_` variables. Deployment secrets, if introduced later, must live in the hosting provider or GitHub Actions secret store, not in `.env` files.
See `docs/SECRETS.md` for the project policy.

Optional monitoring secret:

- `CRUX_API_KEY`, `PAGESPEED_API_KEY`, or `GOOGLE_API_KEY`: Google API key with Chrome UX Report/PageSpeed API access for `.github/workflows/crux-monitoring.yml`.

Credential preflight:

```bash
npm run check:crux-credentials
npm run check:crux-live-probes
```

The credential preflight writes `artifacts/manual-evidence/chrome-ux-report-credentials.json` and reports whether a supported key is directly usable from exported environment variables, local `.env*` files, GitHub repository secrets, or `github-pages` environment secrets. It also records macOS Keychain, Google ADC, gcloud, GitHub repository variables, and GitHub environment variables as troubleshooting context, but those sources are not consumed by the current monitor unless exported to an accepted environment variable or configured as a GitHub Actions secret available to the workflow job. The live-probe check writes `artifacts/manual-evidence/crux-live-probe.json` and `artifacts/manual-evidence/pagespeed-live-probe.json`, then exits non-zero when neither API returns field data.
