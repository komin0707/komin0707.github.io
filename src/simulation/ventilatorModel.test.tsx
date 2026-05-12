import { expect, expectTypeOf, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SCENARIOS,
  VENT_MODES,
  type Scenario,
  type ScenarioType,
  type VentMode,
  type VentSettings,
} from './scenarios';
import { isScenarioType, isVentMode } from './typeGuards';
import {
  calculateAlarms,
  calculateDerivedVitals,
  calculateSimulation,
  calculateVitals,
  buildVisualState,
  DEFAULT_ALARM_THRESHOLDS,
  describeState,
  getConditionLabel,
  getConditionMessage,
  getPatientCondition,
  mapVitalsToVisualState,
  sortAlarmsByPriority,
  type Alarm,
  type AlarmThresholds,
  type DerivedVitals,
  type PatientCondition,
  type PatientVisualState,
  type SimulationState,
} from './ventilatorModel';
import { clamp, finiteOr } from './ventilatorMath';

const simulate = (settings: Partial<VentSettings> = {}, scenario = SCENARIOS.pneumonia) =>
  calculateSimulation({ ...DEFAULT_SETTINGS, ...settings }, scenario);
const ventModes: readonly VentMode[] = VENT_MODES;
const scenarioTypes = Object.keys(SCENARIOS) as ScenarioType[];
const patientConditions: PatientCondition[] = ['stable', 'watch', 'worsening', 'critical'];
const expectedAlarmIds = new Set([
  'apnea',
  'bradypnea',
  'circuit-occlusion',
  'disconnect',
  'high-co2',
  'high-etco2',
  'high-fio2',
  'high-leak',
  'high-mv',
  'high-peep',
  'high-pip',
  'high-rr',
  'low-battery',
  'low-co2',
  'low-compliance',
  'low-etco2',
  'low-fio2',
  'low-mv',
  'low-peep',
  'low-pressure',
  'low-spo2',
  'auto-peep',
  'gas-supply-low',
  'oxygen-supply-low',
  'power-failure',
  'system-error',
  'bradycardia',
  'hyperthermia',
  'hypertension',
  'hypotension',
  'hypothermia',
  'tachycardia',
]);

it('calculates bounded vitals for every supported ventilator mode', () => {
  for (const mode of ventModes) {
    const vitals = calculateVitals({ ...DEFAULT_SETTINGS, mode }, SCENARIOS.normal);

    expect(vitals.spo2).toBeGreaterThanOrEqual(65);
    expect(vitals.spo2).toBeLessThanOrEqual(99);
    expect(vitals.pip).toBeGreaterThan(0);
    expect(vitals.vte).toBeGreaterThan(0);
    expect(vitals.minuteVentilation).toBeGreaterThan(0);
  }
});

it('calculates scenario-specific vitals for every scenario', () => {
  for (const scenarioType of scenarioTypes) {
    const scenario = SCENARIOS[scenarioType];
    const vitals = calculateVitals(DEFAULT_SETTINGS, scenario);

    expect(scenario.type).toBe(scenarioType);
    expect(vitals.compliance).toBeLessThanOrEqual(scenario.baselineCompliance + 20);
    expect(vitals.resistance).toBeGreaterThanOrEqual(scenario.baselineResistance);
    expect(vitals.frc).toBeGreaterThanOrEqual(650);
  }
});

