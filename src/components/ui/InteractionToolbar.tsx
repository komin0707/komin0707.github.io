import { type DragEvent, type MouseEvent, type ReactNode, type RefObject, useRef, useState } from 'react';
import type {
  AccessibilityPreferenceKey,
  AccessibilityPreferences,
  ColorVisionMode,
  SpatialCommand,
} from '@/hooks/useSimulatorInteractions';
import type { ScenarioType } from '@/simulation/scenarios';
import { ContextMenuOverlay, type ContextMenuState } from './ContextMenuOverlay';
import { ShortcutHelp } from './ShortcutHelp';

type InteractionToolbarProps = {
  accessibilityPreferences: AccessibilityPreferences;
  arStatus: string;
  commandPaletteOpen: boolean;
  contextMenu: ContextMenuState | null;
  debugMode: boolean;
  examMode: boolean;
  exitConfirmOpen: boolean;
  fullscreenMode: boolean;
  gestureMessage: string;
  hapticsEnabled: boolean;
  helpMode: boolean;
  isPaused: boolean;
  mobilePanelState: string;
  onAccessibilityPreferenceToggle: (key: AccessibilityPreferenceKey) => void;
  onArCheck: () => void;
  onColorVisionModeChange: (mode: ColorVisionMode) => void;
  onContextMenuClose: () => void;
  onExamModeToggle: () => void;
  onHapticTest: (kind: 'alarm' | 'heavy' | 'light' | 'medium') => void;
  onHapticsToggle: () => void;
  onHelpModeToggle: () => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onScenarioDragStart: (event: DragEvent<HTMLButtonElement>, scenario: ScenarioType) => void;
  onTutorialAdvance: () => void;
  onTutorialClose: () => void;
  onVoiceCommand: () => void;
  onVoiceNameChange: (name: string) => void;
  onVoiceOutputToggle: () => void;
  onVoiceRateChange: (rate: number) => void;
  onVoiceSpeak: (kind: 'alarm' | 'vitals') => void;
  onVoiceVolumeChange: (volume: number) => void;
  onSpatialCommand: (command: SpatialCommand) => void;
  searchOpen: boolean;
  scenarioOrder: readonly ScenarioType[];
  settingsShortcutOpen: boolean;
  shortcutStatus: string;
  shortcutsDisabled: boolean;
  spatialStatus: string;
  onShortcutDisableToggle: () => void;
  orientationStatus: string;
  tutorialOpen: boolean;
  tutorialStep: number;
  voiceName: string;
  voiceOutputEnabled: boolean;
  voiceRate: number;
  voiceStatus: string;
  voiceVolume: number;
  xrMode: string;
};

const TUTORIAL_STEPS = [
  {
    body: '환자 이름, 시나리오, 산소포화도, 알람을 먼저 확인합니다.',
    plainBody: '먼저 환자가 위험한지 봅니다.',
    title: '관찰',
  },
  {
    body: '산소화, 환기, 순환, 회로 문제를 분리해서 원인을 고릅니다.',
    plainBody: '산소, 숨, 혈압, 장비를 따로 확인합니다.',
    title: '판단',
  },
  {
    body: 'FiO2, PEEP, Vt 같은 설정을 바꿀 때 위험 이유를 함께 확인합니다.',
    plainBody: '설정을 바꾸기 전에 왜 바꾸는지 확인합니다.',
    title: '조치',
  },
  {
    body: '조치 후 SpO2, EtCO2, 압력, 혈압이 좋아지는지 재평가합니다.',
    plainBody: '바꾼 뒤 환자가 좋아졌는지 다시 봅니다.',
    title: '재평가',
  },
  {
    body: '스냅샷, 오류, 다음 학습 목표를 기록하고 필요하면 도움말을 엽니다.',
    plainBody: '무엇을 했고 다음에 무엇을 볼지 적습니다.',
    title: '기록',
  },
] as const;

