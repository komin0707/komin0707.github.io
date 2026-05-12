import { DEFAULT_SETTINGS, type ScenarioType, type VentSettings } from './scenarios';
import { TIME_SCALE_OPTIONS } from './simulationTime';
import { isScenarioType, isVentMode } from './typeGuards';

/** Current persisted simulator snapshot schema version. */
export const SIMULATION_SNAPSHOT_VERSION = 1;

/** Supported playback speed multipliers for exported simulation snapshots. */
export type TimeScale = 1 | 2 | 5 | 10 | 60;

/** Portable JSON shape used for exporting and importing simulator state. */
export type SimulationSnapshot = {
  elapsedSeconds: number;
  paused: boolean;
  scenarioType: ScenarioType;
  settings: VentSettings;
  timeScale: TimeScale;
  version: typeof SIMULATION_SNAPSHOT_VERSION;
};

/** Returns true when an unknown value is a supported snapshot time scale. */
export function isTimeScale(value: unknown): value is TimeScale {
  return typeof value === 'number' && TIME_SCALE_OPTIONS.includes(value as TimeScale);
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Coerces unknown snapshot settings into safe ventilator settings with defaults. */
export function normalizeVentSettings(value: unknown): VentSettings {
  if (!isRecord(value)) return DEFAULT_SETTINGS;

  return {
    fio2: finiteNumber(value.fio2, DEFAULT_SETTINGS.fio2),
    flow: finiteNumber(value.flow, DEFAULT_SETTINGS.flow),
    inspiratoryTime: finiteNumber(value.inspiratoryTime, DEFAULT_SETTINGS.inspiratoryTime),
    mode: typeof value.mode === 'string' && isVentMode(value.mode) ? value.mode : DEFAULT_SETTINGS.mode,
    peep: finiteNumber(value.peep, DEFAULT_SETTINGS.peep),
    respiratoryRate: finiteNumber(value.respiratoryRate, DEFAULT_SETTINGS.respiratoryRate),
    tidalVolume: finiteNumber(value.tidalVolume, DEFAULT_SETTINGS.tidalVolume),
    trigger: finiteNumber(value.trigger, DEFAULT_SETTINGS.trigger),
  };
}

/** Serializes a validated simulator snapshot for copy/paste or file storage. */
export function serializeSimulationSnapshot(snapshot: SimulationSnapshot) {
  return JSON.stringify(snapshot, null, 2);
}

/** Parses snapshot JSON defensively and returns null for unsupported or malformed payloads. */
export function parseSimulationSnapshot(json: string): SimulationSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== SIMULATION_SNAPSHOT_VERSION) return null;

    const scenarioType =
      typeof parsed.scenarioType === 'string' && isScenarioType(parsed.scenarioType)
        ? parsed.scenarioType
        : null;
    const timeScale = isTimeScale(parsed.timeScale) ? parsed.timeScale : null;
    if (!scenarioType || !timeScale) return null;

    return {
      elapsedSeconds: Math.max(0, Math.round(finiteNumber(parsed.elapsedSeconds, 0))),
      paused: parsed.paused === true,
      scenarioType,
      settings: normalizeVentSettings(parsed.settings),
      timeScale,
      version: SIMULATION_SNAPSHOT_VERSION,
    };
  } catch {
    return null;
  }
}