it('clamps boundary and invalid ventilator setting inputs', () => {
  const peepLow = calculateVitals({ ...DEFAULT_SETTINGS, peep: 0 }, SCENARIOS.normal);
  const peepHigh = calculateVitals({ ...DEFAULT_SETTINGS, peep: 25 }, SCENARIOS.normal);
  const lowVt = calculateVitals({ ...DEFAULT_SETTINGS, tidalVolume: 200 }, SCENARIOS.normal);
  const highVt = calculateVitals({ ...DEFAULT_SETTINGS, tidalVolume: 1200 }, SCENARIOS.normal);
  const lowRr = calculateVitals({ ...DEFAULT_SETTINGS, respiratoryRate: 4 }, SCENARIOS.normal);
  const highRr = calculateVitals({ ...DEFAULT_SETTINGS, respiratoryRate: 100 }, SCENARIOS.normal);
  const lowFio2 = calculateVitals({ ...DEFAULT_SETTINGS, fio2: 21 }, SCENARIOS.normal);
  const highFio2 = calculateVitals({ ...DEFAULT_SETTINGS, fio2: 100 }, SCENARIOS.normal);
  const invalid = calculateVitals(
    {
      ...DEFAULT_SETTINGS,
      fio2: Number.NaN,
      flow: Number.POSITIVE_INFINITY,
      peep: -10,
      respiratoryRate: -4,
      tidalVolume: -200,
    },
    SCENARIOS.normal,
  );

  expect(peepLow.peep).toBe(0);
  expect(peepHigh.peep).toBe(24);
  expect(lowVt.vte).toBeLessThan(highVt.vte);
  expect(lowRr.totalRR).toBeLessThan(highRr.totalRR);
  expect(lowFio2.spo2).toBeLessThanOrEqual(highFio2.spo2);
  expect(invalid.peep).toBe(0);
  expect(invalid.vte).toBeGreaterThan(0);
  expect(invalid.totalRR).toBeGreaterThanOrEqual(4);
  expect(invalid.spo2).toBeGreaterThanOrEqual(65);
});

it('raises oxygenation and clears low SpO2 alarm when FiO2 is increased', () => {
  const baseline = simulate({ fio2: 40 });
  const improved = simulate({ fio2: 80 });

  expect(improved.vitals.spo2).toBeGreaterThan(baseline.vitals.spo2);
  expect(improved.alarms.some((alarm) => alarm.id === 'low-spo2')).toBe(false);
  expect(improved.visualState.condition).not.toBe(baseline.visualState.condition);
});

it('improves oxygenation with moderate PEEP but raises PIP when PEEP is excessive', () => {
  const moderate = simulate({ peep: 10 });
  const excessive = simulate({ peep: 18 });

  expect(moderate.vitals.spo2).toBeGreaterThanOrEqual(simulate({ peep: 5 }).vitals.spo2);
  expect(excessive.vitals.pip).toBeGreaterThan(moderate.vitals.pip);
  expect(excessive.alarms.some((alarm) => alarm.id === 'high-pip')).toBe(true);
});

it('raises PaCO2 when tidal volume and respiratory rate are reduced', () => {
  const baseline = simulate({ tidalVolume: 500, respiratoryRate: 16 });
  const lowVentilation = simulate({ tidalVolume: 200, respiratoryRate: 6 });

  expect(lowVentilation.vitals.minuteVentilation).toBeLessThan(baseline.vitals.minuteVentilation);
  expect(lowVentilation.vitals.paco2).toBeGreaterThan(baseline.vitals.paco2);
  expect(lowVentilation.alarms.some((alarm) => alarm.id === 'high-co2')).toBe(true);
  expect(lowVentilation.visualState.expression).toBe('critical');
});