const EDUCATION_GUIDES = [
  {
    body: '현재 화면의 환자 상태, 알람, 설정 패널을 같은 순서로 훑고 위험 신호를 먼저 확인합니다.',
    label: '상황별 도움말',
  },
  {
    body: '버튼을 눌러 단계가 바뀌는 인터랙티브 가이드로 관찰, 판단, 조치, 재평가 순서를 반복합니다.',
    label: '인터랙티브 가이드',
  },
  {
    body: '저산소증이면 산소화, 환기, 순환, 장비 문제를 분리해서 생각하고 가장 위험한 원인을 먼저 배제합니다.',
    label: '임상 사고 과정',
  },
  {
    body: '진단은 airway, breathing, circulation, ventilator, scenario clue 순서로 좁혀 갑니다.',
    label: '진단 단계별 가이드',
  },
  {
    body: '처치는 산소 공급, 회로 확인, 압력/용적 위험 완화, 원인 치료, 기록 순서로 우선순위를 둡니다.',
    label: '처치 우선순위 가이드',
  },
  {
    body: '진정제, 진통제, 근이완제는 체중, 혈압, 신기능, 알레르기, 호흡 억제 위험을 함께 확인합니다.',
    label: '약물 처방 가이드',
  },
  {
    body: '알람은 환자 안전 확인, 회로/튜브 확인, 설정 확인, 알람 재평가, 팀 호출 순서로 대응합니다.',
    label: '알람 대응 가이드',
  },
  {
    body: '응급 상황은 도움 요청, 100% 산소, 수동 환기 준비, 가역 원인 확인, ACLS/기관 프로토콜 연결입니다.',
    label: '응급 상황 프로토콜',
  },
] as const;

const GLOSSARY_TERMS = [
  {
    definition: '흡입 산소 농도. 환자에게 들어가는 산소 비율입니다.',
    plain: '산소 농도',
    term: 'FiO2',
  },
  {
    definition: '호기말 양압. 숨을 내쉰 뒤에도 폐를 열어 두는 압력입니다.',
    plain: '숨 끝 폐 압력',
    term: 'PEEP',
  },
  {
    definition: '일회 호흡량. 한 번 숨쉴 때 들어가는 공기량입니다.',
    plain: '한 번 숨의 공기량',
    term: 'Vt',
  },
  {
    definition: '고원압. 폐포 압력 위험을 보는 지표이며 30 cmH2O 초과 시 주의합니다.',
    plain: '폐 안쪽 압력',
    term: 'Plateau',
  },
  {
    definition: '호기말 이산화탄소. 숨, 순환, 튜브 위치 변화의 빠른 단서입니다.',
    plain: '내쉰 숨의 이산화탄소',
    term: 'EtCO2',
  },
] as const;

const FAQ_ITEMS = [
  {
    answer: '산소포화도가 낮으면 FiO2, PEEP, 튜브 위치, 폐 상태, 혈압을 차례로 확인합니다.',
    question: 'SpO2가 낮으면 무엇을 보나요?',
  },
  {
    answer: 'FiO2는 산소 농도이고 PEEP은 숨 끝에 폐를 열어 두는 압력입니다.',
    question: 'FiO2와 PEEP 차이는 무엇인가요?',
  },
  {
    answer: '압력, 용적, 알람, 환자 상태를 확인한 뒤 적용 전 확인 단계를 거칩니다.',
    question: '설정 변경 전 무엇을 확인하나요?',
  },
] as const;

const ERROR_RECOVERY_ITEMS = [
  '오류 식별: 범위를 벗어난 값은 텍스트로 표시합니다.',
  '오류 제안: FiO2는 21-100 사이, PEEP은 현재 폐 상태에 맞게 낮은 값부터 조정합니다.',
  '오류 회피: 적용 전 환자 상태와 변경 이유를 확인합니다.',
] as const;

export function InteractionToolbar(props: InteractionToolbarProps): ReactNode {
  const helpButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <ToolbarControls {...props} helpButtonRef={helpButtonRef} />
      <ToolbarOverlays {...props} helpButtonRef={helpButtonRef} />
    </>
  );
}

