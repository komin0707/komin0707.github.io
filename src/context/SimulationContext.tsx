import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useElapsedTimer, useSimulation, useVentilatorSettings } from '@/hooks';
import { SCENARIOS } from '@/simulation/scenarios';
import {
  parseSimulationSnapshot,
  serializeSimulationSnapshot,
  SIMULATION_SNAPSHOT_VERSION,
  type TimeScale,
} from '@/simulation/simulationSnapshot';
import { DEFAULT_ALARM_THRESHOLDS, type AlarmThresholds } from '@/simulation/ventilatorModel';
import { SimulationContext } from './simulationContextValue';

type SimulationProviderProps = {
  children: ReactNode;
};

const PHYSIOLOGY_BASELINE_SECONDS = 765;

/** Owns simulator state transitions and exposes a single context value for the dashboard. */
export function SimulationProvider({ children }: Readonly<SimulationProviderProps>) {
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState<TimeScale>(1);
  const [alarmThresholds, setAlarmThresholds] = useState<AlarmThresholds>(DEFAULT_ALARM_THRESHOLDS);
  // prettier-ignore
  const { elapsedMilliseconds, elapsedSeconds, jumpToElapsedSeconds, resetElapsedSeconds, rewindElapsedSeconds } = useElapsedTimer(paused, timeScale);
  const { replaceSettings, resetSettings, scenarioType, setScenarioType, settings, updateSetting } =
    useVentilatorSettings();
  const scenario = SCENARIOS[scenarioType];
  const simulation = useSimulation(
    settings,
    scenario,
    alarmThresholds,
    Math.max(0, elapsedSeconds - PHYSIOLOGY_BASELINE_SECONDS),
  );

  const updateAlarmThreshold = useCallback((key: keyof AlarmThresholds, value: number) => {
    setAlarmThresholds((current) => ({ ...current, [key]: value }));
  }, []);

  // prettier-ignore
  const reset = useCallback(() => { resetSettings(); setAlarmThresholds(DEFAULT_ALARM_THRESHOLDS); setPaused(false); setTimeScale(1); resetElapsedSeconds(); }, [resetElapsedSeconds, resetSettings]);

  // prettier-ignore
  const exportSnapshot = useCallback(
    () => serializeSimulationSnapshot({ elapsedSeconds, paused, scenarioType, settings, timeScale, version: SIMULATION_SNAPSHOT_VERSION }),
    [elapsedSeconds, paused, scenarioType, settings, timeScale],
  );

  // prettier-ignore
  const importSnapshot = useCallback(
    (json: string) => {
      const snapshot = parseSimulationSnapshot(json); if (!snapshot) return false; replaceSettings(snapshot.settings); setScenarioType(snapshot.scenarioType); setPaused(snapshot.paused); setTimeScale(snapshot.timeScale); jumpToElapsedSeconds(snapshot.elapsedSeconds); return true;
    },
    [jumpToElapsedSeconds, replaceSettings, setScenarioType],
  );

  // prettier-ignore
  const value = useMemo(
    () => ({ alarmThresholds, elapsedMilliseconds, elapsedSeconds, exportSnapshot, importSnapshot, jumpToTime: jumpToElapsedSeconds, paused, reset, rewindTime: rewindElapsedSeconds, scenario, scenarioType, setPaused, setScenarioType, setTimeScale, settings, simulation, timeScale, updateAlarmThreshold, updateSetting }),
    [alarmThresholds, elapsedMilliseconds, elapsedSeconds, exportSnapshot, importSnapshot, jumpToElapsedSeconds, paused, reset, rewindElapsedSeconds, scenario, scenarioType, setScenarioType, settings, simulation, timeScale, updateAlarmThreshold, updateSetting],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}