it('models timed physiologic trajectories and ventilator injury risks', () => {
  const protectiveSettings = {
    ...DEFAULT_SETTINGS,
    fio2: 100,
    peep: 8,
    tidalVolume: 360,
    respiratoryRate: 24,
  };
  const unsafeSettings = { ...DEFAULT_SETTINGS, fio2: 30, peep: 2, tidalVolume: 900, respiratoryRate: 6 };
  const early = calculateSimulation(protectiveSettings, SCENARIOS.normal, undefined, { elapsedSeconds: 0 });
  const later = calculateSimulation(protectiveSettings, SCENARIOS.normal, undefined, { elapsedSeconds: 900 });
  const unsafe = calculateSimulation(unsafeSettings, SCENARIOS.ards, undefined, { elapsedSeconds: 900 });
  const excessivePeep = calculateSimulation({ ...protectiveSettings, peep: 18 }, SCENARIOS.ards, undefined, {
    elapsedSeconds: 900,
  });

  expect(later.vitals.temporalVariation).not.toBe(early.vitals.temporalVariation);
  expect(later.vitals.recoveryTrajectory).toBeGreaterThanOrEqual(early.vitals.recoveryTrajectory);
  expect(later.vitals.spo2).toBeGreaterThanOrEqual(early.vitals.spo2);
  expect(later.vitals.paco2).toBeLessThanOrEqual(early.vitals.paco2);
  expect(unsafe.vitals.deteriorationTrajectory).toBeGreaterThan(later.vitals.deteriorationTrajectory);
  expect(unsafe.vitals.volutraumaRisk).toBeGreaterThan(later.vitals.volutraumaRisk);
  expect(unsafe.vitals.atelectraumaRisk).toBeGreaterThan(later.vitals.atelectraumaRisk);
  expect(unsafe.vitals.viliRisk).toBeGreaterThan(later.vitals.viliRisk);
  expect(unsafe.vitals.biotraumaRisk).toBeGreaterThan(0);
  expect(excessivePeep.vitals.hemodynamicPeepPenalty).toBeGreaterThan(later.vitals.hemodynamicPeepPenalty);
  expect(excessivePeep.vitals.meanArterialPressure).toBeLessThan(later.vitals.meanArterialPressure);
  expect(excessivePeep.vitals.venousReturnIndex).toBeLessThan(later.vitals.venousReturnIndex);
  expect(excessivePeep.vitals.cardiacOutput).toBeLessThan(later.vitals.cardiacOutput);
  expect(unsafe.vitals.rightVentricleAfterload).toBeGreaterThan(later.vitals.rightVentricleAfterload);
  expect(unsafe.vitals.pulmonaryVascularResistance).toBeGreaterThan(later.vitals.pulmonaryVascularResistance);
  expect(unsafe.vitals.vqMismatchIndex).toBeGreaterThan(later.vitals.vqMismatchIndex);
  expect(unsafe.vitals.shuntFraction).toBeGreaterThanOrEqual(later.vitals.shuntFraction);
  expect(unsafe.vitals.deadSpaceFraction).toBeGreaterThanOrEqual(later.vitals.deadSpaceFraction);
  expect(unsafe.vitals.diffusionLimitationIndex).toBeGreaterThanOrEqual(
    later.vitals.diffusionLimitationIndex,
  );
  expect(unsafe.vitals.co2RetentionPattern).toContain('retention');
  expect(unsafe.vitals.oxygenationPattern).toMatch(/hypoxemia|failure|impairment/);
  expect(later.vitals.oxygenationResponsePercent).toBeGreaterThan(
    early.vitals.oxygenationResponsePercent - 1,
  );
  expect(later.vitals.co2ResponsePercent).toBeGreaterThan(0);
  expect(later.vitals.settingResponseScore).toBeGreaterThan(unsafe.vitals.settingResponseScore);
});

it('keeps moderate hypercapnia drowsy before critical physiology is reached', () => {
  const moderateHypercapnia = simulate({ tidalVolume: 450, respiratoryRate: 10 }, SCENARIOS.normal);

  expect(moderateHypercapnia.condition).toBe('watch');
  expect(moderateHypercapnia.vitals.paco2).toBeGreaterThan(55);
  expect(moderateHypercapnia.visualState.expression).toBe('drowsy');
});

it('models airway obstruction with high resistance and high peak pressure', () => {
  const obstruction = simulate({}, SCENARIOS.airwayObstruction);

  expect(obstruction.vitals.resistance).toBeGreaterThan(30);
  expect(obstruction.vitals.pip).toBeGreaterThan(32);
  expect(obstruction.visualState.tubePressureWarning).toBe(true);
});

it('models ARDS with low compliance and lung stiffness alarms', () => {
  const ards = simulate({}, SCENARIOS.ards);

  expect(ards.vitals.compliance).toBeLessThan(25);
  expect(ards.visualState.lungColor).toBe('stiff');
  expect(ards.alarms.some((alarm) => alarm.id === 'low-compliance')).toBe(true);
});