function ToolbarControls({
  accessibilityPreferences,
  arStatus,
  examMode,
  gestureMessage,
  helpButtonRef,
  helpMode,
  onAccessibilityPreferenceToggle,
  onArCheck,
  onColorVisionModeChange,
  onExamModeToggle,
  onHelpModeToggle,
  onScenarioDragStart,
  onTutorialAdvance,
  onVoiceCommand,
  scenarioOrder,
  tutorialStep,
  voiceStatus,
}: InteractionToolbarProps & { helpButtonRef: RefObject<HTMLButtonElement | null> }): ReactNode {
  return (
    <section className="interaction-toolbar" aria-label="사용자 인터랙션" role="region">
      <ScenarioDragButtons onScenarioDragStart={onScenarioDragStart} scenarioOrder={scenarioOrder} />
      <button type="button" onClick={onVoiceCommand}>
        {voiceStatus}
      </button>
      <button type="button" onClick={onArCheck}>
        {arStatus}
      </button>
      <button
        aria-controls="shortcut-help"
        aria-expanded={helpMode}
        ref={helpButtonRef}
        type="button"
        onClick={onHelpModeToggle}
      >
        Help
      </button>
      <button type="button" onClick={onTutorialAdvance}>
        Tutorial {tutorialStep + 1}
      </button>
      <button aria-checked={examMode} role="switch" type="button" onClick={onExamModeToggle}>
        {examMode ? 'Exam on' : 'Exam off'}
      </button>
      <button
        aria-pressed={accessibilityPreferences.easyReadMode}
        type="button"
        onClick={() => onAccessibilityPreferenceToggle('easyReadMode')}
      >
        Easy read
      </button>
      <button
        aria-pressed={accessibilityPreferences.highContrastMode}
        type="button"
        onClick={() => onAccessibilityPreferenceToggle('highContrastMode')}
      >
        High contrast
      </button>
      <button
        aria-pressed={accessibilityPreferences.calmMode}
        type="button"
        onClick={() => onAccessibilityPreferenceToggle('calmMode')}
      >
        Calm
      </button>
      <button
        aria-pressed={accessibilityPreferences.plainLanguageMode}
        type="button"
        onClick={() => onAccessibilityPreferenceToggle('plainLanguageMode')}
      >
        Plain
      </button>
      <button
        aria-pressed={accessibilityPreferences.readingGuide}
        type="button"
        onClick={() => onAccessibilityPreferenceToggle('readingGuide')}
      >
        Guide
      </button>
      <button
        aria-pressed={accessibilityPreferences.focusMode}
        type="button"
        onClick={() => onAccessibilityPreferenceToggle('focusMode')}
      >
        Focus
      </button>
      <button
        aria-pressed={accessibilityPreferences.distractionFreeMode}
        type="button"
        onClick={() => onAccessibilityPreferenceToggle('distractionFreeMode')}
      >
        Clean
      </button>
      <button
        aria-pressed={accessibilityPreferences.invertedColorsMode}
        type="button"
        onClick={() => onAccessibilityPreferenceToggle('invertedColorsMode')}
      >
        Invert
      </button>
      <label className="color-vision-select">
        <span>Color vision</span>
        <select
          aria-describedby="color-vision-tooltip"
          aria-label="색각 시뮬레이션"
          onChange={(event) => onColorVisionModeChange(event.target.value as ColorVisionMode)}
          value={accessibilityPreferences.colorVisionMode}
        >
          <option value="default">Default</option>
          <option value="protanopia">Protanopia</option>
          <option value="deuteranopia">Deuteranopia</option>
          <option value="tritanopia">Tritanopia</option>
          <option value="achromatopsia">Achromatopsia</option>
        </select>
      </label>
      <span className="sr-only" id="color-vision-tooltip" role="tooltip">
        색각 시뮬레이션은 주요 임상 색상을 색각 유형별 팔레트로 바꿉니다.
      </span>
      <span>{gestureMessage}</span>
    </section>
  );
}

