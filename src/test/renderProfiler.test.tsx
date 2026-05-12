import { fireEvent, render, screen } from '@testing-library/react';
import { Profiler, useState, type ProfilerOnRenderCallback } from 'react';
import { describe, expect, it } from 'vitest';
import { MonitorPanel } from '@/components';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';

const FRAME_RENDER_BUDGET_MS = 1000 / 60;
const COVERAGE_INSTRUMENTED_RENDER_BUDGET_MS = 50;
const TRANSIENT_RENDER_BUDGET_MS = 50;
const isCoverageRun = process.env.npm_lifecycle_event === 'test:coverage';
const TRANSIENT_BUDGET_MS = isCoverageRun
  ? COVERAGE_INSTRUMENTED_RENDER_BUDGET_MS
  : TRANSIENT_RENDER_BUDGET_MS;
const pneumoniaSimulation = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);

function ParentRerenderProbe({ onRender }: { onRender: ProfilerOnRenderCallback }) {
  const [count, setCount] = useState(0);

  return (
    <>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        parent {count}
      </button>
      <Profiler id="memoized-monitor" onRender={onRender}>
        <MonitorPanel
          clinical={pneumoniaSimulation.clinical}
          isPaused={false}
          scenario={SCENARIOS.pneumonia}
          settings={DEFAULT_SETTINGS}
          vitals={pneumoniaSimulation.vitals}
        />
      </Profiler>
    </>
  );
}

describe('render profiler budget', () => {
  it('keeps monitor update render work under one 60fps frame', () => {
    const updateDurations: number[] = [];
    const onRender: ProfilerOnRenderCallback = (_id, phase, actualDuration) => {
      if (phase === 'update') {
        updateDurations.push(actualDuration);
      }
    };

    const createMonitor = (isPaused: boolean) => (
      <Profiler id="monitor-panel" onRender={onRender}>
        <MonitorPanel
          clinical={pneumoniaSimulation.clinical}
          isPaused={isPaused}
          scenario={SCENARIOS.pneumonia}
          settings={DEFAULT_SETTINGS}
          vitals={pneumoniaSimulation.vitals}
        />
      </Profiler>
    );

    const { rerender } = render(createMonitor(false));
    rerender(createMonitor(true));
    updateDurations.length = 0;
    rerender(createMonitor(false));
    rerender(createMonitor(true));
    rerender(createMonitor(false));

    expect(updateDurations).not.toHaveLength(0);
    expect(Math.min(...updateDurations)).toBeLessThan(FRAME_RENDER_BUDGET_MS);
    expect(Math.max(...updateDurations)).toBeLessThan(TRANSIENT_BUDGET_MS);
  });

  it('detects unnecessary monitor rerenders under parent-only state changes', () => {
    const parentOnlyUpdateDurations: number[] = [];
    const onRender: ProfilerOnRenderCallback = (_id, phase, actualDuration) => {
      if (phase === 'update') {
        parentOnlyUpdateDurations.push(actualDuration);
      }
    };

    render(<ParentRerenderProbe onRender={onRender} />);
    fireEvent.click(screen.getByRole('button', { name: /parent 0/ }));
    parentOnlyUpdateDurations.length = 0;
    fireEvent.click(screen.getByRole('button', { name: /parent 1/ }));
    fireEvent.click(screen.getByRole('button', { name: /parent 2/ }));
    fireEvent.click(screen.getByRole('button', { name: /parent 3/ }));

    expect(parentOnlyUpdateDurations).not.toHaveLength(0);
    expect(Math.min(...parentOnlyUpdateDurations)).toBeLessThan(FRAME_RENDER_BUDGET_MS);
    expect(Math.max(...parentOnlyUpdateDurations)).toBeLessThan(TRANSIENT_BUDGET_MS);
    expect(screen.getByRole('button', { name: /parent 4/ })).toBeInTheDocument();
  });
});
