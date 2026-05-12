import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS, VENT_MODES } from './scenarios';
import {
  VENTILATOR_ADJUNCT_CONTROL_MANIFEST,
  VENTILATOR_MODE_DETAIL_MANIFEST,
  applyModeDefaults,
  assertVentilatorModeDetailCoverage,
  calculateModeSafety,
} from './modeSafety';
import { calculateSimulation } from './ventilatorModel';

describe('mode safety', () => {
  it('applies mode-specific parameter defaults', () => {
    expect(applyModeDefaults(DEFAULT_SETTINGS, 'HFOV')).toMatchObject({
      flow: 80,
      inspiratoryTime: 0.33,
      mode: 'HFOV',
      peep: 14,
      respiratoryRate: 30,
      tidalVolume: 120,
    });
    expect(applyModeDefaults(DEFAULT_SETTINGS, 'SIMV')).toMatchObject({
      mode: 'SIMV',
      respiratoryRate: 12,
      tidalVolume: 450,
    });
    expect(applyModeDefaults(DEFAULT_SETTINGS, 'PRVC')).toMatchObject({
      mode: 'PRVC',
      tidalVolume: 450,
    });
    expect(applyModeDefaults(DEFAULT_SETTINGS, 'BiPAP')).toMatchObject({
      flow: 55,
      mode: 'BiPAP',
      peep: 6,
      respiratoryRate: 12,
      tidalVolume: 380,
    });
    expect(applyModeDefaults(DEFAULT_SETTINGS, 'SmartCare')).toMatchObject({
      mode: 'SmartCare',
      respiratoryRate: 8,
    });
  });

  it('detects mode transition warnings, apnea backup, automatic backup, and IRV', () => {
    const apneaSettings = { ...DEFAULT_SETTINGS, inspiratoryTime: 12, respiratoryRate: 4 };
    const simulation = calculateSimulation(apneaSettings, SCENARIOS.ards);
    const safety = calculateModeSafety(apneaSettings, simulation.vitals);

    expect(safety.apneaDetected).toBe(true);
    expect(safety.apneaBackupActive).toBe(true);
    expect(safety.autoBackupMode).toBe('SIMV');
    expect(safety.inverseRatioVentilation).toBe(true);
    expect(safety.modeTransitionTrigger).toContain('trigger');
    expect(safety.modeDetail).toContain('volume');
    expect(safety.modeControlSummary.join(' ')).toContain('volume target');
    expect(safety.adjunctControlSummary.join(' ')).toContain('Manual breath');
    expect(safety.safetyWarning).toContain('Inverse ratio');
  });

  it('describes advanced ventilator mode details', () => {
    expect(
      calculateModeSafety(
        { ...DEFAULT_SETTINGS, mode: 'PRVC' },
        calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal).vitals,
      ).modeDetail,
    ).toContain('volume target');
    expect(
      calculateModeSafety(
        { ...DEFAULT_SETTINGS, mode: 'NAVA' },
        calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal).vitals,
      ).modeDetail,
    ).toContain('neural');
    expect(
      calculateModeSafety(
        { ...DEFAULT_SETTINGS, mode: 'PAV' },
        calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal).vitals,
      ).modeDetail,
    ).toContain('proportional');
    expect(
      calculateModeSafety(
        { ...DEFAULT_SETTINGS, mode: 'IntelliVent' },
        calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal).vitals,
      ).modeDetail,
    ).toContain('automatically');
  });

  it('covers A.4 ventilator mode targets, cycling, safety, and adjunct controls', () => {
    expect(assertVentilatorModeDetailCoverage()).toBe(true);
    expect(Object.keys(VENTILATOR_MODE_DETAIL_MANIFEST).sort()).toEqual([...VENT_MODES].sort());

    const searchableModeDetails = Object.values(VENTILATOR_MODE_DETAIL_MANIFEST)
      .flatMap((profile) => [
        profile.target,
        profile.triggerAndCycle,
        ...profile.controlSurface,
        ...profile.safetyModel,
      ])
      .join(' ');
    const searchableAdjuncts = VENTILATOR_ADJUNCT_CONTROL_MANIFEST.join(' ');

    expect(searchableModeDetails).toContain('AC-VC volume target');
    expect(searchableModeDetails).toContain('AC-PC pressure target');
    expect(searchableModeDetails).toContain('SIMV-VC');
    expect(searchableModeDetails).toContain('SIMV-PC');
    expect(searchableModeDetails).toContain('pressure support only with no mandatory rate');
    expect(searchableModeDetails).toContain('Patient-determined I-time');
    expect(searchableModeDetails).toContain('25% peak flow');
    expect(searchableModeDetails).toContain('single pressure');
    expect(searchableModeDetails).toContain('IPAP and EPAP');
    expect(searchableModeDetails).toContain('NIV pressure support with leak tolerance');
    expect(searchableModeDetails).toContain('APRV Airway Pressure Release Ventilation');
    expect(searchableModeDetails).toContain('P-high/P-low');
    expect(searchableModeDetails).toContain('T-high');
    expect(searchableModeDetails).toContain('T-low');
    expect(searchableModeDetails).toContain('HFOV High Frequency Oscillation');
    expect(searchableModeDetails).toContain('Hz frequency');
    expect(searchableModeDetails).toContain('amplitude delta P');
    expect(searchableModeDetails).toContain('bias flow');
    expect(searchableModeDetails).toContain('PRVC Pressure Regulated Volume Control');
    expect(searchableModeDetails).toContain('VS Volume Support');
    expect(searchableModeDetails).toContain('ASV Adaptive Support Ventilation');
    expect(searchableModeDetails).toContain('NAVA Neurally Adjusted Ventilatory Assist');
    expect(searchableModeDetails).toContain('PAV Proportional Assist Ventilation');
    expect(searchableModeDetails).toContain('SmartCare/PS automatically weans');
    expect(searchableModeDetails).toContain('IntelliVent automatically');
    expect(searchableModeDetails).toContain('mode transition safety check');
    expect(searchableModeDetails).toContain('apnea backup mode');

    expect(searchableAdjuncts).toContain('Sigh breath');
    expect(searchableAdjuncts).toContain('Auto-flow enable disable');
    expect(searchableAdjuncts).toContain('Rise time setting');
    expect(searchableAdjuncts).toContain('Trigger sensitivity flow vs pressure');
    expect(searchableAdjuncts).toContain('Cycle threshold adjustment');
    expect(searchableAdjuncts).toContain('Inspiratory hold measures Pplat');
    expect(searchableAdjuncts).toContain('Expiratory hold measures PEEPi');
    expect(searchableAdjuncts).toContain('Manual breath button');
    expect(searchableAdjuncts).toContain('Suction mode alarm suppression');
    expect(searchableAdjuncts).toContain('Nebulizer mode');
    expect(searchableAdjuncts).toContain('Standby mode');
    expect(searchableAdjuncts).toContain('100% O2 two minute button');
    expect(searchableAdjuncts).toContain('Pre-oxygenation mode');
  });

  it('classifies critical transition pressure warnings', () => {
    const safety = calculateModeSafety(DEFAULT_SETTINGS, {
      ...calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal).vitals,
      pip: 45,
    });

    expect(safety.safetyWarning).toBe('Critical pressure during mode transition');
    expect(safety.autoBackupMode).toBeNull();
  });
});
