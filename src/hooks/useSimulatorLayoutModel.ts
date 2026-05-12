import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useSimulationContext, type SimulationContextValue } from '@/context';
import { detectBrowserLocale, localeDirection, nextLocale, resolveLocale, type AppLocale } from '@/lib';
import { applyModeDefaults, calculateModeSafety } from '@/simulation/modeSafety';
import { calculateScenarioProgress, type InterventionState } from '@/simulation/scenarioEngine';
import type { ScenarioType, VentMode, VentSettings } from '@/simulation/scenarios';
import { terminateWaveformWorker } from '@/simulation/waveformWorkerClient';
import { useMemoryPressurePause } from './useMemoryPressurePause';
import { useSimulatorInteractions } from './useSimulatorInteractions';
import { useThrottledViewportMetrics } from './useThrottledViewportMetrics';

/** Default scenario traversal order used by scenario navigation controls. */
export const SCENARIO_ORDER: ScenarioType[] = [
  'normal',
  'pneumonia',
  'ards',
  'airwayObstruction',
  'pneumothorax',
  'pulmonaryEmbolism',
  'pulmonaryFibrosis',
  'aspirationPneumonia',
  'drowning',
  'burnInhalation',
  'covidArds',
  'atelectasis',
  'pulmonaryEdema',
  'diaphragmParalysis',
  'neuromuscularDisease',
  'opioidOverdose',
  'sepsisRespiratoryFailure',
  'traumaticChestInjury',
  'cardiogenicShock',
  'postCardiacArrest',
  'stroke',
  'traumaticBrainInjury',
  'diabeticKetoacidosis',
  'chronicKidneyDisease',
  'hepaticEncephalopathy',
  'paralyticMedication',
];

/** View model returned by the simulator layout orchestration hook. */
export type SimulatorLayoutModel = ReturnType<typeof useSimulatorLayoutModel>;

/** Builds the state, callbacks, and derived values consumed by the simulator layout. */
export function useSimulatorLayoutModel() {
  const [locale, setLocale] = useState<AppLocale>(() => readUrlLocale() ?? 'ko');
  const [modeWarning, setModeWarning] = useState('');
  const viewportMetrics = useThrottledViewportMetrics();
  const simulationState = useSimulationContext();
  const modeChange = useModeDefaultsHandler(
    simulationState.settings,
    simulationState.updateSetting,
    setModeWarning,
  );
  const interactions = useSimulatorInteractions({
    elapsedSeconds: simulationState.elapsedSeconds,
    exportSnapshot: simulationState.exportSnapshot,
    importSnapshot: simulationState.importSnapshot,
    jumpToTime: simulationState.jumpToTime,
    onModeChange: modeChange,
    reset: simulationState.reset,
    rewindTime: simulationState.rewindTime,
    scenarioOrder: SCENARIO_ORDER,
    scenarioType: simulationState.scenarioType,
    settings: simulationState.settings,
    setPaused: simulationState.setPaused,
    setScenarioType: simulationState.setScenarioType,
    setTimeScale: simulationState.setTimeScale,
    timeScale: simulationState.timeScale,
    updateSetting: simulationState.updateSetting,
  });
  const modeSafety = useMemo(
    () => calculateModeSafety(simulationState.settings, simulationState.simulation.vitals),
    [simulationState.settings, simulationState.simulation.vitals],
  );

  useMemoryPressurePause(simulationState.setPaused);
  useDocumentLocale(locale);
  usePauseWhenHidden(simulationState.setPaused);
  usePageLifecycleMemoryControls(simulationState.setPaused);

  return {
    modeChange,
    i: interactions,
    locale,
    ms: { ...modeSafety, safetyWarning: modeWarning || modeSafety.safetyWarning },
    progress: useScenarioProgress(simulationState, interactions.interventions),
    state: simulationState,
    autoDetectLocale: () => setLocale(detectBrowserLocale()),
    setLocale,
    switchLang: () => setLocale((value) => nextLocale(value)),
    update: useInterventionUpdater(interactions.setInterventions),
    vp: viewportMetrics,
  };
}

function useScenarioProgress(state: SimulationContextValue, interventions: InterventionState) {
  return useMemo(
    () =>
      calculateScenarioProgress({
        elapsedSeconds: state.elapsedSeconds,
        interventions,
        scenario: state.scenario,
        settings: state.settings,
        vitals: state.simulation.vitals,
      }),
    [interventions, state.elapsedSeconds, state.scenario, state.settings, state.simulation.vitals],
  );
}

function useModeDefaultsHandler(
  settings: VentSettings,
  updateSetting: SimulationContextValue['updateSetting'],
  setModeWarning: Dispatch<SetStateAction<string>>,
) {
  return useCallback(
    (mode: VentMode) => {
      const adjustedSettings = applyModeDefaults(settings, mode);
      (Object.keys(adjustedSettings) as Array<keyof VentSettings>).forEach((key) => {
        if (adjustedSettings[key] !== settings[key]) updateSetting(key, adjustedSettings[key]);
      });
      setModeWarning(`${mode} defaults applied`);
    },
    [settings, setModeWarning, updateSetting],
  );
}

function useInterventionUpdater(setInterventions: Dispatch<SetStateAction<InterventionState>>) {
  return useCallback(
    <K extends keyof InterventionState>(key: K, value: InterventionState[K]) => {
      setInterventions((current) => ({ ...current, [key]: value }));
    },
    [setInterventions],
  );
}

function useDocumentLocale(locale: AppLocale) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
    writeUrlLocale(locale);
  }, [locale]);
}

function readUrlLocale(): AppLocale | null {
  return resolveLocale(new URLSearchParams(window.location.search).get('lang'));
}

function writeUrlLocale(locale: AppLocale): void {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', locale);
  window.history.replaceState(window.history.state, '', url);
}

function usePauseWhenHidden(setPaused: SimulationContextValue['setPaused']) {
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setPaused(true);
    };

    document.addEventListener('visibilitychange', pauseWhenHidden, { passive: true });
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [setPaused]);
}

function usePageLifecycleMemoryControls(setPaused: SimulationContextValue['setPaused']) {
  useEffect(() => {
    const pauseAndRelease = (event: Event) => {
      document.documentElement.dataset.pageLifecycle = event.type;
      setPaused(true);
      terminateWaveformWorker();
    };
    const markResume = () => {
      document.documentElement.dataset.pageLifecycle = 'resume';
    };

    window.addEventListener('beforeunload', pauseAndRelease);
    window.addEventListener('pagehide', pauseAndRelease);
    document.addEventListener('freeze', pauseAndRelease);
    document.addEventListener('resume', markResume);
    return () => {
      window.removeEventListener('beforeunload', pauseAndRelease);
      window.removeEventListener('pagehide', pauseAndRelease);
      document.removeEventListener('freeze', pauseAndRelease);
      document.removeEventListener('resume', markResume);
    };
  }, [setPaused]);
}
