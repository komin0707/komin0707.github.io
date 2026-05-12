# Secrets Management

The current simulator has no private runtime secrets. Only public environment signals are read by the browser build:

- `VITE_APP_ENV`
- `VITE_ENABLE_DEBUG_PANEL`
- `VITE_VERCEL_ENV`
- `VERCEL`
- `VERCEL_ENV`

## Policy

- Do not commit private keys, API tokens, service credentials, `.env.local`, or production secret files.
- Use GitHub Actions secrets or the hosting provider secret store for any future private deployment credentials.
- Keep browser-exposed configuration prefixed with `VITE_` unless the build explicitly maps a known-safe provider signal such as `VERCEL` or `VERCEL_ENV`; treat all exposed values as public.
- Rotate any leaked credential immediately and document the incident in `SECURITY.md` or release notes.

## CI/CD

The current GitHub Pages deployment workflow uses OIDC and repository permissions, not checked-in credentials. Vercel Analytics and Speed Insights use public client scripts and do not require repository secrets. If Vercel, Netlify, Cloudflare, Sentry, or notification integrations later require tokens, configure them in the provider secret store and reference them through workflow environment variables.

Chrome UX Report monitoring may optionally use one Google API key named `CRUX_API_KEY`, `PAGESPEED_API_KEY`, or `GOOGLE_API_KEY`. Do not commit the key to the repository. Use `npm run check:crux-credentials` to confirm key presence without printing the value. Local monitor and live-probe runs consume accepted key names from the process environment or `.env.local`, `.env`, `.env.production.local`, and `.env.production`; remote GitHub Actions monitoring requires the key as a repository secret or as a `github-pages` environment secret available to the CrUX workflow job. `npm run check:crux-live-probes` records CrUX/PageSpeed status and field-data presence in JSON artifacts without printing or storing the key value.

To unblock Chrome UX Report monitoring for the GitHub Pages site, add the key as an Actions secret in the Pages repository:

```bash
gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io
# or, for the github-pages environment used by the CrUX workflow:
gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages
```

Then run the CrUX Monitoring workflow and refresh the blocker evidence locally:

```bash
gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io
npm run refresh:crux-blocker-evidence
```

Completion still requires returned CrUX or PageSpeed field data for the production origin; a valid key with no available field data keeps item 874 blocked.
