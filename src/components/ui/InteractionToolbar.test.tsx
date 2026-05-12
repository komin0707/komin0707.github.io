import { fireEvent, render, screen, within } from '@testing-library/react';
import type { DragEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScenarioType } from '@/simulation/scenarios';
import { InteractionToolbar } from './InteractionToolbar';

type ScenarioDragStartHandler = (event: DragEvent<HTMLButtonElement>, scenario: ScenarioType) => void;

const defaultProps = {
  accessibilityPreferences: {
    calmMode: false,
    colorVisionMode: 'default' as const,
    distractionFreeMode: false,
    easyReadMode: false,
    focusMode: false,
    highContrastMode: false,
    invertedColorsMode: false,
    plainLanguageMode: false,
    readingGuide: false,
  },
  arStatus: 'AR ready',
  commandPaletteOpen: false,
  contextMenu: null,
  debugMode: false,
  examMode: false,
  exitConfirmOpen: false,
  fullscreenMode: false,
  gestureMessage: 'Ready',
  hapticsEnabled: true,
  helpMode: false,
  isPaused: false,
  mobilePanelState: 'expanded',
  onAccessibilityPreferenceToggle: vi.fn(),
  onArCheck: vi.fn(),
  onColorVisionModeChange: vi.fn(),
  onContextMenuClose: vi.fn(),
  onExamModeToggle: vi.fn(),
  onHapticTest: vi.fn(),
  onHapticsToggle: vi.fn(),
  onHelpModeToggle: vi.fn(),
  onPauseToggle: vi.fn(),
  onReset: vi.fn(),
  onScenarioDragStart: vi.fn(),
  onShortcutDisableToggle: vi.fn(),
  onSpatialCommand: vi.fn(),
  orientationStatus: 'orientation locked: portrait',
  onTutorialAdvance: vi.fn(),
  onTutorialClose: vi.fn(),
  onVoiceCommand: vi.fn(),
  onVoiceNameChange: vi.fn(),
  onVoiceOutputToggle: vi.fn(),
  onVoiceRateChange: vi.fn(),
  onVoiceSpeak: vi.fn(),
  onVoiceVolumeChange: vi.fn(),
  searchOpen: false,
  scenarioOrder: ['normal', 'ards'] as const,
  settingsShortcutOpen: false,
  shortcutStatus: 'Shortcuts ready',
  shortcutsDisabled: false,
  spatialStatus: 'Spatial controls ready',
  tutorialOpen: false,
  tutorialStep: 0,
  voiceName: 'default',
  voiceOutputEnabled: true,
  voiceRate: 1,
  voiceStatus: 'Voice idle',
  voiceVolume: 0.8,
  xrMode: '2D bedside',
};

describe('InteractionToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  registerToolbarActionTests();
  registerHelpDialogTests();
  registerOverlayTests();
});

