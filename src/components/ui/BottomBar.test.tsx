import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SCENARIOS, type ScenarioType } from '@/simulation/scenarios';
import type { TimeScale } from '@/simulation/simulationSnapshot';
import { BottomBar } from './BottomBar';

type BottomBarProps = ComponentProps<typeof BottomBar>;

const FAST_TIME_SCALE = 5;
const REWIND_SECONDS = 30;
const JUMP_SECONDS = 900;

describe('BottomBar and scenario selection', () => {
  registerBottomBarInteractionTests();
  registerBottomBarStateTests();
  registerBottomBarLocaleTests();
  registerBottomBarInvalidJumpTests();
});

function registerBottomBarInteractionTests(): void {
  it('renders all props and dispatches pause, reset, rewind, jump, import, export, scenario, and speed events', () => {
    const handlers = renderInteractiveBottomBar();

    expect(screen.getByText('00:12:45')).toBeInTheDocument();
    expect(screen.getAllByText(SCENARIOS.pneumonia.koreanLabel).length).toBeGreaterThan(0);
    expect(screen.getByText('성인 / 65kg / 남성 / 기관삽관 상태')).toBeInTheDocument();
    expect(screen.getByText('00:12:45.000')).toBeInTheDocument();
    expect(document.querySelector('.bottom-bar')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Simulation time controls' })).toBeInTheDocument();
    expect(screen.getByLabelText('특정 시간으로 점프')).toHaveAttribute('required');
    expectScenarioOptions();
    expect(
      [...screen.getByLabelText('시뮬레이션 속도').querySelectorAll('option')].map((option) => option.value),
    ).toEqual(['1', '2', '5', '10', '60']);
    expect(screen.getByLabelText('시간 슬라이더')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('시나리오'), { target: { value: 'ards' } });
    fireEvent.change(screen.getByLabelText('시뮬레이션 속도'), {
      target: { value: String(FAST_TIME_SCALE) },
    });
    fireEvent.click(screen.getByRole('button', { name: '-5s' }));
    fireEvent.click(screen.getByRole('button', { name: '-30s' }));
    fireEvent.click(screen.getByRole('button', { name: '-1m' }));
    fireEvent.click(screen.getByRole('button', { name: '-5m' }));
    fireEvent.click(screen.getByRole('button', { name: '+5s' }));
    fireEvent.click(screen.getByRole('button', { name: '+1m' }));
    fireEvent.click(screen.getByRole('button', { name: '+1h' }));
    fireEvent.change(screen.getByLabelText('특정 시간으로 점프'), {
      target: { value: String(JUMP_SECONDS) },
    });
    fireEvent.click(screen.getByRole('button', { name: '이동' }));
    fireEvent.click(screen.getByRole('button', { name: /JSON 내보내기/ }));
    fireEvent.click(screen.getByRole('button', { name: /JSON 불러오기/ }));
    fireEvent.click(screen.getByRole('button', { name: /시간 CSV/ }));
    fireEvent.click(screen.getByRole('button', { name: /중지/ }));
    fireEvent.click(screen.getByRole('button', { name: /^초기화$/ }));

    expect(handlers.onScenarioChange).toHaveBeenCalledWith('ards');
    expect(handlers.onTimeScaleChange).toHaveBeenCalledWith(FAST_TIME_SCALE satisfies TimeScale);
    expect(handlers.onRewind).toHaveBeenCalledWith(5);
    expect(handlers.onRewind).toHaveBeenCalledWith(REWIND_SECONDS);
    expect(handlers.onRewind).toHaveBeenCalledWith(60);
    expect(handlers.onRewind).toHaveBeenCalledWith(300);
    expect(handlers.onJumpToTime).toHaveBeenCalledWith(770);
    expect(handlers.onJumpToTime).toHaveBeenCalledWith(825);
    expect(handlers.onJumpToTime).toHaveBeenCalledWith(4365);
    expect(handlers.onJumpToTime).toHaveBeenCalledWith(JUMP_SECONDS);
    expect(handlers.onExportSnapshot).toHaveBeenCalledTimes(1);
    expect(handlers.onImportSnapshot).toHaveBeenCalledWith('{"version":1}');
    expect(screen.getAllByText('시간 CSV').length).toBeGreaterThan(0);
    expect(handlers.onPauseToggle).toHaveBeenCalledTimes(1);
    expect(handlers.onReset).toHaveBeenCalledTimes(1);
  });
}

function renderInteractiveBottomBar(): {
  onExportSnapshot: ReturnType<typeof vi.fn>;
  onImportSnapshot: ReturnType<typeof vi.fn>;
  onJumpToTime: ReturnType<typeof vi.fn>;
  onPauseToggle: ReturnType<typeof vi.fn>;
  onReset: ReturnType<typeof vi.fn>;
  onRewind: ReturnType<typeof vi.fn>;
  onScenarioChange: ReturnType<typeof vi.fn>;
  onTimeScaleChange: ReturnType<typeof vi.fn>;
} {
  const handlers = {
    onExportSnapshot: vi.fn(() => '{"version":1}'),
    onImportSnapshot: vi.fn((json: string) => json.includes('version')),
    onJumpToTime: vi.fn(),
    onPauseToggle: vi.fn(),
    onReset: vi.fn(),
    onRewind: vi.fn(),
    onScenarioChange: vi.fn(),
    onTimeScaleChange: vi.fn(),
  };
  renderBottomBar({ ...handlers, scenarioType: 'pneumonia' });
  return handlers;
}

function expectScenarioOptions(): void {
  expect(
    [...screen.getByLabelText('시나리오').querySelectorAll('option')].map((option) => option.value),
  ).toEqual(Object.keys(SCENARIOS) as ScenarioType[]);
}

function registerBottomBarStateTests(): void {
  it('shows import failure and paused resume state', () => {
    const onTimeScaleChange = vi.fn();
    renderBottomBar({
      elapsedSeconds: 0,
      isPaused: true,
      onExportSnapshot: () => 'not-json',
      onImportSnapshot: () => false,
      onTimeScaleChange,
    });

    fireEvent.change(screen.getByLabelText('시뮬레이션 속도'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /JSON 내보내기/ }));
    fireEvent.click(screen.getByRole('button', { name: /JSON 불러오기/ }));

    expect(onTimeScaleChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /재개/ })).toBeInTheDocument();
    expect(screen.getByText('JSON 오류')).toBeInTheDocument();
  });
}

