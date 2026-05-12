# Testing

## Unit and Integration

Run:

```bash
npm test
npm run test:coverage
```

Coverage includes simulation calculations, alarm behavior, components, hooks, context, formatting helpers, and snapshot import/export.

## Phase Gate Evidence

Run:

```bash
npm run check:phase-gates
```

`check:phase-gates` records the objective phase-report commands in `artifacts/manual-evidence/phase-gate-command-results.json`. The artifact captures exit codes and truncated command output for `type-check`, `lint -- --quiet`, `build`, `check:no-raster`, `check:bundle-size`, and `test:coverage`, plus current `dist` size and screenshot file evidence.

## End-to-End

Run:

```bash
npm run test:e2e
```

Playwright verifies patient avatar visibility, scenarios, settings, runtime controls, keyboard access, touch gestures, offline behavior, and automated axe accessibility scanning.

Alarm accessibility is covered through semantic `role="alert"`, critical `role="alertdialog"`, and snapshot error `role="alert"` checks. Trend printing uses `window.print()` and the global print stylesheet.

Keyboard and pointer parity are covered in `src/e2e/simulator.spec.ts`: the full-surface test exercises mode buttons, scenario selection, sliders, pause/resume, reset, keyboard focus traversal, shortcut dialogs, hover, click, and touch gestures without console errors.

The app does not generate transactional email templates. Email accessibility is therefore out of scope unless an email surface is added.

## Visual Regression

Playwright stores the patient avatar baseline under `src/e2e/*-snapshots/`.
Update the baseline only after an intentional visual design change:

```bash
npm run test:e2e -- --update-snapshots
```

## Demo Recording

```bash
npm run demo:record
```

The recording is written to `artifacts/demo.webm`, with captions in `artifacts/demo.vtt` and transcript text in `artifacts/demo-transcript.md`.

## Budgets

Run:

```bash
npm run check:no-raster
npm run check:bundle-size
npm run check:jsdoc-exports
npm run check:performance
npm run check:lighthouse
npm run check:memory
npm run check:memory:10min
npm run check:memory:30min
npm run check:memory:1hour
npm run check:pdf-accessibility
npm run check:licenses
npm run check:contrast
```

`check:contrast` verifies text, non-text control borders, hover, disabled, dark-mode, and light-mode contrast tokens. CSS tests also assert forced-colors, high-contrast, colorblind, and monochrome media support remain present.

Slider drag updates are debounced in `SliderControl`; component tests use fake timers to verify the delayed range callback while preserving immediate keyboard, wheel, and numeric-input updates.

`check:jsdoc-exports` verifies every directly exported TypeScript declaration in `src/` has JSDoc so generated API documentation stays complete.

Viewport scroll and resize updates use `useThrottledViewportMetrics`, which batches repeated events through one `requestAnimationFrame`; hook tests verify the batching behavior.

`DataVisualizationPanel` uses `IntersectionObserver` to lazy-render the off-screen trend data table, then schedules the table commit through `requestIdleCallback` so auxiliary data rendering does not compete with primary interaction work; component tests cover the observer and idle-callback path.

Waveform polyline generation is routed through `waveformWorkerClient` and the Vite `waveform.worker.ts` module when `Worker` is available, with synchronous fallback for tests and unsupported browsers. `renderingBudget.test.tsx` verifies that the chart uses the worker client.

The waveform worker feature-detects `OffscreenCanvas` and initializes a 2D context when available, while keeping the SVG polyline fallback for browsers that do not support worker-side canvas.

`renderProfiler.test.tsx` wraps the monitor panel in React `Profiler` and detects parent-only update render work, verifying pause-state and parent-only commits stay below one 16 ms frame budget.

`check:memory` runs the production preview through repeated scenario, mode, slider, and pause/resume cycles, then records Chrome DevTools Protocol heap and DOM counter snapshots in `artifacts/memory-profile.json`.

`check:memory:10min` keeps the production preview active for a full 10 minutes, samples Chrome DevTools Protocol heap and DOM counters every minute, and writes `artifacts/memory-profile-10min.json`.
The 30-minute and 1-hour variants use the same sampling path and write `artifacts/memory-profile-30min.json` and `artifacts/memory-profile-1hour.json`.

Experimental memory pressure handling listens for `memorypressure` when the browser emits it and pauses the simulation; App integration tests dispatch the event and verify the pause state plus `data-memory-pressure` marker.

Real User Monitoring is registered in production builds through `PerformanceObserver` for paint, LCP, CLS, and long-task entries. The unit test mocks observer callbacks, verifies the `vent-simulator-rum` event, and checks the `sessionStorage` snapshot used for field diagnostics.

Vercel Analytics and Speed Insights are mounted at the React root for deployed user analytics, aggregate traffic analysis, and field performance monitoring. Bundle budgets verify the client integrations remain within the size limit.

Client error tracking uses `src/lib/errorTracking.ts`; render failures emit `vent-error` and keep a bounded `sessionStorage` diagnostic log.

`check:lighthouse` runs Lighthouse against the production preview and writes the full JSON report to `artifacts/lighthouse-report.json` plus score thresholds to `artifacts/lighthouse-summary.json`.

`check:pages-domain` records the connected GitHub Pages production origin, optional CNAME, and current Pages build status in `artifacts/manual-evidence/github-pages-domain.json`; it passes when the expected origin is connected. `check:crux-credentials` records whether a monitor-usable Chrome UX Report/PageSpeed API key source exists without printing secret values. `check:crux-monitoring` checks deployed-origin discoverability, the Chrome UX Report API, PageSpeed field data, and the latest public CrUX cache. `check:crux-live-probes` performs direct Chrome UX Report origin/URL and PageSpeed field-data probes. The checks write `artifacts/manual-evidence/chrome-ux-report-credentials.json`, `artifacts/manual-evidence/chrome-ux-report-monitoring.json`, `artifacts/manual-evidence/crux-live-probe.json`, and `artifacts/manual-evidence/pagespeed-live-probe.json`; use `CRUX_CACHE_SCAN=1` for the full public-cache origin search and `CRUX_API_KEY`, `PAGESPEED_API_KEY`, or `GOOGLE_API_KEY` in the process environment or `.env*` when API quota is available.

PWA basics are covered by `manifest.webmanifest`, `pwa-icon.svg`, production-only service worker registration, and `serviceWorkerRegistration.test.tsx`.

Manual PDFs are generated as tagged PDFs with document outlines, and `check:pdf-accessibility` verifies the expected structure tree, marked-content metadata, and language marker.