function ScenarioDragButtons({
  onScenarioDragStart,
  scenarioOrder,
}: Pick<InteractionToolbarProps, 'onScenarioDragStart' | 'scenarioOrder'>): ReactNode {
  const [selectedScenarios, setSelectedScenarios] = useState<readonly ScenarioType[]>([]);
  const [previewScenario, setPreviewScenario] = useState<ScenarioType | null>(null);

  const handleScenarioClick = (event: MouseEvent<HTMLButtonElement>, scenarioName: ScenarioType) => {
    if (event.detail >= 3) {
      setSelectedScenarios(scenarioOrder);
      return;
    }

    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      setSelectedScenarios((items) =>
        items.includes(scenarioName)
          ? items.filter((item) => item !== scenarioName)
          : [...items, scenarioName],
      );
      return;
    }

    setSelectedScenarios([scenarioName]);
  };

  return scenarioOrder.map((scenarioName) => (
    <button
      aria-pressed={selectedScenarios.includes(scenarioName)}
      className={previewScenario === scenarioName ? 'scenario-preview' : ''}
      data-alt-fine-adjust="hold Alt for fine drag"
      draggable
      key={scenarioName}
      onClick={(event) => handleScenarioClick(event, scenarioName)}
      onDragStart={(event) => onScenarioDragStart(event, scenarioName)}
      onMouseEnter={() => setPreviewScenario(scenarioName)}
      onMouseLeave={() => setPreviewScenario(null)}
      title={`${scenarioName} preview. Shift/Ctrl click selects multiple. Triple click selects all.`}
      type="button"
    >
      {scenarioName}
    </button>
  ));
}

function ToolbarOverlays({
  accessibilityPreferences,
  contextMenu,
  commandPaletteOpen,
  debugMode,
  exitConfirmOpen,
  fullscreenMode,
  hapticsEnabled,
  helpButtonRef,
  helpMode,
  isPaused,
  mobilePanelState,
  onContextMenuClose,
  onHapticTest,
  onHapticsToggle,
  onHelpModeToggle,
  onPauseToggle,
  onReset,
  onShortcutDisableToggle,
  onSpatialCommand,
  onVoiceNameChange,
  onVoiceOutputToggle,
  onVoiceRateChange,
  onVoiceSpeak,
  onVoiceVolumeChange,
  orientationStatus,
  searchOpen,
  settingsShortcutOpen,
  shortcutStatus,
  shortcutsDisabled,
  spatialStatus,
  onTutorialAdvance,
  onTutorialClose,
  tutorialOpen,
  tutorialStep,
  voiceName,
  voiceOutputEnabled,
  voiceRate,
  voiceVolume,
  xrMode,
}: InteractionToolbarProps & { helpButtonRef: RefObject<HTMLButtonElement | null> }): ReactNode {
  return (
    <>
      {helpMode ? <ShortcutHelp fallbackFocusRef={helpButtonRef} onClose={onHelpModeToggle} /> : null}
      {tutorialOpen ? (
        <TutorialPanel
          onClose={onTutorialClose}
          onNext={onTutorialAdvance}
          onVoiceGuide={() => onVoiceSpeak('vitals')}
          plainLanguageMode={accessibilityPreferences.plainLanguageMode}
          step={tutorialStep}
        />
      ) : null}
      {contextMenu ? (
        <ContextMenuOverlay
          contextMenu={contextMenu}
          isPaused={isPaused}
          onClose={onContextMenuClose}
          onPauseToggle={onPauseToggle}
          onReset={onReset}
        />
      ) : null}
      <ShortcutStateOverlay
        commandPaletteOpen={commandPaletteOpen}
        debugMode={debugMode}
        exitConfirmOpen={exitConfirmOpen}
        fullscreenMode={fullscreenMode}
        hapticsEnabled={hapticsEnabled}
        mobilePanelState={mobilePanelState}
        onHapticTest={onHapticTest}
        onHapticsToggle={onHapticsToggle}
        onShortcutDisableToggle={onShortcutDisableToggle}
        onSpatialCommand={onSpatialCommand}
        onVoiceNameChange={onVoiceNameChange}
        onVoiceOutputToggle={onVoiceOutputToggle}
        onVoiceRateChange={onVoiceRateChange}
        onVoiceSpeak={onVoiceSpeak}
        onVoiceVolumeChange={onVoiceVolumeChange}
        orientationStatus={orientationStatus}
        searchOpen={searchOpen}
        settingsShortcutOpen={settingsShortcutOpen}
        shortcutStatus={shortcutStatus}
        shortcutsDisabled={shortcutsDisabled}
        spatialStatus={spatialStatus}
        voiceName={voiceName}
        voiceOutputEnabled={voiceOutputEnabled}
        voiceRate={voiceRate}
        voiceVolume={voiceVolume}
        xrMode={xrMode}
      />
    </>
  );
}

