import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { type MockInstance, describe, expect, it, vi } from 'vitest';
import { SimulationProvider, useSimulationContext, useSimulationSelector } from '@/context';
import { DEFAULT_SETTINGS, SCENARIOS, type TimeScale } from '@/simulation';
import {
  useElapsedTimer,
  useIntersectionVisibility,
  useSimulation,
  useThrottledViewportMetrics,
  useVentilatorSettings,
} from './index';

const NORMAL_FIO2 = 100;
const UPDATED_FIO2 = 80;
const UPDATED_PEEP = 12;
const DEFAULT_FIO2 = 40;
const JUMP_TO_SECONDS = 900.4;
const REWIND_SECONDS = 30.2;
const TIMER_TICK_MS = 1000;
const PAUSED_WAIT_MS = 3000;
const RAF_TIMESTAMP_MS = 16;
type AnimationFrameSpy = MockInstance<(callback: FrameRequestCallback) => number>;

function SimulationProbe({
  fio2 = DEFAULT_SETTINGS.fio2,
  scenarioType = 'pneumonia',
}: {
  fio2?: number;
  scenarioType?: keyof typeof SCENARIOS;
}): ReactElement {
  const simulation = useSimulation({ ...DEFAULT_SETTINGS, fio2 }, SCENARIOS[scenarioType]);
  return (
    <output>
      {simulation.condition}:{simulation.vitals.spo2}:{simulation.visualState.lungColor}
    </output>
  );
}

function VentilatorSettingsProbe(): ReactElement {
  const { resetSettings, scenarioType, setScenarioType, settings, updateSetting } = useVentilatorSettings();
  return (
    <div>
      <span>{scenarioType}</span>
      <span>{settings.fio2}</span>
      <span>{settings.peep}</span>
      <button type="button" onClick={() => updateSetting('fio2', UPDATED_FIO2)}>
        fio2
      </button>
      <button type="button" onClick={() => updateSetting('peep', UPDATED_PEEP)}>
        peep
      </button>
      <button type="button" onClick={() => setScenarioType('ards')}>
        scenario
      </button>
      <button type="button" onClick={resetSettings}>
        reset
      </button>
    </div>
  );
}

function TimerProbe({ paused, timeScale }: { paused: boolean; timeScale: TimeScale }): ReactElement {
  const { elapsedSeconds, jumpToElapsedSeconds, resetElapsedSeconds, rewindElapsedSeconds } = useElapsedTimer(
    paused,
    timeScale,
  );
  return (
    <div>
      <span>{elapsedSeconds}</span>
      <button type="button" onClick={() => jumpToElapsedSeconds(JUMP_TO_SECONDS)}>
        jump
      </button>
      <button type="button" onClick={() => rewindElapsedSeconds(REWIND_SECONDS)}>
        rewind
      </button>
      <button type="button" onClick={resetElapsedSeconds}>
        reset
      </button>
    </div>
  );
}

function ContextSelectorProbe(): ReactElement {
  const scenarioType = useSimulationSelector((value) => value.scenarioType);
  const { updateSetting } = useSimulationContext();
  return (
    <div>
      <span>{scenarioType}</span>
      <button type="button" onClick={() => updateSetting('fio2', UPDATED_FIO2)}>
        update
      </button>
    </div>
  );
}

function ViewportMetricsProbe(): ReactElement {
  const metrics = useThrottledViewportMetrics();
  return (
    <output>
      {metrics.width}:{metrics.scrollBucket}
    </output>
  );
}

function VisibilityProbe(): ReactElement {
  const { elementRef, isVisible } = useIntersectionVisibility<HTMLDivElement>();
  return <div ref={elementRef}>{isVisible ? 'visible' : 'hidden'}</div>;
}

function VisibilityStateOnlyProbe(): ReactElement {
  const { isVisible } = useIntersectionVisibility<HTMLDivElement>();
  return <div>{isVisible ? 'visible' : 'hidden'}</div>;
}

let latestIntersectionObserverCallback: IntersectionObserverCallback | null = null;

function installIntersectionObserverMock(disconnect: () => void): void {
  latestIntersectionObserverCallback = null;
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly scrollMargin = '0px';
    readonly thresholds = [];
    constructor(callback: IntersectionObserverCallback) {
      latestIntersectionObserverCallback = callback;
    }
    disconnect(): void {
      disconnect();
    }
    observe(): void {
      return undefined;
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {
      return undefined;
    }
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    value: MockIntersectionObserver,
  });
}

