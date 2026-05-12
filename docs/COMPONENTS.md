# Components

## Shell

- `App.tsx`: composes the simulator screen and wires context values to panels.
- `Header`: ventilator mode selection and global display controls.
- `BottomBar`: scenario, timing, snapshot, pause, and reset controls.
- `InteractionToolbar`: keyboard help, drag/drop scenarios, voice, AR, tutorial, and context menu controls.

## Panels

- `SettingsPanel`: ventilator setting sliders.
- `PatientConditionPanel`: condition card and lazy-loaded patient avatar.
- `MonitorPanel`: waveforms, vitals, clinical data, and trend visualization.
- `AlarmPanel`: sorted alarms, alert history, and thresholds.
- `LungStatusPanel`: compliance, resistance, FRC, and secretion status.
- `ScenarioInterventionPanel`: intervention controls and scenario progress.
- `ModeSafetyPanel`: mode-specific safety messages.

## Patient Avatar

The avatar is split into SVG body, head, airway, lung, posture, and pathology parts under `src/components/patient/`.