function registerToolbarActionTests(): void {
  it('routes toolbar button, switch, and drag actions', () => {
    const onScenarioDragStart = vi.fn<ScenarioDragStartHandler>();
    render(<InteractionToolbar {...defaultProps} onScenarioDragStart={onScenarioDragStart} />);

    expect(screen.getByRole('region', { name: '사용자 인터랙션' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Clinical learning article' })).toBeInTheDocument();
    expect(screen.getByLabelText('Clinical learning section')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Clinical support form' })).toBeInTheDocument();
    expect(screen.getByRole('search', { name: 'Clinical FAQ search' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Trend data grid' })).toBeInTheDocument();
    expect(screen.getByRole('treegrid', { name: 'Scenario tree grid' })).toBeInTheDocument();
    expect(screen.getByLabelText('Media accessibility alternatives')).toHaveTextContent('Video captions');
    expect(screen.getByLabelText('Media accessibility alternatives')).toHaveTextContent('Audio transcript');
    expect(screen.getByLabelText('Media accessibility alternatives')).toHaveTextContent('Live captions');
    expect(screen.getByLabelText('Color vision text alternatives')).toHaveTextContent('danger uses !!');
    expect(screen.getByLabelText('Color vision text alternatives')).toHaveTextContent('achromatopsia');
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole('rowheader').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getByRole('button', { name: 'Voice idle' }));
    fireEvent.click(screen.getByRole('button', { name: 'AR ready' }));
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tutorial 1' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Exam off' }));
    fireEvent.click(screen.getByRole('button', { name: 'Easy read' }));
    fireEvent.click(screen.getByRole('button', { name: 'High contrast' }));
    fireEvent.click(screen.getByRole('button', { name: 'Calm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Plain' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guide' }));
    fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clean' }));
    fireEvent.click(screen.getByRole('button', { name: 'Invert' }));
    fireEvent.change(screen.getByLabelText('색각 시뮬레이션'), { target: { value: 'deuteranopia' } });
    fireEvent.click(screen.getByRole('button', { name: 'normal' }), { shiftKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'ards' }), { ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'normal' }), { detail: 3 });
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'ards' }));
    fireEvent.dragStart(screen.getByRole('button', { name: 'ards' }));

    expect(defaultProps.onVoiceCommand).toHaveBeenCalledTimes(1);
    expect(defaultProps.onArCheck).toHaveBeenCalledTimes(1);
    expect(defaultProps.onHelpModeToggle).toHaveBeenCalledTimes(1);
    expect(defaultProps.onTutorialAdvance).toHaveBeenCalledTimes(1);
    expect(defaultProps.onExamModeToggle).toHaveBeenCalledTimes(1);
    expect(defaultProps.onAccessibilityPreferenceToggle).toHaveBeenCalledWith('easyReadMode');
    expect(defaultProps.onAccessibilityPreferenceToggle).toHaveBeenCalledWith('highContrastMode');
    expect(defaultProps.onAccessibilityPreferenceToggle).toHaveBeenCalledWith('calmMode');
    expect(defaultProps.onAccessibilityPreferenceToggle).toHaveBeenCalledWith('plainLanguageMode');
    expect(defaultProps.onAccessibilityPreferenceToggle).toHaveBeenCalledWith('readingGuide');
    expect(defaultProps.onAccessibilityPreferenceToggle).toHaveBeenCalledWith('focusMode');
    expect(defaultProps.onAccessibilityPreferenceToggle).toHaveBeenCalledWith('distractionFreeMode');
    expect(defaultProps.onAccessibilityPreferenceToggle).toHaveBeenCalledWith('invertedColorsMode');
    expect(defaultProps.onColorVisionModeChange).toHaveBeenCalledWith('deuteranopia');
    expect(screen.getByRole('tooltip')).toHaveTextContent('색각 시뮬레이션');
    expect(onScenarioDragStart).toHaveBeenCalledTimes(1);
    const [, scenario] = onScenarioDragStart.mock.calls[0] ?? [];
    expect(scenario).toBe('ards');
    expect(screen.getByRole('button', { name: 'ards' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ards' })).toHaveClass('scenario-preview');
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'ards' }));
    expect(screen.getByRole('button', { name: 'ards' })).not.toHaveClass('scenario-preview');
  });
}

function registerHelpDialogTests(): void {
  it('closes help with Escape and restores focus to the help button', () => {
    const onHelpModeToggle = vi.fn();
    const { rerender } = render(
      <InteractionToolbar {...defaultProps} helpMode onHelpModeToggle={onHelpModeToggle} />,
    );

    expect(screen.getByRole('dialog', { name: '키보드 단축키 도움말' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '본문 이동' })).toHaveFocus();
    expect(screen.getByText(/Ctrl\+K command palette/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cheat sheet print' })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('dialog', { name: '키보드 단축키 도움말' }), { key: 'Escape' });
    expect(onHelpModeToggle).toHaveBeenCalledTimes(1);

    rerender(<InteractionToolbar {...defaultProps} helpMode={false} onHelpModeToggle={onHelpModeToggle} />);
    expect(screen.getByRole('button', { name: 'Help' })).toHaveFocus();
  });

  it('cycles focus inside the help dialog in both tab directions', () => {
    render(<InteractionToolbar {...defaultProps} helpMode />);
    const dialog = screen.getByRole('dialog', { name: '키보드 단축키 도움말' });
    const bodyLink = screen.getByRole('link', { name: '본문 이동' });
    const closeButton = screen.getByRole('button', { name: '닫기' });

    closeButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(bodyLink).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    expect(closeButton).toHaveFocus();
  });
}

function registerOverlayTests(): void {
  it('renders tutorial and context menu overlays with pause, reset, close actions', () => {
    render(
      <InteractionToolbar
        {...defaultProps}
        contextMenu={{ x: 32, y: 48 }}
        isPaused
        tutorialOpen
        tutorialStep={1}
      />,
    );

    expect(screen.getByRole('dialog', { name: '인터랙티브 튜토리얼' })).toHaveTextContent('Step 2/5');
    expect(screen.getByLabelText('진행 표시')).toHaveTextContent('진행 2/5');
    expect(screen.getByLabelText('진행 표시')).toHaveTextContent('관찰 -> 판단 -> 조치');
    expect(screen.getByLabelText('시간 제한 접근성')).toHaveTextContent('10초 전 알림');
    fireEvent.click(screen.getByRole('button', { name: '시간 제한 없음' }));
    expect(screen.getByLabelText('시간 제한 접근성')).toHaveTextContent('시간 제한 없음');
    fireEvent.click(screen.getByRole('button', { name: '시간 제한 연장' }));
    expect(screen.getByLabelText('시간 제한 접근성')).toHaveTextContent('시간 제한 연장');
    expect(screen.getByLabelText('Contextual help')).toHaveTextContent('상황별 도움말');
    expect(screen.getByLabelText('Educational guide selector')).toHaveTextContent('인터랙티브 가이드');
    expect(screen.getByLabelText('Medical glossary hover terms')).toHaveTextContent('PEEP');
    expect(screen.getByLabelText('Medical glossary hover terms')).toHaveTextContent('FiO2 -> 산소 농도');
    expect(screen.getByText(/Plateau/)).toHaveAttribute('title', expect.stringContaining('고원압'));
    expect(screen.getByLabelText('오류 복구 도움말')).toHaveTextContent('오류 식별');
    expect(screen.getByLabelText('오류 복구 도움말')).toHaveTextContent('오류 제안');
    expect(screen.getByLabelText('오류 복구 도움말')).toHaveTextContent('오류 회피');
    fireEvent.change(screen.getByLabelText('FAQ 검색어'), { target: { value: 'PEEP' } });
    expect(screen.getByLabelText('FAQ 검색 가능한 도움말')).toHaveTextContent('FiO2와 PEEP 차이');
    fireEvent.change(screen.getByLabelText('챗봇 질문'), { target: { value: 'hypoxia' } });
    expect(screen.getByLabelText('도움 챗봇')).toHaveTextContent('산소화, 환기, 회로, 순환');
    expect(screen.getByLabelText('비디오 튜토리얼')).toHaveTextContent('자막 포함');
    fireEvent.click(screen.getByRole('button', { name: '오디오 가이드 재생' }));
    expect(defaultProps.onVoiceSpeak).toHaveBeenCalledWith('vitals');
    expect(screen.getByLabelText('일관된 네비게이션')).toHaveTextContent('같은 기능은 같은 이름');
    fireEvent.click(screen.getByRole('button', { name: '임상 사고 과정' }));
    expect(screen.getByLabelText('Contextual help')).toHaveTextContent('저산소증이면');
    fireEvent.click(screen.getByRole('button', { name: '진단 단계별 가이드' }));
    expect(screen.getByLabelText('Contextual help')).toHaveTextContent('airway');
    fireEvent.click(screen.getByRole('button', { name: '처치 우선순위 가이드' }));
    expect(screen.getByLabelText('Contextual help')).toHaveTextContent('산소 공급');
    fireEvent.click(screen.getByRole('button', { name: '약물 처방 가이드' }));
    expect(screen.getByLabelText('Contextual help')).toHaveTextContent('알레르기');
    fireEvent.click(screen.getByRole('button', { name: '알람 대응 가이드' }));
    expect(screen.getByLabelText('Contextual help')).toHaveTextContent('회로/튜브');
    fireEvent.click(screen.getByRole('button', { name: '응급 상황 프로토콜' }));
    expect(screen.getByLabelText('Contextual help')).toHaveTextContent('100% 산소');
    fireEvent.click(within(screen.getByRole('dialog', { name: '인터랙티브 튜토리얼' })).getByText('다음'));
    fireEvent.click(within(screen.getByRole('dialog', { name: '인터랙티브 튜토리얼' })).getByText('닫기'));

    const menu = screen.getByRole('menu');
    expect(menu).toHaveStyle({ left: '32px', top: '48px' });
    expect(screen.getByRole('menuitem', { name: 'Analyze' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Print' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Share' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(defaultProps.onTutorialAdvance).toHaveBeenCalledTimes(1);
    expect(defaultProps.onTutorialClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onPauseToggle).toHaveBeenCalledTimes(1);
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    expect(defaultProps.onContextMenuClose).toHaveBeenCalledTimes(1);
  });

  it('renders shortcut state overlays for command, search, settings, fullscreen, and exit confirm', () => {
    render(
      <InteractionToolbar
        {...defaultProps}
        commandPaletteOpen
        debugMode
        exitConfirmOpen
        fullscreenMode
        searchOpen
        settingsShortcutOpen
        shortcutStatus="Ctrl+K command palette"
        shortcutsDisabled
      />,
    );

    expect(screen.getByLabelText('Shortcut state')).toHaveTextContent('Ctrl+K command palette');
    expect(screen.getByLabelText('Shortcut state')).toHaveAttribute('data-fullscreen', 'true');
    expect(screen.getByLabelText('Shortcut state')).toHaveTextContent('orientation locked: portrait');
    expect(screen.getByLabelText('Shortcut state')).toHaveTextContent('Mobile panel: expanded');
    expect(screen.getByLabelText('Shortcut state')).toHaveTextContent('Spatial controls ready');
    expect(screen.getByLabelText('Shortcut state')).toHaveTextContent('2D bedside');
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    expect(screen.getByRole('search', { name: 'Shortcut search' })).toHaveTextContent('Ctrl+/');
    expect(screen.getByRole('dialog', { name: 'Settings shortcut panel' })).toBeInTheDocument();
    expect(screen.getByRole('alertdialog', { name: 'Exit confirmation' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enable shortcuts' }));
    expect(defaultProps.onShortcutDisableToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Disable haptics' }));
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    fireEvent.click(screen.getByRole('button', { name: 'Medium' }));
    fireEvent.click(screen.getByRole('button', { name: 'Heavy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alarm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disable voice output' }));
    fireEvent.click(screen.getByRole('button', { name: 'Speak alarm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Speak vitals' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Voice rate' }), { target: { value: '1.2' } });
    fireEvent.change(screen.getByRole('slider', { name: 'Voice volume' }), { target: { value: '0.5' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Voice selection' }), {
      target: { value: 'clinical-en' },
    });
    for (const spatialLabel of [
      'Hand wave next',
      'Palm stop',
      'Finger point',
      'Eye tracking',
      'AR marker',
      'AR patient 3D',
      'AR ventilator 3D',
      'AR measure',
      'AR guide',
      'AR overlay',
      'VR mode',
      'VR 360',
      'VR bedside',
      'VR controller',
      'VR voice collaboration',
      'WebXR standard',
      'OpenXR compatible',
      'Meta Quest',
      'Apple Vision Pro',
      'Microsoft HoloLens',
      'Magic Leap',
      'Mixed Reality',
      'Head tracking',
      'Room scale',
      'Multi user',
      'Virtual classroom',
      'Virtual exam',
    ]) {
      fireEvent.click(screen.getByRole('button', { name: spatialLabel }));
    }
    expect(screen.getByLabelText('Spatial XR controls')).toHaveTextContent('Apple Vision Pro');
    expect(screen.getByLabelText('Spatial XR controls')).toHaveTextContent('Microsoft HoloLens');
    expect(defaultProps.onHapticsToggle).toHaveBeenCalledTimes(1);
    expect(defaultProps.onHapticTest).toHaveBeenCalledWith('light');
    expect(defaultProps.onHapticTest).toHaveBeenCalledWith('medium');
    expect(defaultProps.onHapticTest).toHaveBeenCalledWith('heavy');
    expect(defaultProps.onHapticTest).toHaveBeenCalledWith('alarm');
    expect(defaultProps.onVoiceOutputToggle).toHaveBeenCalledTimes(1);
    expect(defaultProps.onVoiceSpeak).toHaveBeenCalledWith('alarm');
    expect(defaultProps.onVoiceSpeak).toHaveBeenCalledWith('vitals');
    expect(defaultProps.onVoiceRateChange).toHaveBeenCalledWith(1.2);
    expect(defaultProps.onVoiceVolumeChange).toHaveBeenCalledWith(0.5);
    expect(defaultProps.onVoiceNameChange).toHaveBeenCalledWith('clinical-en');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('hand-wave-next');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('palm-stop');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('finger-point');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('eye-tracking');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('ar-marker');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('ar-patient-3d');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('ar-ventilator-3d');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('ar-measure');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('ar-guide');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('ar-overlay');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('vr-mode');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('vr-360');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('vr-bedside');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('vr-controller');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('vr-voice-collab');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('webxr');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('openxr');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('quest');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('vision-pro');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('hololens');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('magic-leap');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('mixed-reality');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('head-tracking');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('room-scale');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('multi-user');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('vr-classroom');
    expect(defaultProps.onSpatialCommand).toHaveBeenCalledWith('vr-exam');
  });

  it('falls back to the first tutorial step for negative indices', () => {
    render(<InteractionToolbar {...defaultProps} tutorialOpen tutorialStep={-1} />);

    expect(screen.getByRole('dialog', { name: '인터랙티브 튜토리얼' })).toHaveTextContent('Step 1/5');
  });
}
