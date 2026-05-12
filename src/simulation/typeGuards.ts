import { SCENARIOS, VENT_MODES, type ScenarioType, type VentMode } from './scenarios';

const VENT_MODE_SET = new Set<VentMode>(VENT_MODES);

export function isVentMode(value: string): value is VentMode {
  return VENT_MODE_SET.has(value as VentMode);
}

export function isScenarioType(value: string): value is ScenarioType {
  return value in SCENARIOS;
}