it('calculates pulmonary mechanics, protective ventilation, and weaning readiness metrics', () => {
  const baseline = simulate({}, SCENARIOS.normal);
  const pressureLimited = simulate({ peep: 20, tidalVolume: 1000, flow: 100 }, SCENARIOS.ards);
  const obstruction = simulate({}, SCENARIOS.airwayObstruction);
  const pressureSupport = simulate({ mode: 'PSV' }, SCENARIOS.normal);

  expect(baseline.vitals.staticCompliance).toBeCloseTo(
    baseline.vitals.vte / baseline.vitals.drivingPressure,
    0,
  );
  expect(baseline.vitals.dynamicCompliance).toBeLessThanOrEqual(baseline.vitals.staticCompliance);
  expect(baseline.vitals.airwayResistance).toBeGreaterThan(0);
  expect(baseline.vitals.mechanicalPower).toBeGreaterThan(0);
  expect(baseline.vitals.optimalPeep).toBe(baseline.vitals.lowerInflectionPoint + 2);
  expect(baseline.vitals.upperInflectionPoint).toBeGreaterThan(baseline.vitals.lowerInflectionPoint);
  expect(baseline.vitals.frc).toBeGreaterThan(0);
  expect(baseline.vitals.deadSpaceFraction).toBeGreaterThan(0);
  expect(baseline.vitals.alveolarVentilation).toBeLessThan(baseline.vitals.minuteVentilation);
  expect(baseline.vitals.negativeInspiratoryForce).toBeLessThan(0);
  expect(baseline.vitals.vitalCapacity).toBeGreaterThan(baseline.vitals.vte);
  expect(baseline.vitals.transpulmonaryStress).toBeGreaterThan(0);
  expect(baseline.vitals.strain).toBeGreaterThan(0);
  expect(baseline.vitals.lungProtectiveTidalVolume).toBe(baseline.vitals.predictedBodyWeight * 6);
  expect(baseline.vitals.plateauSafe).toBe(baseline.vitals.plateau < 30);
  expect(baseline.vitals.drivingPressureSafe).toBe(baseline.vitals.drivingPressure < 15);
  expect(baseline.vitals.permissiveHypercapnia).toBe(true);
  expect(obstruction.vitals.autoPeep).toBeGreaterThan(baseline.vitals.autoPeep);
  expect(pressureSupport.vitals.spontaneousTidalVolume).toBeGreaterThan(
    pressureSupport.vitals.mandatoryTidalVolume,
  );
  expect(pressureSupport.vitals.rsbi).toBeLessThan(105);
  expect(pressureLimited.vitals.plateauSafe).toBe(false);
  expect(pressureLimited.vitals.drivingPressureSafe).toBe(false);
});

it('escalates severe ARDS physiology to a distinct critical visual state', () => {
  const severeArds = simulate({ peep: 20, tidalVolume: 1000, flow: 100 }, SCENARIOS.ards);

  expect(severeArds.condition).toBe('critical');
  expect(severeArds.vitals.pip).toBeGreaterThan(40);
  expect(severeArds.visualState.expression).toBe('critical');
  expect(severeArds.visualState.skinTone).toBe('severelyCyanotic');
  expect(severeArds.visualState.lipColor).toBe('deepBlue');
});

it('does not mark a well-saturated normal patient critical just because FiO2 is high', () => {
  const normalHighOxygen = simulate({ fio2: 100 }, SCENARIOS.normal);

  expect(normalHighOxygen.vitals.spo2).toBe(99);
  expect(normalHighOxygen.vitals.pao2fio2).toBeLessThan(120);
  expect(normalHighOxygen.condition).toBe('stable');
  expect(normalHighOxygen.visualState.expression).toBe('calm');
});

it('models pneumothorax with asymmetric chest motion and scenario-specific message', () => {
  const pneumothorax = simulate({}, SCENARIOS.pneumothorax);
  const rightPneumothorax = simulate(
    {},
    {
      ...SCENARIOS.pneumothorax,
      oneSideChestMotionReduced: false,
      reducedChestMotionSide: 'right',
    },
  );
  const legacyScenario = { ...SCENARIOS.pneumothorax };
  delete legacyScenario.reducedChestMotionSide;
  const legacyAsymmetry = simulate({}, legacyScenario);

  expect(pneumothorax.visualState.leftChestReduced).toBe(true);
  expect(pneumothorax.visualState.rightChestReduced).toBe(false);
  expect(rightPneumothorax.visualState.leftChestReduced).toBe(false);
  expect(rightPneumothorax.visualState.rightChestReduced).toBe(true);
  expect(legacyAsymmetry.visualState.leftChestReduced).toBe(true);
  expect(legacyAsymmetry.visualState.rightChestReduced).toBe(false);
  expect(pneumothorax.visualState.lungColor).toBe('collapsed');
  expect(pneumothorax.description).toContain('한쪽 흉곽 움직임 감소');
  expect(pneumothorax.vitals.frc).toBe(SCENARIOS.pneumothorax.frc);
});

