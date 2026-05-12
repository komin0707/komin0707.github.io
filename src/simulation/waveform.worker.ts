/// <reference lib="webworker" />

import { generateWaveform, toPolyline } from './waveformGenerator';
import type { WaveformWorkerRequest, WaveformWorkerResponse } from './waveformWorkerProtocol';

const scope = self as DedicatedWorkerGlobalScope;

function canUseOffscreenCanvas(): boolean {
  if (typeof OffscreenCanvas === 'undefined') return false;

  try {
    const canvas = new OffscreenCanvas(1, 1);
    return Boolean(canvas.getContext('2d'));
  } catch {
    return false;
  }
}

scope.addEventListener('message', (event: MessageEvent<WaveformWorkerRequest>) => {
  const { id, options } = event.data;
  const response: WaveformWorkerResponse = {
    id,
    offscreenCanvasSupported: canUseOffscreenCanvas(),
    polyline: toPolyline(generateWaveform(options)),
  };

  scope.postMessage(response);
});
