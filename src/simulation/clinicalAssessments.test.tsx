import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS } from './scenarios';
import { buildClinicalAssessments } from './clinicalAssessments';
import { calculateSimulation } from './ventilatorModel';

describe('clinical assessments', () => {
  it('derives bedside chart data, labs, imaging, ECG, BP, temperature, GCS, pain, trends, and log', () => {
    const pneumonia = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
    const clinical = buildClinicalAssessments({
      alarms: pneumonia.alarms,
      condition: pneumonia.condition,
      scenario: SCENARIOS.pneumonia,
      vitals: pneumonia.vitals,
    });

    expect(clinical.patient).toEqual({
      age: 68,
      name: 'Kim Minjun',
      photoLabel: 'bedside avatar',
      sex: 'male',
      weightKg: 65,
    });
    expect(clinical.scenarioFindings).toContainEqual(expect.stringContaining('unilateral right lower lobe'));
    expect(clinical.scenarioFindings).toContainEqual(expect.stringContaining('CAP pattern'));
    expect(clinical.abga).toContainEqual(expect.stringContaining(`pH ${pneumonia.vitals.ph.toFixed(2)}`));
    expect(clinical.abga).toContainEqual(expect.stringContaining(`HCO3 ${pneumonia.vitals.hco3} mEq/L`));
    expect(clinical.abga).toContainEqual(expect.stringContaining('Anion gap'));
    expect(clinical.abga).toContainEqual(expect.stringContaining('Base excess'));
    expect(clinical.abga).toContainEqual(expect.stringContaining('Lactate'));
    expect(clinical.abga).toContainEqual(expect.stringContaining('Winters expected PaCO2'));
    expect(clinical.abga).toContainEqual(expect.stringContaining('Henderson-Hasselbalch pH'));
    expect(clinical.cbc).toContain('WBC 15.2');
    expect(clinical.bmp).toContain('Cr 0.9');
    expect(clinical.bmp).toContain(`HCO3 ${pneumonia.vitals.hco3}`);
    expect(clinical.xray).toBe('우하엽 폐렴성 침윤');
    expect(clinical.ecg).toContain('Sinus tachycardia');
    expect(clinical.integratedMonitoring.ecg5Lead).toContainEqual(expect.stringContaining('Lead II'));
    expect(clinical.integratedMonitoring.ecg12Lead).toContainEqual(expect.stringContaining('V1-V6'));
    expect(clinical.integratedMonitoring.hrAnalysis).toContain('tachycardia');
    expect(clinical.integratedMonitoring.spo2Pleth).toContain('pleth');
    expect(clinical.integratedMonitoring.perfusionIndex).toBeGreaterThan(0);
    expect(clinical.integratedMonitoring.nibp).toContain('mmHg cuff');
    expect(clinical.integratedMonitoring.ibp).toContain('arterial line');
    expect(clinical.integratedMonitoring.cvp).toContain('mmHg');
    expect(clinical.integratedMonitoring.pap).toContain('mmHg');
    expect(clinical.integratedMonitoring.cardiacOutput).toContain('Swan-Ganz');
    expect(clinical.integratedMonitoring.etco2Trend).toContainEqual(expect.stringContaining('Current'));
    expect(clinical.integratedMonitoring.temperatureSites).toContainEqual(expect.stringContaining('Rectal'));
    expect(clinical.integratedMonitoring.bisIndex).toBeGreaterThan(0);
    expect(clinical.integratedMonitoring.tof).toContain('TOF');
    expect(clinical.integratedMonitoring.arterialBloodGas).toContainEqual(expect.stringContaining('ABG pH'));
    expect(clinical.integratedMonitoring.venousBloodGas).toContainEqual(expect.stringContaining('VBG pH'));
    expect(clinical.integratedMonitoring.glucose).toContain('mg/dL');
    expect(clinical.integratedMonitoring.urineOutput).toContain('mL/hr');
    expect(clinical.bloodPressure.systolic).toBeGreaterThan(clinical.bloodPressure.diastolic);
    expect(clinical.temperatureCelsius).toBe(38.6);
    expect(clinical.gcs).toBe(12);
    expect(clinical.painScore).toBe(4);
    expect(clinical.trend).toContain(`SpO2 ${pneumonia.vitals.spo2}%`);
    expect(clinical.simulationLog).toContain('WORSENING state');
    expect(clinical.chiefComplaint).toBe(SCENARIOS.pneumonia.description);
    expect(clinical.pastMedicalHistory).toContain('Hypertension');
    expect(clinical.currentMedications).toContain('Propofol infusion');
    expect(clinical.allergies).toBe('Penicillin rash');
  });

  it('marks scenario-specific X-ray and critical bedside status', () => {
    const critical = calculateSimulation(
      { ...DEFAULT_SETTINGS, fio2: 21, peep: 20, tidalVolume: 1000, flow: 100 },
      SCENARIOS.ards,
    );

    expect(critical.clinical.xray).toBe('양측 미만성 침윤, ARDS 패턴');
    expect(critical.clinical.scenarioFindings).toContainEqual(expect.stringContaining('Berlin ARDS'));
    expect(critical.clinical.scenarioFindings).toContainEqual(expect.stringContaining('PCWP 14 mmHg (<18)'));
    expect(critical.clinical.temperatureCelsius).toBe(37.8);
    expect(critical.clinical.gcs).toBe(8);
    expect(critical.clinical.ecg).toContain('tachycardia');
    expect(critical.clinical.simulationLog).toContainEqual(expect.stringContaining('critical alarms'));
  });

  it('reports AFib and V-tach rhythm scenarios for ECG and HR analysis', () => {
    const cardiogenicShock = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.cardiogenicShock);
    const postArrest = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.postCardiacArrest);
    const afib = buildClinicalAssessments({
      alarms: cardiogenicShock.alarms,
      condition: cardiogenicShock.condition,
      scenario: SCENARIOS.cardiogenicShock,
      vitals: cardiogenicShock.vitals,
    });
    const vtach = buildClinicalAssessments({
      alarms: postArrest.alarms,
      condition: postArrest.condition,
      scenario: SCENARIOS.postCardiacArrest,
      vitals: { ...postArrest.vitals, heartRate: 132 },
    });

    expect(afib.ecg).toContain('Atrial fibrillation');
    expect(afib.integratedMonitoring.ecg12Lead).toContainEqual(
      expect.stringContaining('Atrial fibrillation'),
    );
    expect(vtach.ecg).toContain('V-tach');
    expect(vtach.integratedMonitoring.hrAnalysis).toContain('wide-complex');
  });
});