function registerBottomBarLocaleTests(): void {
  it('renders English locale labels and scenario names', () => {
    renderBottomBar({ locale: 'en', scenarioType: 'pneumonia' });

    expect(screen.getByText('Simulation time')).toBeInTheDocument();
    expect(screen.getByText('Adult / 65kg / male / intubated')).toBeInTheDocument();
    expect(screen.getAllByText('Pneumonia').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Simulation speed')).toBeInTheDocument();
  });
}

function registerBottomBarInvalidJumpTests(): void {
  it('does not jump when the parsed time is not finite', () => {
    const onJumpToTime = vi.fn();
    renderBottomBar({ onJumpToTime });
    const isFiniteSpy = vi.spyOn(Number, 'isFinite').mockReturnValue(false);

    fireEvent.change(screen.getByLabelText('특정 시간으로 점프'), {
      target: { value: String(JUMP_SECONDS) },
    });
    fireEvent.click(screen.getByRole('button', { name: '이동' }));

    expect(onJumpToTime).not.toHaveBeenCalled();
    isFiniteSpy.mockRestore();
  });
}

function renderBottomBar(overrides: Partial<BottomBarProps> = {}): void {
  render(
    <BottomBar
      elapsedSeconds={765}
      isPaused={false}
      onExportSnapshot={() => '{"version":1}'}
      onImportSnapshot={() => true}
      onJumpToTime={() => undefined}
      onPauseToggle={() => undefined}
      onReset={() => undefined}
      onRewind={() => undefined}
      onScenarioChange={() => undefined}
      onTimeScaleChange={() => undefined}
      scenarioType="normal"
      timeScale={1}
      {...overrides}
    />,
  );
}
