import type { Scenario } from './scenarios';
import type { Alarm, DerivedVitals, PatientCondition } from './ventilatorTypes';
import { buildAcidBaseAssessment } from './acidBase';
import { buildScenarioMedicalFindings } from './scenarioMedicalFindings';

export type BloodPressure = {
  diastolic: number;
  map: number;
  systolic: number;
};

export type IntegratedMonitoring = {
  arterialBloodGas: readonly string[];
  bisIndex: number;
  cardiacOutput: string;
  cvp: string;
  ecg12Lead: readonly string[];
  ecg5Lead: readonly string[];
  etco2Trend: readonly string[];
  glucose: string;
  hrAnalysis: string;
  ibp: string;
  nibp: string;
  pap: string;
  perfusionIndex: number;
  spo2Pleth: string;
  temperatureSites: readonly string[];
  tof: string;
  urineOutput: string;
  venousBloodGas: readonly string[];
};

export type ClinicalAssessments = {
  abga: readonly string[];
  allergies: string;
  bloodPressure: BloodPressure;
  bmp: readonly string[];
  cbc: readonly string[];
  chiefComplaint: string;
  currentMedications: readonly string[];
  ecg: string;
  gcs: number;
  integratedMonitoring: IntegratedMonitoring;
  painScore: number;
  pastMedicalHistory: readonly string[];
  patient: {
    age: number;
    name: string;
    photoLabel: string;
    sex: string;
    weightKg: number;
  };
  scenarioFindings: readonly string[];
  simulationLog: readonly string[];
  temperatureCelsius: number;
  trend: readonly string[];
  xray: string;
};

export type ClinicalAssessmentInput = {
  alarms: readonly Alarm[];
  condition: PatientCondition;
  scenario: Scenario;
  vitals: DerivedVitals;
};

function getBloodPressure(vitals: DerivedVitals): BloodPressure {
  const systolic = vitals.systolicBloodPressure;
  const diastolic = vitals.diastolicBloodPressure;
  return {
    diastolic,
    map: vitals.meanArterialPressure,
    systolic,
  };
}

function getTemperatureFromVitals(vitals: DerivedVitals) {
  return vitals.temperatureCelsius;
}

function getGcs(condition: PatientCondition, paco2: number) {
  if (condition === 'critical') return 8;
  if (paco2 > 55) return 12;
  if (condition === 'worsening') return 14;
  return 15;
}

function getPainScore(condition: PatientCondition, scenario: Scenario) {
  if (
    scenario.type === 'pneumothorax' ||
    scenario.type === 'traumaticChestInjury' ||
    scenario.type === 'burnInhalation'
  )
    return 7;
  if (condition === 'critical') return 6;
  if (condition === 'worsening') return 4;
  return 1;
}

function getXrayImpression(scenario: Scenario) {
  const impressions: Record<Scenario['type'], string> = {
    airwayObstruction: '과팽창 및 호기 지연 소견',
    ards: '양측 미만성 침윤, ARDS 패턴',
    aspirationPneumonia: '의존부위 흡인성 침윤',
    atelectasis: '기저부 무기폐 및 용적 감소',
    burnInhalation: '흡입 손상 의심, 기관지벽 비후',
    cardiogenicShock: '심비대 및 폐정체성 폐부종',
    chronicKidneyDisease: '체액 과다성 폐부종 의심',
    covidArds: '양측 간질성/간유리 음영, COVID ARDS 패턴',
    diabeticKetoacidosis: '급성 폐 음영 없음, 과환기 소견',
    diaphragmParalysis: '횡격막 상승 및 기저부 무기폐',
    drowning: '익수 후 양측 폐부종성 음영',
    hepaticEncephalopathy: '흡인 위험, 뚜렷한 급성 폐 음영 없음',
    neuromuscularDisease: '저환기와 기저부 무기폐 위험',
    normal: '급성 심폐 이상 없음',
    opioidOverdose: '저환기, 흡인 여부 추적 필요',
    paralyticMedication: '마비 약물 후 무기폐 위험',
    pneumonia: '우하엽 폐렴성 침윤',
    pneumothorax: '좌측 기흉 및 폐허탈',
    postCardiacArrest: '심정지 후 폐부종/흡인 감별 필요',
    pulmonaryEdema: '양측 폐부종성 음영',
    pulmonaryEmbolism: '명확한 침윤 없음, 폐색전증 의심',
    pulmonaryFibrosis: '양측 망상성 섬유화 음영',
    sepsisRespiratoryFailure: '패혈증 관련 양측 침윤 가능',
    stroke: '흡인 위험 평가, 급성 폐 음영 없음',
    traumaticBrainInjury: '두부외상 후 흡인/신경성 폐부종 감시',
    traumaticChestInjury: '폐좌상 및 외상성 흉부 손상 소견',
  };
  return impressions[scenario.type];
}

