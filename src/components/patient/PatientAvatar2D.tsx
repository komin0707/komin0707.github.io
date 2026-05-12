import { memo, type CSSProperties } from 'react';
import type { Scenario, VentMode } from '@/simulation/scenarios';
import type { DerivedVitals, PatientVisualState } from '@/simulation/ventilatorModel';
import {
  DEFAULT_PATIENT_AVATAR_PROFILE,
  PATIENT_AVATAR_COORDINATE_FRAME_TRANSFORM,
  PATIENT_AVATAR_VIEWBOX_VALUE,
  type PatientAvatarProfile,
} from './patientAvatarGeometry';
import { PATIENT_AVATAR_PALETTE } from './patientAvatarPalette';
import { AirwayLayer, AvatarDefs, BedLayer, BodyLayer, HeadLayer } from './patientAvatarSvgParts';
import './PatientAvatar2D.css';
import './styles/PatientAvatarAnatomy.css';
import './styles/PatientAvatarAnimations.css';
import './styles/PatientAvatarBreathing.css';
import './styles/PatientAvatarPathology.css';
import './styles/PatientAvatarSvgDetails.css';

type PatientAvatar2DProps = {
  apneaSeconds?: number;
  fio2: number;
  inspiratoryTime: number;
  mode: VentMode;
  profile?: PatientAvatarProfile;
  scenario: Scenario;
  visualState: PatientVisualState;
  vitals: DerivedVitals;
};

const CYANOSIS_OPACITY_BY_TONE: Record<PatientVisualState['skinTone'], number> = {
  normal: 0,
  pale: 0.1,
  cyanotic: 0.5,
  jaundiced: 0,
  severelyCyanotic: 0.86,
};

const DISTRESS_OPACITY_BY_CONDITION: Record<PatientVisualState['condition'], number> = {
  stable: 0,
  watch: 0.24,
  worsening: 0.7,
  critical: 0.95,
};

const RECOVERY_OPACITY_BY_CONDITION: Record<PatientVisualState['condition'], number> = {
  stable: 0.26,
  watch: 0.08,
  worsening: 0,
  critical: 0,
};

const LIP_COLOR_BY_STATE: Record<PatientVisualState['lipColor'], string> = {
  normal: PATIENT_AVATAR_PALETTE.lip.normal,
  blue: PATIENT_AVATAR_PALETTE.lip.blue,
  deepBlue: PATIENT_AVATAR_PALETTE.lip.deepBlue,
};

function getBreathPattern(scenario: Scenario, vitals: DerivedVitals, visualState: PatientVisualState) {
  if (vitals.totalRR <= 4) return 'apnea';
  if (vitals.ph < 7.25 && vitals.hco3 < 22 && vitals.baseExcess < -3 && vitals.totalRR >= 24)
    return 'kussmaul';
  if ((scenario.type === 'stroke' || scenario.type === 'traumaticBrainInjury') && vitals.paco2 > 50)
    return 'biot';
  if (scenario.type === 'airwayObstruction' && vitals.paco2 > 55 && vitals.totalRR <= 12) return 'apneustic';
  if (vitals.paco2 > 60 && vitals.totalRR <= 10) return 'cheyne-stokes';
  if (visualState.condition === 'critical' && vitals.totalRR <= 7) return 'agonal';
  if (visualState.condition === 'critical') return 'gasping';
  if (scenario.type === 'normal' && visualState.condition === 'watch' && vitals.totalRR >= 18)
    return 'sighing';
  if (vitals.totalRR <= 10) return 'bradypnea';
  if (vitals.totalRR >= 28) return 'tachypnea';
  return 'regular';
}

function getAlarmLevel(visualState: PatientVisualState) {
  if (!visualState.alarmGlow) return 'none';
  if (visualState.condition === 'critical' || visualState.condition === 'worsening') return 'critical';
  return 'warning';
}

function getBreathSource(mode: VentMode) {
  return mode === 'CPAP' || mode === 'PSV' || mode === 'NIV' || mode === 'BiPAP'
    ? 'spontaneous'
    : 'mechanical';
}

