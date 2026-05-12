import { VENT_MODES, type VentMode, type VentSettings } from './scenarios';
import type { DerivedVitals } from './ventilatorModel';

/** Detailed educational description of a ventilator mode. */
export type ModeDetailProfile = {
  target: string;
  triggerAndCycle: string;
  controlSurface: readonly string[];
  safetyModel: readonly string[];
};

/** Clinical control and safety descriptions for every supported ventilator mode. */
export const VENTILATOR_MODE_DETAIL_MANIFEST: Record<VentMode, ModeDetailProfile> = {
  AC: {
    target: 'AC-VC volume target reaches the set tidal volume with mandatory assist-control breaths.',
    triggerAndCycle:
      'Patient or time trigger; volume delivery cycles after the set volume and inspiratory time.',
    controlSurface: ['tidal volume target', 'mandatory rate', 'set flow', 'PEEP', 'FiO2'],
    safetyModel: ['mode transition pressure check', 'apnea backup mode'],
  },
  APRV: {
    target:
      'APRV Airway Pressure Release Ventilation alternates P-high/P-low with long T-high and brief T-low.',
    triggerAndCycle:
      'Release cycling is controlled by T-high/T-low while spontaneous breathing can occur at P-high.',
    controlSurface: ['P-high', 'P-low', 'T-high', 'T-low', 'release flow monitoring'],
    safetyModel: ['inverse ratio ventilation check', 'pressure release safety check'],
  },
  ASV: {
    target:
      'ASV Adaptive Support Ventilation adapts mandatory and spontaneous support toward target minute ventilation.',
    triggerAndCycle: 'Automatic rate and pressure support selection preserves patient-triggered breaths.',
    controlSurface: [
      'target minute ventilation',
      'adaptive rate',
      'adaptive pressure support',
      'PEEP',
      'FiO2',
    ],
    safetyModel: ['automatic backup support', 'mode transition safety check'],
  },
  BiPAP: {
    target: 'BiPAP separates IPAP and EPAP and simulates NIV pressure support with leak tolerance.',
    triggerAndCycle:
      'Patient-triggered pressure support cycles between inspiratory and expiratory pressure levels.',
    controlSurface: ['IPAP', 'EPAP', 'NIV leak compensation', 'backup rate', 'rise time'],
    safetyModel: ['mask leak tolerance', 'apnea backup mode'],
  },
  CPAP: {
    target: 'CPAP maintains a single pressure level without mandatory volume delivery.',
    triggerAndCycle: 'Spontaneous breathing occurs on one continuous pressure baseline.',
    controlSurface: ['single CPAP pressure', 'FiO2', 'trigger sensitivity'],
    safetyModel: ['apnea backup mode', 'oxygenation safety check'],
  },
  HFOV: {
    target:
      'HFOV High Frequency Oscillation uses mean airway pressure, Hz frequency, amplitude delta P, and bias flow.',
    triggerAndCycle: 'Oscillator frequency drives very small tidal swings around the mean airway pressure.',
    controlSurface: [
      'Hz frequency setting',
      'amplitude delta P setting',
      'bias flow setting',
      'mean airway pressure',
    ],
    safetyModel: ['high mean airway pressure check', 'disconnect backup excluded for oscillator mode'],
  },
  IntelliVent: {
    target: 'IntelliVent automatically adapts oxygenation and ventilation targets.',
    triggerAndCycle: 'Closed-loop controller changes support while preserving spontaneous respiratory drive.',
    controlSurface: [
      'automatic ventilation target',
      'automatic oxygenation target',
      'ETCO2 target',
      'SpO2 target',
    ],
    safetyModel: ['closed-loop safety bounds', 'mode transition safety check'],
  },
  NAVA: {
    target:
      'NAVA Neurally Adjusted Ventilatory Assist scales pressure assistance to neural respiratory drive.',
    triggerAndCycle: 'Edi neural trigger and neural cycling follow patient effort.',
    controlSurface: ['NAVA level', 'Edi trigger', 'neural cycling', 'PEEP', 'FiO2'],
    safetyModel: ['neural signal fallback', 'apnea backup mode'],
  },
  NIV: {
    target: 'NIV delivers noninvasive pressure support with leak tolerance and mask compensation.',
    triggerAndCycle: 'Flow trigger and leak-adapted cycling support spontaneous noninvasive breaths.',
    controlSurface: [
      'IPAP equivalent support',
      'EPAP equivalent baseline',
      'leak compensation',
      'backup rate',
    ],
    safetyModel: ['mask leak tolerance', 'apnea backup mode'],
  },
  PAV: {
    target: 'PAV Proportional Assist Ventilation provides support proportional to patient effort.',
    triggerAndCycle: 'Patient effort determines assist level, timing, and cycling.',
    controlSurface: ['proportional assist percent', 'elastic unloading', 'resistive unloading', 'PEEP'],
    safetyModel: ['effort safety bounds', 'apnea backup mode'],
  },
  PC: {
    target: 'AC-PC pressure target reaches set inspiratory pressure rather than fixed tidal volume.',
    triggerAndCycle: 'Patient or time trigger; pressure-controlled breath cycles by inspiratory time.',
    controlSurface: ['pressure target', 'inspiratory time', 'mandatory rate', 'rise time', 'PEEP'],
    safetyModel: ['pressure limit check', 'mode transition safety check'],
  },
  PRVC: {
    target: 'PRVC Pressure Regulated Volume Control regulates inspiratory pressure to reach a volume target.',
    triggerAndCycle: 'Pressure is adjusted breath-to-breath while preserving volume-targeted ventilation.',
    controlSurface: ['tidal volume target', 'regulated inspiratory pressure', 'pressure limit', 'PEEP'],
    safetyModel: ['pressure regulation safety check', 'apnea backup mode'],
  },
  PSV: {
    target: 'PSV provides pressure support only with no mandatory rate.',
    triggerAndCycle: 'Patient-determined I-time with cycle off at 25% peak flow.',
    controlSurface: ['pressure support', 'flow trigger', 'cycle threshold', 'rise time', 'PEEP'],
    safetyModel: ['apnea backup mode', 'low drive safety check'],
  },
  SIMV: {
    target: 'SIMV-VC and SIMV-PC preserve spontaneous breath activity between mandatory breaths.',
    triggerAndCycle: 'Mandatory breaths follow set rate while spontaneous breaths use patient triggering.',
    controlSurface: [
      'SIMV-VC volume target',
      'SIMV-PC pressure target',
      'spontaneous breath preservation',
      'pressure support',
    ],
    safetyModel: ['mandatory-spontaneous synchrony check', 'apnea backup mode'],
  },
  SmartCare: {
    target: 'SmartCare/PS automatically weans pressure support.',
    triggerAndCycle: 'Closed-loop pressure support changes while patient-triggered cycling remains active.',
    controlSurface: [
      'automatic weaning',
      'pressure support bounds',
      'respiratory rate target',
      'ETCO2 guardrail',
    ],
    safetyModel: ['weaning safety bounds', 'apnea backup mode'],
  },
  VC: {
    target: 'VC delivers a fixed volume target using set flow.',
    triggerAndCycle: 'Time or assist trigger with volume-controlled cycling.',
    controlSurface: ['tidal volume target', 'set flow', 'mandatory rate', 'PEEP'],
    safetyModel: ['plateau pressure check', 'mode transition safety check'],
  },
  VS: {
    target: 'VS Volume Support targets tidal volume with spontaneous pressure support.',
    triggerAndCycle:
      'Patient-triggered spontaneous breaths are pressure adjusted to a volume support target.',
    controlSurface: ['volume support target', 'adaptive pressure support', 'cycle threshold', 'rise time'],
    safetyModel: ['pressure support safety bounds', 'apnea backup mode'],
  },
};