function getWbc(scenario: Scenario) {
  if (
    scenario.type === 'pneumonia' ||
    scenario.type === 'aspirationPneumonia' ||
    scenario.type === 'sepsisRespiratoryFailure' ||
    scenario.type === 'covidArds'
  )
    return '15.2';
  if (scenario.type === 'burnInhalation' || scenario.type === 'traumaticChestInjury') return '12.4';
  return '8.6';
}

function getRhythm(vitals: DerivedVitals, scenario: Scenario, condition: PatientCondition) {
  if (scenario.type === 'postCardiacArrest' && vitals.heartRate > 120)
    return 'V-tach watch: wide-complex run risk';
  if (scenario.type === 'cardiogenicShock') return 'Atrial fibrillation risk: irregularly irregular watch';
  if (vitals.heartRate >= 120) return 'Sinus tachycardia, hypoxia/hypercapnia driven';
  if ((condition === 'worsening' || condition === 'critical') && vitals.heartRate >= 80)
    return 'Sinus tachycardia, clinical stress response';
  if (vitals.heartRate <= 50) return 'Sinus bradycardia';
  return 'Normal sinus rhythm, regular R-R';
}

function buildIntegratedMonitoring(
  vitals: DerivedVitals,
  scenario: Scenario,
  bloodPressure: BloodPressure,
  condition: PatientCondition,
): IntegratedMonitoring {
  const rhythm = getRhythm(vitals, scenario, condition);
  const perfusionIndex = Number(
    Math.max(
      0.2,
      Math.min(9.9, 5.2 - Math.max(0, 92 - vitals.spo2) * 0.18 + bloodPressure.map / 120),
    ).toFixed(1),
  );
  const cardiacOutput = Number(
    Math.max(2.2, Math.min(8.5, (vitals.heartRate * 65 * (bloodPressure.map / 90)) / 1000)).toFixed(1),
  );
  const urineOutput = Math.round(Math.max(10, Math.min(90, bloodPressure.map - 35 - vitals.lactate * 3)));
  const bisIndex = Math.round(
    Math.max(18, Math.min(98, 92 - Math.max(0, vitals.paco2 - 45) * 0.9 - vitals.lactate * 3)),
  );
  const rectalTemperature = vitals.temperatureCelsius;
  const oralTemperature = Number((rectalTemperature - 0.3).toFixed(1));
  const esophagealTemperature = Number((rectalTemperature - 0.1).toFixed(1));

  return {
    arterialBloodGas: [
      `ABG pH ${vitals.ph.toFixed(2)} / PaCO2 ${vitals.paco2} / PaO2 ${vitals.pao2}`,
      `HCO3 ${vitals.hco3}, BE ${vitals.baseExcess}, lactate ${vitals.lactate}`,
    ],
    bisIndex,
    cardiacOutput: `${cardiacOutput} L/min by Swan-Ganz estimate`,
    cvp: `${Math.round(8 + (vitals.peep - 5) * 0.25)} mmHg`,
    ecg12Lead: [
      `I/II/III: ${rhythm}`,
      `V1-V6: ${vitals.pao2fio2 < 180 ? 'right-heart strain watch' : 'no acute ST elevation pattern'}`,
    ],
    ecg5Lead: ['RA-LA/RL-LL/V: lead set active', `Lead II: ${rhythm}`],
    etco2Trend: [
      `Current ${vitals.etco2} mmHg`,
      vitals.etco2 > 50
        ? 'Up-sloping capnogram, hypoventilation/obstruction watch'
        : 'Capnogram plateau present',
    ],
    glucose:
      scenario.type === 'diabeticKetoacidosis'
        ? '326 mg/dL'
        : scenario.type === 'sepsisRespiratoryFailure'
          ? '168 mg/dL'
          : '112 mg/dL',
    hrAnalysis: rhythm,
    ibp: `${bloodPressure.systolic}/${bloodPressure.diastolic} (${bloodPressure.map}) mmHg arterial line`,
    nibp: `${bloodPressure.systolic}/${bloodPressure.diastolic} (${bloodPressure.map}) mmHg cuff`,
    pap: `${Math.round(28 + Math.max(0, 250 - vitals.pao2fio2) * 0.03)}/${Math.round(12 + vitals.peep * 0.2)} mmHg`,
    perfusionIndex,
    spo2Pleth:
      perfusionIndex < 1.5 ? 'low-amplitude pleth, poor peripheral perfusion' : 'regular pleth waveform',
    temperatureSites: [
      `Rectal ${rectalTemperature.toFixed(1)}°C`,
      `Oral ${oralTemperature.toFixed(1)}°C`,
      `Esophageal ${esophagealTemperature.toFixed(1)}°C`,
    ],
    tof:
      scenario.type === 'paralyticMedication'
        ? 'TOF 1/4 twitches, neuromuscular blockade active'
        : 'TOF 4/4 twitches',
    urineOutput: `${urineOutput} mL/hr`,
    venousBloodGas: [
      `VBG pH ${Math.max(7.0, vitals.ph - 0.03).toFixed(2)} / PvCO2 ${vitals.paco2 + 5}`,
      `SvO2 ${Math.max(45, Math.min(78, vitals.spo2 - 22))}%`,
    ],
  };
}

