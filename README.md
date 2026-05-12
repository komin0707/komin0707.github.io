# Vent Simulator 2D

Vent Simulator 2D is an educational mechanical ventilation simulator. It renders ventilator settings, waveforms, alarms, clinical trends, and a responsive 2D patient avatar that changes with scenario and vital-sign state.

This project is for education and simulation only. It is not a medical device and must not be used for clinical decision-making.

## Start

```bash
npm ci
npm run dev
```

## Verify

```bash
npm run type-check
npm run lint
npm run lint:css
npm run format:check
npm test
npm run test:e2e
npm run test:coverage
npm run build
npm run check:phase-gates
npm run check:no-raster
npm run check:bundle-size
npm run check:performance
```

`check:phase-gates` reruns the phase-report commands and writes `artifacts/manual-evidence/phase-gate-command-results.json`, including type-check, lint, build, no-raster, bundle-size, and coverage exit codes.

For the remaining CrUX evidence gate, `npm run refresh:crux-blocker-evidence` runs the local CrUX probes, posts the latest blocker issue update when needed, syncs remote evidence, writes the seven-command blocker refresh artifact, refreshes completion manifests, and verifies consistency. `npm run update:crux-blocker-issue` and `npm run sync:remote-crux-evidence` are also available for troubleshooting individual steps.

To unblock item 874, configure a Google API key with Chrome UX Report/PageSpeed quota as `CRUX_API_KEY`, `PAGESPEED_API_KEY`, or `GOOGLE_API_KEY`, then run:

```bash
gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io
gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages
gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io
npm run refresh:crux-blocker-evidence
```

The gate stays blocked until the production origin also has real CrUX/PageSpeed field data; monitoring-only artifacts must not be copied into `artifacts/manual-evidence/chrome-ux-report.json`.

## Documentation

- Screenshot artifact: `artifacts/d6-patient-stable.png`
- Demo recording: `artifacts/demo.webm`
- Demo captions and transcript: `artifacts/demo.vtt`, `artifacts/demo-transcript.md`
- Simulation logic: `docs/SIMULATION_LOGIC.md`
- API docs: `docs/api/index.html`
- User manual PDF: `docs/manuals/user-manual.pdf`
- Developer guide PDF: `docs/manuals/developer-guide.pdf`
- Contributing: `CONTRIBUTING.md`
- Security: `SECURITY.md`
- Changelog: `CHANGELOG.md`
- License: `LICENSE`
- Privacy and terms: `docs/PRIVACY.md`, `docs/TERMS.md`
- Runbook: `docs/RUNBOOK.md`
