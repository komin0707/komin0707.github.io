# Vent Simulator 2D User Manual

## Purpose

Vent Simulator 2D is an educational mechanical ventilation simulator. It is not a medical device and must not be used for clinical decisions.

## Starting The Simulator

- Install dependencies with `npm ci`.
- Start development mode with `npm run dev`.
- Open the local URL printed by Vite.

## Core Workflow

1. Select a scenario from the scenario menu.
2. Adjust ventilator settings with the sliders and numeric inputs.
3. Watch patient condition, alarms, lung status, and waveforms change.
4. Use pause, rewind, time jump, export, and import controls for teaching sessions.

## Patient Avatar

The patient avatar shows condition, skin tone, facial expression, lung findings, chest movement, tube pressure warning, and alarm glow. The visual is a teaching aid and should be interpreted with the numeric vitals.

## Alarms

The alarm panel sorts alarms by priority and keeps recent alarm history. Threshold controls are available for educational drills.

## Accessibility

The simulator supports keyboard navigation, skip links, focus indicators, dialog focus trapping, live status updates, and text alternatives for the avatar and chart data.

## Safety Notice

This software simplifies physiology for education. It does not replace clinical judgment, device manuals, institutional protocols, or licensed medical supervision.