it('lets mode, inspiratory time, and trigger affect derived values', () => {
  const baseline = simulate();
  const cpap = simulate({ mode: 'CPAP' });
  const bipap = simulate({ mode: 'BiPAP' });
  const simv = simulate({ mode: 'SIMV' });
  const aprv = simulate({ mode: 'APRV' });
  const hfov = simulate({ mode: 'HFOV' });
  const niv = simulate({ mode: 'NIV' });
  const shortInspiratoryTime = simulate({ inspiratoryTime: 0.2 });
  const highTrigger = simulate({ trigger: 15 });

  expect(cpap.vitals.vte).toBeLessThan(baseline.vitals.vte);
  expect(bipap.vitals.vte).toBeLessThan(baseline.vitals.vte);
  expect(simv.vitals.vte).toBeLessThan(baseline.vitals.vte);
  expect(aprv.vitals.pip).toBeGreaterThan(baseline.vitals.pip);
  expect(hfov.vitals.vte).toBeLessThan(cpap.vitals.vte);
  expect(niv.vitals.vte).toBeLessThan(baseline.vitals.vte);
  expect(shortInspiratoryTime.vitals.pip).toBeGreaterThan(baseline.vitals.pip);
  expect(highTrigger.vitals.totalRR).toBeGreaterThan(baseline.vitals.totalRR);
});

it('supports advanced ventilator modes for PRVC, volume support, adaptive, and proportional assist ventilation', () => {
  const advancedModes: readonly VentMode[] = ['PRVC', 'VS', 'ASV', 'NAVA', 'PAV', 'SmartCare', 'IntelliVent'];

  for (const mode of advancedModes) {
    const simulation = simulate({ mode }, SCENARIOS.normal);

    expect(simulation.vitals.vte).toBeGreaterThan(0);
    expect(simulation.vitals.pip).toBeGreaterThan(simulation.vitals.peep);
    expect(simulation.vitals.totalRR).toBeGreaterThanOrEqual(4);
  }

  expect(simulate({ mode: 'NAVA' }, SCENARIOS.normal).vitals.spontaneousTidalVolume).toBeGreaterThan(
    simulate({ mode: 'PRVC' }, SCENARIOS.normal).vitals.spontaneousTidalVolume,
  );
  expect(simulate({ mode: 'SmartCare' }, SCENARIOS.normal).vitals.rsbi).toBeLessThan(105);
});

it('covers alarm severity boundaries and math fallbacks', () => {
  const baselineVitals = simulate({}, SCENARIOS.normal).vitals;
  const alarms = calculateAlarms({
    ...baselineVitals,
    spo2: 81,
    pip: 41,
    totalRR: 35,
    compliance: 17,
    paco2: 71,
    minuteVentilation: 2.9,
  });

  expect(alarms.every((alarm) => alarm.severity === 'critical')).toBe(true);
  expect(clamp(30, 0, 20)).toBe(20);
  expect(clamp(-5, 0, 20)).toBe(0);
  expect(clamp(10, 0, 20)).toBe(10);
  expect(finiteOr(Number.NaN, 7)).toBe(7);
  expect(finiteOr(Number.POSITIVE_INFINITY, 7)).toBe(7);
  expect(finiteOr(Number.NEGATIVE_INFINITY, 7)).toBe(7);
  expect(finiteOr(4, 7)).toBe(4);

  expect(
    calculateAlarms({
      ...baselineVitals,
      minuteVentilation: 3.5,
    }),
  ).toContainEqual(expect.objectContaining({ id: 'low-mv', severity: 'warning' }));
});

it('covers alarm priority, custom thresholds, mode thresholds, and precision alarm types', () => {
  const baselineVitals = simulate({}, SCENARIOS.normal).vitals;

  expectAllAlarmTypes(baselineVitals);
  expectAlarmThresholdOverrides(baselineVitals);
});

it('maps every patient condition to visual state, labels, chest motion, and lung mapping', () => {
  const baselineVitals = simulate({}, SCENARIOS.normal).vitals;

  expectPatientConditionVisualStates(baselineVitals);
  expectAdditionalVisualStateMappings(baselineVitals);
});