/** Adjunct controls exposed around the ventilator mode surface. */
export const VENTILATOR_ADJUNCT_CONTROL_MANIFEST = [
  'Sigh breath recruitment breath',
  'Auto-flow enable disable',
  'Rise time setting',
  'Trigger sensitivity flow vs pressure',
  'Cycle threshold adjustment',
  'Inspiratory hold measures Pplat',
  'Expiratory hold measures PEEPi',
  'Manual breath button',
  'Suction mode alarm suppression',
  'Nebulizer mode',
  'Standby mode',
  '100% O2 two minute button',
  'Pre-oxygenation mode',
] as const;

/** Safety assessment shown after ventilator mode transitions. */
export type ModeSafetyState = {
  apneaBackupActive: boolean;
  apneaDetected: boolean;
  autoBackupMode: VentMode | null;
  inverseRatioVentilation: boolean;
  adjunctControlSummary: readonly string[];
  modeControlSummary: readonly string[];
  modeDetail: string;
  modeTransitionTrigger: string;
  safetyWarning: string;
};

/** Applies conservative starting settings for a newly selected ventilator mode. */
export function applyModeDefaults(current: VentSettings, mode: VentMode): VentSettings {
  const modeDefaults: Partial<Record<VentMode, Partial<VentSettings>>> = {
    AC: { flow: 50, inspiratoryTime: 1, peep: 5, respiratoryRate: 16, tidalVolume: 500 },
    APRV: { inspiratoryTime: 2.4, peep: 12, respiratoryRate: 10, tidalVolume: 420 },
    CPAP: { inspiratoryTime: 1.2, peep: 8, respiratoryRate: 8, tidalVolume: 320 },
    HFOV: { flow: 80, inspiratoryTime: 0.33, peep: 14, respiratoryRate: 30, tidalVolume: 120 },
    ASV: { flow: 50, inspiratoryTime: 1, peep: 6, respiratoryRate: 14, tidalVolume: 420 },
    BiPAP: { flow: 55, inspiratoryTime: 0.9, peep: 6, respiratoryRate: 12, tidalVolume: 380 },
    IntelliVent: { flow: 50, inspiratoryTime: 1, peep: 8, respiratoryRate: 14, tidalVolume: 420 },
    NAVA: { flow: 45, inspiratoryTime: 0.8, peep: 6, respiratoryRate: 8, tidalVolume: 360 },
    NIV: { flow: 55, peep: 6, respiratoryRate: 14, tidalVolume: 380 },
    PAV: { flow: 45, inspiratoryTime: 0.8, peep: 6, respiratoryRate: 8, tidalVolume: 360 },
    PC: { flow: 50, inspiratoryTime: 1, peep: 5, respiratoryRate: 16, tidalVolume: 500 },
    PRVC: { flow: 50, inspiratoryTime: 1, peep: 5, respiratoryRate: 16, tidalVolume: 450 },
    PSV: { flow: 45, inspiratoryTime: 0.8, respiratoryRate: 10, tidalVolume: 360 },
    SIMV: { respiratoryRate: 12, tidalVolume: 450 },
    SmartCare: { flow: 45, inspiratoryTime: 0.8, peep: 5, respiratoryRate: 8, tidalVolume: 360 },
    VC: { flow: 50, inspiratoryTime: 1, peep: 5, respiratoryRate: 16, tidalVolume: 500 },
    VS: { flow: 45, inspiratoryTime: 0.8, peep: 5, respiratoryRate: 8, tidalVolume: 380 },
  };

  return {
    ...current,
    ...modeDefaults[mode],
    mode,
  };
}

