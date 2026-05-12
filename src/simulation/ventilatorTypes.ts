import type { ClinicalAssessments } from './clinicalAssessments';

/** Calculated bedside values derived from ventilator settings and the active lung scenario. */
export type DerivedVitals = {
  spo2: number;
  fio2: number;
  pao2: number;
  pao2fio2: number;
  paco2: number;
  ph: number;
  hco3: number;
  anionGap: number;
  baseExcess: number;
  lactate: number;
  peep: number;
  autoPeep: number;
  pip: number;
  plateau: number;
  vte: number;
  minuteVentilation: number;
  alveolarVentilation: number;
  totalRR: number;
  heartRate: number;
  systolicBloodPressure: number;
  diastolicBloodPressure: number;
  meanArterialPressure: number;
  cardiacOutput: number;
  venousReturnIndex: number;
  intrathoracicPressure: number;
  rightVentricleAfterload: number;
  pulmonaryVascularResistance: number;
  temperatureCelsius: number;
  etco2: number;
  compliance: number;
  staticCompliance: number;
  dynamicCompliance: number;
  resistance: number;
  airwayResistance: number;
  drivingPressure: number;
  mechanicalPower: number;
  stressIndex: number;
  lowerInflectionPoint: number;
  upperInflectionPoint: number;
  optimalPeep: number;
  frc: number;
  deadSpaceFraction: number;
  vqMismatchIndex: number;
  shuntFraction: number;
  diffusionLimitationIndex: number;
  co2RetentionPattern: string;
  oxygenationPattern: string;
  spontaneousTidalVolume: number;
  mandatoryTidalVolume: number;
  rsbi: number;
  negativeInspiratoryForce: number;
  vitalCapacity: number;
  transpulmonaryStress: number;
  strain: number;
  predictedBodyWeight: number;
  lungProtectiveTidalVolume: number;
  plateauSafe: boolean;
  drivingPressureSafe: boolean;
  permissiveHypercapnia: boolean;
  leak: number;
  temporalVariation: number;
  recoveryTrajectory: number;
  deteriorationTrajectory: number;
  settingResponseScore: number;
  oxygenationResponsePercent: number;
  co2ResponsePercent: number;
  hemodynamicPeepPenalty: number;
  barotraumaRisk: number;
  volutraumaRisk: number;
  atelectraumaRisk: number;
  biotraumaRisk: number;
  viliRisk: number;
};

/** Coarse clinical state used by panels, alarms, and avatar rendering. */
export type PatientCondition = 'stable' | 'watch' | 'worsening' | 'critical';

/** Visual-only state for the layered SVG patient avatar. */
export type PatientVisualState = {
  condition: PatientCondition;
  expression: 'calm' | 'strained' | 'drowsy' | 'stupor' | 'coma' | 'distressed' | 'critical';
  skinTone: 'normal' | 'pale' | 'cyanotic' | 'severelyCyanotic' | 'jaundiced';
  lipColor: 'normal' | 'blue' | 'deepBlue';
  sweat: boolean;
  chestMotionSpeed: number;
  chestMotionAmplitude: number;
  leftChestReduced: boolean;
  rightChestReduced: boolean;
  lungColor: 'healthy' | 'inflamed' | 'stiff' | 'collapsed';
  infiltrationOpacity: number;
  secretionOpacity: number;
  tubePressureWarning: boolean;
  alarmGlow: boolean;
};

/** Alarm visual severity mapped to monitor color and urgency. */
export type AlarmSeverity = 'warning' | 'critical';

/** Clinical priority used for sorting and escalation. */
export type AlarmPriority = 'low' | 'medium' | 'high';

/** Alarm category used by the panel for color coding and grouping. */
export type AlarmCategory =
  | 'oxygenation'
  | 'ventilation'
  | 'pressure'
  | 'circuit'
  | 'hemodynamics'
  | 'temperature'
  | 'system';

export type AlarmThresholds = {
  lowSpo2Warning: number;
  lowSpo2Critical: number;
  highPressureWarning: number;
  highPressureCritical: number;
  lowPressure: number;
  disconnectPressure: number;
  apneaRate: number;
  apneaSeconds: number;
  tachypneaWarning: number;
  tachypneaCritical: number;
  bradypneaRate: number;
  tachycardiaRate: number;
  bradycardiaRate: number;
  highSystolicBloodPressure: number;
  highDiastolicBloodPressure: number;
  lowSystolicBloodPressure: number;
  lowDiastolicBloodPressure: number;
  highTemperatureCelsius: number;
  lowTemperatureCelsius: number;
  highFio2: number;
  lowFio2: number;
  highPeep: number;
  lowPeep: number;
  highMinuteVentilation: number;
  highCo2Warning: number;
  highCo2Critical: number;
  highEtco2: number;
  lowCo2: number;
  lowEtco2: number;
  lowMinuteVentilationWarning: number;
  lowMinuteVentilationCritical: number;
  lowComplianceWarning: number;
  lowComplianceCritical: number;
  highAutoPeep: number;
  highLeak: number;
  circuitOcclusionResistance: number;
  gasSupplyPressure: number;
  oxygenSupplyPressure: number;
  batteryCriticalPercent: number;
  batteryPercent: number;
};

export type AlarmSystemStatus = {
  batteryPercent: number;
  circuitConnected: boolean;
  gasSupplyPressure: number;
  mainsPowerAvailable: boolean;
  oxygenSupplyPressure: number;
  systemError: boolean;
};

/** A display alarm generated from simulated vitals crossing thresholds. */
export type Alarm = {
  id: string;
  label: string;
  message: string;
  value: number;
  unit: string;
  severity: AlarmSeverity;
  priority: AlarmPriority;
  category: AlarmCategory;
  threshold: number;
  generatedAtSeconds: number;
  isLikelyFalseAlarm?: boolean;
};

/** Complete simulation output consumed by the UI. */
export type SimulationState = {
  vitals: DerivedVitals;
  condition: PatientCondition;
  visualState: PatientVisualState;
  alarms: Alarm[];
  clinical: ClinicalAssessments;
  description: string;
};
