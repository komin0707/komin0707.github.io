import { fireEvent, render, screen } from '@testing-library/react';
import { act, type ReactElement, type TouchEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type ScenarioType, type VentSettings } from '@/simulation/scenarios';
import { useSimulatorInteractions } from './useSimulatorInteractions';

type TouchPoint = {
  clientX: number;
  clientY: number;
};

type TestTouchCollection = {
  readonly [index: number]: TouchPoint | undefined;
  readonly length: number;
};

type Interactions = ReturnType<typeof useSimulatorInteractions>;

function InteractionsProbe({
  exportSnapshot = () => '{"version":1}',
  importSnapshot = () => true,
  jumpToTime = () => undefined,
  onModeChange = () => undefined,
  reset = () => undefined,
  rewindTime = () => undefined,
  scenarioOrder = ['normal', 'pneumonia'],
  scenarioType = 'normal',
  setPaused = () => undefined,
  setScenarioType = () => undefined,
  setTimeScale = () => undefined,
  timeScale = 1,
  updateSetting = () => undefined,
}: {
  exportSnapshot?: () => string;
  importSnapshot?: (json: string) => boolean;
  jumpToTime?: (seconds: number) => void;
  onModeChange?: (mode: Parameters<typeof useSimulatorInteractions>[0]['settings']['mode']) => void;
  reset?: () => void;
  rewindTime?: (seconds: number) => void;
  scenarioOrder?: readonly ScenarioType[];
  scenarioType?: ScenarioType;
  setPaused?: (value: boolean) => void;
  setScenarioType?: (scenarioType: ScenarioType) => void;
  setTimeScale?: (timeScale: Parameters<typeof useSimulatorInteractions>[0]['timeScale']) => void;
  timeScale?: Parameters<typeof useSimulatorInteractions>[0]['timeScale'];
  updateSetting?: <K extends keyof VentSettings>(key: K, value: VentSettings[K]) => void;
}): ReactElement {
  const interactions = useSimulatorInteractions({
    elapsedSeconds: 120,
    exportSnapshot,
    importSnapshot,
    jumpToTime,
    onModeChange,
    reset,
    rewindTime,
    scenarioOrder,
    scenarioType,
    settings: DEFAULT_SETTINGS,
    setPaused: (value) => {
      if (typeof value === 'function') return;
      setPaused(value);
    },
    setScenarioType,
    setTimeScale,
    timeScale,
    updateSetting,
  });

  return (
    <div>
      <output>
        {interactions.gestureMessage}:{interactions.interactionZoom}
      </output>
      <GestureButtons interactions={interactions} />
    </div>
  );
}

