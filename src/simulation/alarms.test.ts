import { describe, expect, it } from 'vitest';
import { ALARM_PRECISION_MANIFEST, createAlarm } from './alarmDefinitions';
import { DEFAULT_ALARM_THRESHOLDS, calculateAlarms } from './alarms';
import type { DerivedVitals } from './ventilatorTypes';

const BASE_VITALS: DerivedVitals = {
  anionGap: 12,
  airwayResistance: 7,
  alveolarVentilation: 5.2,
  atelectraumaRisk: 0,
  autoPeep: 0,
  barotraumaRisk: 0,
  baseExcess: 0,
  biotraumaRisk: 0,
  cardiacOutput: 5,
  co2ResponsePercent: 60,
  co2RetentionPattern: 'normocapnia pattern',
  compliance: 40,
  deadSpaceFraction: 0.25,
  diffusionLimitationIndex: 0.1,
  deteriorationTrajectory: 0,
  drivingPressure: 12,
  drivingPressureSafe: true,
  dynamicCompliance: 34,
  etco2: 40,
  fio2: 40,
  frc: 2.4,
  hco3: 24,
  heartRate: 88,
  hemodynamicPeepPenalty: 0,
  diastolicBloodPressure: 72,
  intrathoracicPressure: 11,
  lactate: 1,
  leak: 0,
  lowerInflectionPoint: 5,
  lungProtectiveTidalVolume: 390,
  mandatoryTidalVolume: 460,
  mechanicalPower: 10.2,
  meanArterialPressure: 87,
  minuteVentilation: 7,
  negativeInspiratoryForce: -25,
  optimalPeep: 7,
  oxygenationResponsePercent: 70,
  oxygenationPattern: 'oxygenation preserved',
  paco2: 40,
  pao2: 95,
  pao2fio2: 237,
  peep: 5,
  permissiveHypercapnia: true,
  ph: 7.4,
  pip: 20,
  plateauSafe: true,
  plateau: 18,
  predictedBodyWeight: 65,
  pulmonaryVascularResistance: 140,
  resistance: 8,
  recoveryTrajectory: 0,
  rightVentricleAfterload: 1,
  rsbi: 35,
  settingResponseScore: 70,
  shuntFraction: 0.1,
  spo2: 96,
  spontaneousTidalVolume: 40,
  staticCompliance: 41,
  strain: 0.28,
  stressIndex: 1,
  systolicBloodPressure: 118,
  temperatureCelsius: 36.8,
  temporalVariation: 0,
  transpulmonaryStress: 6.7,
  totalRR: 16,
  upperInflectionPoint: 22,
  venousReturnIndex: 95,
  vitalCapacity: 3200,
  vqMismatchIndex: 0.25,
  vte: 500,
  volutraumaRisk: 0,
  viliRisk: 0,
};

describe('alarm branch coverage', () => {
  registerPrecisionManifestTests();
  registerPressureAndSystemSeverityTests();
  registerWarningSeverityTests();
  registerRepeatedAlarmPriorityTests();
});

