import type { Scenario } from './scenarios';
import { clamp } from './ventilatorMath';
import type { DerivedVitals, PatientCondition, PatientVisualState } from './ventilatorTypes';

export function getPatientCondition(vitals: DerivedVitals): PatientCondition {
  if (
    vitals.spo2 <= 84 ||
    (vitals.spo2 < 90 && vitals.pao2fio2 < 120) ||
    vitals.ph < 7.2 ||
    vitals.paco2 >= 65 ||
    vitals.pip > 40
  ) {
    return 'critical';
  }
  if (vitals.spo2 < 90 || vitals.paco2 > 60 || vitals.pip > 32) return 'worsening';
  if (vitals.spo2 < 94 || vitals.paco2 > 48 || vitals.pip > 28) return 'watch';
  return 'stable';
}

const VISUAL_BY_CONDITION: Record<
  PatientCondition,
  Omit<
    PatientVisualState,
    | 'condition'
    | 'leftChestReduced'
    | 'rightChestReduced'
    | 'infiltrationOpacity'
    | 'secretionOpacity'
    | 'tubePressureWarning'
  >
> = {
  stable: {
    expression: 'calm',
    skinTone: 'normal',
    lipColor: 'normal',
    sweat: false,
    chestMotionSpeed: 1,
    chestMotionAmplitude: 1,
    lungColor: 'healthy',
    alarmGlow: false,
  },
  watch: {
    expression: 'strained',
    skinTone: 'pale',
    lipColor: 'normal',
    sweat: false,
    chestMotionSpeed: 1.15,
    chestMotionAmplitude: 1.05,
    lungColor: 'inflamed',
    alarmGlow: false,
  },
  worsening: {
    expression: 'distressed',
    skinTone: 'cyanotic',
    lipColor: 'blue',
    sweat: true,
    chestMotionSpeed: 1.35,
    chestMotionAmplitude: 1.2,
    lungColor: 'inflamed',
    alarmGlow: true,
  },
  critical: {
    expression: 'critical',
    skinTone: 'severelyCyanotic',
    lipColor: 'deepBlue',
    sweat: true,
    chestMotionSpeed: 1.5,
    chestMotionAmplitude: 1.35,
    lungColor: 'stiff',
    alarmGlow: true,
  },
};

export function buildVisualState(vitals: DerivedVitals, scenario: Scenario): PatientVisualState {
  const condition = getPatientCondition(vitals);
  const state = VISUAL_BY_CONDITION[condition];
  const expression =
    condition !== 'critical' && vitals.paco2 > 55 && vitals.spo2 >= 82 && vitals.pip <= 40
      ? 'drowsy'
      : state.expression;
  const reducedChestMotionSide =
    scenario.reducedChestMotionSide ?? (scenario.oneSideChestMotionReduced ? 'left' : undefined);
  const lungColor =
    scenario.type === 'pneumothorax' ? 'collapsed' : vitals.compliance < 25 ? 'stiff' : state.lungColor;
  const skinTone =
    condition === 'critical' || vitals.spo2 < 82
      ? 'severelyCyanotic'
      : vitals.spo2 < 88
        ? 'cyanotic'
        : state.skinTone;
  const lipColor =
    condition === 'critical' || vitals.spo2 < 82 ? 'deepBlue' : vitals.spo2 < 88 ? 'blue' : state.lipColor;

  return {
    ...state,
    condition,
    expression,
    skinTone,
    lipColor,
    leftChestReduced: reducedChestMotionSide === 'left',
    rightChestReduced: reducedChestMotionSide === 'right',
    lungColor,
    infiltrationOpacity: clamp(scenario.shunt * 0.85 + scenario.severity * 0.25, 0.05, 0.95),
    secretionOpacity: clamp(scenario.secretionLevel, 0.05, 0.95),
    tubePressureWarning: vitals.pip > 28,
    alarmGlow: state.alarmGlow || vitals.spo2 < 90 || vitals.pip > 28,
  };
}
