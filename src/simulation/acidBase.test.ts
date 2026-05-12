import { describe, expect, it } from 'vitest';
import {
  buildAcidBaseAssessment,
  calculateAnionGap,
  calculateBaseExcess,
  calculateHendersonHasselbalchPh,
  calculateWintersExpectedPaco2Range,
  classifyBaseExcess,
  classifyHco3,
  classifyLactate,
  classifyPaco2,
  classifyPao2,
  classifyPfRatio,
  classifyPh,
} from './acidBase';
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
  etco2: 35,
  fio2: 40,
  frc: 1800,
  hco3: 24,
  heartRate: 88,
  hemodynamicPeepPenalty: 0,
  diastolicBloodPressure: 72,
  intrathoracicPressure: 11,
  lactate: 1.1,
  leak: 2,
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

describe('acid-base assessment', () => {
  it('classifies ABGA threshold ranges used by the clinical monitor', () => {
    expect(classifyPh(7.19)).toBe('severe acidemia (pH < 7.20)');
    expect(classifyPh(7.28)).toBe('mild acidosis (pH 7.20-7.35)');
    expect(classifyPh(7.4)).toBe('normal range (pH 7.35-7.45)');
    expect(classifyPh(7.48)).toBe('alkalemia (pH > 7.45)');

    expect(classifyPaco2(30)).toBe('hypocapnia (PaCO2 < 35 mmHg)');
    expect(classifyPaco2(40)).toBe('normal range (PaCO2 35-45 mmHg)');
    expect(classifyPaco2(55)).toBe('mild hypercapnia (PaCO2 46-60 mmHg)');
    expect(classifyPaco2(70)).toBe('severe hypercapnia (PaCO2 > 60 mmHg), CO2 narcosis risk');

    expect(classifyPao2(55)).toBe('Type I respiratory failure range (PaO2 < 60 mmHg)');
    expect(classifyPao2(70)).toBe('mild hypoxemia (PaO2 60-80 mmHg)');
    expect(classifyPao2(90)).toBe('normal range (PaO2 80-100 mmHg)');
    expect(classifyHco3(24)).toBe('normal range (HCO3 22-26 mEq/L)');
    expect(classifyBaseExcess(-4)).toBe('metabolic base deficit');
    expect(classifyLactate(3.2)).toBe('elevated lactate, tissue perfusion risk');

    expect(classifyPfRatio(80)).toContain('severe ARDS');
    expect(classifyPfRatio(160)).toContain('P/F 100-200');
    expect(classifyPfRatio(250)).toContain('P/F < 300');
    expect(classifyPfRatio(320)).toContain('not in ARDS');
  });

  it('calculates ABGA formulas explicitly', () => {
    expect(calculateAnionGap(138, 102, 24)).toBe(12);
    expect(calculateHendersonHasselbalchPh(24, 40)).toBe(7.4);
    expect(calculateWintersExpectedPaco2Range(16)).toEqual([30, 34]);
    expect(calculateBaseExcess(7.4, 24)).toBeCloseTo(-0.4, 1);
  });

  it('builds a full text report with disorder and compensation cues', () => {
    const report = buildAcidBaseAssessment({
      ...BASE_VITALS,
      anionGap: 17,
      baseExcess: -6.5,
      hco3: 19,
      lactate: 3.4,
      paco2: 58,
      pao2: 58,
      pao2fio2: 97,
      ph: 7.13,
    });

    expect(report.phClassification).toBe('severe acidemia (pH < 7.20)');
    expect(report.paco2Classification).toBe('mild hypercapnia (PaCO2 46-60 mmHg)');
    expect(report.pao2Classification).toContain('Type I respiratory failure');
    expect(report.pfClassification).toContain('severe ARDS');
    expect(report.baseExcessClassification).toBe('metabolic base deficit');
    expect(report.lactateClassification).toBe('elevated lactate, tissue perfusion risk');
    expect(report.primaryDisorder).toBe('primary respiratory acidosis');
    expect(report.compensation).toContain('mixed acid-base disorder');
    expect(report.trendGraphMetrics).toEqual(['pH', 'PaCO2', 'PaO2', 'HCO3', 'Lactate', 'P/F']);
    expect(report.report).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Anion gap 17 mEq/L'),
        expect.stringContaining('Lactate 3.4 mmol/L - elevated lactate'),
        expect.stringContaining('Henderson-Hasselbalch pH'),
        expect.stringContaining('Winters expected PaCO2'),
      ]),
    );
  });
});