function registerPrecisionManifestTests(): void {
  it('documents A.5 default alarm thresholds and alarm control features', () => {
    expect(ALARM_PRECISION_MANIFEST.thresholds.highPressureWarning).toMatchObject({
      adjustable: true,
      defaultValue: 35,
      unit: 'cmH2O',
    });
    expect(ALARM_PRECISION_MANIFEST.thresholds.lowPressure.defaultValue).toBe(5);
    expect(ALARM_PRECISION_MANIFEST.thresholds.highMinuteVentilation.defaultValue).toBe(15);
    expect(ALARM_PRECISION_MANIFEST.thresholds.lowMinuteVentilationCritical.defaultValue).toBe(3);
    expect(ALARM_PRECISION_MANIFEST.thresholds.apneaSeconds.defaultValue).toBe(20);
    expect(ALARM_PRECISION_MANIFEST.thresholds.tachypneaWarning.defaultValue).toBe(35);
    expect(ALARM_PRECISION_MANIFEST.thresholds.bradypneaRate.defaultValue).toBe(8);
    expect(ALARM_PRECISION_MANIFEST.thresholds.highFio2.defaultValue).toBe(80);
    expect(ALARM_PRECISION_MANIFEST.thresholds.lowFio2.defaultValue).toBe(30);
    expect(ALARM_PRECISION_MANIFEST.thresholds.highPeep.defaultValue).toBe(20);
    expect(ALARM_PRECISION_MANIFEST.thresholds.lowPeep.defaultValue).toBe(3);
    expect(ALARM_PRECISION_MANIFEST.thresholds.highAutoPeep.defaultValue).toBe(5);
    expect(ALARM_PRECISION_MANIFEST.thresholds.highLeak.defaultValue).toBe(15);
    expect(ALARM_PRECISION_MANIFEST.thresholds.lowSpo2Warning.defaultValue).toBe(92);
    expect(ALARM_PRECISION_MANIFEST.thresholds.lowSpo2Critical.defaultValue).toBe(88);
    expect(ALARM_PRECISION_MANIFEST.thresholds.lowEtco2.defaultValue).toBe(25);
    expect(ALARM_PRECISION_MANIFEST.thresholds.highEtco2.defaultValue).toBe(50);
    expect(ALARM_PRECISION_MANIFEST.thresholds.tachycardiaRate.defaultValue).toBe(120);
    expect(ALARM_PRECISION_MANIFEST.thresholds.bradycardiaRate.defaultValue).toBe(50);
    expect(ALARM_PRECISION_MANIFEST.thresholds.highSystolicBloodPressure).toMatchObject({
      defaultValue: 180,
      pairedWith: 110,
    });
    expect(ALARM_PRECISION_MANIFEST.thresholds.lowSystolicBloodPressure).toMatchObject({
      defaultValue: 90,
      pairedWith: 60,
    });
    expect(ALARM_PRECISION_MANIFEST.thresholds.highTemperatureCelsius.defaultValue).toBe(38.5);
    expect(ALARM_PRECISION_MANIFEST.thresholds.lowTemperatureCelsius.defaultValue).toBe(35);
    expect(ALARM_PRECISION_MANIFEST.thresholds.batteryPercent).toMatchObject({
      criticalValue: 5,
      defaultValue: 10,
    });

    expect(ALARM_PRECISION_MANIFEST.detection.circuitDisconnect).toContain('low pressure');
    expect(ALARM_PRECISION_MANIFEST.detection.circuitOcclusion).toContain('no-flow');
    expect(ALARM_PRECISION_MANIFEST.detection.gasSupply).toContain('gas');
    expect(ALARM_PRECISION_MANIFEST.detection.powerFailure).toContain('mains power');
    expect(ALARM_PRECISION_MANIFEST.detection.systemError).toContain('system error');
    expect(ALARM_PRECISION_MANIFEST.uiControls.annunciation).toEqual(['HIGH tone', 'MED tone', 'LOW tone']);
    expect(ALARM_PRECISION_MANIFEST.uiControls.muteOptionsSeconds).toEqual([60, 120]);
    expect(ALARM_PRECISION_MANIFEST.uiControls.thresholdLock).toContain('lock');
    expect(ALARM_PRECISION_MANIFEST.uiControls.passwordProtection).toContain('VENT');
    expect(ALARM_PRECISION_MANIFEST.uiControls.smartAlarm).toContain('smart alarm');
    expect(ALARM_PRECISION_MANIFEST.uiControls.patientProfiles).toEqual(['adult', 'ards', 'copd']);
    expect(ALARM_PRECISION_MANIFEST.uiControls.learningMode).toContain('learning');
    expect(ALARM_PRECISION_MANIFEST.uiControls.statistics).toContain('statistics');
    expect(ALARM_PRECISION_MANIFEST.uiControls.falseAlarmCounter).toContain('false alarm count');
    expect(ALARM_PRECISION_MANIFEST.uiControls.latencyMeasurement).toContain('latency seconds');
    expect(ALARM_PRECISION_MANIFEST.uiControls.confirmButton).toContain('confirm button');
  });
}

function registerPressureAndSystemSeverityTests(): void {
  it('classifies low pressure, low battery, and oxygen supply critical states', () => {
    const alarms = calculateAlarms(
      { ...BASE_VITALS, pip: 2, vte: 100 },
      {
        system: { batteryPercent: 5, oxygenSupplyPressure: 35 },
        thresholds: { ...DEFAULT_ALARM_THRESHOLDS, disconnectPressure: 3 },
      },
    );

    expect(alarms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'low-pressure', priority: 'high', severity: 'critical' }),
        expect.objectContaining({ id: 'low-battery', priority: 'high', severity: 'critical' }),
        expect.objectContaining({ id: 'oxygen-supply-low', priority: 'high', severity: 'critical' }),
      ]),
    );
  });
}

function registerWarningSeverityTests(): void {
  it('classifies low pressure, low battery, and oxygen supply warning states', () => {
    const alarms = calculateAlarms(
      { ...BASE_VITALS, pip: 4, vte: 300 },
      {
        system: { batteryPercent: 15, oxygenSupplyPressure: 40 },
        thresholds: { ...DEFAULT_ALARM_THRESHOLDS, batteryPercent: 20, oxygenSupplyPressure: 45 },
      },
    );

    expect(alarms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'low-pressure', priority: 'medium', severity: 'warning' }),
        expect.objectContaining({ id: 'low-battery', priority: 'low', severity: 'warning' }),
        expect.objectContaining({ id: 'oxygen-supply-low', priority: 'medium', severity: 'warning' }),
      ]),
    );
  });
}

function registerRepeatedAlarmPriorityTests(): void {
  it('escalates repeated low-priority alarms to medium priority', () => {
    const lowPriorityAlarm = createAlarm({
      category: 'ventilation',
      generatedAtSeconds: 1,
      id: 'low-co2',
      label: 'Low CO2',
      message: 'Low carbon dioxide',
      priority: 'low',
      repeatedAlarmIds: ['low-co2'],
      severity: 'warning',
      threshold: 30,
      unit: 'mmHg',
      value: 25,
    });
    const mediumPriorityAlarm = createAlarm({
      category: 'oxygenation',
      generatedAtSeconds: 2,
      id: 'low-spo2',
      label: 'Low SpO2',
      message: 'Low oxygen saturation',
      priority: 'medium',
      repeatedAlarmIds: ['low-spo2'],
      severity: 'warning',
      threshold: 90,
      unit: '%',
      value: 88,
    });

    expect(lowPriorityAlarm.priority).toBe('medium');
    expect(lowPriorityAlarm.severity).toBe('warning');
    expect(mediumPriorityAlarm.priority).toBe('high');
    expect(mediumPriorityAlarm.severity).toBe('critical');
  });
}
