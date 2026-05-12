import type { Scenario, VentSettings } from './scenarios';
import { clamp, type DerivedVitals } from './ventilatorModel';

/** Supported ventilator waveform traces rendered in the monitor panel. */
export type WaveformKind =
  | 'pressure'
  | 'flow'
  | 'volume'
  | 'co2'
  | 'ecg'
  | 'pleth'
  | 'ibp'
  | 'cvp'
  | 'pap'
  | 'eeg';
/** Single SVG polyline coordinate in waveform chart space. */
export type WaveformPoint = { x: number; y: number };

/** Inputs for generating one waveform polyline from current simulator state. */
export type WaveformOptions = {
  kind: WaveformKind;
  vitals: DerivedVitals;
  scenario: Scenario;
  settings: VentSettings;
  phase: number;
  paused: boolean;
  historyOffsetSeconds?: number;
  width?: number;
  height?: number;
  zoom?: number;
};

type CycleContext = {
  kind: WaveformKind;
  scenario: Scenario;
  settings: VentSettings;
  t: number;
  vitals: DerivedVitals;
};

type CyclePhase = {
  inspiration: boolean;
  inspirationRatio: number;
  obstruction: boolean;
  plateau: boolean;
  pressureRampEnd: number;
};

const normalize = (value: number, min: number, max: number, height: number) => {
  const ratio = 1 - clamp((value - min) / (max - min), 0, 1);
  return ratio * height;
};

function cycleValue(context: CycleContext) {
  const { kind, settings } = context;
  const phase = getCyclePhase(context);

  if (kind === 'co2') return co2Value(context, phase);
  if (kind === 'ecg') return ecgValue(context);
  if (kind === 'pleth') return plethValue(context);
  if (kind === 'ibp') return ibpValue(context);
  if (kind === 'cvp') return cvpValue(context);
  if (kind === 'pap') return papValue(context);
  if (kind === 'eeg') return eegValue(context);
  if (settings.mode === 'HFOV') return hfovValue(context);
  if (settings.mode === 'APRV') return aprvValue(context);
  if (settings.mode === 'BiPAP' || settings.mode === 'NIV') {
    const supportedValue = bipapValue(context, phase);
    if (supportedValue !== undefined) return supportedValue;
  }
  if (
    (settings.mode === 'SIMV' || settings.mode === 'ASV') &&
    kind === 'pressure' &&
    isSimvSpontaneousPressurePulse(context, phase)
  ) {
    return settings.peep + 5;
  }
  if (settings.mode === 'PRVC' && kind === 'pressure') return prvcPressureValue(context, phase);
  if (
    (settings.mode === 'VS' ||
      settings.mode === 'NAVA' ||
      settings.mode === 'PAV' ||
      settings.mode === 'SmartCare' ||
      settings.mode === 'IntelliVent') &&
    kind === 'pressure'
  ) {
    return proportionalSupportPressureValue(context, phase);
  }

  if (kind === 'pressure') return pressureValue(context, phase);
  if (kind === 'flow') return flowValue(context, phase);
  return volumeValue(context, phase);
}

function getCyclePhase({ scenario, settings, t }: CycleContext): CyclePhase {
  const inspirationRatio = Math.min(0.6, settings.inspiratoryTime / (60 / settings.respiratoryRate));
  const inspiration = t < inspirationRatio;
  const pressureRampEnd = inspirationRatio * 0.38;
  return {
    inspiration,
    inspirationRatio,
    obstruction: scenario.type === 'airwayObstruction',
    plateau: t >= pressureRampEnd && t < inspirationRatio,
    pressureRampEnd,
  };
}

function co2Value({ t, vitals }: CycleContext, phase: CyclePhase) {
  if (t < phase.inspirationRatio) return 0;
  const expiratoryPhase = expiratoryFraction(t, phase.inspirationRatio);
  if (expiratoryPhase < 0.16) return vitals.etco2 * (expiratoryPhase / 0.16) ** 1.8;
  if (expiratoryPhase < 0.78) return vitals.etco2 - 2 + expiratoryPhase * (phase.obstruction ? 8 : 2);
  return vitals.etco2 * Math.max(0, 1 - (expiratoryPhase - 0.78) / 0.22);
}

function plethValue({ t, vitals }: CycleContext) {
  const pulsePhase = (t * Math.max(0.6, vitals.heartRate / Math.max(1, vitals.totalRR))) % 1;
  const perfusion = clamp((vitals.spo2 - 82) / 18, 0.25, 1);
  const systolicRise = Math.exp(-(((pulsePhase - 0.18) / 0.08) ** 2));
  const dicroticNotch = Math.exp(-(((pulsePhase - 0.48) / 0.055) ** 2)) * 0.18;
  return 0.18 + perfusion * (0.72 * systolicRise + dicroticNotch);
}