function GestureButtons({ interactions }: { interactions: Interactions }): ReactElement {
  return (
    <>
      <button type="button" onClick={() => interactions.handleTouchStart(buildTouchEvent(emptyTouches()))}>
        empty start
      </button>
      <button
        type="button"
        onClick={() => interactions.handleTouchStart(buildTouchEvent(singleTouch(10, 10)))}
      >
        short start
      </button>
      <button
        type="button"
        onClick={() => interactions.handleTouchMove(buildTouchEvent(doubleTouch(10, 10, 10, 10)))}
      >
        zero move
      </button>
      <button
        type="button"
        onClick={() => interactions.handleTouchStart(buildTouchEvent(doubleTouch(10, 10, 40, 40)))}
      >
        multi start
      </button>
      <button
        type="button"
        onClick={() => interactions.handleTouchMove(buildTouchEvent(missingSecondTouch()))}
      >
        missing move
      </button>
      <button
        type="button"
        onClick={() => interactions.handleTouchEnd(buildTouchEvent(emptyTouches(), singleTouch(-80, 10)))}
      >
        left swipe
      </button>
      <button
        type="button"
        onClick={() => interactions.handleTouchEnd(buildTouchEvent(emptyTouches(), singleTouch(90, 10)))}
      >
        right swipe
      </button>
      <button
        type="button"
        onClick={() => interactions.handleTouchEnd(buildTouchEvent(emptyTouches(), singleTouch(10, -80)))}
      >
        up swipe
      </button>
      <button
        type="button"
        onClick={() => interactions.handleTouchEnd(buildTouchEvent(emptyTouches(), singleTouch(10, 90)))}
      >
        down swipe
      </button>
      <button type="button" onClick={interactions.handleDoubleClickZoom}>
        double click zoom
      </button>
      <span>{interactions.shortcutStatus}</span>
      <span>{interactions.voiceStatus}</span>
      <span>{interactions.spatialStatus}</span>
      <span>{interactions.xrMode}</span>
      <span>{interactions.commandPaletteOpen ? 'command open' : 'command closed'}</span>
      <span>{interactions.searchOpen ? 'search open' : 'search closed'}</span>
      <span>{interactions.settingsShortcutOpen ? 'settings open' : 'settings closed'}</span>
      <span>{interactions.helpMode ? 'help open' : 'help closed'}</span>
      <span>{interactions.tutorialOpen ? 'tutorial open' : 'tutorial closed'}</span>
      <span>{interactions.debugMode ? 'debug open' : 'debug closed'}</span>
      <span>{interactions.fullscreenMode ? 'fullscreen open' : 'fullscreen closed'}</span>
      <span>{interactions.exitConfirmOpen ? 'exit open' : 'exit closed'}</span>
      <span>{interactions.mobilePanelState}</span>
      <span>{interactions.contextMenu ? 'context open' : 'context closed'}</span>
      <span>{interactions.hapticsEnabled ? 'haptics on' : 'haptics off'}</span>
      <button type="button" onClick={() => interactions.setHapticsEnabled((value) => !value)}>
        toggle haptics
      </button>
      <button type="button" onClick={interactions.startVoiceCommand}>
        voice command
      </button>
      <button type="button" onClick={() => interactions.runSpatialCommand('hand-wave-next')}>
        hand wave next
      </button>
      <button type="button" onClick={() => interactions.runSpatialCommand('palm-stop')}>
        palm stop
      </button>
      <button type="button" onClick={() => interactions.runSpatialCommand('finger-point')}>
        finger point
      </button>
      <button type="button" onClick={() => interactions.runSpatialCommand('ar-marker')}>
        ar marker
      </button>
      <button type="button" onClick={() => interactions.runSpatialCommand('vr-mode')}>
        vr mode
      </button>
    </>
  );
}

