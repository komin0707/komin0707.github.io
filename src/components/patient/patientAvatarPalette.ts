import type { PatientVisualState } from '@/simulation/ventilatorModel';

export const PATIENT_AVATAR_PALETTE = {
  cheek: {
    critical: '#263b9b',
    stable: '#d99482',
    watch: '#d9a081',
    worsening: '#4d62bc',
  },
  clinical: {
    danger: '#ff4545',
    emergency: '#ff3030',
    normal: '#35d27f',
    warning: '#ffd84a',
  },
  ecgLead: {
    la: '#1f2937',
    ll: '#e53935',
    ra: '#f8fcff',
    rl: '#35d27f',
    v1: '#8b5a2b',
    v2: '#7c3aed',
    v3: '#2563eb',
    v4: '#0ea5e9',
    v5: '#14b8a6',
    v6: '#f97316',
  },
  hair: {
    black: '#242118',
    darkBrown: '#3a2a1d',
    gray: '#8f9699',
  },
  hairHighlight: {
    black: '#3a3327',
    darkBrown: '#604329',
    gray: '#c4cbce',
  },
  lip: {
    blue: '#4d62bc',
    deepBlue: '#273a8f',
    normal: '#b96f67',
  },
  lung: {
    collapsed: '#2f343d',
    collapsedStroke: '#111827',
    healthy: '#de8384',
    inflamed: '#c94c4f',
    stiff: '#793749',
  },
  outline: {
    patient: '#f3c7b6',
    patientHighContrast: '#ffe1d4',
  },
  pathology: {
    bleeding: '#c1121f',
    emesis: '#7a4d21',
  },
  secretion: {
    high: '#b8c63d',
    low: '#f4df8a',
    medium: '#ffd352',
  },
  skin: {
    cyanosisOverlay: '#5b8dff',
    facialDistress: '#7f514c',
    facialDistressCritical: '#293a90',
    jaundiceOverlay: '#e6c84f',
    underEye: '#9a6558',
    underEyeHypoxic: '#5362a8',
  },
} as const;

export function getCheekColor(condition: PatientVisualState['condition']) {
  return PATIENT_AVATAR_PALETTE.cheek[condition];
}

export function getSecretionColor(secretionOpacity: number) {
  if (secretionOpacity >= 0.75) return PATIENT_AVATAR_PALETTE.secretion.high;
  if (secretionOpacity >= 0.35) return PATIENT_AVATAR_PALETTE.secretion.medium;
  return PATIENT_AVATAR_PALETTE.secretion.low;
}

export function getUnderEyeColor(expression: PatientVisualState['expression']) {
  return expression === 'critical' || expression === 'drowsy'
    ? PATIENT_AVATAR_PALETTE.skin.underEyeHypoxic
    : PATIENT_AVATAR_PALETTE.skin.underEye;
}
