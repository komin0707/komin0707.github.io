import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS } from './scenarios';
import { calculateSimulation } from './ventilatorModel';
import { generateWaveform } from './waveformGenerator';

const WAVEFORM_POINT_COUNT = 96;
const WAVEFORM_LAST_POINT_INDEX = 95;
const CHART_WIDTH = 120;
const CHART_HEIGHT = 60;

describe('waveform generator', () => {
  registerFlowAmplitudeTests();
  registerExpiratoryTailTests();
  registerPressureVolumeTests();
  registerCapnographyTests();
  registerAdvancedModeTests();
  registerPatientMonitoringWaveformTests();
});

function registerFlowAmplitudeTests(): void {
  it('uses Flow setting for inspiratory flow amplitude', () => {
    const lowFlowSettings = { ...DEFAULT_SETTINGS, flow: 30 };
    const highFlowSettings = { ...DEFAULT_SETTINGS, flow: 90 };
    const { vitals } = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);

    const lowFlow = generateWaveform({
      kind: 'flow',
      vitals,
      scenario: SCENARIOS.pneumonia,
      settings: lowFlowSettings,
      phase: 0,
      paused: false,
    });
    const highFlow = generateWaveform({
      kind: 'flow',
      vitals,
      scenario: SCENARIOS.pneumonia,
      settings: highFlowSettings,
      phase: 0,
      paused: false,
    });

    expect(Math.min(...highFlow.map((point) => point.y))).toBeLessThan(
      Math.min(...lowFlow.map((point) => point.y)),
    );
  });
}

function registerExpiratoryTailTests(): void {
  it('extends expiratory tail in airway obstruction', () => {
    const settings = { ...DEFAULT_SETTINGS, flow: 50 };
    const normalVitals = calculateSimulation(settings, SCENARIOS.normal).vitals;
    const obstructionVitals = calculateSimulation(settings, SCENARIOS.airwayObstruction).vitals;

    const normal = generateWaveform({
      kind: 'flow',
      vitals: normalVitals,
      scenario: SCENARIOS.normal,
      settings,
      phase: 0,
      paused: false,
    });
    const obstruction = generateWaveform({
      kind: 'flow',
      vitals: obstructionVitals,
      scenario: SCENARIOS.airwayObstruction,
      settings,
      phase: 0,
      paused: false,
    });

    const normalLateExpiration = normal[28]?.y ?? 0;
    const obstructionLateExpiration = obstruction[28]?.y ?? 0;

    expect(obstructionLateExpiration).toBeGreaterThan(normalLateExpiration);
  });
}

function registerPressureVolumeTests(): void {
  it('generates pressure and volume waveforms across inspiration and expiration', () => {
    const settings = { ...DEFAULT_SETTINGS, flow: 50 };
    const normalVitals = calculateSimulation(settings, SCENARIOS.normal).vitals;
    const obstructionVitals = calculateSimulation(settings, SCENARIOS.airwayObstruction).vitals;

    const pressure = generateWaveform({
      kind: 'pressure',
      vitals: normalVitals,
      scenario: SCENARIOS.normal,
      settings,
      phase: 0.25,
      paused: false,
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
    });
    const volume = generateWaveform({
      kind: 'volume',
      vitals: obstructionVitals,
      scenario: SCENARIOS.airwayObstruction,
      settings,
      phase: 0.45,
      paused: true,
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
    });

    expect(pressure).toHaveLength(WAVEFORM_POINT_COUNT);
    expect(volume).toHaveLength(WAVEFORM_POINT_COUNT);
    expect(pressure[WAVEFORM_LAST_POINT_INDEX]?.x).toBe(CHART_WIDTH);
    expect(volume.every((point) => point.y >= 0 && point.y <= CHART_HEIGHT)).toBe(true);
  });
}

function registerCapnographyTests(): void {
  it('generates capnography and supports zoomed historical windows', () => {
    const { vitals } = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.airwayObstruction);
    const capnography = generateWaveform({
      kind: 'co2',
      vitals,
      scenario: SCENARIOS.airwayObstruction,
      settings: DEFAULT_SETTINGS,
      phase: 0.6,
      paused: false,
    });
    const zoomedHistory = generateWaveform({
      kind: 'co2',
      vitals,
      scenario: SCENARIOS.airwayObstruction,
      settings: DEFAULT_SETTINGS,
      phase: 0.6,
      paused: false,
      historyOffsetSeconds: 8,
      zoom: 4,
    });

    expect(capnography).toHaveLength(WAVEFORM_POINT_COUNT);
    expect(Math.min(...capnography.map((point) => point.y))).toBeLessThan(
      Math.max(...capnography.map((point) => point.y)),
    );
    expect(zoomedHistory.map((point) => point.y.toFixed(1))).not.toEqual(
      capnography.map((point) => point.y.toFixed(1)),
    );
  });
}

