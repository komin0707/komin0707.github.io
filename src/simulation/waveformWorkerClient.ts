import WaveformWorker from './waveform.worker?worker';
import { generateWaveform, toPolyline, type WaveformOptions } from './waveformGenerator';
import type { WaveformWorkerRequest, WaveformWorkerResponse } from './waveformWorkerProtocol';

type ResolvePolyline = (polyline: string) => void;

let nextRequestId = 0;
let worker: Worker | null = null;
const pendingRequests = new Map<number, ResolvePolyline>();

function calculateWaveformPolyline(options: WaveformOptions): string {
  return toPolyline(generateWaveform(options));
}

function resolvePendingRequest({ id, polyline }: WaveformWorkerResponse) {
  const resolve = pendingRequests.get(id);
  if (!resolve) return;

  pendingRequests.delete(id);
  resolve(polyline);
}

function resolveAllPendingWithFallback() {
  pendingRequests.forEach((resolve) => resolve(''));
  pendingRequests.clear();
  worker?.terminate();
  worker = null;
}

/** Terminates the waveform worker and resolves pending waveform requests with fallbacks. */
export function terminateWaveformWorker(): void {
  resolveAllPendingWithFallback();
}

function getWaveformWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (worker) return worker;

  try {
    worker = new WaveformWorker();
    worker.addEventListener('message', (event: MessageEvent<WaveformWorkerResponse>) => {
      resolvePendingRequest(event.data);
    });
    worker.addEventListener('error', resolveAllPendingWithFallback);
  } catch {
    worker = null;
  }

  return worker;
}

/** Returns a synchronous waveform polyline for the first render before worker response. */
export function getInitialWaveformPolyline(options: WaveformOptions): string {
  return calculateWaveformPolyline(options);
}

/** Requests worker-backed waveform generation with a synchronous fallback. */
export function requestWaveformPolyline(options: WaveformOptions): Promise<string> {
  const activeWorker = getWaveformWorker();
  if (!activeWorker) return Promise.resolve(calculateWaveformPolyline(options));

  const id = (nextRequestId += 1);
  const message: WaveformWorkerRequest = { id, options };

  return new Promise((resolve) => {
    pendingRequests.set(id, (polyline) => {
      resolve(polyline || calculateWaveformPolyline(options));
    });

    try {
      activeWorker.postMessage(message);
    } catch {
      pendingRequests.delete(id);
      resolve(calculateWaveformPolyline(options));
    }
  });
}
