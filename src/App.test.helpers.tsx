import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { expect, vi } from 'vitest';
import App from './App';

const LAZY_IMPORT_FLUSH_COUNT = 20;
const AVATAR_LOAD_TIMEOUT_MS = 30000;
/** Timeout budget for broad integration-style app rendering tests. */
export const INTEGRATION_TEST_TIMEOUT_MS = 60000;
/** Timeout budget for settings flow tests that exercise timer-driven controls. */
export const SETTINGS_TEST_TIMEOUT_MS = 60000;
const SLIDER_DEBOUNCE_WAIT_MS = 100;
const TIMER_TICK_MS = 1000;
const PAUSED_WAIT_MS = 3000;

const getSlider = (label: string): HTMLElement => {
  return within(screen.getByText(label).closest('label')!).getByRole('slider');
};

const flushLazyImports = async (): Promise<void> => {
  await act(async () => {
    for (let index = 0; index < LAZY_IMPORT_FLUSH_COUNT; index += 1) {
      await Promise.resolve();
    }
  });
};

/** Renders the app and flushes deferred imports before assertions run. */
export async function renderLoadedApp(): Promise<void> {
  render(<App />);
  await flushLazyImports();
}

/** Verifies the default Korean dashboard shell and initial simulation state. */
export async function expectDefaultDashboard(): Promise<void> {
  expect(screen.getByText('VENT SIMULATOR 2D')).toBeInTheDocument();
  expect(screen.getByText('악화')).toBeInTheDocument();
  expect(screen.getAllByText('폐렴(Pneumonia)_중증').length).toBeGreaterThan(0);
  expect(screen.getByText('추가 모니터링')).toBeInTheDocument();
  expect(screen.getByText('Low SpO2')).toBeInTheDocument();
  expect(screen.getByText('High CO2')).toBeInTheDocument();
  expect(
    await screen.findByTestId('patient-avatar', undefined, { timeout: AVATAR_LOAD_TIMEOUT_MS }),
  ).toHaveAttribute('data-condition', 'worsening');
  expect(screen.getAllByText('환자 상태').length).toBeGreaterThan(0);
  expect(screen.getByText('알람 설정')).toBeInTheDocument();
  expect(screen.getByTestId('vent-simulator')).toHaveAttribute('data-palette', 'default');
  expect(screen.getByLabelText('시나리오 처치')).toBeInTheDocument();
  expect(screen.getByText('시뮬레이터 로드 완료')).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: '시나리오 진행 상황' })).toHaveAttribute('aria-valuenow');
  expect(screen.getByText(/환자 시각 상태:/)).toHaveTextContent('폐렴(Pneumonia)_중증');
  expect(screen.queryByLabelText('Debug panel')).not.toBeInTheDocument();
}

