# Codemap

## Application

- `src/App.tsx`: simulator composition.
- `src/main.tsx`: React entrypoint and environment data attribute.
- `src/config/`: environment validation.

## Components

- `src/components/ui/`: reusable controls, shell pieces, waveforms, and error boundary.
- `src/components/panels/`: simulator panels for settings, patient state, monitoring, alarms, safety, and interventions.
- `src/components/patient/`: SVG patient avatar parts and clinical visualization tokens.

## State

- `src/context/`: `SimulationProvider` and context selectors.
- `src/hooks/`: settings, timer, simulation, and interaction hooks.

## Domain

- `src/simulation/`: scenarios, vitals, visual state, alarms, clinical assessments, snapshots, and waveforms.

## Verification

- `src/**/*.test.tsx`: unit and integration tests.
- `src/e2e/`: Playwright E2E and accessibility tests.
- `scripts/`: bundle, raster asset, license, and performance budget checks.