/** Evaluates apnea backup, inverse-ratio risk, and pressure warnings for the active mode. */
export function calculateModeSafety(settings: VentSettings, vitals: DerivedVitals): ModeSafetyState {
  const breathCycleSeconds = 60 / Math.max(1, settings.respiratoryRate);
  const expiratoryTime = breathCycleSeconds - settings.inspiratoryTime;
  const apneaDetected = settings.respiratoryRate <= 4 || vitals.totalRR <= 4;
  const inverseRatioVentilation = settings.inspiratoryTime >= expiratoryTime;
  const pressureWarning =
    vitals.pip > 40
      ? 'Critical pressure during mode transition'
      : vitals.pip > 32
        ? 'Check pressure after mode transition'
        : '';
  const apneaBackupActive = apneaDetected && settings.mode !== 'HFOV';

  return {
    apneaBackupActive,
    apneaDetected,
    adjunctControlSummary: VENTILATOR_ADJUNCT_CONTROL_MANIFEST,
    autoBackupMode: apneaBackupActive ? 'SIMV' : null,
    inverseRatioVentilation,
    modeControlSummary: getModeControlSummary(settings.mode),
    modeDetail: getModeDetail(settings.mode),
    modeTransitionTrigger: `${settings.mode} trigger ${settings.trigger.toFixed(1)} L/min`,
    safetyWarning: inverseRatioVentilation
      ? 'Inverse ratio ventilation active'
      : pressureWarning || 'Mode transition safety check passed',
  };
}

function getModeDetail(mode: VentMode) {
  const details: Record<VentMode, string> = {
    AC: 'AC-VC delivers mandatory volume-targeted breaths.',
    APRV: 'APRV uses P-high/P-low with long T-high and brief release.',
    ASV: 'ASV adapts mandatory/spontaneous support toward target minute ventilation.',
    BiPAP: 'BiPAP separates IPAP and EPAP for NIV-style pressure support.',
    CPAP: 'CPAP maintains a single continuous airway pressure.',
    HFOV: 'HFOV uses high frequency, amplitude delta-P, and bias flow.',
    IntelliVent: 'IntelliVent adapts oxygenation and ventilation targets automatically.',
    NAVA: 'NAVA scales assist to patient neural respiratory drive.',
    NIV: 'NIV delivers noninvasive pressure support with leak tolerance.',
    PAV: 'PAV provides proportional assist based on patient effort.',
    PC: 'AC-PC targets inspiratory pressure rather than tidal volume.',
    PRVC: 'PRVC regulates inspiratory pressure to reach a volume target.',
    PSV: 'PSV is patient-triggered pressure support with patient-determined I-time and 25% peak-flow cycling.',
    SIMV: 'SIMV preserves spontaneous breaths between mandatory breaths.',
    SmartCare: 'SmartCare/PS automatically weans pressure support.',
    VC: 'VC delivers a fixed volume target with set flow.',
    VS: 'Volume Support targets tidal volume with spontaneous pressure support.',
  };

  return details[mode];
}

function getModeControlSummary(mode: VentMode) {
  const profile = VENTILATOR_MODE_DETAIL_MANIFEST[mode];
  return [profile.target, profile.triggerAndCycle, ...profile.controlSurface, ...profile.safetyModel];
}

/** Verifies that every supported ventilator mode has detail and safety copy. */
export function assertVentilatorModeDetailCoverage() {
  return VENT_MODES.every((mode) => {
    const profile = VENTILATOR_MODE_DETAIL_MANIFEST[mode];
    return Boolean(
      profile?.target &&
      profile.triggerAndCycle &&
      profile.controlSurface.length &&
      profile.safetyModel.length,
    );
  });
}