function ecgValue({ scenario, t, vitals }: CycleContext) {
  const beatsPerRespiratoryCycle = Math.max(1, vitals.heartRate / Math.max(1, vitals.totalRR));
  const irregularOffset =
    scenario.type === 'cardiogenicShock'
      ? Math.sin(t * Math.PI * 9.7) * 0.09 + Math.sin(t * Math.PI * 3.1) * 0.04
      : 0;
  const pulsePhase = (((t * beatsPerRespiratoryCycle + irregularOffset) % 1) + 1) % 1;

  if (scenario.type === 'postCardiacArrest' && vitals.heartRate > 120) {
    return 0.45 + Math.sin(pulsePhase * Math.PI * 2) * 0.38 + Math.sin(pulsePhase * Math.PI * 4) * 0.12;
  }

  const pWave = Math.exp(-(((pulsePhase - 0.16) / 0.035) ** 2)) * 0.12;
  const qWave = Math.exp(-(((pulsePhase - 0.29) / 0.012) ** 2)) * -0.18;
  const rWave = Math.exp(-(((pulsePhase - 0.32) / 0.01) ** 2)) * 1.05;
  const sWave = Math.exp(-(((pulsePhase - 0.35) / 0.014) ** 2)) * -0.25;
  const tWave = Math.exp(-(((pulsePhase - 0.58) / 0.07) ** 2)) * 0.28;
  const fibrillatoryBaseline =
    scenario.type === 'cardiogenicShock' ? Math.sin(pulsePhase * Math.PI * 18) * 0.055 : 0;
  return 0.28 + pWave + qWave + rWave + sWave + tWave + fibrillatoryBaseline;
}

function ibpValue({ t, vitals }: CycleContext) {
  const pulsePhase = (t * Math.max(0.8, vitals.heartRate / Math.max(1, vitals.totalRR))) % 1;
  const pulsePressure = Math.max(20, vitals.systolicBloodPressure - vitals.diastolicBloodPressure);
  const upstroke = Math.exp(-(((pulsePhase - 0.14) / 0.055) ** 2));
  const runoff = Math.exp(-pulsePhase * 2.2);
  const notch = Math.exp(-(((pulsePhase - 0.42) / 0.035) ** 2)) * -5;
  return vitals.diastolicBloodPressure + pulsePressure * (0.18 * runoff + 0.82 * upstroke) + notch;
}

function cvpValue({ t, vitals }: CycleContext) {
  const respiratorySwing = Math.sin(t * Math.PI * 2) * 1.2;
  const venousWave = Math.sin(t * Math.PI * 6) * 0.8;
  return clamp(8 + (vitals.peep - 5) * 0.25 + respiratorySwing + venousWave, 2, 20);
}

function papValue({ t, vitals }: CycleContext) {
  const pulsePhase = (t * Math.max(0.8, vitals.heartRate / Math.max(1, vitals.totalRR))) % 1;
  const pulmonaryPressure = 18 + Math.max(0, 250 - vitals.pao2fio2) * 0.035 + vitals.peep * 0.25;
  return (
    pulmonaryPressure + Math.exp(-(((pulsePhase - 0.18) / 0.08) ** 2)) * 14 + Math.sin(t * Math.PI * 2) * 2
  );
}

function eegValue({ t, vitals }: CycleContext) {
  const encephalopathy = vitals.paco2 > 55 || vitals.spo2 < 88;
  const slowWave = Math.sin(t * Math.PI * 8) * (encephalopathy ? 0.55 : 0.25);
  const fastWave = Math.sin(t * Math.PI * 38) * (encephalopathy ? 0.12 : 0.3);
  return 0.5 + slowWave + fastWave;
}

function hfovValue({ kind, settings, t, vitals }: CycleContext) {
  const oscillation = Math.sin(t * Math.PI * 24);
  if (kind === 'pressure') return settings.peep + 12 + oscillation * 6;
  if (kind === 'flow') return oscillation * settings.flow * 0.55;
  return vitals.vte * 0.35 + Math.sin(t * Math.PI * 24 + Math.PI / 2) * vitals.vte * 0.08;
}

function aprvValue({ kind, settings, t, vitals }: CycleContext) {
  const highPressurePhase = t < 0.78;
  if (kind === 'pressure') return highPressurePhase ? settings.peep + 22 : settings.peep + 2;
  if (kind === 'flow') return highPressurePhase ? settings.flow * 0.18 : -settings.flow * 1.05;
  return highPressurePhase ? vitals.vte * 0.82 : vitals.vte * Math.exp(-((t - 0.78) / 0.22) * 4);
}

function bipapValue({ kind, settings }: CycleContext, phase: CyclePhase) {
  const pressureSupport = settings.mode === 'BiPAP' ? 12 : 8;
  if (kind === 'pressure') return phase.inspiration ? settings.peep + pressureSupport : settings.peep + 3;
  if (kind === 'flow') return phase.inspiration ? settings.flow * 0.62 : -settings.flow * 0.54;
  return undefined;
}

function isSimvSpontaneousPressurePulse({ t }: CycleContext, phase: CyclePhase) {
  return !phase.inspiration && t > 0.58 && t < 0.66;
}