describe('useSimulatorInteractions direct gestures', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('covers fallback touch coordinates and guarded pinch movement', () => {
    render(<InteractionsProbe />);

    fireEvent.click(screen.getByRole('button', { name: 'empty start' }));
    fireEvent.click(screen.getByRole('button', { name: 'missing move' }));
    fireEvent.click(screen.getByRole('button', { name: 'short start' }));
    fireEvent.click(screen.getByRole('button', { name: 'zero move' }));

    expect(screen.getByText('Ready:1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'multi start' }));
    expect(screen.getByText('Multi-finger gesture:1')).toBeInTheDocument();
    expect(screen.getByText('multi-finger')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'double click zoom' }));
    expect(screen.getByText('Double click zoom:1.18')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'double click zoom' }));
    expect(screen.getByText('Double click zoom:1')).toBeInTheDocument();
  });

  it('falls back to pneumonia when cycling with an empty scenario order', () => {
    const setScenarioType = vi.fn();
    render(<InteractionsProbe scenarioOrder={[]} setScenarioType={setScenarioType} />);

    fireEvent.click(screen.getByRole('button', { name: 'short start' }));
    fireEvent.click(screen.getByRole('button', { name: 'left swipe' }));
    fireEvent.click(screen.getByRole('button', { name: 'short start' }));
    fireEvent.click(screen.getByRole('button', { name: 'right swipe' }));

    expect(setScenarioType).toHaveBeenCalledWith('pneumonia');
    expect(screen.getByText('Swipe scenario:1')).toBeInTheDocument();
  });

  it('handles global keyboard shortcut overlays and scenario navigation', () => {
    const setScenarioType = vi.fn();
    render(<InteractionsProbe setScenarioType={setScenarioType} />);

    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' });
    expect(screen.getByText('command open')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+K command palette')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'n' });
    expect(setScenarioType).toHaveBeenCalledWith('pneumonia');
    expect(screen.getByText('N next scenario')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByText('command closed')).toBeInTheDocument();
    expect(screen.getByText('Esc close')).toBeInTheDocument();
  });

  it('covers the complete bedside keyboard shortcut contract', () => {
    const exportSnapshot = vi.fn(() => '{"version":2}');
    const importSnapshot = vi.fn(() => true);
    const jumpToTime = vi.fn();
    const onModeChange = vi.fn();
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const reset = vi.fn();
    const rewindTime = vi.fn();
    const setScenarioType = vi.fn();
    const setTimeScale = vi.fn();
    const storage = new Map<string, string>();
    const writeText = vi.fn();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <InteractionsProbe
        exportSnapshot={exportSnapshot}
        importSnapshot={importSnapshot}
        jumpToTime={jumpToTime}
        onModeChange={onModeChange}
        reset={reset}
        rewindTime={rewindTime}
        scenarioOrder={['normal', 'pneumonia', 'ards', 'airwayObstruction', 'pneumothorax']}
        setScenarioType={setScenarioType}
        setTimeScale={setTimeScale}
      />,
    );

    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(screen.getByText('Space pause/resume')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.keyDown(window, { ctrlKey: true, key: 'r' });
    expect(reset).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Ctrl+R reset')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'm' });
    expect(screen.getByText('M alarm mute requested')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'n' });
    fireEvent.keyDown(window, { key: 'p' });
    expect(setScenarioType).toHaveBeenCalledWith('pneumonia');
    expect(setScenarioType).toHaveBeenCalledWith('pneumothorax');
    fireEvent.keyDown(window, { key: 'h' });
    expect(screen.getByText('help open')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 't' });
    expect(screen.getByText('tutorial open')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByText('debug open')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'f' });
    expect(screen.getByText('fullscreen open')).toBeInTheDocument();

    fireEvent.keyDown(window, { ctrlKey: true, key: 's' });
    expect(storage.get('vent-simulator-shortcut-snapshot')).toBe('{"version":2}');
    fireEvent.keyDown(window, { ctrlKey: true, key: 'o' });
    expect(importSnapshot).toHaveBeenCalledWith('{"version":2}');
    fireEvent.keyDown(window, { ctrlKey: true, key: 'e' });
    expect(writeText).toHaveBeenCalledWith('{"version":2}');
    fireEvent.keyDown(window, { ctrlKey: true, key: 'p' });
    expect(print).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { ctrlKey: true, key: 'z' });
    expect(screen.getByText('Ctrl+Z undo requested')).toBeInTheDocument();
    fireEvent.keyDown(window, { ctrlKey: true, key: 'y' });
    expect(screen.getByText('Ctrl+Y redo requested')).toBeInTheDocument();
    fireEvent.keyDown(window, { ctrlKey: true, key: ',' });
    expect(screen.getByText('settings open')).toBeInTheDocument();
    fireEvent.keyDown(window, { ctrlKey: true, key: '/' });
    expect(screen.getByText('search open')).toBeInTheDocument();
    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' });
    expect(screen.getByText('command open')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '+' });
    fireEvent.keyDown(window, { key: '-' });
    fireEvent.keyDown(window, { ctrlKey: true, key: '0' });
    fireEvent.keyDown(window, { key: 'PageUp' });
    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(setTimeScale).toHaveBeenCalledWith(1);
    expect(screen.getByText('Page Down large decrease')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: '[' });
    fireEvent.keyDown(window, { key: ']' });
    expect(rewindTime).toHaveBeenCalledWith(30);
    expect(jumpToTime).toHaveBeenCalledWith(150);
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: '6' });
    expect(onModeChange).toHaveBeenCalledWith('AC');
    expect(setScenarioType).toHaveBeenCalledWith('normal');
    fireEvent.keyDown(window, { key: 'q' });
    expect(screen.getByText('exit open')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByText('Enter confirm')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByText('? help dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'Home' });
    fireEvent.keyDown(window, { key: 'End' });
    expect(screen.getByText('End last control')).toBeInTheDocument();
    fireEvent.keyDown(window, { ctrlKey: true, key: 'X', shiftKey: true });
    expect(screen.getByText('Shortcut disable toggled')).toBeInTheDocument();

    print.mockRestore();
  });

  it('handles long press context menu, vertical panel swipes, haptic toggle, and shake undo', () => {
    vi.useFakeTimers();
    render(<InteractionsProbe />);

    fireEvent.click(screen.getByRole('button', { name: 'short start' }));
    act(() => {
      vi.advanceTimersByTime(560);
    });
    expect(screen.getByText('context open')).toBeInTheDocument();
    expect(screen.getByText('Long press menu:1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'short start' }));
    fireEvent.click(screen.getByRole('button', { name: 'up swipe' }));
    expect(screen.getByText('minimized')).toBeInTheDocument();
    expect(screen.getByText('Swipe minimize:1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'short start' }));
    fireEvent.click(screen.getByRole('button', { name: 'down swipe' }));
    expect(screen.getByText('expanded')).toBeInTheDocument();
    expect(screen.getByText('Swipe expand:1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'toggle haptics' }));
    expect(screen.getByText('haptics off')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new DeviceMotionEvent('devicemotion', {
          accelerationIncludingGravity: { x: 25, y: 0, z: 0 },
        }),
      );
    });
    expect(screen.getByText('Shake undo:1')).toBeInTheDocument();
    expect(screen.getByText('Shake undo requested')).toBeInTheDocument();
  });

  it('recognizes pause, resume, reset, PEEP, FiO2, and medical voice commands', () => {
    const reset = vi.fn();
    const setPaused = vi.fn();
    const updateSetting = vi.fn();
    const recognition = installSpeechRecognitionMock();
    render(<InteractionsProbe reset={reset} setPaused={setPaused} updateSetting={updateSetting} />);

    fireEvent.click(screen.getByRole('button', { name: 'voice command' }));
    act(() => recognition.emit('Pause ventilation'));
    expect(setPaused).toHaveBeenCalledWith(true);
    expect(screen.getByText('Voice confirmed: pause')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'voice command' }));
    act(() => recognition.emit('정지'));
    expect(setPaused).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'voice command' }));
    act(() => recognition.emit('Resume ventilation'));
    expect(setPaused).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole('button', { name: 'voice command' }));
    act(() => recognition.emit('Reset scenario'));
    expect(reset).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'voice command' }));
    act(() => recognition.emit('Increase PEEP'));
    expect(updateSetting).toHaveBeenCalledWith('peep', DEFAULT_SETTINGS.peep + 2);

    fireEvent.click(screen.getByRole('button', { name: 'voice command' }));
    act(() => recognition.emit('Decrease FiO2'));
    expect(updateSetting).toHaveBeenCalledWith('fio2', DEFAULT_SETTINGS.fio2 - 5);

    fireEvent.click(screen.getByRole('button', { name: 'voice command' }));
    act(() => recognition.emit('airway resistance'));
    expect(screen.getByText('Voice confirmed medical term: airway resistance')).toBeInTheDocument();
  });

  it('routes spatial hand, eye, AR, and VR commands through simulator state', () => {
    const setScenarioType = vi.fn();
    const setPaused = vi.fn();
    render(<InteractionsProbe setPaused={setPaused} setScenarioType={setScenarioType} />);

    fireEvent.click(screen.getByRole('button', { name: 'hand wave next' }));
    expect(setScenarioType).toHaveBeenCalledWith('pneumonia');
    expect(screen.getByText('Hand wave next scenario')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'palm stop' }));
    expect(setPaused).toHaveBeenCalledWith(true);
    expect(screen.getByText('Palm stop pause')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'finger point' }));
    expect(screen.getByText('Finger pointing help active')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ar marker' }));
    expect(screen.getByText('AR marker recognition ready')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'vr mode' }));
    expect(screen.getAllByText('VR simulation mode ready')).toHaveLength(2);
  });
});

