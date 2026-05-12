import { useMemo } from 'react';
import type { Scenario, VentSettings } from '@/simulation/scenarios';
import { calculateSimulation, type AlarmThresholds } from '@/simulation/ventilatorModel';

export function useSimulation(
  settings: VentSettings,
  scenario: Scenario,
  alarmThresholds?: AlarmThresholds,
  elapsedSeconds = 0,
) {
  return useMemo(
    () => calculateSimulation(settings, scenario, alarmThresholds, { elapsedSeconds }),
    [alarmThresholds, elapsedSeconds, settings, scenario],
  );
}