/** Switches the app to English and checks locale-dependent controls. */
export function switchToEnglishLocaleAndExpect(): void {
  fireEvent.click(screen.getByRole('button', { name: '언어를 영어로 전환' }));
  expect(document.documentElement.lang).toBe('en');
  expect(screen.getByRole('button', { name: 'Switch language to Korean' })).toBeInTheDocument();
  expect(
    screen.getByText('Educational simulator only. Do not use for real clinical decisions.'),
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Simulation speed')).toBeInTheDocument();
  expect(screen.getAllByText('Pneumonia').length).toBeGreaterThan(0);
}

/** Switches the app back to Korean and checks locale-dependent copy. */
export function switchToKoreanLocaleAndExpect(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Switch language to Korean' }));
  expect(document.documentElement.lang).toBe('ko');
  expect(
    screen.getByText('교육용 시뮬레이터입니다. 실제 임상 의사결정용으로 사용하지 마세요.'),
  ).toBeInTheDocument();
}

/** Exercises settings, mode, alarm, export, import, and reset behavior. */
export async function runSettingsFlow(): Promise<void> {
  try {
    await renderLoadedApp();
    expect(
      await screen.findByTestId('patient-avatar', undefined, { timeout: AVATAR_LOAD_TIMEOUT_MS }),
    ).toBeInTheDocument();
    vi.useFakeTimers();
    applyVentModeAndPalette();
    updateFio2Slider();
    updateAlarmThresholdInput();
    switchToNormalScenario();
    advanceSimulationTimer();
    exportResetAndImportSnapshot();
    triggerApneaThenReset();
  } finally {
    vi.useRealTimers();
  }
}

function applyVentModeAndPalette(): void {
  fireEvent.click(screen.getByRole('button', { name: 'CPAP' }));
  expect(screen.getByRole('button', { name: 'CPAP' })).toHaveClass('active');
  expect(screen.getByLabelText('모드 안전 상태')).toHaveTextContent('CPAP defaults applied');
  fireEvent.click(screen.getByRole('button', { name: '색맹 친화 팔레트' }));
  expect(screen.getByTestId('vent-simulator')).toHaveAttribute('data-palette', 'colorblind');
  expect(screen.getByRole('button', { name: '색맹 친화 팔레트' })).toHaveAttribute('aria-pressed', 'true');
}

function updateFio2Slider(): void {
  fireEvent.change(getSlider('FiO2 (%)'), { target: { value: '100' } });
  fireEvent.change(getSlider('FiO2 (%)'), { target: { value: '21' } });
  fireEvent.change(getSlider('FiO2 (%)'), { target: { value: '80' } });
  act(() => {
    vi.advanceTimersByTime(SLIDER_DEBOUNCE_WAIT_MS);
  });
  expect(getSlider('FiO2 (%)')).toHaveValue('80');
  fireEvent.change(getSlider('FiO2 (%)'), { target: { value: '100' } });
  act(() => {
    vi.advanceTimersByTime(SLIDER_DEBOUNCE_WAIT_MS);
  });
  expect(getSlider('FiO2 (%)')).toHaveValue('100');
}

function updateAlarmThresholdInput(): void {
  fireEvent.change(screen.getByLabelText('Low SpO2 threshold'), { target: { value: '88' } });
  expect(screen.getByLabelText('Low SpO2 threshold')).toHaveValue(88);
}

function switchToNormalScenario(): void {
  fireEvent.click(screen.getByRole('button', { name: 'A/C' }));
  fireEvent.change(screen.getByLabelText('시나리오'), { target: { value: 'normal' } });
  expect(screen.getAllByText('정상').length).toBeGreaterThan(0);
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-condition', 'stable');
}

function advanceSimulationTimer(): void {
  const primaryTime = screen.getByTestId('primary-simulation-time');
  const initialTimeSeconds = parseClockText(primaryTime.textContent ?? '00:12:45');
  fireEvent.change(screen.getByLabelText('시뮬레이션 속도'), { target: { value: '5' } });
  act(() => {
    vi.advanceTimersByTime(TIMER_TICK_MS);
  });
  expect(screen.getByText(formatClockText(initialTimeSeconds + 5))).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '-30s' }));
  expect(screen.getByText(formatClockText(initialTimeSeconds - 25))).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('특정 시간으로 점프'), { target: { value: '900' } });
  fireEvent.click(screen.getByRole('button', { name: '이동' }));
  expect(screen.getByText('00:15:00')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /중지/ }));
  act(() => {
    vi.advanceTimersByTime(PAUSED_WAIT_MS);
  });
  expect(screen.getByText('00:15:00')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '재개' }));
  act(() => {
    vi.advanceTimersByTime(TIMER_TICK_MS);
  });
  expect(screen.getByText('00:15:05')).toBeInTheDocument();
}

function parseClockText(value: string): number {
  const [hours = '0', minutes = '0', seconds = '0'] = value.split(':');
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function formatClockText(value: number): string {
  const clampedValue = Math.max(0, Math.round(value));
  const hours = Math.floor(clampedValue / 3600);
  const minutes = Math.floor((clampedValue % 3600) / 60);
  const seconds = clampedValue % 60;
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':');
}

