import { BodyArmPerfusion, BodyPeripheralCyanosis, BodyPeripheralMottling } from './BodyPeripheralParts';

type BodyPeripheralPerfusionProps = { mottlingOpacity: number; peripheralCyanosisOpacity: number };

export function BodyPeripheralPerfusion({
  mottlingOpacity,
  peripheralCyanosisOpacity,
}: BodyPeripheralPerfusionProps) {
  return (
    <>
      <BodyArmPerfusion />
      <BodyPeripheralCyanosis peripheralCyanosisOpacity={peripheralCyanosisOpacity} />
      <BodyPeripheralMottling mottlingOpacity={mottlingOpacity} />
    </>
  );
}
