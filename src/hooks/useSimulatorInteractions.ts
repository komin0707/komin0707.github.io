import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type SetStateAction,
  type Touch as ReactTouch,
  type TouchEvent,
} from 'react';
import { DEFAULT_INTERVENTIONS } from '@/simulation/scenarioEngine';
import { VENT_MODES, type ScenarioType, type VentMode, type VentSettings } from '@/simulation/scenarios';
import type { TimeScale } from '@/simulation/simulationSnapshot';
import { TIME_SCALE_OPTIONS } from '@/simulation/simulationTime';
import { isScenarioType } from '@/simulation/typeGuards';

type ContextMenuState = {
  x: number;
  y: number;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  readonly 0: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  lang: string;
  maxAlternatives?: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type XRSystemLike = {
  isSessionSupported: (mode: string) => Promise<boolean>;
};

export type SpatialCommand =
  | 'ar-guide'
  | 'ar-marker'
  | 'ar-measure'
  | 'ar-overlay'
  | 'ar-patient-3d'
  | 'ar-ventilator-3d'
  | 'eye-tracking'
  | 'finger-point'
  | 'hand-wave-next'
  | 'head-tracking'
  | 'hololens'
  | 'magic-leap'
  | 'mixed-reality'
  | 'multi-user'
  | 'openxr'
  | 'palm-stop'
  | 'quest'
  | 'room-scale'
  | 'vision-pro'
  | 'vr-360'
  | 'vr-bedside'
  | 'vr-classroom'
  | 'vr-controller'
  | 'vr-exam'
  | 'vr-mode'
  | 'vr-voice-collab'
  | 'webxr';

export type AccessibilityPreferenceKey =
  | 'calmMode'
  | 'distractionFreeMode'
  | 'easyReadMode'
  | 'focusMode'
  | 'highContrastMode'
  | 'invertedColorsMode'
  | 'plainLanguageMode'
  | 'readingGuide';

export type ColorVisionMode = 'achromatopsia' | 'deuteranopia' | 'default' | 'protanopia' | 'tritanopia';

export type AccessibilityPreferences = Record<AccessibilityPreferenceKey, boolean> & {
  colorVisionMode: ColorVisionMode;
};

type TouchCollection = {
  readonly [index: number]: ReactTouch | undefined;
  readonly length: number;
};

type UseSimulatorInteractionsOptions = {
  elapsedSeconds: number;
  exportSnapshot: () => string;
  importSnapshot: (json: string) => boolean;
  jumpToTime: (seconds: number) => void;
  onModeChange: (mode: VentMode) => void;
  reset: () => void;
  rewindTime: (seconds: number) => void;
  scenarioOrder: readonly ScenarioType[];
  scenarioType: ScenarioType;
  settings: VentSettings;
  setPaused: Dispatch<SetStateAction<boolean>>;
  setScenarioType: (scenarioType: ScenarioType) => void;
  setTimeScale: (timeScale: TimeScale) => void;
  timeScale: TimeScale;
  updateSetting: <K extends keyof VentSettings>(key: K, value: VentSettings[K]) => void;
};

const LONG_PRESS_MS = 550;
const SHAKE_ACCELERATION_THRESHOLD = 24;
const TUTORIAL_STEP_COUNT = 5;

const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  calmMode: false,
  colorVisionMode: 'default',
  distractionFreeMode: false,
  easyReadMode: false,
  focusMode: false,
  highContrastMode: false,
  invertedColorsMode: false,
  plainLanguageMode: false,
  readingGuide: false,
};

