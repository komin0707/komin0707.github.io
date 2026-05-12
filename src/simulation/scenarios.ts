export const VENT_MODES = [
  'AC',
  'VC',
  'PC',
  'PSV',
  'CPAP',
  'BiPAP',
  'SIMV',
  'APRV',
  'HFOV',
  'NIV',
  'PRVC',
  'VS',
  'ASV',
  'NAVA',
  'PAV',
  'SmartCare',
  'IntelliVent',
] as const;

export type VentMode = (typeof VENT_MODES)[number];

/** User-adjustable ventilator controls used by the physiology model. */
export type VentSettings = {
  fio2: number;
  tidalVolume: number;
  respiratoryRate: number;
  peep: number;
  inspiratoryTime: number;
  flow: number;
  trigger: number;
  mode: VentMode;
};

export type ScenarioType =
  | 'normal'
  | 'pneumonia'
  | 'ards'
  | 'airwayObstruction'
  | 'pneumothorax'
  | 'pulmonaryEmbolism'
  | 'pulmonaryFibrosis'
  | 'aspirationPneumonia'
  | 'drowning'
  | 'burnInhalation'
  | 'covidArds'
  | 'atelectasis'
  | 'pulmonaryEdema'
  | 'diaphragmParalysis'
  | 'neuromuscularDisease'
  | 'opioidOverdose'
  | 'sepsisRespiratoryFailure'
  | 'traumaticChestInjury'
  | 'cardiogenicShock'
  | 'postCardiacArrest'
  | 'stroke'
  | 'traumaticBrainInjury'
  | 'diabeticKetoacidosis'
  | 'chronicKidneyDisease'
  | 'hepaticEncephalopathy'
  | 'paralyticMedication';

/** Educational lung condition preset that drives mechanics, gas exchange, and avatar state. */
export type Scenario = {
  type: ScenarioType;
  label: string;
  koreanLabel: string;
  severity: number;
  baselineCompliance: number;
  baselineResistance: number;
  secretionLevel: number;
  shunt: number;
  frc: number;
  description: string;
  oneSideChestMotionReduced?: boolean;
  reducedChestMotionSide?: 'left' | 'right';
};

export const DEFAULT_SETTINGS: VentSettings = {
  fio2: 40,
  tidalVolume: 500,
  respiratoryRate: 16,
  peep: 5,
  inspiratoryTime: 1,
  flow: 50,
  trigger: 2,
  mode: 'AC',
};