function exportResetAndImportSnapshot(): void {
  fireEvent.click(screen.getByRole('button', { name: /JSON 내보내기/ }));
  const snapshotField = screen.getByLabelText('시뮬레이션 JSON') as HTMLTextAreaElement;
  expect(snapshotField.value).toContain('"timeScale": 5');
  expect(screen.getByText('내보냄')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^초기화$/ }));
  expect(screen.getByText('00:12:45')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /JSON 불러오기/ }));
  expect(screen.getByText('00:15:05')).toBeInTheDocument();
  expect(screen.getByText('불러옴')).toBeInTheDocument();
  fireEvent.change(snapshotField, { target: { value: '{' } });
  expect(snapshotField).toHaveValue('{');
}

function triggerApneaThenReset(): void {
  fireEvent.change(getSlider('Respiratory Rate (/min)'), { target: { value: '4' } });
  act(() => {
    vi.advanceTimersByTime(SLIDER_DEBOUNCE_WAIT_MS);
  });
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'apnea');
  expect(document.querySelector('.apnea-time-badge')).toHaveTextContent(/APNEA/);
  fireEvent.click(screen.getByRole('button', { name: /^초기화$/ }));
  expect(screen.getAllByText('폐렴(Pneumonia)_중증').length).toBeGreaterThan(0);
  expect(screen.getByText('00:12:45')).toBeInTheDocument();
}

/** Exercises keyboard, visualization, help, voice, and scenario interactions. */
export async function runInteractionFlow(): Promise<void> {
  await renderLoadedApp();
  const shell = screen.getByTestId('vent-simulator');
  togglePauseFromKeyboardAndSystemEvents();
  exerciseVisualizationControls();
  await openAndCloseHelpDialog();
  performContextMenuDragAndTouch(shell);
  await toggleVoiceArTutorialAndExam();
  triggerScenarioInterventions();
  await resetFio2WithKeyboardShortcut();
}

function togglePauseFromKeyboardAndSystemEvents(): void {
  fireEvent.keyDown(window, { code: 'Space' });
  expect(screen.getByRole('button', { name: '재개' })).toBeInTheDocument();
  fireEvent.keyDown(getSlider('FiO2 (%)'), { code: 'Space' });
  expect(screen.getByRole('button', { name: '재개' })).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('button', { name: '재개' }), { code: 'Space' });
  expect(screen.getByRole('button', { name: '재개' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '재개' }));
  expect(screen.getByRole('button', { name: /중지/ })).toBeInTheDocument();
  const hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(screen.getByRole('button', { name: '재개' })).toBeInTheDocument();
  hiddenSpy.mockRestore();
  fireEvent.click(screen.getByRole('button', { name: '재개' }));
  fireEvent(window, new Event('memorypressure'));
  expect(document.documentElement).toHaveAttribute('data-memory-pressure', 'detected');
  expect(screen.getByRole('button', { name: '재개' })).toBeInTheDocument();
}

function exerciseVisualizationControls(): void {
  fireEvent.click(screen.getByLabelText('Trend zoom in'));
  expect(screen.getByText('Auto scale 2x')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Trend zoom out'));
  expect(screen.getByText('Auto scale 1x')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^Detail avg/ }));
  expect(screen.getByRole('tab', { name: 'PIP' })).toHaveAttribute('aria-selected', 'true');
  fireEvent.click(screen.getByLabelText('Pressure zoom in'));
  fireEvent.click(screen.getByLabelText('Pressure zoom out'));
}

async function openAndCloseHelpDialog(): Promise<void> {
  const user = userEvent.setup();
  fireEvent.click(screen.getByRole('button', { name: 'Help' }));
  expect(screen.getByRole('dialog', { name: '키보드 단축키 도움말' })).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('dialog', { name: '키보드 단축키 도움말' })).getByText('닫기'));
  expect(screen.queryByRole('dialog', { name: '키보드 단축키 도움말' })).not.toBeInTheDocument();
  fireEvent.keyDown(window, { key: '?' });
  expect(screen.getByRole('dialog', { name: '키보드 단축키 도움말' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '본문 이동' })).toHaveFocus();
  await user.keyboard('{Shift>}{Tab}{/Shift}');
  expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
  await user.keyboard('{Tab}');
  expect(screen.getByRole('link', { name: '본문 이동' })).toHaveFocus();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: '키보드 단축키 도움말' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Help' })).toHaveFocus();
  expect(screen.getByRole('link', { name: '본문으로 이동' })).toHaveAttribute('href', '#simulator-content');
}

