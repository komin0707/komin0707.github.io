# Context

`SimulationProvider` combines scenario selection, settings, alarms, elapsed time, pause state, time scale, and JSON snapshot import/export.

The provider exposes:

- Current settings and `updateSetting`.
- Current scenario and `setScenarioType`.
- Derived simulation state.
- Alarm thresholds and `updateAlarmThreshold`.
- Time controls: pause, speed, jump, rewind, reset.
- Snapshot controls: `exportSnapshot` and `importSnapshot`.

Use `useSimulationSelector` when a component only needs a derived slice of the context value.