export const SCENARIOS: Record<ScenarioType, Scenario> = {
  normal: {
    type: 'normal',
    label: 'Normal',
    koreanLabel: '정상',
    severity: 0.1,
    baselineCompliance: 55,
    baselineResistance: 8,
    secretionLevel: 0.1,
    shunt: 0.1,
    frc: 2400,
    description: '정상 폐역학에 가까운 안정 시나리오입니다.',
  },
  pneumonia: {
    type: 'pneumonia',
    label: 'Pneumonia',
    koreanLabel: '폐렴(Pneumonia)_중증',
    severity: 0.82,
    baselineCompliance: 25,
    baselineResistance: 13.8,
    secretionLevel: 0.7,
    shunt: 0.61,
    frc: 1200,
    description: '폐렴으로 인한 저산소혈증과 분비물 증가 시나리오입니다.',
  },
  ards: {
    type: 'ards',
    label: 'ARDS',
    koreanLabel: 'ARDS_중증',
    severity: 0.85,
    baselineCompliance: 18,
    baselineResistance: 14,
    secretionLevel: 0.4,
    shunt: 0.75,
    frc: 900,
    description: '중증 저순응도와 심한 션트를 보이는 ARDS 시나리오입니다.',
  },
  airwayObstruction: {
    type: 'airwayObstruction',
    label: 'Airway Obstruction',
    koreanLabel: '기도 폐쇄',
    severity: 0.55,
    baselineCompliance: 38,
    baselineResistance: 30,
    secretionLevel: 0.8,
    shunt: 0.35,
    frc: 1800,
    description: '기도저항 증가와 호기 지연을 보이는 폐쇄성 시나리오입니다.',
  },
  pneumothorax: {
    type: 'pneumothorax',
    label: 'Pneumothorax',
    koreanLabel: '기흉',
    severity: 0.75,
    baselineCompliance: 20,
    baselineResistance: 18,
    secretionLevel: 0.2,
    shunt: 0.6,
    frc: 1000,
    description: '한쪽 흉곽 움직임 감소와 폐허탈을 표현하는 기흉 시나리오입니다.',
    oneSideChestMotionReduced: true,
    reducedChestMotionSide: 'left',
  },
  pulmonaryEmbolism: {
    type: 'pulmonaryEmbolism',
    label: 'Pulmonary Embolism',
    koreanLabel: '폐색전증(PE)',
    severity: 0.68,
    baselineCompliance: 42,
    baselineResistance: 12,
    secretionLevel: 0.05,
    shunt: 0.55,
    frc: 2100,
    description: '폐색전증으로 인한 사강 증가와 급성 저산소혈증 시나리오입니다.',
  },
  pulmonaryFibrosis: {
    type: 'pulmonaryFibrosis',
    label: 'Pulmonary Fibrosis',
    koreanLabel: '폐섬유증',
    severity: 0.62,
    baselineCompliance: 16,
    baselineResistance: 10,
    secretionLevel: 0.05,
    shunt: 0.42,
    frc: 1050,
    description: '섬유화로 인한 제한성 저순응도와 빠른 얕은 호흡 시나리오입니다.',
  },
  aspirationPneumonia: {
    type: 'aspirationPneumonia',
    label: 'Aspiration Pneumonia',
    koreanLabel: '흡인성 폐렴',
    severity: 0.78,
    baselineCompliance: 23,
    baselineResistance: 16,
    secretionLevel: 0.82,
    shunt: 0.64,
    frc: 1150,
    description: '흡인 이후 의존부위 침윤과 분비물 증가를 보이는 시나리오입니다.',
  },
  drowning: {
    type: 'drowning',
    label: 'Drowning',
    koreanLabel: '익수/익사',
    severity: 0.82,
    baselineCompliance: 20,
    baselineResistance: 16,
    secretionLevel: 0.9,
    shunt: 0.7,
    frc: 950,
    description: '익수 후 폐부종과 계면활성제 손상에 의한 산소화 장애 시나리오입니다.',
  },
  burnInhalation: {
    type: 'burnInhalation',
    label: 'Burn/Inhalation',
    koreanLabel: '화상/흡입 손상',
    severity: 0.76,
    baselineCompliance: 28,
    baselineResistance: 24,
    secretionLevel: 0.65,
    shunt: 0.5,
    frc: 1400,
    description: '상기도 부종과 그을음 흡입에 따른 기도저항 증가 시나리오입니다.',
  },
  covidArds: {
    type: 'covidArds',
    label: 'COVID-19 ARDS',
    koreanLabel: 'COVID-19 ARDS',
    severity: 0.86,
    baselineCompliance: 21,
    baselineResistance: 13,
    secretionLevel: 0.35,
    shunt: 0.78,
    frc: 950,
    description: 'COVID-19 관련 저산소성 ARDS와 양측 간질성 침윤 시나리오입니다.',
  },
  atelectasis: {
    type: 'atelectasis',
    label: 'Atelectasis',
    koreanLabel: '무기폐',
    severity: 0.58,
    baselineCompliance: 26,
    baselineResistance: 14,
    secretionLevel: 0.45,
    shunt: 0.48,
    frc: 850,
    description: '폐포 허탈과 낮은 FRC, PEEP 반응성을 보이는 무기폐 시나리오입니다.',
  },
  pulmonaryEdema: {
    type: 'pulmonaryEdema',
    label: 'Pulmonary Edema',
    koreanLabel: '폐부종',
    severity: 0.74,
    baselineCompliance: 22,
    baselineResistance: 15,
    secretionLevel: 0.55,
    shunt: 0.66,
    frc: 1100,
    description: '폐부종으로 인한 양측 음영과 산소화 저하 시나리오입니다.',
  },
  diaphragmParalysis: {
    type: 'diaphragmParalysis',
    label: 'Diaphragm Paralysis',
    koreanLabel: '횡격막 마비',
    severity: 0.5,
    baselineCompliance: 36,
    baselineResistance: 11,
    secretionLevel: 0.15,
    shunt: 0.32,
    frc: 1550,
    description: '횡격막 약화로 낮은 자발호흡량과 기저부 무기폐 위험을 보이는 시나리오입니다.',
  },
  neuromuscularDisease: {
    type: 'neuromuscularDisease',
    label: 'Neuromuscular Disease',
    koreanLabel: '신경근 질환(ALS/GBS)',
    severity: 0.56,
    baselineCompliance: 39,
    baselineResistance: 11,
    secretionLevel: 0.2,
    shunt: 0.35,
    frc: 1650,
    description: 'ALS/GBS 양상의 호흡근 약화와 낮은 NIF/VC 시나리오입니다.',
  },
  opioidOverdose: {
    type: 'opioidOverdose',
    label: 'Opioid Overdose',
    koreanLabel: '마약 과량',
    severity: 0.64,
    baselineCompliance: 45,
    baselineResistance: 10,
    secretionLevel: 0.1,
    shunt: 0.28,
    frc: 2200,
    description: '중추성 호흡저하와 고탄산혈증 위험을 보이는 opioid overdose 시나리오입니다.',
  },
  sepsisRespiratoryFailure: {
    type: 'sepsisRespiratoryFailure',
    label: 'Sepsis Respiratory Failure',
    koreanLabel: '패혈증 호흡부전',
    severity: 0.84,
    baselineCompliance: 21,
    baselineResistance: 15,
    secretionLevel: 0.6,
    shunt: 0.72,
    frc: 1000,
    description: '패혈증에 의한 고열, 젖산 상승, 저산소성 호흡부전 시나리오입니다.',
  },
  traumaticChestInjury: {
    type: 'traumaticChestInjury',
    label: 'Traumatic Chest Injury',
    koreanLabel: '외상성 흉부 손상',
    severity: 0.8,
    baselineCompliance: 19,
    baselineResistance: 18,
    secretionLevel: 0.35,
    shunt: 0.68,
    frc: 950,
    description: '폐좌상과 늑골 손상으로 인한 저순응도/통증/산소화 장애 시나리오입니다.',
    oneSideChestMotionReduced: true,
    reducedChestMotionSide: 'right',
  },
  cardiogenicShock: {
    type: 'cardiogenicShock',
    label: 'Cardiogenic Shock',
    koreanLabel: '심인성 쇼크',
    severity: 0.82,
    baselineCompliance: 24,
    baselineResistance: 14,
    secretionLevel: 0.45,
    shunt: 0.69,
    frc: 1050,
    description: '심인성 쇼크와 폐정체/폐부종을 동반한 산소화 장애 시나리오입니다.',
  },
  postCardiacArrest: {
    type: 'postCardiacArrest',
    label: 'Post-cardiac Arrest',
    koreanLabel: '심정지 후',
    severity: 0.88,
    baselineCompliance: 24,
    baselineResistance: 13,
    secretionLevel: 0.3,
    shunt: 0.74,
    frc: 1250,
    description: '심정지 후 재관류, 목표체온, 저산소성 뇌손상 위험 시나리오입니다.',
  },
  stroke: {
    type: 'stroke',
    label: 'Stroke',
    koreanLabel: '뇌졸중',
    severity: 0.58,
    baselineCompliance: 42,
    baselineResistance: 12,
    secretionLevel: 0.25,
    shunt: 0.34,
    frc: 1950,
    description: '뇌졸중 후 의식 저하와 흡인 위험, 기도 보호 문제를 다루는 시나리오입니다.',
  },
  traumaticBrainInjury: {
    type: 'traumaticBrainInjury',
    label: 'Traumatic Brain Injury',
    koreanLabel: '두부 외상(TBI)',
    severity: 0.66,
    baselineCompliance: 40,
    baselineResistance: 12,
    secretionLevel: 0.25,
    shunt: 0.36,
    frc: 1900,
    description: 'TBI에서 산소화/환기와 두개내압 위험을 함께 관리하는 시나리오입니다.',
  },
  diabeticKetoacidosis: {
    type: 'diabeticKetoacidosis',
    label: 'Diabetic Ketoacidosis',
    koreanLabel: '케토산증(DKA)',
    severity: 0.6,
    baselineCompliance: 44,
    baselineResistance: 11,
    secretionLevel: 0.12,
    shunt: 0.3,
    frc: 2200,
    description: '대사성 산증과 Kussmaul 호흡 보상을 표현하는 DKA 시나리오입니다.',
  },
  chronicKidneyDisease: {
    type: 'chronicKidneyDisease',
    label: 'Chronic Kidney Disease',
    koreanLabel: '신부전(CKD)',
    severity: 0.62,
    baselineCompliance: 30,
    baselineResistance: 13,
    secretionLevel: 0.28,
    shunt: 0.5,
    frc: 1400,
    description: '요독성 산증과 체액 과다성 폐부종 위험을 보이는 CKD 시나리오입니다.',
  },
  hepaticEncephalopathy: {
    type: 'hepaticEncephalopathy',
    label: 'Hepatic Encephalopathy',
    koreanLabel: '간성 뇌증',
    severity: 0.57,
    baselineCompliance: 38,
    baselineResistance: 12,
    secretionLevel: 0.2,
    shunt: 0.36,
    frc: 1750,
    description: '간성 뇌증으로 인한 의식 저하, 흡인 위험, 과환기 가능성 시나리오입니다.',
  },
  paralyticMedication: {
    type: 'paralyticMedication',
    label: 'Paralytic Medication Effect',
    koreanLabel: '마비 약물 효과',
    severity: 0.48,
    baselineCompliance: 46,
    baselineResistance: 10,
    secretionLevel: 0.1,
    shunt: 0.3,
    frc: 2100,
    description: '신경근 차단제 투여 후 자발호흡 소실과 동기화 개선을 보는 시나리오입니다.',
  },
};