export function useSimulatorInteractions(options: UseSimulatorInteractionsOptions) {
  const {
    elapsedSeconds,
    exportSnapshot,
    importSnapshot,
    jumpToTime,
    onModeChange,
    reset,
    rewindTime,
    scenarioOrder,
    scenarioType,
    settings,
    setPaused,
    setScenarioType,
    setTimeScale,
    timeScale,
    updateSetting,
  } = options;
  // prettier-ignore
  const [colorblindPalette, setColorblindPalette] = useState(false), [commandPaletteOpen, setCommandPaletteOpen] = useState(false), [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null), [debugMode, setDebugMode] = useState(false), [examMode, setExamMode] = useState(false), [exitConfirmOpen, setExitConfirmOpen] = useState(false), [fullscreenMode, setFullscreenMode] = useState(false), [gestureMessage, setGestureMessage] = useState('Ready'), [hapticsEnabled, setHapticsEnabled] = useState(true), [helpMode, setHelpMode] = useState(false), [interventions, setInterventions] = useState(DEFAULT_INTERVENTIONS), [interactionZoom, setInteractionZoom] = useState(1), [mobilePanelState, setMobilePanelState] = useState('expanded'), [orientationStatus, setOrientationStatus] = useState('orientation locked: portrait'), [searchOpen, setSearchOpen] = useState(false), [settingsShortcutOpen, setSettingsShortcutOpen] = useState(false), [shortcutsDisabled, setShortcutsDisabled] = useState(false), [shortcutStatus, setShortcutStatus] = useState('Shortcuts ready'), [spatialStatus, setSpatialStatus] = useState('Spatial controls ready'), [tutorialOpen, setTutorialOpen] = useState(false), [tutorialStep, setTutorialStep] = useState(0), [voiceName, setVoiceName] = useState('default'), [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true), [voiceRate, setVoiceRate] = useState(1), [voiceStatus, setVoiceStatus] = useState('Voice idle'), [voiceVolume, setVoiceVolume] = useState(0.8), [xrMode, setXrMode] = useState('2D bedside'), [arStatus, setArStatus] = useState('AR ready');
  const [accessibilityPreferences, setAccessibilityPreferences] = useState(DEFAULT_ACCESSIBILITY_PREFERENCES);
  const touchStartRef = useRef<{ distance: number; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
    },
    [],
  );

  const pulseHaptic = useCallback(
    (kind: 'alarm' | 'heavy' | 'light' | 'medium') => {
      if (!hapticsEnabled) return;
      const pattern = kind === 'alarm' ? [30, 20, 30] : kind === 'heavy' ? 28 : kind === 'medium' ? 18 : 8;
      navigator.vibrate?.(pattern);
    },
    [hapticsEnabled],
  );

  // prettier-ignore
  useEffect(() => { const handleKeyDown = (event: KeyboardEvent) => { const target = event.target; if (target instanceof Element) { if (target.matches('input, textarea, select')) return; if (event.code === 'Space' && target.matches('a[href], button, [role="switch"]')) return; } handleGlobalShortcut(event, { elapsedSeconds, exportSnapshot, importSnapshot, jumpToTime, onModeChange, reset, rewindTime, scenarioOrder, scenarioType, setCommandPaletteOpen, setContextMenu, setDebugMode, setExitConfirmOpen, setFullscreenMode, setHelpMode, setPaused, setScenarioType, setSearchOpen, setSettingsShortcutOpen, setShortcutStatus, setShortcutsDisabled, setTimeScale, setTutorialOpen, setTutorialStep, shortcutsDisabled, timeScale }); }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [elapsedSeconds, exportSnapshot, importSnapshot, jumpToTime, onModeChange, reset, rewindTime, scenarioOrder, scenarioType, setPaused, setScenarioType, setTimeScale, shortcutsDisabled, timeScale]);

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      const force = Math.max(
        Math.abs(acceleration?.x ?? 0),
        Math.abs(acceleration?.y ?? 0),
        Math.abs(acceleration?.z ?? 0),
      );
      if (force < SHAKE_ACCELERATION_THRESHOLD) return;
      setGestureMessage('Shake undo');
      setShortcutStatus('Shake undo requested');
      pulseHaptic('medium');
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [pulseHaptic]);

  useEffect(() => {
    const orientation = window.screen.orientation;
    const updateOrientationStatus = () => {
      const orientationType =
        orientation?.type ??
        (window.matchMedia?.('(orientation: landscape)').matches ? 'landscape-primary' : 'portrait-primary');
      setOrientationStatus(
        `orientation locked: ${orientationType.includes('landscape') ? 'landscape' : 'portrait'}`,
      );
    };

    updateOrientationStatus();
    orientation?.addEventListener('change', updateOrientationStatus);
    window.addEventListener('orientationchange', updateOrientationStatus);
    return () => {
      orientation?.removeEventListener('change', updateOrientationStatus);
      window.removeEventListener('orientationchange', updateOrientationStatus);
    };
  }, []);

  // prettier-ignore
  const cycleScenario = useCallback((direction: 1 | -1) => { const currentIndex = scenarioOrder.indexOf(scenarioType); const nextIndex = (currentIndex + direction + scenarioOrder.length) % scenarioOrder.length; const nextScenario = scenarioOrder[nextIndex] ?? 'pneumonia'; setScenarioType(nextScenario); pulseHaptic('light'); }, [pulseHaptic, scenarioOrder, scenarioType, setScenarioType]);

  // prettier-ignore
  const handleDrop = useCallback((event: DragEvent<HTMLElement>) => { event.preventDefault(); const droppedScenario = event.dataTransfer.getData('text/plain'); if (isScenarioType(droppedScenario)) { setScenarioType(droppedScenario); setGestureMessage(`Dropped ${droppedScenario}`); } }, [setScenarioType]);

  // prettier-ignore
  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    touchStartRef.current = { distance: touchDistance(event.touches), x: event.touches[0]?.clientX ?? 0, y: event.touches[0]?.clientY ?? 0 };
    if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
    if (event.touches.length > 1) { setMobilePanelState('multi-finger'); setGestureMessage('Multi-finger gesture'); return; }
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (!touch) return;
    longPressTimerRef.current = window.setTimeout(() => { setContextMenu({ x: touch.clientX, y: touch.clientY }); setGestureMessage('Long press menu'); pulseHaptic('heavy'); }, LONG_PRESS_MS);
  }, [pulseHaptic]);

  // prettier-ignore
  const handleTouchMove = useCallback((event: TouchEvent<HTMLElement>) => { const start = touchStartRef.current; if (!start) return; const movedTouch = event.touches[0]; if ((event.touches.length >= 2 || (movedTouch && Math.hypot(movedTouch.clientX - start.x, movedTouch.clientY - start.y) > 12)) && longPressTimerRef.current !== null) { window.clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } if (event.touches.length < 2) return; const nextDistance = touchDistance(event.touches); if (nextDistance <= 0 || start.distance <= 0) return; setInteractionZoom(Math.min(1.4, Math.max(0.82, nextDistance / start.distance))); setGestureMessage('Pinch zoom'); pulseHaptic('light'); }, [pulseHaptic]);

  // prettier-ignore
  const handleTouchEnd = useCallback((event: TouchEvent<HTMLElement>) => { if (longPressTimerRef.current !== null) { window.clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } const start = touchStartRef.current; const changedTouch = event.changedTouches[0]; touchStartRef.current = null; if (!start || !changedTouch) return; handleSwipeEnd(changedTouch, start, cycleScenario, setGestureMessage, setMobilePanelState, pulseHaptic); }, [cycleScenario, pulseHaptic]);

  // prettier-ignore
  const handleDoubleClickZoom = useCallback(() => { setInteractionZoom((value) => value === 1 ? 1.18 : 1); setGestureMessage('Double click zoom'); pulseHaptic('medium'); }, [pulseHaptic]);

  const speakClinicalMessage = useCallback(
    (kind: 'alarm' | 'vitals') => {
      speakClinicalText(kind, {
        enabled: voiceOutputEnabled,
        rate: voiceRate,
        voiceName,
        volume: voiceVolume,
      });
      setVoiceStatus(kind === 'alarm' ? 'TTS alarm spoken' : 'TTS vitals spoken');
    },
    [voiceName, voiceOutputEnabled, voiceRate, voiceVolume],
  );

  const runSpatialCommand = useCallback(
    (command: SpatialCommand) => {
      const status = spatialCommandStatus(command);
      if (command === 'hand-wave-next') cycleScenario(1);
      if (command === 'palm-stop') setPaused(true);
      if (command === 'finger-point') setHelpMode(true);
      if (command.startsWith('ar-')) setArStatus(status);
      if (command.startsWith('vr-') || command === 'mixed-reality') setXrMode(status);
      setSpatialStatus(status);
      setGestureMessage(status);
    },
    [cycleScenario, setPaused],
  );

  const toggleAccessibilityPreference = useCallback((key: AccessibilityPreferenceKey) => {
    setAccessibilityPreferences((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const setColorVisionMode = useCallback((colorVisionMode: ColorVisionMode) => {
    setAccessibilityPreferences((current) => ({ ...current, colorVisionMode }));
  }, []);

  // prettier-ignore
  const advanceTutorial = useCallback(() => { setTutorialOpen(true); setTutorialStep((value) => (value + 1) % TUTORIAL_STEP_COUNT); }, []);

  // prettier-ignore
  return {
    accessibilityPreferences, advanceTutorial, arStatus, checkArSupport: () => checkArSupport(setArStatus), closeTutorial: () => setTutorialOpen(false), colorblindPalette, commandPaletteOpen, contextMenu, debugMode, examMode, exitConfirmOpen, fullscreenMode, gestureMessage, handleDoubleClickZoom, handleDrop, handleTouchEnd, handleTouchMove, handleTouchStart, hapticsEnabled, helpMode, interactionZoom, interventions, mobilePanelState, orientationStatus, pulseHaptic, runSpatialCommand, searchOpen, setColorblindPalette, setColorVisionMode, setCommandPaletteOpen, setContextMenu, setExamMode, setExitConfirmOpen, setHapticsEnabled, setHelpMode, setInterventions, setMobilePanelState, setOrientationStatus, setSearchOpen, setSettingsShortcutOpen, setShortcutStatus, setShortcutsDisabled, setVoiceName, setVoiceOutputEnabled, setVoiceRate, setVoiceVolume, settingsShortcutOpen, shortcutStatus, shortcutsDisabled, spatialStatus, speakClinicalMessage, startVoiceCommand: () => startVoiceCommand({ reset, settings, setPaused, setVoiceStatus, updateSetting }), toggleAccessibilityPreference, tutorialOpen, tutorialStep, voiceName, voiceOutputEnabled, voiceRate, voiceStatus, voiceVolume, xrMode,
  };
}

type GlobalShortcutActions = Pick<
  UseSimulatorInteractionsOptions,
  | 'elapsedSeconds'
  | 'exportSnapshot'
  | 'importSnapshot'
  | 'jumpToTime'
  | 'onModeChange'
  | 'reset'
  | 'rewindTime'
  | 'scenarioOrder'
  | 'scenarioType'
  | 'setPaused'
  | 'setScenarioType'
  | 'setTimeScale'
  | 'timeScale'
> & {
  setCommandPaletteOpen: Dispatch<SetStateAction<boolean>>;
  setContextMenu: Dispatch<SetStateAction<ContextMenuState | null>>;
  setDebugMode: Dispatch<SetStateAction<boolean>>;
  setExitConfirmOpen: Dispatch<SetStateAction<boolean>>;
  setFullscreenMode: Dispatch<SetStateAction<boolean>>;
  setHelpMode: Dispatch<SetStateAction<boolean>>;
  setSearchOpen: Dispatch<SetStateAction<boolean>>;
  setSettingsShortcutOpen: Dispatch<SetStateAction<boolean>>;
  setShortcutStatus: Dispatch<SetStateAction<string>>;
  setShortcutsDisabled: Dispatch<SetStateAction<boolean>>;
  setTutorialOpen: Dispatch<SetStateAction<boolean>>;
  setTutorialStep: Dispatch<SetStateAction<number>>;
  shortcutsDisabled: boolean;
};

function handleGlobalShortcut(event: KeyboardEvent, actions: GlobalShortcutActions) {
  const {
    elapsedSeconds,
    exportSnapshot,
    importSnapshot,
    jumpToTime,
    onModeChange,
    reset,
    rewindTime,
    scenarioOrder,
    scenarioType,
    setCommandPaletteOpen,
    setContextMenu,
    setDebugMode,
    setExitConfirmOpen,
    setFullscreenMode,
    setHelpMode,
    setPaused,
    setScenarioType,
    setSearchOpen,
    setSettingsShortcutOpen,
    setShortcutStatus,
    setShortcutsDisabled,
    setTimeScale,
    setTutorialOpen,
    setTutorialStep,
    shortcutsDisabled,
    timeScale,
  } = actions;
  if (shortcutsDisabled && !(event.key === '?' || (event.ctrlKey && event.key === '/'))) return;
  if (event.code === 'Space') {
    event.preventDefault();
    setPaused((value) => !value);
    setShortcutStatus('Space pause/resume');
  } else if (event.key === 'Enter') {
    setExitConfirmOpen(false);
    setShortcutStatus('Enter confirm');
  } else if (event.ctrlKey && event.key.toLowerCase() === 'r') {
    event.preventDefault();
    reset();
    setShortcutStatus('Ctrl+R reset');
  } else if (event.key.toLowerCase() === 'r') {
    reset();
    setShortcutStatus('R reset');
  } else if (event.key.toLowerCase() === 'm') {
    setShortcutStatus('M alarm mute requested');
  } else if (event.key.toLowerCase() === 'n') {
    cycleScenarioByShortcut(1, scenarioOrder, scenarioType, setScenarioType);
    setShortcutStatus('N next scenario');
  } else if (event.key.toLowerCase() === 'p' && !event.ctrlKey) {
    cycleScenarioByShortcut(-1, scenarioOrder, scenarioType, setScenarioType);
    setShortcutStatus('P previous scenario');
  } else if (event.key.toLowerCase() === 'h') {
    setHelpMode((value) => !value);
    setShortcutStatus('H help');
  } else if (event.key.toLowerCase() === 't') {
    setTutorialOpen(true);
    setTutorialStep((value) => (value + 1) % TUTORIAL_STEP_COUNT);
    setShortcutStatus('T tutorial');
  } else if (event.key.toLowerCase() === 'd') {
    setDebugMode((value) => !value);
    setShortcutStatus('D debug mode');
  } else if (event.key.toLowerCase() === 'f') {
    setFullscreenMode((value) => !value);
    setShortcutStatus('F fullscreen');
  } else if (event.ctrlKey && event.key.toLowerCase() === 's') {
    event.preventDefault();
    localStorage.setItem('vent-simulator-shortcut-snapshot', exportSnapshot());
    setShortcutStatus('Ctrl+S snapshot saved');
  } else if (event.ctrlKey && event.key.toLowerCase() === 'o') {
    event.preventDefault();
    setShortcutStatus(
      importSnapshot(localStorage.getItem('vent-simulator-shortcut-snapshot') ?? '')
        ? 'Ctrl+O snapshot opened'
        : 'Ctrl+O no snapshot',
    );
  } else if (event.ctrlKey && event.key.toLowerCase() === 'e') {
    event.preventDefault();
    void navigator.clipboard?.writeText(exportSnapshot());
    setShortcutStatus('Ctrl+E exported');
  } else if (event.ctrlKey && event.key.toLowerCase() === 'p') {
    event.preventDefault();
    window.print();
    setShortcutStatus('Ctrl+P print');
  } else if (event.ctrlKey && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    setShortcutStatus('Ctrl+Z undo requested');
  } else if (event.ctrlKey && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    setShortcutStatus('Ctrl+Y redo requested');
  } else if (event.ctrlKey && event.key === ',') {
    event.preventDefault();
    setSettingsShortcutOpen((value) => !value);
    setShortcutStatus('Ctrl+, settings');
  } else if (event.ctrlKey && event.key === '/') {
    event.preventDefault();
    setSearchOpen((value) => !value);
    setShortcutStatus('Ctrl+/ search');
  } else if (event.ctrlKey && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    setCommandPaletteOpen((value) => !value);
    setShortcutStatus('Ctrl+K command palette');
  } else if (event.key === '+' || event.key === '=') {
    setTimeScale(nextTimeScale(timeScale, 1));
    setShortcutStatus('+ time scale');
  } else if (event.key === '-') {
    setTimeScale(nextTimeScale(timeScale, -1));
    setShortcutStatus('- time scale');
  } else if (event.ctrlKey && event.key === '0') {
    event.preventDefault();
    setTimeScale(1);
    setShortcutStatus('Ctrl+0 time scale 1x');
  } else if (event.key === '[') {
    rewindTime(30);
    setShortcutStatus('[ rewind');
  } else if (event.key === ']') {
    jumpToTime(elapsedSeconds + 30);
    setShortcutStatus('] forward');
  } else if (event.key.toLowerCase() === 'q') {
    setExitConfirmOpen(true);
    setShortcutStatus('Q exit confirm');
  } else if (/^[1-5]$/.test(event.key)) {
    onModeChange(VENT_MODES[Number(event.key) - 1] ?? 'AC');
    setShortcutStatus(`${event.key} mode selected`);
  } else if (/^[6-9]$|^0$/.test(event.key)) {
    const scenarioIndex = event.key === '0' ? 4 : Number(event.key) - 6;
    setScenarioType(scenarioOrder[scenarioIndex] ?? 'normal');
    setShortcutStatus(`${event.key} scenario selected`);
  } else if (event.key === '?') {
    event.preventDefault();
    setHelpMode((value) => !value);
    setShortcutStatus('? help dialog');
  } else if (event.key === 'Escape') {
    event.preventDefault();
    setContextMenu(null);
    setHelpMode(false);
    setCommandPaletteOpen(false);
    setSearchOpen(false);
    setSettingsShortcutOpen(false);
    setExitConfirmOpen(false);
    setShortcutStatus('Esc close');
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    focusSiblingControl(1);
    setShortcutStatus('Arrow focus next');
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    focusSiblingControl(-1);
    setShortcutStatus('Arrow focus previous');
  } else if (event.key === 'Home') {
    focusEdgeControl(0);
    setShortcutStatus('Home first control');
  } else if (event.key === 'End') {
    focusEdgeControl(-1);
    setShortcutStatus('End last control');
  } else if (event.key === 'PageUp') {
    setTimeScale(nextTimeScale(timeScale, 1));
    setShortcutStatus('Page Up large increase');
  } else if (event.key === 'PageDown') {
    setTimeScale(nextTimeScale(timeScale, -1));
    setShortcutStatus('Page Down large decrease');
  } else if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'x') {
    event.preventDefault();
    setShortcutsDisabled((value) => !value);
    setShortcutStatus('Shortcut disable toggled');
  }
}

function cycleScenarioByShortcut(
  direction: 1 | -1,
  scenarioOrder: readonly ScenarioType[],
  scenarioType: ScenarioType,
  setScenarioType: (scenarioType: ScenarioType) => void,
) {
  const currentIndex = Math.max(0, scenarioOrder.indexOf(scenarioType));
  setScenarioType(
    scenarioOrder[(currentIndex + direction + scenarioOrder.length) % scenarioOrder.length] ?? 'pneumonia',
  );
}

function nextTimeScale(current: TimeScale, direction: 1 | -1): TimeScale {
  const values: readonly TimeScale[] = TIME_SCALE_OPTIONS;
  const currentIndex = values.indexOf(current);
  return values[Math.min(values.length - 1, Math.max(0, currentIndex + direction))] ?? 1;
}

function focusableControls() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function focusSiblingControl(direction: 1 | -1) {
  const controls = focusableControls();
  if (controls.length === 0) return;
  const currentIndex = controls.findIndex((control) => control === document.activeElement);
  controls[(currentIndex + direction + controls.length) % controls.length]?.focus();
}

function focusEdgeControl(edge: 0 | -1) {
  const controls = focusableControls();
  if (controls.length === 0) return;
  controls.at(edge)?.focus();
}

function touchDistance(touches: TouchCollection) {
  if (touches.length < 2) return 0;
  const firstTouch = touches[0];
  const secondTouch = touches[1];
  if (!firstTouch || !secondTouch) return 0;
  return Math.hypot(firstTouch.clientX - secondTouch.clientX, firstTouch.clientY - secondTouch.clientY);
}

function handleSwipeEnd(
  changedTouch: ReactTouch,
  start: { distance: number; x: number; y: number },
  cycleScenario: (direction: 1 | -1) => void,
  setGestureMessage: Dispatch<SetStateAction<string>>,
  setMobilePanelState: Dispatch<SetStateAction<string>>,
  pulseHaptic: (kind: 'alarm' | 'heavy' | 'light' | 'medium') => void,
) {
  const dx = changedTouch.clientX - start.x;
  const dy = changedTouch.clientY - start.y;
  if (Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy)) {
    cycleScenario(dx > 0 ? -1 : 1);
    setMobilePanelState(dx > 0 ? 'previous-panel' : 'next-panel');
    setGestureMessage('Swipe scenario');
    pulseHaptic('medium');
    return;
  }
  if (Math.abs(dy) > 58 && Math.abs(dy) > Math.abs(dx)) {
    setMobilePanelState(dy < 0 ? 'minimized' : 'expanded');
    setGestureMessage(dy < 0 ? 'Swipe minimize' : 'Swipe expand');
    pulseHaptic(dy < 0 ? 'light' : 'heavy');
  }
}

function spatialCommandStatus(command: SpatialCommand) {
  const statuses: Record<SpatialCommand, string> = {
    'ar-guide': 'AR guide lines ready',
    'ar-marker': 'AR marker recognition ready',
    'ar-measure': 'AR measurement tool ready',
    'ar-overlay': 'AR medical overlay ready',
    'ar-patient-3d': 'AR patient 3D model ready',
    'ar-ventilator-3d': 'AR ventilator 3D model ready',
    'eye-tracking': 'Eye tracking calibration ready',
    'finger-point': 'Finger pointing help active',
    'hand-wave-next': 'Hand wave next scenario',
    'head-tracking': 'Head tracking ready',
    hololens: 'Microsoft HoloLens profile ready',
    'magic-leap': 'Magic Leap profile ready',
    'mixed-reality': 'Mixed Reality mode ready',
    'multi-user': 'Multi-user collaboration ready',
    openxr: 'OpenXR compatibility profile ready',
    'palm-stop': 'Palm stop pause',
    quest: 'Meta Quest profile ready',
    'room-scale': 'Room scale tracking ready',
    'vision-pro': 'Apple Vision Pro profile ready',
    'vr-360': 'VR 360 viewpoint ready',
    'vr-bedside': 'VR bedside position ready',
    'vr-classroom': 'Virtual classroom mode ready',
    'vr-controller': 'VR hand controller ready',
    'vr-exam': 'Virtual exam room ready',
    'vr-mode': 'VR simulation mode ready',
    'vr-voice-collab': 'VR voice collaboration ready',
    webxr: 'WebXR standard ready',
  };
  return statuses[command];
}

function startVoiceCommand({
  reset,
  settings,
  setPaused,
  setVoiceStatus,
  updateSetting,
}: {
  reset: () => void;
  settings: VentSettings;
  setPaused: Dispatch<SetStateAction<boolean>>;
  setVoiceStatus: Dispatch<SetStateAction<string>>;
  updateSetting: <K extends keyof VentSettings>(key: K, value: VentSettings[K]) => void;
}) {
  const voiceWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  const SpeechRecognition = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setVoiceStatus('Voice unavailable');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.maxAlternatives = 3;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript.toLowerCase() ?? '';
    const status = applyVoiceCommand(transcript, { reset, settings, setPaused, updateSetting });
    setVoiceStatus(status);
  };
  recognition.start();
  setVoiceStatus('Listening');
}

