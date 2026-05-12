import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/simulation/scenarios';
import { SIMULATION_SNAPSHOT_VERSION } from '@/simulation/simulationSnapshot';
import { SimulationProvider } from './SimulationContext';
import { useSimulationContext } from './useSimulationContext';

function ContextConsumer(): ReactElement {
  const {
    exportSnapshot,
    importSnapshot,
    jumpToTime,
    rewindTime,
    scenarioType,
    setTimeScale,
    settings,
    simulation,
    timeScale,
  } = useSimulationContext();
  return (
    <div>
      <span>{scenarioType}</span>
      <span>{settings.fio2}</span>
      <span>{simulation.condition}</span>
      <span>{timeScale}x</span>
      <button type="button" onClick={() => setTimeScale(5)}>
        speed
      </button>
      <button type="button" onClick={() => jumpToTime(900)}>
        jump
      </button>
      <button type="button" onClick={() => rewindTime(30)}>
        rewind
      </button>
      <SnapshotImportButton importSnapshot={importSnapshot} />
      <button type="button" onClick={() => importSnapshot('{')}>
        invalid import
      </button>
      <output>{exportSnapshot()}</output>
    </div>
  );
}

function SnapshotImportButton({
  importSnapshot,
}: {
  importSnapshot: ReturnType<typeof useSimulationContext>['importSnapshot'];
}): ReactElement {
  return (
    <button
      type="button"
      onClick={() =>
        importSnapshot(
          JSON.stringify({
            elapsedSeconds: 123,
            paused: true,
            scenarioType: 'normal',
            settings: { ...DEFAULT_SETTINGS, fio2: 100 },
            timeScale: 10,
            version: SIMULATION_SNAPSHOT_VERSION,
          }),
        )
      }
    >
      import
    </button>
  );
}

function MissingProviderConsumer(): null {
  useSimulationContext();
  return null;
}

describe('SimulationContext', () => {
  it('provides simulation state to descendants', () => {
    render(
      <SimulationProvider>
        <ContextConsumer />
      </SimulationProvider>,
    );

    expect(screen.getByText('pneumonia')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('worsening')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
  });

  it('updates time controls and imports serialized simulation state', () => {
    render(
      <SimulationProvider>
        <ContextConsumer />
      </SimulationProvider>,
    );

    act(() => screen.getByRole('button', { name: 'speed' }).click());
    expect(screen.getByText('5x')).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'import' }).click());
    expect(screen.getByText('normal')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('10x')).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'invalid import' }).click());
    expect(screen.getByText('normal')).toBeInTheDocument();
    expect(screen.getByText('10x')).toBeInTheDocument();
  });

  it('throws when the simulation hook is used outside the provider', () => {
    expect(() => render(<MissingProviderConsumer />)).toThrow(
      'useSimulationContext must be used inside SimulationProvider',
    );
  });
});