function setViewport(width: number, scrollY: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: scrollY });
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1500 });
}

function mockRequestAnimationFrame(): {
  animationCallbacks: FrameRequestCallback[];
  requestAnimationFrameSpy: AnimationFrameSpy;
} {
  const animationCallbacks: FrameRequestCallback[] = [];
  const requestAnimationFrameSpy = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      animationCallbacks.push(callback);
      return animationCallbacks.length;
    });

  return { animationCallbacks, requestAnimationFrameSpy };
}

describe('simulation hooks', () => {
  registerSimulationHookTests();
  registerVentilatorSettingsHookTests();
  registerElapsedTimerHookTests();
  registerSimulationContextHookTests();
  registerViewportMetricsHookTests();
});

function registerSimulationHookTests(): void {
  it('useSimulation recalculates when settings or scenario inputs change', () => {
    const { rerender } = render(<SimulationProbe />);
    expect(screen.getByText(/worsening:/)).toBeInTheDocument();

    rerender(<SimulationProbe fio2={NORMAL_FIO2} scenarioType="normal" />);
    expect(screen.getByText(/stable:/)).toBeInTheDocument();
    expect(screen.getByText(/healthy/)).toBeInTheDocument();
  });
}

function registerVentilatorSettingsHookTests(): void {
  it('useVentilatorSettings exposes initial state, immutable updates, scenario changes, and reset', () => {
    render(<VentilatorSettingsProbe />);

    expect(screen.getByText('pneumonia')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(DEFAULT_SETTINGS.fio2).toBe(DEFAULT_FIO2);

    fireEvent.click(screen.getByRole('button', { name: 'fio2' }));
    fireEvent.click(screen.getByRole('button', { name: 'peep' }));
    fireEvent.click(screen.getByRole('button', { name: 'scenario' }));

    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('ards')).toBeInTheDocument();
    expect(DEFAULT_SETTINGS).toMatchObject({ fio2: 40, peep: 5 });

    fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByText('pneumonia')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
}

function registerElapsedTimerHookTests(): void {
  it('useElapsedTimer starts, pauses, cleans up, jumps, rewinds, resets, and advances exactly by time scale', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const { rerender, unmount } = render(<TimerProbe paused={false} timeScale={1} />);

    expect(screen.getByText('765')).toBeInTheDocument();
    void act(() => vi.advanceTimersByTime(TIMER_TICK_MS));
    expect(screen.getByText('766')).toBeInTheDocument();

    rerender(<TimerProbe paused timeScale={1} />);
    void act(() => vi.advanceTimersByTime(PAUSED_WAIT_MS));
    expect(screen.getByText('766')).toBeInTheDocument();

    rerender(<TimerProbe paused={false} timeScale={5} />);
    void act(() => vi.advanceTimersByTime(TIMER_TICK_MS));
    expect(screen.getByText('771')).toBeInTheDocument();

    rerender(<TimerProbe paused={false} timeScale={60} />);
    void act(() => vi.advanceTimersByTime(TIMER_TICK_MS));
    expect(screen.getByText('831')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'jump' }));
    expect(screen.getByText('900')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'rewind' }));
    expect(screen.getByText('870')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByText('765')).toBeInTheDocument();

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
    vi.useRealTimers();
  });
}

function registerSimulationContextHookTests(): void {
  it('SimulationProvider, useSimulationContext, and selector hook provide integrated context access', () => {
    render(
      <SimulationProvider>
        <ContextSelectorProbe />
      </SimulationProvider>,
    );

    expect(screen.getByText('pneumonia')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'update' }));
    expect(screen.getByText('pneumonia')).toBeInTheDocument();
  });
}

function registerViewportMetricsHookTests(): void {
  registerIntersectionVisibilityFallbackTest();
  registerIntersectionVisibilityIdleCancelTest();
  registerIntersectionVisibilityHiddenEntryTest();
  registerIntersectionVisibilityNoTargetTest();
  registerIntersectionVisibilityNoObserverTest();
  registerStableViewportMetricsTest();
  registerViewportMetricsCleanupTest();
  registerBatchedViewportMetricsTest();
  registerBottomViewportMetricsTest();
}