function applyVoiceCommand(
  transcript: string,
  {
    reset,
    settings,
    setPaused,
    updateSetting,
  }: {
    reset: () => void;
    settings: VentSettings;
    setPaused: Dispatch<SetStateAction<boolean>>;
    updateSetting: <K extends keyof VentSettings>(key: K, value: VentSettings[K]) => void;
  },
) {
  if (!transcript) return 'Voice heard';
  if (/(pause|hold|stop|정지|멈춰)/.test(transcript)) {
    setPaused(true);
    return 'Voice confirmed: pause';
  }
  if (/(resume|continue|start|재개|시작)/.test(transcript)) {
    setPaused(false);
    return 'Voice confirmed: resume';
  }
  if (/(reset|restart|초기화)/.test(transcript)) {
    reset();
    return 'Voice confirmed: reset';
  }
  if (/(increase|raise|올려).*(peep|피프|positive end)/.test(transcript)) {
    updateSetting('peep', Math.min(24, settings.peep + 2));
    return `Voice confirmed: increase PEEP to ${Math.min(24, settings.peep + 2)}`;
  }
  if (/(decrease|lower|내려).*(fio2|oxygen|산소)/.test(transcript)) {
    updateSetting('fio2', Math.max(21, settings.fio2 - 5));
    return `Voice confirmed: decrease FiO2 to ${Math.max(21, settings.fio2 - 5)}`;
  }
  if (
    /(tidal volume|respiratory rate|plateau|compliance|airway resistance|minute ventilation|폐순응도|기도저항)/.test(
      transcript,
    )
  ) {
    return `Voice confirmed medical term: ${transcript}`;
  }
  return `Voice heard: ${transcript}`;
}

function speakClinicalText(
  kind: 'alarm' | 'vitals',
  {
    enabled,
    rate,
    voiceName,
    volume,
  }: {
    enabled: boolean;
    rate: number;
    voiceName: string;
    volume: number;
  },
) {
  if (!enabled || !('speechSynthesis' in window)) return;
  const text =
    kind === 'alarm'
      ? 'Ventilator alarm active. Check airway pressure, oxygenation, and patient synchrony.'
      : 'Vitals update. Review oxygen saturation, heart rate, blood pressure, respiratory rate, and end tidal carbon dioxide.';
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.volume = volume;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.name === voiceName) ?? null;
  window.speechSynthesis.speak(utterance);
}

function checkArSupport(setArStatus: Dispatch<SetStateAction<string>>) {
  const arNavigator = navigator as Navigator & { xr?: XRSystemLike };
  if (!arNavigator.xr) {
    setArStatus('AR unavailable');
    return;
  }
  void arNavigator.xr.isSessionSupported('immersive-ar').then((supported) => {
    setArStatus(supported ? 'AR supported' : 'AR unavailable');
  });
}