function pressureValue({ settings, t, vitals }: CycleContext, phase: CyclePhase) {
  if (t < phase.pressureRampEnd) {
    return settings.peep + (vitals.pip - settings.peep) * (t / Math.max(phase.pressureRampEnd, 0.01));
  }
  if (phase.plateau) return vitals.plateau;
  const expPhase = expiratoryFraction(t, phase.inspirationRatio);
  return settings.peep + (vitals.plateau - settings.peep) * Math.exp(-expPhase * 5);
}

function prvcPressureValue({ settings, t, vitals }: CycleContext, phase: CyclePhase) {
  const regulatedPip = Math.min(vitals.pip, settings.peep + 24);
  if (t < phase.pressureRampEnd) {
    return settings.peep + (regulatedPip - settings.peep) * (t / Math.max(phase.pressureRampEnd, 0.01));
  }
  if (phase.plateau) return Math.min(vitals.plateau + 1, regulatedPip);
  const expPhase = expiratoryFraction(t, phase.inspirationRatio);
  return settings.peep + (regulatedPip - settings.peep) * Math.exp(-expPhase * 5.5);
}

function proportionalSupportPressureValue({ settings, t }: CycleContext, phase: CyclePhase) {
  const supportPressure =
    settings.mode === 'NAVA'
      ? 10
      : settings.mode === 'PAV'
        ? 8
        : settings.mode === 'SmartCare'
          ? 7
          : settings.mode === 'IntelliVent'
            ? 9
            : 6;
  if (!phase.inspiration) {
    const expPhase = expiratoryFraction(t, phase.inspirationRatio);
    return settings.peep + supportPressure * Math.exp(-expPhase * 7);
  }
  return settings.peep + supportPressure * Math.sin((t / Math.max(phase.inspirationRatio, 0.01)) * Math.PI);
}

function flowValue({ settings, t }: CycleContext, phase: CyclePhase) {
  if (phase.inspiration) return settings.flow;
  const expPhase = expiratoryFraction(t, phase.inspirationRatio);
  const obstructionFactor = phase.obstruction ? 1.8 : 1;
  return -settings.flow * 0.8 * Math.exp(-expPhase * (3 / obstructionFactor));
}

function volumeValue({ t, vitals }: CycleContext, phase: CyclePhase) {
  if (phase.inspiration) return vitals.vte * (t / Math.max(phase.inspirationRatio, 0.01));
  const expPhase = expiratoryFraction(t, phase.inspirationRatio);
  return vitals.vte * Math.exp(-expPhase * (phase.obstruction ? 2.4 : 3.5));
}

function expiratoryFraction(t: number, inspirationRatio: number) {
  return (t - inspirationRatio) / Math.max(1 - inspirationRatio, 0.01);
}

/** Generates sampled chart coordinates for the requested waveform kind. */
export function generateWaveform({
  kind,
  vitals,
  scenario,
  settings,
  phase,
  paused,
  historyOffsetSeconds = 0,
  width = 330,
  height = 88,
  zoom = 1,
}: WaveformOptions): WaveformPoint[] {
  const points: WaveformPoint[] = [];
  const breathPeriodSeconds = 60 / Math.max(1, settings.respiratoryRate);
  const offsetPhase = historyOffsetSeconds / breathPeriodSeconds;
  const effectivePhase = (paused ? Math.floor(phase * 10) / 10 : phase) - offsetPhase;
  const samples = 96;
  const visibleCycles = 31 * clamp(zoom, 1, 4);

  for (let i = 0; i < samples; i += 1) {
    const x = (i / (samples - 1)) * width;
    const t = (((i / visibleCycles + effectivePhase) % 1) + 1) % 1;
    const raw = cycleValue({ kind, scenario, settings, t, vitals });
    const y =
      kind === 'pressure'
        ? normalize(raw, -5, Math.max(45, vitals.pip + 8), height)
        : kind === 'flow'
          ? normalize(raw, -90, 90, height)
          : kind === 'volume'
            ? normalize(raw, 0, Math.max(800, vitals.vte + 220), height)
            : kind === 'co2'
              ? normalize(raw, 0, Math.max(60, vitals.etco2 + 16), height)
              : kind === 'ecg'
                ? normalize(raw, -0.35, 1.35, height)
                : kind === 'pleth'
                  ? normalize(raw, 0, 1.05, height)
                  : kind === 'ibp'
                    ? normalize(raw, 40, Math.max(190, vitals.systolicBloodPressure + 20), height)
                    : kind === 'cvp'
                      ? normalize(raw, 0, 24, height)
                      : kind === 'pap'
                        ? normalize(raw, 0, 70, height)
                        : normalize(raw, -0.3, 1.3, height);

    points.push({ x, y });
  }

  return points;
}

/** Converts sampled waveform points into an SVG polyline points attribute. */
export const toPolyline = (points: WaveformPoint[]) =>
  points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