function getTriggerMode(mode: VentMode, vitals: DerivedVitals, visualState: PatientVisualState) {
  const breathSource = getBreathSource(mode);

  if (visualState.tubePressureWarning) return 'asynchrony';
  if (breathSource === 'mechanical' && vitals.totalRR >= 30) return 'double-trigger';
  if (breathSource === 'spontaneous' && vitals.leak >= 14) return 'auto-trigger';
  if (breathSource === 'spontaneous' && vitals.totalRR <= 10) return 'wasted-trigger';
  return 'sync';
}

// prettier-ignore
function PatientAvatar2DComponent({ apneaSeconds, fio2, inspiratoryTime, mode, profile = DEFAULT_PATIENT_AVATAR_PROFILE, scenario, visualState, vitals }: Readonly<PatientAvatar2DProps>) {
  const adjustedBreathsPerMinute = vitals.totalRR * visualState.chestMotionSpeed;
  const breathCycleSeconds = Math.min(4.5, Math.max(0.55, 60 / adjustedBreathsPerMinute));
  const ventilatorCycleSeconds = 60 / vitals.totalRR;
  // prettier-ignore
  const safeInspiratoryTime = Math.min(Math.max(inspiratoryTime, 0.1), ventilatorCycleSeconds - 0.1), visualInspiratorySeconds = Math.min(2, Math.max(1.5, safeInspiratoryTime)), visualExpiratorySeconds = 3;
  const ieRatio = Math.max(0.1, (ventilatorCycleSeconds - safeInspiratoryTime) / safeInspiratoryTime);
  const alarmCycleSeconds =
    visualState.condition === 'critical' ? 0.68 : visualState.condition === 'worsening' ? 0.85 : 1.1;
  const alarmLevel = getAlarmLevel(visualState),
    breathPattern = getBreathPattern(scenario, vitals, visualState);
  const displayedApneaSeconds = apneaSeconds ?? Math.ceil(60 / Math.max(1, vitals.totalRR));
  const apneaLabel =
    apneaSeconds === undefined ? `APNEA ≥${displayedApneaSeconds}s` : `APNEA ${displayedApneaSeconds}s`;
  const breathSource = getBreathSource(mode);
  const triggerMode = getTriggerMode(mode, vitals, visualState);
  const hasInspiratoryHold = !vitals.plateauSafe || vitals.plateau >= 30;
  const hasExpiratoryHold = vitals.autoPeep >= 4;
  const pressureCompressionOpacity = Math.min(1, Math.max(0, (vitals.pip - 28) / 14));

  // prettier-ignore
  const style = { '--alarm-speed': `${alarmCycleSeconds.toFixed(2)}s`, '--breath-speed': `${breathCycleSeconds.toFixed(2)}s`, '--breath-scale': 1 + visualState.chestMotionAmplitude * 0.055, '--cyanosis-opacity': CYANOSIS_OPACITY_BY_TONE[visualState.skinTone], '--distress-opacity': DISTRESS_OPACITY_BY_CONDITION[visualState.condition], '--infiltration-opacity': visualState.infiltrationOpacity, '--lung-pulse-speed': `${Math.max(0.72, breathCycleSeconds * 0.58).toFixed(2)}s`, '--pressure-compression-opacity': pressureCompressionOpacity, '--recovery-opacity': RECOVERY_OPACITY_BY_CONDITION[visualState.condition], '--secretion-opacity': visualState.secretionOpacity, '--sweat-opacity': visualState.sweat ? 1 : 0, '--tube-warning-opacity': visualState.tubePressureWarning ? 1 : 0, '--visual-expiration-duration': `${visualExpiratorySeconds.toFixed(2)}s`, '--visual-inspiration-duration': `${visualInspiratorySeconds.toFixed(2)}s` } as CSSProperties;

  // prettier-ignore
  return (
    <div aria-label={`상태 기반 삽관 환자 이미지, ${visualState.condition}, 산소포화도 ${vitals.spo2}%`} className={`patient-avatar ${visualState.condition} ${visualState.alarmGlow ? 'alarm-glow' : ''}`} data-alarm-level={alarmLevel} data-breath-pattern={breathPattern} data-breath-source={breathSource} data-condition={visualState.condition} data-expression={visualState.expression} data-apnea-seconds={breathPattern === 'apnea' ? displayedApneaSeconds : 0} data-left-chest-reduced={visualState.leftChestReduced} data-lip-color={visualState.lipColor} data-lung-color={visualState.lungColor} data-right-chest-reduced={visualState.rightChestReduced} data-scenario={scenario.type} data-ie-ratio={`1:${ieRatio.toFixed(1)}`} data-expiration-duration={visualExpiratorySeconds.toFixed(2)} data-inspiration-duration={visualInspiratorySeconds.toFixed(2)} data-inspiratory-hold={hasInspiratoryHold} data-expiratory-hold={hasExpiratoryHold} data-skin-tone={visualState.skinTone} data-trigger-mode={triggerMode} data-tube-pressure-warning={visualState.tubePressureWarning} data-testid="patient-avatar" role="img" style={style}>
      <svg aria-hidden="true" className="patient-avatar-svg" focusable="false" preserveAspectRatio="xMidYMid meet" viewBox={PATIENT_AVATAR_VIEWBOX_VALUE}>
        <g className="patient-avatar-coordinate-frame" transform={PATIENT_AVATAR_COORDINATE_FRAME_TRANSFORM}>
          <AvatarDefs />
          <BedLayer />
          <BodyLayer scenario={scenario} visualState={visualState} />
          <HeadLayer lipColor={LIP_COLOR_BY_STATE[visualState.lipColor]} profile={profile} visualState={visualState} vitals={vitals} />
          <AirwayLayer fio2={fio2} ieRatio={ieRatio} visualState={visualState} vitals={vitals} />
        </g>
        {breathPattern === 'apnea' ? (
          <g className="apnea-time-badge" aria-hidden="true">
            <rect x="1118" y="104" width="270" height="74" rx="18" fill="#21170c" stroke="#ffd84a" strokeOpacity="0.9" strokeWidth="3" />
            <text className="apnea-time-label" dominantBaseline="middle" fill="#ffd84a" textAnchor="middle" x="1253" y="143">
              {apneaLabel}
            </text>
          </g>
        ) : null}
      </svg>
      <div className="patient-state-effects" aria-hidden="true">
        <span className="effect-oxygen-normal" /><span className="effect-breath-chest" /><span className="effect-expiratory-fall" /><span className="effect-shoulder-lift" /><span className="effect-sternal-tug" /><span className="effect-intercostal-tug" /><span className="effect-abdominal-motion" /><span className="effect-spontaneous-trigger" /><span className="effect-cycling-cue" /><span className="effect-sync-indicator" /><span className="effect-double-trigger" /><span className="effect-wasted-trigger" /><span className="effect-auto-trigger" /><span className="effect-inspiratory-hold" /><span className="effect-expiratory-hold" /><span className="effect-circuit-inflation" /><span className="effect-circuit-collapse" /><span className="effect-apnea-hold" /><span className="effect-apnea-recovery" /><span className="effect-hypoxia-mask" />
        <span className="effect-cyanosis face" /><span className="effect-lip-cyanosis" /><span className="effect-pursed-lip-breath" /><span className="effect-cyanosis chest" /><span className="effect-lung-haze left" /><span className="effect-lung-haze right" /><span className="effect-lung-consolidation left" /><span className="effect-lung-consolidation right" />
        <span className="effect-pressure-compression" /><span className="effect-tube-warning" /><span className="effect-asynchrony-jolt shoulder" /><span className="effect-asynchrony-jolt tube" /><span className="effect-alarm-ring ring-a" /><span className="effect-alarm-ring ring-b" /><span className="effect-sweat drop-a" /><span className="effect-sweat drop-b" /><span className="effect-sweat drop-c" />
      </div>
    </div>
  );
}

/** Memoized patient visualization for the active scenario and clinical visual state. */
export const PatientAvatar2D = memo(PatientAvatar2DComponent);