function buildTouchEvent(
  touches: TestTouchCollection,
  changedTouches: TestTouchCollection = touches,
): TouchEvent<HTMLElement> {
  return { changedTouches, touches } as unknown as TouchEvent<HTMLElement>;
}

function emptyTouches(): TestTouchCollection {
  return { length: 0 };
}

function singleTouch(clientX: number, clientY: number): TestTouchCollection {
  return { 0: { clientX, clientY }, length: 1 };
}

function doubleTouch(firstX: number, firstY: number, secondX: number, secondY: number): TestTouchCollection {
  return {
    0: { clientX: firstX, clientY: firstY },
    1: { clientX: secondX, clientY: secondY },
    length: 2,
  };
}

function missingSecondTouch(): TestTouchCollection {
  return { 0: { clientX: 10, clientY: 10 }, length: 2 };
}

function installSpeechRecognitionMock() {
  let latestInstance: { emit: (transcript: string) => void } | null = null;
  class MockSpeechRecognition {
    continuous = false;
    lang = '';
    maxAlternatives = 1;
    onresult: ((event: { results: ArrayLike<{ readonly 0: { transcript: string } }> }) => void) | null = null;

    constructor() {
      latestInstance = {
        emit: (transcript: string) => {
          this.onresult?.({ results: [{ 0: { transcript } }] });
        },
      };
    }

    start() {
      return undefined;
    }
  }

  Object.defineProperty(window, 'SpeechRecognition', {
    configurable: true,
    value: MockSpeechRecognition,
  });
  return {
    emit: (transcript: string) => latestInstance?.emit(transcript),
  };
}
