# Hooks

## `useVentilatorSettings`

Owns ventilator setting state, per-key updates, full replacement, and reset.

## `useSimulation`

Memoizes derived simulator output from current settings and scenario.

## `useElapsedTimer`

Advances simulation time with interval cleanup, pause handling, jump, rewind, and reset helpers.

## `useSimulatorInteractions`

Owns interaction-only UI state for keyboard shortcuts, touch gestures, drag/drop scenarios, help, voice, AR, tutorial, and exam toggles.

## `useSimulationContext`

Reads the provider value and throws when used outside `SimulationProvider`.
