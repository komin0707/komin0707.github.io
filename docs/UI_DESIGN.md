# UI Design

## Design System

Vent Simulator 2D uses a dense clinical monitor layout: a mode header, left settings panel, central patient view, right monitor panel, intervention strip, and bottom runtime controls.

## Color Guide

Semantic colors live in `src/styles/global.css` and `src/components/patient/patientAvatarPalette.ts`.

- Normal: green status and recovery cues.
- Warning: yellow status, waveform badges, and threshold warnings.
- Danger: red text, alarms, and patient distress overlays.
- Cyanosis: blue/purple skin and lip overlays.

The app also supports color-scheme, contrast, forced-colors, and a colorblind palette toggle.
