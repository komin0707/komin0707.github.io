import type { Scenario } from '@/simulation/scenarios';
import type { DerivedVitals, PatientVisualState } from '@/simulation/ventilatorModel';
import type { PatientAvatarProfile } from './patientAvatarGeometry';

export type AvatarSvgPartsProps = {
  lipColor: string;
  profile: PatientAvatarProfile;
  scenario: Scenario;
  visualState: PatientVisualState;
  vitals: DerivedVitals;
};
