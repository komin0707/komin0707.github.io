import type { WaveformOptions } from './waveformGenerator';

export type WaveformWorkerRequest = {
  id: number;
  options: WaveformOptions;
};

export type WaveformWorkerResponse = {
  id: number;
  offscreenCanvasSupported: boolean;
  polyline: string;
};