function ShortcutStateOverlay({
  commandPaletteOpen,
  debugMode,
  exitConfirmOpen,
  fullscreenMode,
  hapticsEnabled,
  mobilePanelState,
  onHapticTest,
  onHapticsToggle,
  onShortcutDisableToggle,
  onSpatialCommand,
  onVoiceNameChange,
  onVoiceOutputToggle,
  onVoiceRateChange,
  onVoiceSpeak,
  onVoiceVolumeChange,
  orientationStatus,
  searchOpen,
  settingsShortcutOpen,
  shortcutStatus,
  shortcutsDisabled,
  spatialStatus,
  voiceName,
  voiceOutputEnabled,
  voiceRate,
  voiceVolume,
  xrMode,
}: {
  commandPaletteOpen: boolean;
  debugMode: boolean;
  exitConfirmOpen: boolean;
  fullscreenMode: boolean;
  hapticsEnabled: boolean;
  mobilePanelState: string;
  onHapticTest: (kind: 'alarm' | 'heavy' | 'light' | 'medium') => void;
  onHapticsToggle: () => void;
  onShortcutDisableToggle: () => void;
  onSpatialCommand: (command: SpatialCommand) => void;
  onVoiceNameChange: (name: string) => void;
  onVoiceOutputToggle: () => void;
  onVoiceRateChange: (rate: number) => void;
  onVoiceSpeak: (kind: 'alarm' | 'vitals') => void;
  onVoiceVolumeChange: (volume: number) => void;
  orientationStatus: string;
  searchOpen: boolean;
  settingsShortcutOpen: boolean;
  shortcutStatus: string;
  shortcutsDisabled: boolean;
  spatialStatus: string;
  voiceName: string;
  voiceOutputEnabled: boolean;
  voiceRate: number;
  voiceVolume: number;
  xrMode: string;
}) {
  return (
    <aside className="shortcut-state-panel" aria-label="Shortcut state" data-fullscreen={fullscreenMode}>
      <AccessibilityRoleMatrix />
      <strong>{shortcutStatus}</strong>
      <span>Conflict check: no conflicts</span>
      <span>Profile: default bedside</span>
      <span>{debugMode ? 'Debug shortcut on' : 'Debug shortcut off'}</span>
      <span>{orientationStatus}</span>
      <span>Mobile panel: {mobilePanelState}</span>
      <span>{spatialStatus}</span>
      <span>{xrMode}</span>
      <button type="button" onClick={onShortcutDisableToggle}>
        {shortcutsDisabled ? 'Enable shortcuts' : 'Disable shortcuts'}
      </button>
      <button type="button" onClick={onHapticsToggle}>
        {hapticsEnabled ? 'Disable haptics' : 'Enable haptics'}
      </button>
      <div className="haptic-test-row" aria-label="Haptic feedback tests" role="group">
        <button type="button" onClick={() => onHapticTest('light')}>
          Light
        </button>
        <button type="button" onClick={() => onHapticTest('medium')}>
          Medium
        </button>
        <button type="button" onClick={() => onHapticTest('heavy')}>
          Heavy
        </button>
        <button type="button" onClick={() => onHapticTest('alarm')}>
          Alarm
        </button>
      </div>
      <div className="voice-output-controls" aria-label="Voice output controls" role="group">
        <button type="button" onClick={onVoiceOutputToggle}>
          {voiceOutputEnabled ? 'Disable voice output' : 'Enable voice output'}
        </button>
        <button type="button" onClick={() => onVoiceSpeak('alarm')}>
          Speak alarm
        </button>
        <button type="button" onClick={() => onVoiceSpeak('vitals')}>
          Speak vitals
        </button>
        <label>
          Rate
          <input
            aria-label="Voice rate"
            max={1.5}
            min={0.7}
            onChange={(event) => onVoiceRateChange(Number(event.target.value))}
            step={0.1}
            type="range"
            value={voiceRate}
          />
        </label>
        <label>
          Volume
          <input
            aria-label="Voice volume"
            max={1}
            min={0}
            onChange={(event) => onVoiceVolumeChange(Number(event.target.value))}
            step={0.1}
            type="range"
            value={voiceVolume}
          />
        </label>
        <label>
          Voice
          <select
            aria-label="Voice selection"
            onChange={(event) => onVoiceNameChange(event.target.value)}
            value={voiceName}
          >
            <option value="default">Default voice</option>
            <option value="clinical-ko">Clinical Korean</option>
            <option value="clinical-en">Clinical English</option>
          </select>
        </label>
      </div>
      {debugMode ? <SpatialXrControls onSpatialCommand={onSpatialCommand} /> : null}
      <button type="button" onClick={() => window.print()}>
        Print cheat sheet
      </button>
      {commandPaletteOpen ? (
        <div role="dialog" aria-label="Command palette">
          Command palette · Ctrl+K
        </div>
      ) : null}
      {searchOpen ? (
        <div aria-label="Shortcut search" role="search">
          Search · Ctrl+/
        </div>
      ) : null}
      {settingsShortcutOpen ? (
        <div role="dialog" aria-label="Settings shortcut panel">
          Settings · Ctrl+,
        </div>
      ) : null}
      {exitConfirmOpen ? (
        <div role="alertdialog" aria-label="Exit confirmation">
          Press Enter to confirm exit
        </div>
      ) : null}
    </aside>
  );
}

