import { BodyDrapeAndLegs, BodyFeetEdema, BodyTorsoBase } from './BodyBaseParts';

type BodyBaseLayerProps = { edemaOpacity: number; jaundiceOpacity: number; pallorOpacity: number };

export function BodyBaseLayer({ edemaOpacity, jaundiceOpacity, pallorOpacity }: BodyBaseLayerProps) {
  return (
    <>
      <BodyTorsoBase jaundiceOpacity={jaundiceOpacity} pallorOpacity={pallorOpacity} />
      <BodyDrapeAndLegs />
      <BodyFeetEdema edemaOpacity={edemaOpacity} />
    </>
  );
}
