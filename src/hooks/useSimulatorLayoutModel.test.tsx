import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { SimulationProvider } from '@/context';
import { useSimulatorLayoutModel } from './useSimulatorLayoutModel';

function LayoutModelProbe(): ReactElement {
  const model = useSimulatorLayoutModel();
  return <output>{model.state.paused ? 'paused' : 'running'}</output>;
}

describe('useSimulatorLayoutModel', () => {
  it('keeps the simulator running when visibility changes while visible', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    render(
      <SimulationProvider>
        <LayoutModelProbe />
      </SimulationProvider>,
    );

    void act(() => document.dispatchEvent(new Event('visibilitychange')));

    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('pauses the simulator when the document becomes hidden', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    render(
      <SimulationProvider>
        <LayoutModelProbe />
      </SimulationProvider>,
    );

    void act(() => document.dispatchEvent(new Event('visibilitychange')));

    expect(screen.getByText('paused')).toBeInTheDocument();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });

  it('pauses and marks lifecycle events for pagehide, freeze, beforeunload, and resume', () => {
    render(
      <SimulationProvider>
        <LayoutModelProbe />
      </SimulationProvider>,
    );

    void act(() => window.dispatchEvent(new Event('pagehide')));
    expect(screen.getByText('paused')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-page-lifecycle', 'pagehide');

    void act(() => document.dispatchEvent(new Event('resume')));
    expect(document.documentElement).toHaveAttribute('data-page-lifecycle', 'resume');

    void act(() => document.dispatchEvent(new Event('freeze')));
    expect(document.documentElement).toHaveAttribute('data-page-lifecycle', 'freeze');

    void act(() => window.dispatchEvent(new Event('beforeunload')));
    expect(document.documentElement).toHaveAttribute('data-page-lifecycle', 'beforeunload');
  });
});
