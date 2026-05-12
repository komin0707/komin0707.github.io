# Vent Simulator 2D Developer Guide

## Environment

- Node version: `22`, matching `.nvmrc`.
- Install dependencies with `npm ci`.
- Run the app with `npm run dev`.

## Quality Gates

Run these before release:

```bash
npm run type-check
npm run lint -- --quiet
npm run lint:css
npm run format:check
npm test
npm run test:e2e
npm run build
npm run check:phase-gates
```

## Documentation Generation

- API docs: `npm run docs:api`.
- Codemap: `npm run docs:codemap`.
- Manual PDFs: `npm run docs:pdf`.

## Architecture

The simulator separates UI components, context state, hooks, and deterministic simulation modules. The simulation layer calculates vitals, alarms, clinical assessments, visual state, waveforms, and scenario progress.

## Release Checklist

- Regenerate `docs/api`.
- Regenerate `docs/CODEMAP.generated.md`.
- Regenerate `docs/manuals/*.pdf`.
- Regenerate `artifacts/sbom.json`.
- Confirm bundle, performance, license, contrast, and raster checks.

## Operational Notes

Static deployment targets are defined for Vercel, Netlify, Cloudflare Pages, and GitHub Pages. Rollback is handled by manually dispatching the CD workflow with the last known good `ref`.
