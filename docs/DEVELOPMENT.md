# Development

## Setup

Use Node `22`, matching `.nvmrc`.

```bash
npm install
npm run dev
```

## Quality Gates

Run these before handing off changes:

```bash
npm run type-check
npm run lint
npm test -- --run
npm run test:coverage
npm run build
npm run check:phase-gates
```

## Formatting

```bash
npm run format
npm run format:check
```

The formatter targets app source, verification scripts, and root config files, not generated artifacts.

## Debugging

- Use `npm run dev` for fast Vite reloads.
- Use `npm run preview` after `npm run build` to inspect production chunking and compression behavior.
- Use `npm run test:e2e -- --debug` to pause Playwright on the simulator and inspect selectors.
- Use `npm run check:performance` to reproduce Core Web Vitals budget failures locally; the JSON evidence is written to `artifacts/performance-budget.json`.
- Use `npm run check:lighthouse` to reproduce Lighthouse score and Speed Index budgets; reports are written to `artifacts/lighthouse-report.json` and `artifacts/lighthouse-summary.json`.
- Use `npm run build:visualize` to regenerate `artifacts/bundle-report.html` when a bundle budget fails.
- Patient avatar `@keyframes` are limited to `transform` and `opacity`; `src/test/patientAvatarMotionCss.test.tsx` enforces the compositor-safe animation property set.
- Runtime source should avoid forced synchronous layout reads. The only allowed layout measurement is `useThrottledViewportMetrics`, where scroll state is batched through `requestAnimationFrame`.
- Waveform polyline generation uses `src/simulation/waveform.worker.ts` through the worker client when browsers expose `Worker`, keeping per-frame waveform serialization off the main thread.
- Memory checks use Chrome DevTools Protocol heap usage and DOM counters through `npm run check:memory`; the JSON profile is written to `artifacts/memory-profile.json`.
- Long memory stability evidence uses `npm run check:memory:10min`, `npm run check:memory:30min`, and `npm run check:memory:1hour`; the JSON profiles are written under `artifacts/`.
- Production builds register Real User Monitoring through `src/lib/realUserMonitoring.ts`; field metrics are exposed on the `vent-simulator-rum` event and mirrored to `sessionStorage` for diagnostics.
- Vercel Analytics and Speed Insights are mounted in `src/main.tsx` so deployed Vercel environments collect user analytics, traffic analysis, and Web Vitals-style field performance metrics.
- Client error tracking in `src/lib/errorTracking.ts` records error boundary failures through `vent-error` and retains a bounded browser-session log for diagnostics.

## API Documentation

```bash
npm run docs:api
```

Generated TypeScript API documentation is written to `docs/api/`.

## Manual PDFs

```bash
npm run docs:pdf
```

Generated user and developer guide PDFs are written to `docs/manuals/`.
The generator emits tagged PDFs with outlines; run `npm run check:pdf-accessibility` after regenerating them.

## Publication Scope

The maintained public artifacts are the app, README, generated API docs, Storybook build, user/developer PDFs, and demo recording. Academic papers and conference slide decks are optional external publications and are not required release artifacts for this simulator.
