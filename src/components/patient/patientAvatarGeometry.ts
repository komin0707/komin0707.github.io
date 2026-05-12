export const PATIENT_AVATAR_BASE_COORDINATE_SPACE = {
  height: 360,
  width: 640,
} as const;

export const PATIENT_AVATAR_VIEWBOX = {
  height: 941,
  width: 1672,
} as const;

export const PATIENT_AVATAR_VIEWBOX_VALUE = `0 0 ${PATIENT_AVATAR_VIEWBOX.width} ${PATIENT_AVATAR_VIEWBOX.height}`;

export const PATIENT_AVATAR_COORDINATE_FRAME_TRANSFORM = `scale(${
  PATIENT_AVATAR_VIEWBOX.width / PATIENT_AVATAR_BASE_COORDINATE_SPACE.width
} ${PATIENT_AVATAR_VIEWBOX.height / PATIENT_AVATAR_BASE_COORDINATE_SPACE.height})`;

export const PATIENT_AVATAR_LAYER_BOUNDS = {
  airway: { maxX: 622, maxY: 232, minX: 120, minY: 103 },
  bed: { maxX: 612, maxY: 360, minX: 34, minY: 31 },
  body: { maxX: 580, maxY: 360, minX: 18, minY: 156 },
  head: { maxX: 267, maxY: 203, minX: 120, minY: 28 },
} as const;

export const PATIENT_AVATAR_SUPINE_GEOMETRY = {
  bedHorizontalMarginTolerance: 0.1,
  cameraAngle: 'supine-oblique',
  headWidthToPatientWidth: { max: 0.24, min: 0.12 },
  monitorQuadrant: 'upper-right',
  patientRotation: 'aligned-to-bed-long-axis',
  projectedArmToTorsoRatio: { max: 1.15, min: 0.55 },
  projectedHeadToBodyRatio: { max: 0.34, min: 0.14 },
  projectedLegToTorsoRatio: { max: 1.45, min: 0.65 },
  projectedShoulderToHeadRatio: { max: 3.8, min: 1.9 },
} as const;

export const PATIENT_AVATAR_PROFILE_OPTIONS = {
  ageGroup: ['adult', 'olderAdult'],
  hairColor: ['black', 'darkBrown', 'gray'],
  headRotation: ['supine', 'left', 'right'],
  sexPresentation: ['neutral', 'female', 'male'],
} as const;

export type PatientAvatarProfile = {
  ageGroup: (typeof PATIENT_AVATAR_PROFILE_OPTIONS.ageGroup)[number];
  hairColor: (typeof PATIENT_AVATAR_PROFILE_OPTIONS.hairColor)[number];
  headRotation: (typeof PATIENT_AVATAR_PROFILE_OPTIONS.headRotation)[number];
  sexPresentation: (typeof PATIENT_AVATAR_PROFILE_OPTIONS.sexPresentation)[number];
};

export const DEFAULT_PATIENT_AVATAR_PROFILE: PatientAvatarProfile = {
  ageGroup: 'adult',
  hairColor: 'black',
  headRotation: 'supine',
  sexPresentation: 'neutral',
};