function registerAdvancedModeTests(): void {
  it('generates distinct mode-specific waveform shapes for advanced ventilator modes', () => {
    const { vitals } = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.ards);
    const baseline = generateWaveform({
      kind: 'pressure',
      phase: 0,
      paused: false,
      scenario: SCENARIOS.ards,
      settings: DEFAULT_SETTINGS,
      vitals,
    });
    const advancedModes = ['BiPAP', 'SIMV', 'APRV', 'HFOV', 'NIV'] as const;

    for (const mode of advancedModes) {
      const pressure = generateWaveform({
        kind: 'pressure',
        phase: 0,
        paused: false,
        scenario: SCENARIOS.ards,
        settings: { ...DEFAULT_SETTINGS, mode },
        vitals,
      });

      expect(pressure).toHaveLength(WAVEFORM_POINT_COUNT);
      expect(new Set(pressure.map((point) => point.y.toFixed(1))).size).toBeGreaterThan(1);
      expect(pressure.map((point) => point.y.toFixed(1))).not.toEqual(
        baseline.map((point) => point.y.toFixed(1)),
      );
    }

    expectAdvancedModeKind('HFOV', 'flow', vitals);
    expectAdvancedModeKind('HFOV', 'volume', vitals);
    expectAdvancedModeKind('APRV', 'flow', vitals);
    expectAdvancedModeKind('APRV', 'volume', vitals);
    expectAdvancedModeKind('BiPAP', 'flow', vitals);
    expectAdvancedModeKind('BiPAP', 'volume', vitals);
  });
}

function registerPatientMonitoringWaveformTests(): void {
  it('generates patient monitoring waveforms for ECG, pleth, IBP, CVP, PAP, and EEG/BIS', () => {
    const { vitals } = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
    const patientMonitoringKinds = ['ecg', 'pleth', 'ibp', 'cvp', 'pap', 'eeg'] as const;

    for (const kind of patientMonitoringKinds) {
      const waveform = generateWaveform({
        kind,
        phase: 0.3,
        paused: false,
        scenario: SCENARIOS.pneumonia,
        settings: DEFAULT_SETTINGS,
        vitals,
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
      });

      expect(waveform).toHaveLength(WAVEFORM_POINT_COUNT);
      expect(waveform[WAVEFORM_LAST_POINT_INDEX]?.x).toBe(CHART_WIDTH);
      expect(waveform.every((point) => point.y >= 0 && point.y <= CHART_HEIGHT)).toBe(true);
      expect(new Set(waveform.map((point) => point.y.toFixed(1))).size).toBeGreaterThan(1);
    }

    const afibWaveform = generateWaveform({
      kind: 'ecg',
      phase: 0.3,
      paused: false,
      scenario: SCENARIOS.cardiogenicShock,
      settings: DEFAULT_SETTINGS,
      vitals: calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.cardiogenicShock).vitals,
    });
    const vtachWaveform = generateWaveform({
      kind: 'ecg',
      phase: 0.3,
      paused: false,
      scenario: SCENARIOS.postCardiacArrest,
      settings: DEFAULT_SETTINGS,
      vitals: {
        ...calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.postCardiacArrest).vitals,
        heartRate: 132,
      },
    });
    expect(afibWaveform.map((point) => point.y.toFixed(1))).not.toEqual(
      vtachWaveform.map((point) => point.y.toFixed(1)),
    );
  });
}

function expectAdvancedModeKind(
  mode: 'APRV' | 'BiPAP' | 'HFOV',
  kind: 'flow' | 'volume',
  vitals: ReturnType<typeof calculateSimulation>['vitals'],
): void {
  const waveform = generateWaveform({
    kind,
    phase: 0.2,
    paused: false,
    scenario: SCENARIOS.ards,
    settings: { ...DEFAULT_SETTINGS, mode },
    vitals,
  });

  expect(waveform).toHaveLength(WAVEFORM_POINT_COUNT);
  expect(new Set(waveform.map((point) => point.y.toFixed(1))).size).toBeGreaterThan(1);
}
