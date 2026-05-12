import {
  AlarmPanel,
  BottomBar,
  Header,
  InteractionToolbar,
  LungStatusPanel,
  ModeSafetyPanel,
  MonitorPanel,
  PatientConditionPanel,
  ScenarioInterventionPanel,
  SettingsPanel,
} from '@/components';
import { APP_CONFIG } from '@/config';
import { SimulationProvider, type SimulationContextValue } from '@/context';
import { APP_COPY, type AppLocale } from '@/lib';
import {
  SCENARIO_ORDER,
  useSimulatorLayoutModel,
  type SimulatorLayoutModel,
} from '@/hooks/useSimulatorLayoutModel';
import type { CSSProperties } from 'react';
import './App.css';
import './App.responsive.css';

/** Root simulator application with provider-backed state and panel layout. */
export default function App() {
  return (
    <SimulationProvider>
      <SimulatorLayout />
    </SimulationProvider>
  );
}

function SimulatorLayout() {
  const model = useSimulatorLayoutModel();
  const copy = APP_COPY[model.locale];

  return <SimulatorShell copy={copy} model={model} />;
}

function SimulatorShell({
  copy,
  model,
}: Readonly<{ copy: (typeof APP_COPY)[AppLocale]; model: SimulatorLayoutModel }>) {
  const { i, state, vp } = model;

  return (
    <main
      aria-describedby="education-warning"
      aria-labelledby="app-title"
      className="simulator-shell"
      data-accessibility-calm={i.accessibilityPreferences.calmMode}
      data-accessibility-distraction-free={i.accessibilityPreferences.distractionFreeMode}
      data-accessibility-easy-read={i.accessibilityPreferences.easyReadMode}
      data-accessibility-focus={i.accessibilityPreferences.focusMode}
      data-accessibility-high-contrast={i.accessibilityPreferences.highContrastMode}
      data-accessibility-inverted={i.accessibilityPreferences.invertedColorsMode}
      data-accessibility-plain-language={i.accessibilityPreferences.plainLanguageMode}
      data-accessibility-reading-guide={i.accessibilityPreferences.readingGuide}
      data-color-vision={i.accessibilityPreferences.colorVisionMode}
      data-palette={i.colorblindPalette ? 'colorblind' : 'default'}
      data-mobile-panel-state={i.mobilePanelState}
      data-orientation-status={i.orientationStatus}
      data-scroll-bucket={vp.scrollBucket}
      data-testid="vent-simulator"
      data-viewport-width={vp.width}
      role="main"
      onContextMenu={(event) => {
        event.preventDefault();
        i.setContextMenu({ x: event.clientX, y: event.clientY });
      }}
      onDoubleClick={i.handleDoubleClickZoom}
      onDragOver={(event) => event.preventDefault()}
      onDrop={i.handleDrop}
      onTouchEnd={i.handleTouchEnd}
      onTouchMove={i.handleTouchMove}
      onTouchStart={i.handleTouchStart}
      style={getInteractionZoomStyle(i.interactionZoom)}
    >
      <a className="skip-link" href="#simulator-content">
        {copy.skipLink}
      </a>
      <SimulatorHeader model={model} />
      <SimulatorGrid state={state} />
      <SimulatorScenarioControls model={model} />
      <SimulatorDebugPanel state={state} />
      <SimulatorToolbar model={model} />
      <SimulatorTimeline model={model} />
      <SimulatorStatus copy={copy} />
    </main>
  );
}

function SimulatorHeader({ model }: Readonly<{ model: SimulatorLayoutModel }>) {
  const { i, locale, state } = model;

  return (
    <Header
      isColorblindPalette={i.colorblindPalette}
      locale={locale}
      mode={state.settings.mode}
      onLocaleAutoDetect={model.autoDetectLocale}
      onLocaleChange={model.setLocale}
      onLocaleToggle={model.switchLang}
      onModeChange={model.modeChange}
      onPaletteToggle={() => i.setColorblindPalette((value) => !value)}
    />
  );
}

function SimulatorGrid({ state }: Readonly<{ state: SimulationContextValue }>) {
  return (
    <section className="simulator-grid" id="simulator-content">
      <SettingsPanel settings={state.settings} onChange={state.updateSetting} />
      <SimulatorPatientColumn state={state} />
      <MonitorPanel
        clinical={state.simulation.clinical}
        isPaused={state.paused}
        scenario={state.scenario}
        settings={state.settings}
        vitals={state.simulation.vitals}
      />
    </section>
  );
}

function SimulatorPatientColumn({ state }: Readonly<{ state: SimulationContextValue }>) {
  return (
    <div className="center-column">
      <PatientConditionPanel
        condition={state.simulation.condition}
        description={state.simulation.description}
        fio2={state.settings.fio2}
        inspiratoryTime={state.settings.inspiratoryTime}
        mode={state.settings.mode}
        scenario={state.scenario}
        visualState={state.simulation.visualState}
        vitals={state.simulation.vitals}
      />
      <div className="lower-grid">
        <LungStatusPanel
          scenario={state.scenario}
          visualState={state.simulation.visualState}
          vitals={state.simulation.vitals}
        />
        <AlarmPanel
          alarms={state.simulation.alarms}
          elapsedSeconds={state.elapsedSeconds}
          onThresholdChange={state.updateAlarmThreshold}
          thresholds={state.alarmThresholds}
        />
      </div>
    </div>
  );
}