function registerIntersectionVisibilityFallbackTest(): void {
  it('useIntersectionVisibility falls back to timeout scheduling and cleanup', () => {
    vi.useFakeTimers();
    const disconnect = vi.fn();
    installIntersectionObserverMock(disconnect);

    const { unmount } = render(<VisibilityProbe />);
    expect(screen.getByText('hidden')).toBeInTheDocument();
    act(() => {
      latestIntersectionObserverCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    unmount();
    expect(disconnect).toHaveBeenCalled();
    Reflect.deleteProperty(window, 'IntersectionObserver');
  });
}

function registerIntersectionVisibilityIdleCancelTest(): void {
  it('useIntersectionVisibility cancels pending idle visibility updates', () => {
    const disconnect = vi.fn();
    const cancelIdleCallback = vi.fn();
    installIntersectionObserverMock(disconnect);
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: vi.fn(() => 7),
    });
    Object.defineProperty(window, 'cancelIdleCallback', { configurable: true, value: cancelIdleCallback });

    const { unmount } = render(<VisibilityProbe />);
    act(() => {
      latestIntersectionObserverCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    unmount();

    expect(disconnect).toHaveBeenCalled();
    expect(cancelIdleCallback).toHaveBeenCalledWith(7);
    Reflect.deleteProperty(window, 'IntersectionObserver');
    Reflect.deleteProperty(window, 'requestIdleCallback');
    Reflect.deleteProperty(window, 'cancelIdleCallback');
  });
}

function registerIntersectionVisibilityHiddenEntryTest(): void {
  it('useIntersectionVisibility ignores hidden observer entries', () => {
    const disconnect = vi.fn();
    installIntersectionObserverMock(disconnect);

    render(<VisibilityProbe />);
    act(() => {
      latestIntersectionObserverCallback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(screen.getByText('hidden')).toBeInTheDocument();
    expect(disconnect).not.toHaveBeenCalled();
    Reflect.deleteProperty(window, 'IntersectionObserver');
  });
}

function registerIntersectionVisibilityNoTargetTest(): void {
  it('useIntersectionVisibility tolerates missing observed elements', () => {
    const disconnect = vi.fn();
    installIntersectionObserverMock(disconnect);

    render(<VisibilityStateOnlyProbe />);

    expect(screen.getByText('hidden')).toBeInTheDocument();
    expect(disconnect).not.toHaveBeenCalled();
    Reflect.deleteProperty(window, 'IntersectionObserver');
  });
}

function registerIntersectionVisibilityNoObserverTest(): void {
  it('useIntersectionVisibility starts visible when IntersectionObserver is unavailable', () => {
    Reflect.deleteProperty(window, 'IntersectionObserver');

    render(<VisibilityProbe />);

    expect(screen.getByText('visible')).toBeInTheDocument();
  });
}

function registerStableViewportMetricsTest(): void {
  it('useThrottledViewportMetrics keeps identical measurements stable', () => {
    const { animationCallbacks, requestAnimationFrameSpy } = mockRequestAnimationFrame();
    setViewport(1024, 0);

    render(<ViewportMetricsProbe />);
    window.dispatchEvent(new Event('resize'));
    act(() => {
      animationCallbacks[0]?.(RAF_TIMESTAMP_MS);
    });

    expect(screen.getByText('1024:top')).toBeInTheDocument();
    requestAnimationFrameSpy.mockRestore();
  });
}

function registerViewportMetricsCleanupTest(): void {
  it('useThrottledViewportMetrics cancels pending animation frames on cleanup', () => {
    const { requestAnimationFrameSpy } = mockRequestAnimationFrame();
    const cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);
    setViewport(1024, 0);

    const { unmount } = render(<ViewportMetricsProbe />);
    window.dispatchEvent(new Event('resize'));
    unmount();

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(1);
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
}

function registerBatchedViewportMetricsTest(): void {
  it('useThrottledViewportMetrics batches scroll and resize updates into one animation frame', () => {
    const { animationCallbacks, requestAnimationFrameSpy } = mockRequestAnimationFrame();
    const cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);
    setViewport(1024, 0);

    render(<ViewportMetricsProbe />);
    expect(screen.getByText('1024:top')).toBeInTheDocument();

    setViewport(768, 500);
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    act(() => {
      animationCallbacks[0]?.(RAF_TIMESTAMP_MS);
    });
    expect(screen.getByText('768:middle')).toBeInTheDocument();

    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
}

function registerBottomViewportMetricsTest(): void {
  it('useThrottledViewportMetrics reports bottom scroll bucket', () => {
    setViewport(1024, 1000);

    render(<ViewportMetricsProbe />);

    expect(screen.getByText('1024:bottom')).toBeInTheDocument();
  });
}