function performContextMenuDragAndTouch(shell: HTMLElement): void {
  fireEvent.dragOver(shell);
  fireEvent.contextMenu(shell, { clientX: 20, clientY: 30 });
  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Analyze' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Save' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Print' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Share' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  fireEvent.doubleClick(shell);
  expect(screen.getByText('Double click zoom')).toBeInTheDocument();
  const dragData = { setData: vi.fn() };
  fireEvent.dragStart(screen.getByRole('button', { name: 'normal' }), { dataTransfer: dragData });
  expect(dragData.setData).toHaveBeenCalledWith('text/plain', 'normal');
  fireEvent.drop(shell, { dataTransfer: { getData: () => 'not-a-scenario' } });
  expect(screen.queryByText('Dropped not-a-scenario')).not.toBeInTheDocument();
  fireEvent.drop(shell, { dataTransfer: { getData: () => 'ards' } });
  expect(screen.getAllByText('ARDS_중증').length).toBeGreaterThan(0);
  expect(screen.getByText('Dropped ards')).toBeInTheDocument();
  fireEvent.touchMove(shell, { touches: [{ clientX: 30, clientY: 20 }] });
  fireEvent.touchEnd(shell, { changedTouches: [] });
  fireEvent.touchStart(shell, { touches: [{ clientX: 80, clientY: 20 }] });
  fireEvent.touchEnd(shell, { changedTouches: [{ clientX: 75, clientY: 24 }] });
  expect(screen.getByText('Dropped ards')).toBeInTheDocument();
  fireEvent.touchStart(shell, { touches: [{ clientX: 80, clientY: 20 }] });
  fireEvent.touchEnd(shell, { changedTouches: [{ clientX: 10, clientY: 24 }] });
  expect(screen.getAllByText('기도 폐쇄').length).toBeGreaterThan(0);
  expect(screen.getByText('Swipe scenario')).toBeInTheDocument();
  fireEvent.touchStart(shell, {
    touches: [
      { clientX: 20, clientY: 20 },
      { clientX: 50, clientY: 20 },
    ],
  });
  fireEvent.touchMove(shell, {
    touches: [
      { clientX: 10, clientY: 20 },
      { clientX: 70, clientY: 20 },
    ],
  });
  expect(screen.getByText('Pinch zoom')).toBeInTheDocument();
}

async function toggleVoiceArTutorialAndExam(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'Voice idle' }));
  expect(screen.getByRole('button', { name: 'Voice unavailable' })).toBeInTheDocument();
  triggerMockVoiceRecognition();
  fireEvent.click(screen.getByRole('button', { name: 'AR ready' }));
  expect(screen.getByRole('button', { name: 'AR unavailable' })).toBeInTheDocument();
  await triggerMockArSupport();
  fireEvent.click(screen.getByRole('button', { name: /Tutorial 1/ }));
  expect(screen.getByRole('button', { name: /Tutorial 2/ })).toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: '인터랙티브 튜토리얼' })).toHaveTextContent('Step 2');
  fireEvent.click(within(screen.getByRole('dialog', { name: '인터랙티브 튜토리얼' })).getByText('다음'));
  expect(screen.getByRole('dialog', { name: '인터랙티브 튜토리얼' })).toHaveTextContent('Step 3');
  fireEvent.click(within(screen.getByRole('dialog', { name: '인터랙티브 튜토리얼' })).getByText('닫기'));
  expect(screen.queryByRole('dialog', { name: '인터랙티브 튜토리얼' })).not.toBeInTheDocument();
  expect(screen.getByRole('switch', { name: 'Exam off' })).toHaveAttribute('aria-checked', 'false');
  fireEvent.click(screen.getByRole('switch', { name: 'Exam off' }));
  expect(screen.getByRole('switch', { name: 'Exam on' })).toHaveAttribute('aria-checked', 'true');
}

