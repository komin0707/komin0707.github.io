import type { PatientVisualState } from '@/simulation/ventilatorModel';
import { BodyLungAirways, BodyLungBase, BodyLungFindings, BodyLungSecretions } from './BodyLungParts';

export type SecretionSpot = { cx: number; cy: number; r: number };

type BodyLungFieldsProps = {
  groundGlassOpacity: number;
  hyperinflationOpacity: number;
  leftLungClass: string;
  pleuralAirOpacity: number;
  rightLungClass: string;
  secretionColor: string;
  visibleSecretionSpots: readonly SecretionSpot[];
  visualState: PatientVisualState;
};

export function BodyLungFields({
  groundGlassOpacity,
  hyperinflationOpacity,
  leftLungClass,
  pleuralAirOpacity,
  rightLungClass,
  secretionColor,
  visibleSecretionSpots,
  visualState,
}: BodyLungFieldsProps) {
  return (
    <g
      className={`chest-motion ${visualState.leftChestReduced ? 'left-reduced' : ''} ${visualState.rightChestReduced ? 'right-reduced' : ''}`}
    >
      <BodyLungBase
        hyperinflationOpacity={hyperinflationOpacity}
        leftLungClass={leftLungClass}
        pleuralAirOpacity={pleuralAirOpacity}
        rightLungClass={rightLungClass}
      />
      <BodyLungFindings groundGlassOpacity={groundGlassOpacity} />
      <BodyLungAirways />
      <BodyLungSecretions secretionColor={secretionColor} visibleSecretionSpots={visibleSecretionSpots} />
    </g>
  );
}
