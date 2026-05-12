import type { PatientVisualState } from '@/simulation/ventilatorModel';
import { PATIENT_AVATAR_PALETTE } from './patientAvatarPalette';

export const lungClass = (
  state: PatientVisualState['lungColor'],
  side: 'left' | 'right',
  collapsed: boolean,
) => `anatomy-lung ${side} ${collapsed ? 'collapsed' : state}`;

export const SECRETION_SPOTS = [
  { cx: 208, cy: 311, r: 4.5 },
  { cx: 234, cy: 283, r: 3.5 },
  { cx: 287, cy: 292, r: 4.5 },
  { cx: 305, cy: 319, r: 3.5 },
  { cx: 217, cy: 296, r: 3.2 },
  { cx: 298, cy: 306, r: 3.1 },
];

export const ECG_LEAD_MARKERS = [
  {
    className: 'lead-ra',
    cx: 178,
    cy: 251,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.ra,
    label: 'RA',
    textFill: '#10263d',
  },
  {
    className: 'lead-la',
    cx: 315,
    cy: 253,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.la,
    label: 'LA',
    textFill: '#f8fcff',
  },
  {
    className: 'lead-v1',
    cx: 226,
    cy: 244,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.v1,
    label: 'V1',
    textFill: '#fff8ed',
  },
  {
    className: 'lead-v2',
    cx: 242,
    cy: 252,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.v2,
    label: 'V2',
    textFill: '#fff8ff',
  },
  {
    className: 'lead-v3',
    cx: 257,
    cy: 261,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.v3,
    label: 'V3',
    textFill: '#f8fcff',
  },
  {
    className: 'lead-v4',
    cx: 273,
    cy: 273,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.v4,
    label: 'V4',
    textFill: '#052235',
  },
  {
    className: 'lead-v5',
    cx: 292,
    cy: 286,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.v5,
    label: 'V5',
    textFill: '#052014',
  },
  {
    className: 'lead-v6',
    cx: 313,
    cy: 296,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.v6,
    label: 'V6',
    textFill: '#fff8ed',
  },
  {
    className: 'lead-rl',
    cx: 276,
    cy: 246,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.rl,
    label: 'RL',
    textFill: '#052014',
  },
  {
    className: 'lead-ll',
    cx: 249,
    cy: 340,
    fill: PATIENT_AVATAR_PALETTE.ecgLead.ll,
    label: 'LL',
    textFill: '#fff6f4',
  },
] as const;
