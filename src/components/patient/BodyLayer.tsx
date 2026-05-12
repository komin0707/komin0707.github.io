import { BodyBaseLayer } from './BodyBaseLayer';
import { BodyClinicalLines } from './BodyClinicalLines';
import { BodyElectrodes } from './BodyElectrodes';
import { BodyGownSurface } from './BodyGownSurface';
import { BodyLungFields } from './BodyLungFields';
import { BodyPeripheralPerfusion } from './BodyPeripheralPerfusion';
import { BodyRespiratoryPosture } from './BodyRespiratoryPosture';
import { lungClass, SECRETION_SPOTS } from './avatarSvgShared';
import { getSecretionColor } from './patientAvatarPalette';
import type { AvatarSvgPartsProps } from './patientAvatarSvgTypes';

export function BodyLayer({ scenario, visualState }: Pick<AvatarSvgPartsProps, 'scenario' | 'visualState'>) {
  // prettier-ignore
  const reducedChestMotionSide = scenario.reducedChestMotionSide ?? (scenario.oneSideChestMotionReduced ? 'left' : undefined);
  const leftLungClass = lungClass(visualState.lungColor, 'left', reducedChestMotionSide === 'left');
  const rightLungClass = lungClass(visualState.lungColor, 'right', reducedChestMotionSide === 'right');
  const visibleSecretionSpots = SECRETION_SPOTS.slice(
    0,
    visualState.secretionOpacity >= 0.75 ? 6 : visualState.secretionOpacity >= 0.35 ? 4 : 2,
  );
  const secretionColor = getSecretionColor(visualState.secretionOpacity);
  // prettier-ignore
  const respiratoryEffortOpacity = visualState.condition === 'critical' ? 0.88 : visualState.condition === 'worsening' ? 0.64 : visualState.condition === 'watch' ? 0.28 : 0.08;
  // prettier-ignore
  const mottlingOpacity = visualState.condition === 'critical' ? 0.82 : visualState.condition === 'worsening' ? 0.58 : visualState.condition === 'watch' ? 0.16 : 0;
  const edemaOpacity =
    visualState.condition === 'critical' ? 0.72 : visualState.condition === 'worsening' ? 0.28 : 0;
  const groundGlassOpacity = scenario.type === 'ards' ? 0.66 : 0;
  const hyperinflationOpacity = scenario.type === 'airwayObstruction' ? 0.68 : 0;
  const jaundiceOpacity = visualState.skinTone === 'jaundiced' ? 0.44 : 0;
  const pallorOpacity = visualState.skinTone === 'pale' ? 0.42 : 0;
  const pleuralAirOpacity = scenario.type === 'pneumothorax' ? 0.78 : 0;
  // prettier-ignore
  const decompensationPostureOpacity = visualState.condition === 'critical' ? 0.9 : visualState.condition === 'worsening' ? 0.5 : visualState.condition === 'watch' ? 0.18 : 0;
  // prettier-ignore
  const peripheralCyanosisOpacity = visualState.skinTone === 'severelyCyanotic' ? 0.82 : visualState.skinTone === 'cyanotic' ? 0.48 : 0;
  const recoveryPostureOpacity = visualState.condition === 'stable' ? 0.34 : 0;
  // prettier-ignore
  const erythemaOpacity = scenario.type === 'pneumonia' ? 0.32 : visualState.condition === 'watch' || visualState.condition === 'worsening' ? 0.16 : 0;

  // prettier-ignore
  return (
    <g className={`body ${visualState.skinTone}`} filter="url(#softShadow)">
      <BodyBaseLayer edemaOpacity={edemaOpacity} jaundiceOpacity={jaundiceOpacity} pallorOpacity={pallorOpacity} />
      <BodyRespiratoryPosture decompensationPostureOpacity={decompensationPostureOpacity} recoveryPostureOpacity={recoveryPostureOpacity} respiratoryEffortOpacity={respiratoryEffortOpacity} />
      <BodyPeripheralPerfusion mottlingOpacity={mottlingOpacity} peripheralCyanosisOpacity={peripheralCyanosisOpacity} />
      <BodyClinicalLines scenario={scenario} visualState={visualState} />
      <BodyLungFields groundGlassOpacity={groundGlassOpacity} hyperinflationOpacity={hyperinflationOpacity} leftLungClass={leftLungClass} pleuralAirOpacity={pleuralAirOpacity} rightLungClass={rightLungClass} secretionColor={secretionColor} visibleSecretionSpots={visibleSecretionSpots} visualState={visualState} />
      <BodyGownSurface erythemaOpacity={erythemaOpacity} />
      <BodyElectrodes />
    </g>
  );
}