function triggerMockVoiceRecognition(): void {
  type VoiceEvent = { results: ArrayLike<{ readonly 0: { transcript: string } }> };
  class MockSpeechRecognition {
    static latest: MockSpeechRecognition | null = null;
    continuous = false;
    lang = '';
    onresult: ((event: VoiceEvent) => void) | null = null;
    constructor() {
      MockSpeechRecognition.latest = this;
    }
    start(): void {
      return undefined;
    }
  }

  Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: MockSpeechRecognition });
  fireEvent.click(screen.getByRole('button', { name: 'Voice unavailable' }));
  expect(screen.getByRole('button', { name: 'Listening' })).toBeInTheDocument();
  act(() => {
    MockSpeechRecognition.latest?.onresult?.({ results: [{ 0: { transcript: 'resume' } }] });
  });
  expect(screen.getByRole('button', { name: 'Voice confirmed: resume' })).toBeInTheDocument();
  act(() => {
    MockSpeechRecognition.latest?.onresult?.({ results: [{ 0: { transcript: 'pause reset' } }] });
  });
  expect(screen.getByRole('button', { name: 'Voice confirmed: pause' })).toBeInTheDocument();
  act(() => {
    MockSpeechRecognition.latest?.onresult?.({ results: [] });
  });
  expect(screen.getByRole('button', { name: 'Voice heard' })).toBeInTheDocument();
  Reflect.deleteProperty(window, 'SpeechRecognition');
}

async function triggerMockArSupport(): Promise<void> {
  const isSessionSupported = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
  Object.defineProperty(navigator, 'xr', {
    configurable: true,
    value: { isSessionSupported },
  });
  fireEvent.click(screen.getByRole('button', { name: 'AR unavailable' }));
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.getByRole('button', { name: 'AR supported' })).toBeInTheDocument();
  isSessionSupported.mockResolvedValue(false);
  fireEvent.click(screen.getByRole('button', { name: 'AR supported' }));
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.getByRole('button', { name: 'AR unavailable' })).toBeInTheDocument();
  Reflect.deleteProperty(navigator, 'xr');
}

function triggerScenarioInterventions(): void {
  fireEvent.change(screen.getByLabelText('사용자 정의 시나리오'), { target: { value: 'Custom drill' } });
  expect(screen.getByText('Custom drill')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Learning off' }));
  fireEvent.click(screen.getByRole('button', { name: 'Quiz off' }));
  fireEvent.click(screen.getByRole('button', { name: 'Antibiotics' }));
  fireEvent.click(screen.getByRole('button', { name: /Sedation 0/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Paralytic' }));
  fireEvent.click(screen.getByRole('button', { name: 'NMB' }));
  fireEvent.click(screen.getByRole('button', { name: /Fluid 0/ }));
  fireEvent.click(screen.getByRole('button', { name: /Blood 0/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Extubate' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reintubate' }));
  fireEvent.click(screen.getByRole('button', { name: /CPR 0/ }));
  fireEvent.click(screen.getByRole('button', { name: 'balanced' }));
  expect(screen.getByRole('button', { name: 'normal-saline' })).toBeInTheDocument();
  expect(screen.getByText(/Sedation level 1/)).toBeInTheDocument();
  expect(screen.getByText(/Paralytic active/)).toBeInTheDocument();
  expect(screen.getByText(/Neuromuscular blockade/)).toBeInTheDocument();
  expect(screen.getByText(/supports perfusion/)).toBeInTheDocument();
}

async function resetFio2WithKeyboardShortcut(): Promise<void> {
  fireEvent.change(getSlider('FiO2 (%)'), { target: { value: '100' } });
  await new Promise((resolve) => {
    window.setTimeout(resolve, SLIDER_DEBOUNCE_WAIT_MS);
  });
  fireEvent.keyDown(window, { key: 'r', ctrlKey: true });
  expect(getSlider('FiO2 (%)')).toHaveValue('40');
}
