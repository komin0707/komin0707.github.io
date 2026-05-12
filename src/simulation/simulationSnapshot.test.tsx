import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './scenarios';
import {
  SIMULATION_SNAPSHOT_VERSION,
  isTimeScale,
  normalizeVentSettings,
  parseSimulationSnapshot,
  serializeSimulationSnapshot,
} from './simulationSnapshot';

const VALID_TIME_SCALE = 60;
const INVALID_TIME_SCALE = 3;

describe('simulation snapshot serialization', () => {
  registerSnapshotRoundTripTest();
  registerInvalidSnapshotTests();
  registerUnsafeSettingsTests();
});

function registerSnapshotRoundTripTest(): void {
  it('round-trips elapsed time, speed, scenario, pause state, and settings as JSON', () => {
    const json = serializeSimulationSnapshot({
      elapsedSeconds: 975,
      paused: true,
      scenarioType: 'ards',
      settings: { ...DEFAULT_SETTINGS, fio2: 80, mode: 'PC' },
      timeScale: 5,
      version: SIMULATION_SNAPSHOT_VERSION,
    });

    expect(parseSimulationSnapshot(json)).toEqual({
      elapsedSeconds: 975,
      paused: true,
      scenarioType: 'ards',
      settings: { ...DEFAULT_SETTINGS, fio2: 80, mode: 'PC' },
      timeScale: 5,
      version: SIMULATION_SNAPSHOT_VERSION,
    });
  });
}

function registerInvalidSnapshotTests(): void {
  it('rejects invalid snapshots and normalizes unsafe settings', () => {
    expect(parseSimulationSnapshot('{')).toBeNull();
    expect(parseSimulationSnapshot(JSON.stringify({ version: 999 }))).toBeNull();
    expect(parseSimulationSnapshot(JSON.stringify(null))).toBeNull();
    expect(parseSimulationSnapshot(JSON.stringify({ version: SIMULATION_SNAPSHOT_VERSION }))).toBeNull();
    expect(
      parseSimulationSnapshot(
        JSON.stringify({
          scenarioType: 'normal',
          timeScale: 3,
          version: SIMULATION_SNAPSHOT_VERSION,
        }),
      ),
    ).toBeNull();
    expect(isTimeScale(VALID_TIME_SCALE)).toBe(true);
    expect(isTimeScale(INVALID_TIME_SCALE)).toBe(false);
    expect(normalizeVentSettings(null)).toBe(DEFAULT_SETTINGS);
  });
}

function registerUnsafeSettingsTests(): void {
  it('normalizes unsafe settings with per-field defaults', () => {
    expect(
      normalizeVentSettings({
        flow: 'fast',
        fio2: Number.NaN,
        inspiratoryTime: null,
        mode: 'bad-mode',
        peep: 9,
        respiratoryRate: undefined,
        tidalVolume: {},
        trigger: [],
      }),
    ).toEqual({ ...DEFAULT_SETTINGS, peep: 9 });
  });
}
