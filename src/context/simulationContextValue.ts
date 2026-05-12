import { createContext } from 'react';
import { SCENARIOS, type ScenarioType, type VentSettings } from '@/simulation/scenarios';
import type { TimeScale } from '@/simulation/simulationSnapshot';
import type { AlarmThresholds, SimulationState } from '@/simulation/ventilatorModel';

export type SimulationContextValue = {
  elapsedSeconds: number;
  elapsedMilliseconds: number;
  alarmThresholds: AlarmThresholds;
  exportSnapshot: () => string;
  importSnapshot: (json: string) => boolean;
  jumpToTime: (seconds: number) => void;
  paused: boolean;
  reset: () => void;
  rewindTime: (seconds: number) => void;
  scenario: (typeof SCENARIOS)[ScenarioType];
  scenarioType: ScenarioType;
  setPaused: (paused: boolean | ((current: boolean) => boolean)) => void;
  setScenarioType: (scenario: ScenarioType) => void;
  setTimeScale: (timeScale: TimeScale) => void;
  updateAlarmThreshold: (key: keyof AlarmThresholds, value: number) => void;
  settings: VentSettings;
  simulation: SimulationState;
  timeScale: TimeScale;
  updateSetting: <K extends keyof VentSettings>(key: K, value: VentSettings[K]) => void;
};

export const SimulationContext = createContext<SimulationContextValue | null>(null);