export function buildClinicalAssessments({
  alarms,
  condition,
  scenario,
  vitals,
}: ClinicalAssessmentInput): ClinicalAssessments {
  const bloodPressure = getBloodPressure(vitals);
  const temperatureCelsius = getTemperatureFromVitals(vitals);
  const gcs = getGcs(condition, vitals.paco2);
  const painScore = getPainScore(condition, scenario);
  const criticalAlarmCount = alarms.filter((alarm) => alarm.severity === 'critical').length;
  const acidBase = buildAcidBaseAssessment(vitals);
  const scenarioFindings = buildScenarioMedicalFindings(scenario, vitals);
  const integratedMonitoring = buildIntegratedMonitoring(vitals, scenario, bloodPressure, condition);

  return {
    abga: acidBase.report,
    allergies: 'Penicillin rash',
    bloodPressure,
    bmp: ['Na 138', 'K 4.1', 'Cl 102', `HCO3 ${vitals.hco3}`, 'Cr 0.9'],
    cbc: [`WBC ${getWbc(scenario)}`, `Hb ${condition === 'critical' ? '10.4' : '12.8'}`, 'Plt 238'],
    chiefComplaint: scenario.description,
    currentMedications: ['Propofol infusion', 'Fentanyl PRN', 'VTE prophylaxis'],
    ecg: integratedMonitoring.hrAnalysis,
    gcs,
    integratedMonitoring,
    painScore,
    pastMedicalHistory: ['Hypertension', 'Former smoker'],
    patient: {
      age: 68,
      name: 'Kim Minjun',
      photoLabel: 'bedside avatar',
      sex: 'male',
      weightKg: 65,
    },
    scenarioFindings,
    simulationLog: [
      `${condition.toUpperCase()} state`,
      `${alarms.length} active alarms`,
      `${criticalAlarmCount} critical alarms`,
    ],
    temperatureCelsius,
    trend: [
      `SpO2 ${vitals.spo2}%`,
      `PIP ${vitals.pip} cmH2O`,
      `MV ${vitals.minuteVentilation} L/min`,
      `MAP ${bloodPressure.map}`,
    ],
    xray: getXrayImpression(scenario),
  };
}