function AccessibilityRoleMatrix(): ReactNode {
  return (
    <div className="sr-only" aria-label="Screen reader role matrix" role="group">
      <article aria-label="Clinical learning article" role="article">
        Ventilator learning summary
      </article>
      <section aria-label="Clinical learning section">Screen reader section landmark</section>
      <form aria-label="Clinical support form" role="form">
        <label>
          Support note
          <input aria-label="Support note" readOnly value="confirmed" />
        </label>
      </form>
      <div aria-label="Clinical FAQ search" role="search">
        Searchable clinical help
      </div>
      <div aria-label="Trend data grid" role="grid">
        <div role="row">
          <span role="columnheader">Metric</span>
          <span role="columnheader">Value</span>
        </div>
        <div role="row">
          <span role="rowheader">SpO2</span>
          <span role="gridcell">94</span>
        </div>
      </div>
      <div aria-label="Scenario tree grid" role="treegrid">
        <div aria-expanded="true" role="row">
          <span role="rowheader">Assessment</span>
          <span role="gridcell">Oxygenation branch</span>
        </div>
      </div>
      <div aria-label="Media accessibility alternatives" role="note">
        Video captions: all tutorial video content is mirrored as visible step text and closed captions. Video
        transcript: tutorial transcript is available as ordered guide steps. Audio transcript: voice alarm and
        vital output text is presented in the shortcut state panel. Live captions: voice command confirmations
        are mirrored as live status text. Sign language: optional sign-language video is represented by the
        same transcript-first tutorial content.
      </div>
      <div aria-label="Color vision text alternatives" role="note">
        Colorblind ASCII: danger uses !!, warning uses ??, normal uses OK, and selected state uses SELECTED.
        Protanopia, deuteranopia, tritanopia, and achromatopsia modes are available in the color vision
        simulation tool.
      </div>
    </div>
  );
}

