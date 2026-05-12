import type { PatientVisualState } from '@/simulation/ventilatorModel';
import { HeadExpressionMarks } from './HeadExpressionMarks';
import { HeadEyes } from './HeadEyes';

type HeadFacialFeaturesProps = {
  ageLineOpacity: number;
  cheekColor: string;
  cheekOpacity: number;
  critical: boolean;
  droolOpacity: number;
  drowsy: boolean;
  eyeHeight: number;
  eyelidEdemaOpacity: number;
  feverFlushOpacity: number;
  foreheadWrinkleOpacity: number;
  jawWidth: number;
  lipColor: string;
  mouthOpeningOpacity: number;
  mouthOpeningPath: string;
  mouthPath: string;
  nasalFlareOpacity: number;
  pupilRadius: number;
  pupilReflexOpacity: number;
  reducedConsciousness: boolean;
  strained: boolean;
  stressed: boolean;
  tongueOpacity: number;
  underEyeColor: string;
  visualState: PatientVisualState;
};

export function HeadFacialFeatures(props: HeadFacialFeaturesProps) {
  return (
    <>
      <HeadEyes
        cheekColor={props.cheekColor}
        cheekOpacity={props.cheekOpacity}
        critical={props.critical}
        drowsy={props.drowsy}
        eyeHeight={props.eyeHeight}
        eyelidEdemaOpacity={props.eyelidEdemaOpacity}
        pupilRadius={props.pupilRadius}
        pupilReflexOpacity={props.pupilReflexOpacity}
        underEyeColor={props.underEyeColor}
      />
      <HeadExpressionMarks
        ageLineOpacity={props.ageLineOpacity}
        critical={props.critical}
        droolOpacity={props.droolOpacity}
        drowsy={props.drowsy}
        feverFlushOpacity={props.feverFlushOpacity}
        foreheadWrinkleOpacity={props.foreheadWrinkleOpacity}
        jawWidth={props.jawWidth}
        lipColor={props.lipColor}
        mouthOpeningOpacity={props.mouthOpeningOpacity}
        mouthOpeningPath={props.mouthOpeningPath}
        mouthPath={props.mouthPath}
        nasalFlareOpacity={props.nasalFlareOpacity}
        reducedConsciousness={props.reducedConsciousness}
        strained={props.strained}
        stressed={props.stressed}
        tongueOpacity={props.tongueOpacity}
        visualState={props.visualState}
      />{' '}
    </>
  );
}
