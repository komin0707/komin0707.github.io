import { useCallback, useState } from 'react';
import { DEFAULT_SETTINGS, type ScenarioType, type VentSettings } from '@/simulation/scenarios';

const DEFAULT_SCENARIO: ScenarioType = 'pneumonia';

export function useVentilatorSettings() {
  const [settings, setSettings] = useState<VentSettings>(DEFAULT_SETTINGS);
  const [scenarioType, setScenarioType] = useState<ScenarioType>(DEFAULT_SCENARIO);

  const updateSetting = useCallback(<K extends keyof VentSettings>(key: K, value: VentSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setScenarioType(DEFAULT_SCENARIO);
  }, []);

  const replaceSettings = useCallback((nextSettings: VentSettings) => setSettings(nextSettings), []);

  return {
    DEFAULT_SCENARIO,
    replaceSettings,
    resetSettings,
    scenarioType,
    setScenarioType,
    settings,
    updateSetting,
  };
}