it('describes every scenario and condition label accurately', () => {
  for (const scenarioType of scenarioTypes) {
    const scenario = SCENARIOS[scenarioType];
    const simulation = calculateSimulation(DEFAULT_SETTINGS, scenario);
    const message = describeState(simulation.vitals, scenario, simulation.condition);

    expect(message.length).toBeGreaterThan(10);
    expect(getConditionMessage(simulation.vitals, scenario, simulation.condition)).toBe(message);
  }

  expect(patientConditions.map((condition) => getConditionLabel(condition))).toEqual([
    '안정',
    '주의',
    '악화',
    '위중',
  ]);
  expect(
    describeState({ ...simulate({}, SCENARIOS.normal).vitals, spo2: 85 }, SCENARIOS.normal, 'worsening'),
  ).toContain('저산소혈증');
});

it('recognizes every valid scenario and ventilator mode string', () => {
  for (const mode of ventModes) expect(isVentMode(mode)).toBe(true);
  for (const scenarioType of scenarioTypes) expect(isScenarioType(scenarioType)).toBe(true);
  expect(isVentMode('invalid')).toBe(false);
  expect(isScenarioType('invalid')).toBe(false);
});

it('keeps scenario objects, default settings, public exports, and model types complete', () => {
  expectScenarioAndSettingsContracts();
  expectPublicModelExportsAndTypes();
});

function expectAllAlarmTypes(baselineVitals: DerivedVitals): void {
  const alarmIds = new Set<string>();

  [
    calculateAlarms({
      ...baselineVitals,
      autoPeep: 6,
      compliance: 17,
      etco2: 51,
      fio2: 90,
      heartRate: 125,
      leak: 16,
      minuteVentilation: 2.8,
      paco2: 71,
      peep: 21,
      pip: 45,
      resistance: 35,
      spo2: 81,
      systolicBloodPressure: 181,
      temperatureCelsius: 38.6,
      totalRR: 35,
    }),
    calculateAlarms({
      ...baselineVitals,
      etco2: 24,
      fio2: 25,
      minuteVentilation: 16,
      peep: 2,
      diastolicBloodPressure: 58,
      heartRate: 48,
      temperatureCelsius: 34.8,
    }),
    calculateAlarms({
      ...baselineVitals,
      paco2: 29,
      pip: 4,
      totalRR: 4,
      vte: 120,
    }),
    calculateAlarms(
      {
        ...baselineVitals,
        totalRR: 7,
      },
      {
        system: {
          batteryPercent: 9,
          circuitConnected: false,
          gasSupplyPressure: 30,
          mainsPowerAvailable: false,
          oxygenSupplyPressure: 30,
          systemError: true,
        },
      },
    ),
  ].forEach((alarms) => alarms.forEach((alarm) => alarmIds.add(alarm.id)));

  expect(alarmIds).toEqual(expectedAlarmIds);
}

function expectAlarmThresholdOverrides(baselineVitals: DerivedVitals): void {
  const customSpo2Threshold = calculateAlarms(
    { ...baselineVitals, spo2: 89 },
    { thresholds: { lowSpo2Warning: 88 } },
  );
  expect(customSpo2Threshold.some((alarm) => alarm.id === 'low-spo2')).toBe(false);

  const hfovAlarms = calculateAlarms(
    { ...baselineVitals, pip: DEFAULT_ALARM_THRESHOLDS.highPressureWarning + 4 },
    { mode: 'HFOV' },
  );
  expect(hfovAlarms.some((alarm) => alarm.id === 'high-pip')).toBe(false);

  const repeated = calculateAlarms({ ...baselineVitals, paco2: 29 }, { repeatedAlarmIds: ['low-co2'] });
  expect(repeated).toContainEqual(expect.objectContaining({ id: 'low-co2', priority: 'medium' }));
  expect(repeated[0]?.priority).toBe('medium');
}

function expectPatientConditionVisualStates(baselineVitals: DerivedVitals): void {
  for (const item of createVisualStateCases(baselineVitals)) {
    const visualState = buildVisualState(item.vitals, SCENARIOS.normal);

    expect(getPatientCondition(item.vitals)).toBe(item.condition);
    expect(getConditionLabel(item.condition)).toBeTruthy();
    expect(visualState.condition).toBe(item.condition);
    expect(visualState.expression).toBe(item.expectedExpression);
    expect(visualState.skinTone).toBe(item.expectedSkinTone);
    expect(visualState.lipColor).toBe(item.expectedLipColor);
    expect(visualState.chestMotionAmplitude).toBeGreaterThan(0);
    expect(visualState.chestMotionSpeed).toBeGreaterThan(0);
  }
}

