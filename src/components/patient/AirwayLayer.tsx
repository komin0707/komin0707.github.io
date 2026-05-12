import { AirwayCircuit } from './AirwayCircuit';
import { AirwayEquipment } from './AirwayEquipment';
import { AirwayProximal } from './AirwayProximal';
import type { AvatarSvgPartsProps } from './patientAvatarSvgTypes';

export function AirwayLayer({
  fio2,
  ieRatio,
  visualState,
  vitals,
}: Pick<AvatarSvgPartsProps, 'visualState' | 'vitals'> & { fio2: number; ieRatio: number }) {
  return (
    <g className="airway">
      <AirwayProximal />
      <AirwayCircuit visualState={visualState} />
      <AirwayEquipment fio2={fio2} ieRatio={ieRatio} vitals={vitals} />
    </g>
  );
}