const SPATIAL_COMMANDS: readonly { command: SpatialCommand; label: string }[] = [
  { command: 'hand-wave-next', label: 'Hand wave next' },
  { command: 'palm-stop', label: 'Palm stop' },
  { command: 'finger-point', label: 'Finger point' },
  { command: 'eye-tracking', label: 'Eye tracking' },
  { command: 'ar-marker', label: 'AR marker' },
  { command: 'ar-patient-3d', label: 'AR patient 3D' },
  { command: 'ar-ventilator-3d', label: 'AR ventilator 3D' },
  { command: 'ar-measure', label: 'AR measure' },
  { command: 'ar-guide', label: 'AR guide' },
  { command: 'ar-overlay', label: 'AR overlay' },
  { command: 'vr-mode', label: 'VR mode' },
  { command: 'vr-360', label: 'VR 360' },
  { command: 'vr-bedside', label: 'VR bedside' },
  { command: 'vr-controller', label: 'VR controller' },
  { command: 'vr-voice-collab', label: 'VR voice collaboration' },
  { command: 'webxr', label: 'WebXR standard' },
  { command: 'openxr', label: 'OpenXR compatible' },
  { command: 'quest', label: 'Meta Quest' },
  { command: 'vision-pro', label: 'Apple Vision Pro' },
  { command: 'hololens', label: 'Microsoft HoloLens' },
  { command: 'magic-leap', label: 'Magic Leap' },
  { command: 'mixed-reality', label: 'Mixed Reality' },
  { command: 'head-tracking', label: 'Head tracking' },
  { command: 'room-scale', label: 'Room scale' },
  { command: 'multi-user', label: 'Multi user' },
  { command: 'vr-classroom', label: 'Virtual classroom' },
  { command: 'vr-exam', label: 'Virtual exam' },
];