function createVisualStateCases(baselineVitals: DerivedVitals): Array<{
  condition: PatientCondition;
  vitals: DerivedVitals;
  expectedExpression: PatientVisualState['expression'];
  expectedLipColor: PatientVisualState['lipColor'];
  expectedSkinTone: PatientVisualState['skinTone'];
}> {
  return [
    {
      condition: 'stable',
      expectedExpression: 'calm',
      expectedLipColor: 'normal',
      expectedSkinTone: 'normal',
      vitals: { ...baselineVitals, paco2: 40, pip: 20, spo2: 96 },
    },
    {
      condition: 'watch',
      expectedExpression: 'strained',
      expectedLipColor: 'normal',
      expectedSkinTone: 'pale',
      vitals: { ...baselineVitals, paco2: 49, pip: 28, spo2: 93 },
    },
    {
      condition: 'worsening',
      expectedExpression: 'distressed',
      expectedLipColor: 'blue',
      expectedSkinTone: 'cyanotic',
      vitals: { ...baselineVitals, paco2: 50, pip: 33, spo2: 86 },
    },
    {
      condition: 'critical',
      expectedExpression: 'critical',
      expectedLipColor: 'deepBlue',
      expectedSkinTone: 'severelyCyanotic',
      vitals: { ...baselineVitals, paco2: 70, pip: 41, spo2: 81 },
    },
  ];
}

function expectAdditionalVisualStateMappings(baselineVitals: DerivedVitals): void {
  expect(
    buildVisualState({ ...baselineVitals, paco2: 56, pip: 28, spo2: 92 }, SCENARIOS.normal).expression,
  ).toBe('drowsy');
  expect(buildVisualState({ ...baselineVitals, compliance: 20 }, SCENARIOS.ards).lungColor).toBe('stiff');
  expect(buildVisualState(baselineVitals, SCENARIOS.pneumothorax).lungColor).toBe('collapsed');
}

function expectScenarioAndSettingsContracts(): void {
  expect(Object.keys(SCENARIOS).sort()).toEqual([...scenarioTypes].sort());
  expect(DEFAULT_SETTINGS).toMatchObject({
    fio2: 40,
    flow: 50,
    inspiratoryTime: 1,
    mode: 'AC',
    peep: 5,
    respiratoryRate: 16,
    tidalVolume: 500,
    trigger: 2,
  });
  for (const scenario of Object.values(SCENARIOS)) {
    expect(scenario).toEqual(
      expect.objectContaining<Partial<Scenario>>({
        description: expect.any(String) as string,
        frc: expect.any(Number) as number,
        koreanLabel: expect.any(String) as string,
        label: expect.any(String) as string,
        type: expect.any(String) as ScenarioType,
      }),
    );
  }
}

function expectPublicModelExportsAndTypes(): void {
  const simulation = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal);
  const sorted = sortAlarmsByPriority([
    {
      category: 'system',
      generatedAtSeconds: 0,
      id: 'low',
      isLikelyFalseAlarm: false,
      label: 'Low',
      message: 'low',
      priority: 'low',
      severity: 'warning',
      threshold: 1,
      unit: '%',
      value: 1,
    },
  ]);

  expect(calculateDerivedVitals(DEFAULT_SETTINGS, SCENARIOS.normal)).toEqual(
    calculateVitals(DEFAULT_SETTINGS, SCENARIOS.normal),
  );
  expect(mapVitalsToVisualState(simulation.vitals, SCENARIOS.normal)).toEqual(
    buildVisualState(simulation.vitals, SCENARIOS.normal),
  );
  expect(sorted[0]?.id).toBe('low');
  expectTypeOf(simulation.vitals).toMatchTypeOf<DerivedVitals>();
  expectTypeOf(simulation.visualState).toMatchTypeOf<PatientVisualState>();
  expectTypeOf(simulation.condition).toMatchTypeOf<PatientCondition>();
  expectTypeOf(simulation.alarms[0]).toMatchTypeOf<Alarm | undefined>();
  expectTypeOf(DEFAULT_ALARM_THRESHOLDS).toMatchTypeOf<AlarmThresholds>();
  expectTypeOf(simulation).toMatchTypeOf<SimulationState>();
}
