import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS } from './scenarios';
import { calculateSimulation } from './ventilatorModel';
import type { WaveformOptions } from './waveformGenerator';

type Mode = 'constructThrow' | 'pending' | 'respond' | 'throw';
type Request = { id: number; options: unknown };
type Response = { id: number; offscreenCanvasSupported: boolean; polyline: string };
type MessageListener = (event: MessageEvent<Response>) => void;
type ErrorListener = (event: Event) => void;

function isMessageEvent(event: Event): event is MessageEvent<Response> {
  return event instanceof MessageEvent;
}

const workerState = vi.hoisted(() => {
  class MockWaveformWorker {
    readonly messageListeners: MessageListener[] = [];
    readonly errorListeners: ErrorListener[] = [];
    readonly postMessage = vi.fn((message: Request) => {
      if (state.mode === 'throw') throw new Error('worker unavailable');
      if (state.mode === 'pending') return;

      this.emitMessage({ id: message.id, offscreenCanvasSupported: true, polyline: 'worker-polyline' });
    });
    readonly terminate = vi.fn();

    constructor() {
      if (state.mode === 'constructThrow') throw new Error('worker constructor unavailable');
      state.instances.push(this);
    }

    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
      const callback =
        typeof listener === 'function' ? listener : (event: Event) => listener.handleEvent(event);

      if (type === 'message') {
        this.messageListeners.push((event) => {
          if (isMessageEvent(event)) callback(event);
        });
      }
      if (type === 'error') {
        this.errorListeners.push(callback);
      }
    }

    emitMessage(response: Response): void {
      const event = new MessageEvent<Response>('message', { data: response });
      this.messageListeners.forEach((listener) => listener(event));
    }

    emitError(): void {
      const event = new Event('error');
      this.errorListeners.forEach((listener) => listener(event));
    }
  }

  const state = {
    instances: [] as MockWaveformWorker[],
    mode: 'respond' as Mode,
    MockWaveformWorker,
  };

  return state;
});

vi.mock('./waveform.worker?worker', () => ({
  default: workerState.MockWaveformWorker,
}));

function buildWaveformOptions(): WaveformOptions {
  const { vitals } = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal);
  return {
    kind: 'pressure',
    paused: false,
    phase: 0.25,
    scenario: SCENARIOS.normal,
    settings: DEFAULT_SETTINGS,
    vitals,
  };
}

describe('waveform worker client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('Worker', class WorkerPresence {});
    workerState.instances.length = 0;
    workerState.mode = 'respond';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  registerWorkerSuccessTests();
  registerWorkerFallbackTests();
});

function registerWorkerSuccessTests(): void {
  it('uses a Web Worker when available', async () => {
    const { requestWaveformPolyline } = await import('./waveformWorkerClient');

    await expect(requestWaveformPolyline(buildWaveformOptions())).resolves.toBe('worker-polyline');
    await expect(requestWaveformPolyline(buildWaveformOptions())).resolves.toBe('worker-polyline');
    expect(workerState.instances).toHaveLength(1);
    expect(workerState.instances[0]?.postMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(workerState.instances[0]?.postMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });
}

function registerWorkerFallbackTests(): void {
  it('falls back to synchronous waveform generation when Worker is unavailable', async () => {
    vi.stubGlobal('Worker', undefined);
    const { requestWaveformPolyline } = await import('./waveformWorkerClient');

    const polyline = await requestWaveformPolyline(buildWaveformOptions());

    expect(polyline).toContain(',');
    expect(workerState.instances).toHaveLength(0);
  });

  it('falls back when worker postMessage throws', async () => {
    workerState.mode = 'throw';
    const { requestWaveformPolyline } = await import('./waveformWorkerClient');

    const polyline = await requestWaveformPolyline(buildWaveformOptions());

    expect(polyline).toContain(',');
    expect(workerState.instances[0]?.postMessage).toHaveBeenCalled();
  });

  it('falls back when worker construction throws', async () => {
    workerState.mode = 'constructThrow';
    const { requestWaveformPolyline } = await import('./waveformWorkerClient');

    const polyline = await requestWaveformPolyline(buildWaveformOptions());

    expect(polyline).toContain(',');
    expect(workerState.instances).toHaveLength(0);
  });

  it('falls back and clears pending requests when the worker errors', async () => {
    workerState.mode = 'pending';
    const { requestWaveformPolyline } = await import('./waveformWorkerClient');

    const pendingPolyline = requestWaveformPolyline(buildWaveformOptions());
    workerState.instances[0]?.emitMessage({
      id: 999,
      offscreenCanvasSupported: false,
      polyline: 'ignored',
    });
    workerState.instances[0]?.emitError();

    await expect(pendingPolyline).resolves.toContain(',');
    expect(workerState.instances[0]?.terminate).toHaveBeenCalled();
  });
}