function SimulatorScenarioControls({ model }: Readonly<{ model: SimulatorLayoutModel }>) {
  return (
    <>
      <ScenarioInterventionPanel
        interventions={model.i.interventions}
        onChange={model.update}
        progress={model.progress}
      />
      <ModeSafetyPanel safety={model.ms} />
    </>
  );
}

function SimulatorDebugPanel({ state }: Readonly<{ state: SimulationContextValue }>) {
  if (import.meta.env.PROD) return null;
  if (!APP_CONFIG.debugPanelEnabled) return null;

  return (
    <aside aria-label="Debug panel" className="debug-panel" role="complementary">
      <strong>Debug</strong>
      <span>env {APP_CONFIG.appEnv}</span>
      <span>scenario {state.scenarioType}</span>
      <span>timeScale {state.timeScale}x</span>
      <span>paused {state.paused ? 'yes' : 'no'}</span>
    </aside>
  );
}

function SimulatorToolbar({ model }: Readonly<{ model: SimulatorLayoutModel }>) {
  const { i, state } = model;

  return (
    <InteractionToolbar
      arStatus={i.arStatus}
      accessibilityPreferences={i.accessibilityPreferences}
      commandPaletteOpen={i.commandPaletteOpen}
      contextMenu={i.contextMenu}
      debugMode={i.debugMode}
      examMode={i.examMode}
      exitConfirmOpen={i.exitConfirmOpen}
      fullscreenMode={i.fullscreenMode}
      gestureMessage={i.gestureMessage}
      hapticsEnabled={i.hapticsEnabled}
      helpMode={i.helpMode}
      isPaused={state.paused}
      mobilePanelState={i.mobilePanelState}
      onArCheck={i.checkArSupport}
      onAccessibilityPreferenceToggle={i.toggleAccessibilityPreference}
      onContextMenuClose={() => i.setContextMenu(null)}
      onExamModeToggle={() => i.setExamMode((value) => !value)}
      onHapticTest={i.pulseHaptic}
      onHapticsToggle={() => i.setHapticsEnabled((value) => !value)}
      onHelpModeToggle={() => i.setHelpMode((value) => !value)}
      onPauseToggle={() => state.setPaused((value) => !value)}
      onReset={state.reset}
      onScenarioDragStart={(event, scenarioName) => event.dataTransfer.setData('text/plain', scenarioName)}
      onColorVisionModeChange={i.setColorVisionMode}
      onShortcutDisableToggle={() => i.setShortcutsDisabled((value) => !value)}
      onSpatialCommand={i.runSpatialCommand}
      onVoiceNameChange={i.setVoiceName}
      onVoiceOutputToggle={() => i.setVoiceOutputEnabled((value) => !value)}
      onVoiceRateChange={i.setVoiceRate}
      onVoiceSpeak={i.speakClinicalMessage}
      onVoiceVolumeChange={i.setVoiceVolume}
      orientationStatus={i.orientationStatus}
      onTutorialAdvance={i.advanceTutorial}
      onTutorialClose={i.closeTutorial}
      onVoiceCommand={i.startVoiceCommand}
      searchOpen={i.searchOpen}
      scenarioOrder={SCENARIO_ORDER}
      settingsShortcutOpen={i.settingsShortcutOpen}
      shortcutStatus={i.shortcutStatus}
      shortcutsDisabled={i.shortcutsDisabled}
      spatialStatus={i.spatialStatus}
      tutorialOpen={i.tutorialOpen}
      tutorialStep={i.tutorialStep}
      voiceName={i.voiceName}
      voiceOutputEnabled={i.voiceOutputEnabled}
      voiceRate={i.voiceRate}
      voiceStatus={i.voiceStatus}
      voiceVolume={i.voiceVolume}
      xrMode={i.xrMode}
    />
  );
}

function SimulatorTimeline({ model }: Readonly<{ model: SimulatorLayoutModel }>) {
  const { locale, state } = model;

  return (
    <BottomBar
      elapsedMilliseconds={state.elapsedMilliseconds}
      elapsedSeconds={state.elapsedSeconds}
      isPaused={state.paused}
      locale={locale}
      onExportSnapshot={state.exportSnapshot}
      onImportSnapshot={state.importSnapshot}
      onJumpToTime={state.jumpToTime}
      onPauseToggle={() => state.setPaused((value) => !value)}
      onReset={state.reset}
      onRewind={state.rewindTime}
      onScenarioChange={state.setScenarioType}
      onTimeScaleChange={state.setTimeScale}
      scenarioType={state.scenarioType}
      timeScale={state.timeScale}
    />
  );
}

function SimulatorStatus({ copy }: Readonly<{ copy: (typeof APP_COPY)[AppLocale] }>) {
  return (
    <>
      <p className="education-warning" id="education-warning">
        {copy.educationWarning}
      </p>
      <p aria-live="polite" className="sr-only" role="status">
        {copy.loaded}
      </p>
    </>
  );
}

function getInteractionZoomStyle(interactionZoom: number): CSSProperties {
  return { '--interaction-zoom': interactionZoom } as CSSProperties;
}
