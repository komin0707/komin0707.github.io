import type { Scenario, VentSettings } from './scenarios';
import { calculateAlarms } from './alarms';
import { buildClinicalAssessments } from './clinicalAssessments';
import { describeState } from './conditionMessages';
import { calculateVitals } from './vitals';
import { buildVisualState, getPatientCondition } from './visualState';
import type { AlarmThresholds, SimulationState } from './ventilatorTypes';

export type {
  Alarm,
  AlarmPriority,
  AlarmSeverity,
  AlarmThresholds,
  DerivedVitals,
  PatientCondition,
  PatientVisualState,
  SimulationState,
} from './ventilatorTypes';
export { calculateAlarms, DEFAULT_ALARM_THRESHOLDS, sortAlarmsByPriority } from './alarms';
export { buildAcidBaseAssessment } from './acidBase';
export { buildClinicalAssessments } from './clinicalAssessments';
export { describeState, getConditionLabel } from './conditionMessages';
export { buildScenarioMedicalFindings } from './scenarioMedicalFindings';
export { clamp } from './ventilatorMath';
export { calculateVitals } from './vitals';
export { buildVisualState, getPatientCondition } from './visualState';

/** Backward-compatible alias for deriving vitals from settings and scenario state. */
export const calculateDerivedVitals = calculateVitals;
/** Backward-compatible alias for mapping vitals into patient avatar visual state. */
export const mapVitalsToVisualState = buildVisualState;
/** Backward-compatible alias for the clinical condition summary message. */
export const getConditionMessage = describeState;

/** Optional context for deriving time-dependent simulator calculations. */
export type SimulationCalculationOptions = {
  elapsedSeconds?: number;
};

/** Assembles vitals, alarms, clinical assessment, and visual state for the active simulator frame. */
export function calculateSimulation(
  settings: VentSettings,
  scenario: Scenario,
  alarmThresholds?: Partial<AlarmThresholds>,
  options: SimulationCalculationOptions = {},
): SimulationState {
  const vitals =
    options.elapsedSeconds === undefined
      ? calculateVitals(settings, scenario)
      : calculateVitals(settings, scenario, { elapsedSeconds: options.elapsedSeconds });
  const condition = getPatientCondition(vitals);
  const visualState = buildVisualState(vitals, scenario);
  const alarms = calculateAlarms(vitals, { mode: settings.mode, thresholds: alarmThresholds });
  const clinical = buildClinicalAssessments({ alarms, condition, scenario, vitals });
  const description = describeState(vitals, scenario, condition);

  return { vitals, condition, visualState, alarms, clinical, description };
}