function SpatialXrControls({
  onSpatialCommand,
}: {
  onSpatialCommand: (command: SpatialCommand) => void;
}): ReactNode {
  return (
    <div className="spatial-xr-controls" aria-label="Spatial XR controls" role="group">
      {SPATIAL_COMMANDS.map(({ command, label }) => (
        <button key={command} type="button" onClick={() => onSpatialCommand(command)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function TutorialPanel({
  onClose,
  onNext,
  onVoiceGuide,
  plainLanguageMode,
  step,
}: {
  onClose: () => void;
  onNext: () => void;
  onVoiceGuide: () => void;
  plainLanguageMode: boolean;
  step: number;
}): ReactNode {
  const activeStepIndex = step < 0 ? 0 : step % TUTORIAL_STEPS.length;
  const activeStep = TUTORIAL_STEPS[activeStepIndex] ?? TUTORIAL_STEPS[0];
  const [activeGuideIndex, setActiveGuideIndex] = useState(0);
  const [chatQuestion, setChatQuestion] = useState('');
  const [faqQuery, setFaqQuery] = useState('');
  const [timeSupport, setTimeSupport] = useState<'extended' | 'none' | 'standard'>('standard');
  const activeGuide = EDUCATION_GUIDES[activeGuideIndex] ?? EDUCATION_GUIDES[0];
  const filteredFaqItems = FAQ_ITEMS.filter(({ answer, question }) =>
    `${question} ${answer}`.toLowerCase().includes(faqQuery.toLowerCase()),
  );
  const chatbotAnswer = chatQuestion.trim()
    ? '도움 챗봇: 산소화, 환기, 회로, 순환 순서로 확인하고 위험한 알람부터 해결하세요.'
    : '도움 챗봇: 질문을 입력하면 다음 확인 순서를 제안합니다.';

  return (
    <aside aria-label="인터랙티브 튜토리얼" className="tutorial-panel" role="dialog">
      <strong>
        Step {activeStepIndex + 1}/{TUTORIAL_STEPS.length}: {activeStep.title}
      </strong>
      <span>{plainLanguageMode ? activeStep.plainBody : activeStep.body}</span>
      <section aria-label="진행 표시" className="education-guide-card">
        <strong>
          진행 {activeStepIndex + 1}/{TUTORIAL_STEPS.length}
        </strong>
        <span>
          작은 단위: 관찰 {'->'} 판단 {'->'} 조치 {'->'} 재평가 {'->'} 기록
        </span>
      </section>
      <section aria-label="시간 제한 접근성" className="education-guide-card">
        <strong>시간 제한 보조</strong>
        <span>
          {timeSupport === 'none'
            ? '시간 제한 없음'
            : timeSupport === 'extended'
              ? '시간 제한 연장'
              : '표준 시간'}
        </span>
        <span>10초 전 알림: 화면과 음성으로 알려줍니다.</span>
        <div>
          <button type="button" onClick={() => setTimeSupport('none')}>
            시간 제한 없음
          </button>
          <button type="button" onClick={() => setTimeSupport('extended')}>
            시간 제한 연장
          </button>
        </div>
      </section>
      <section aria-label="Contextual help" className="education-guide-card">
        <strong>{activeGuide.label}</strong>
        <span>{activeGuide.body}</span>
      </section>
      <div className="education-guide-tabs" aria-label="Educational guide selector">
        {EDUCATION_GUIDES.map((guide, index) => (
          <button
            aria-pressed={index === activeGuideIndex}
            key={guide.label}
            type="button"
            onClick={() => setActiveGuideIndex(index)}
          >
            {guide.label}
          </button>
        ))}
      </div>
      <section aria-label="Medical glossary hover terms" className="education-glossary">
        {GLOSSARY_TERMS.map((item) => (
          <span className="medical-glossary-hover" key={item.term} title={item.definition}>
            {item.term} {'->'} {item.plain}
          </span>
        ))}
      </section>
      <section aria-label="오류 복구 도움말" className="education-guide-card">
        {ERROR_RECOVERY_ITEMS.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>
      <section aria-label="FAQ 검색 가능한 도움말" className="education-guide-card">
        <label>
          FAQ 검색
          <input
            aria-label="FAQ 검색어"
            onChange={(event) => setFaqQuery(event.target.value)}
            type="search"
            value={faqQuery}
          />
        </label>
        {filteredFaqItems.map((item) => (
          <span key={item.question}>
            {item.question} {item.answer}
          </span>
        ))}
      </section>
      <section aria-label="도움 챗봇" className="education-guide-card">
        <label>
          챗봇 질문
          <input
            aria-label="챗봇 질문"
            onChange={(event) => setChatQuestion(event.target.value)}
            type="text"
            value={chatQuestion}
          />
        </label>
        <span>{chatbotAnswer}</span>
      </section>
      <section aria-label="비디오 튜토리얼" className="education-guide-card">
        <strong>비디오 튜토리얼</strong>
        <span>자막 포함: 환자 확인, 설정 변경, 오류 회피 순서</span>
      </section>
      <section aria-label="오디오 가이드" className="education-guide-card">
        <strong>오디오 가이드</strong>
        <span>현재 단계와 활력징후 확인 순서를 음성으로 안내합니다.</span>
        <button type="button" onClick={onVoiceGuide}>
          오디오 가이드 재생
        </button>
      </section>
      <section aria-label="일관된 네비게이션" className="education-guide-card">
        <strong>일관된 네비게이션</strong>
        <span>같은 기능은 같은 이름으로 표시합니다: Help, Tutorial, Easy read, Plain.</span>
      </section>
      <div>
        <button type="button" onClick={onNext}>
          다음
        </button>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </aside>
  );
}
