import {
  DEFAULT_SETTINGS,
  SCENARIOS,
  type Scenario,
  type ScenarioType,
  type VentSettings,
} from '@/simulation/scenarios';

/** Builds test ventilator settings from defaults plus targeted overrides. */
export function buildVentSettings(overrides: Partial<VentSettings> = {}): VentSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...overrides,
  };
}

/** Builds a test scenario from the scenario catalog plus targeted overrides. */
export function buildScenario(type: ScenarioType = 'pneumonia', overrides: Partial<Scenario> = {}): Scenario {
  return {
    ...SCENARIOS[type],
    ...overrides,
  };
}
