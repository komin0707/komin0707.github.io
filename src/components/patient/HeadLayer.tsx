import { HeadAnatomy } from './HeadAnatomy';
import { HeadFacialFeatures } from './HeadFacialFeatures';
import { getCheekColor, getUnderEyeColor, PATIENT_AVATAR_PALETTE } from './patientAvatarPalette';
import type { AvatarSvgPartsProps } from './patientAvatarSvgTypes';

type HeadLayerProps = Pick<AvatarSvgPartsProps, 'lipColor' | 'profile' | 'visualState' | 'vitals'>;

export function HeadLayer({ lipColor, profile, visualState, vitals }: HeadLayerProps) {
  const strained = visualState.expression === 'strained';
  const stressed = visualState.expression === 'distressed' || visualState.expression === 'critical';
  const drowsy = visualState.expression === 'drowsy';
  const stupor = visualState.expression === 'stupor';
  const coma = visualState.expression === 'coma';
  const critical = visualState.expression === 'critical';
  const reducedConsciousness = drowsy || stupor || coma;
  const pupilState = critical ? 'dilated' : stupor || coma ? 'sluggish' : 'normal';
  // prettier-ignore
  const eyeHeight = coma ? 0.7 : stupor ? 1.4 : drowsy ? 2.4 : stressed ? 3.5 : strained ? 3.7 : 3.9;
  const pupilRadius = critical ? 3 : coma ? 2.4 : 1.9;
  // prettier-ignore
  const pupilReflexOpacity = critical ? 0.78 : coma ? 0.12 : stupor ? 0.2 : drowsy ? 0.32 : 0.18;
  const cheekColor = getCheekColor(visualState.condition);
  // prettier-ignore
  const cheekOpacity = visualState.condition === 'critical' ? 0.5 : visualState.condition === 'worsening' ? 0.34 : 0.18;
  const underEyeColor = getUnderEyeColor(visualState.expression);
  const jaundiceOpacity = visualState.skinTone === 'jaundiced' ? 0.44 : 0;
  const pallorOpacity = Math.max(
    visualState.skinTone === 'pale' ? 0.42 : 0,
    vitals.meanArterialPressure < 65 ? 0.5 : 0,
  );
  const feverFlushOpacity =
    vitals.temperatureCelsius >= 38.5 ? Math.min(0.52, (vitals.temperatureCelsius - 37.5) * 0.34) : 0;
  // prettier-ignore
  const nasalFlareOpacity = critical ? 0.9 : stressed ? 0.62 : strained ? 0.34 : drowsy ? 0.28 : 0.1;
  // prettier-ignore
  const mouthPath = critical ? 'M165 157 C178 149 202 151 219 162' : stressed ? 'M165 156 C180 150 203 151 218 159' : strained ? 'M166 155 C181 153 203 154 218 157' : reducedConsciousness ? 'M168 156 C183 159 203 159 218 155' : 'M167 154 C184 158 202 158 218 153';
  // prettier-ignore
  const mouthOpeningPath = critical ? 'M164 157 C177 146 203 148 220 162 C205 174 179 173 164 157Z' : stressed ? 'M166 156 C180 150 203 151 218 159 C204 166 180 165 166 156Z' : strained ? 'M167 155 C181 152 203 153 218 157 C204 162 181 162 167 155Z' : reducedConsciousness ? 'M169 156 C183 160 203 160 217 156 C204 163 183 164 169 156Z' : 'M170 154 C184 157 202 157 216 153 C202 156 184 157 170 154Z';
  // prettier-ignore
  const mouthOpeningOpacity = critical ? 0.72 : stressed ? 0.44 : reducedConsciousness ? 0.32 : strained ? 0.24 : 0.08;
  // prettier-ignore
  const foreheadWrinkleOpacity = critical ? 0.78 : stressed ? 0.52 : strained ? 0.3 : drowsy ? 0.22 : stupor ? 0.18 : coma ? 0.12 : 0.1;
  // prettier-ignore
  const headTransform = profile.headRotation === 'left' ? 'translate(96 14) scale(0.72) rotate(-8 190 118)' : profile.headRotation === 'right' ? 'translate(96 14) scale(0.72) rotate(8 190 118)' : 'translate(96 14) scale(0.72)';
  const ageLineOpacity = profile.ageGroup === 'olderAdult' ? 0.46 : 0.08;
  const eyelidEdemaOpacity =
    visualState.condition === 'critical' ? 0.48 : visualState.condition === 'worsening' ? 0.22 : 0;
  const jawWidth =
    profile.sexPresentation === 'male' ? 2.4 : profile.sexPresentation === 'female' ? 1.4 : 1.8;
  const hairFill = PATIENT_AVATAR_PALETTE.hair[profile.hairColor];
  const hairHighlightFill = PATIENT_AVATAR_PALETTE.hairHighlight[profile.hairColor];

  // prettier-ignore
  return (
    <g className={`head pupil-state-${pupilState}`} data-age-group={profile.ageGroup} data-hair-color={profile.hairColor} data-pupil-state={pupilState} data-sex-presentation={profile.sexPresentation} filter="url(#softShadow)" transform={headTransform}>
      <HeadAnatomy feverFlushOpacity={feverFlushOpacity} hairFill={hairFill} hairHighlightFill={hairHighlightFill} jaundiceOpacity={jaundiceOpacity} pallorOpacity={pallorOpacity} profile={profile} />
      <HeadFacialFeatures ageLineOpacity={ageLineOpacity} cheekColor={cheekColor} cheekOpacity={Math.max(cheekOpacity, feverFlushOpacity)} critical={critical} droolOpacity={Math.max(reducedConsciousness || critical ? 0.56 : 0.02, vitals.paco2 > 60 ? 0.42 : 0)} drowsy={drowsy} eyeHeight={eyeHeight} eyelidEdemaOpacity={eyelidEdemaOpacity} feverFlushOpacity={feverFlushOpacity} foreheadWrinkleOpacity={foreheadWrinkleOpacity} jawWidth={jawWidth} lipColor={lipColor} mouthOpeningOpacity={mouthOpeningOpacity} mouthOpeningPath={mouthOpeningPath} mouthPath={mouthPath} nasalFlareOpacity={nasalFlareOpacity} pupilRadius={pupilRadius} pupilReflexOpacity={pupilReflexOpacity} reducedConsciousness={reducedConsciousness} strained={strained} stressed={stressed} tongueOpacity={Math.max(critical ? 0.42 : reducedConsciousness ? 0.28 : 0.04, vitals.paco2 > 60 ? 0.3 : 0)} underEyeColor={underEyeColor} visualState={visualState} />
    </g>
  );
}
