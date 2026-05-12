import { type RenderResult, render } from '@testing-library/react';
import type { ComponentProps, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';
import { DEFAULT_PATIENT_AVATAR_PROFILE } from './patientAvatarGeometry';
import { AvatarDefs, HeadLayer } from './patientAvatarSvgParts';

type HeadLayerProps = ComponentProps<typeof HeadLayer>;

const BILATERAL_COUNT = 2;
const HAIR_STRAND_COUNT = 4;
const HAIR_FLOW_LOCK_COUNT = 3;
const HAIR_DISARRAY_COUNT = 2;
const SWEAT_DROP_COUNT = 3;
const TOOTH_COUNT = 3;

const normal = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal);
const pneumonia = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
const critical = calculateSimulation(
  { ...DEFAULT_SETTINGS, fio2: 21, peep: 20, tidalVolume: 1000, flow: 100 },
  SCENARIOS.ards,
);

describe('patient avatar head SVG parts', () => {
  registerBaselineHeadTests();
  registerExpressionAndSkinToneTests();
  registerNeurologicStateTests();
  registerCriticalHeadTests();
  registerProfileVariationTests();
});

function registerBaselineHeadTests(): void {
  it('renders calm head anatomy, hair, face, and baseline reflex state', () => {
    const { container } = renderHeadLayer();

    expectBaselineHeadStructure(container);
    expectBaselineFaceState(container);
    expectBaselineHairAndFeatures(container);
  });
}

function registerExpressionAndSkinToneTests(): void {
  it('renders drowsy, pale strained, distressed, and jaundiced face states', () => {
    const { container, rerender } = renderHeadLayer();

    rerender(
      renderHeadSvg({ lipColor: '#4d62bc', visualState: { ...pneumonia.visualState, expression: 'drowsy' } }),
    );
    expectDrowsyHead(container);

    rerender(
      renderHeadSvg({
        visualState: { ...normal.visualState, condition: 'watch', expression: 'strained', skinTone: 'pale' },
      }),
    );
    expectPaleStrainedHead(container);

    rerender(
      renderHeadSvg({
        lipColor: '#4d62bc',
        visualState: { ...pneumonia.visualState, condition: 'worsening', expression: 'distressed' },
      }),
    );
    expectDistressedHead(container);

    rerender(
      renderHeadSvg({
        visualState: {
          ...normal.visualState,
          condition: 'watch',
          expression: 'strained',
          skinTone: 'jaundiced',
        },
      }),
    );
    expect(container.querySelector('.head .jaundice-wash.face')).toHaveAttribute('opacity', '0.44');

    rerender(renderHeadSvg({ visualState: pneumonia.visualState, vitals: pneumonia.vitals }));
    expect(Number(container.querySelector('.fever-flush-wash.face')?.getAttribute('opacity'))).toBeCloseTo(
      0.37,
      2,
    );
    expect(Number(container.querySelector('.forehead-flush')?.getAttribute('opacity'))).toBeCloseTo(0.17, 2);
  });
}

function registerNeurologicStateTests(): void {
  it('renders stupor and coma pupil and eyelid states', () => {
    const { container, rerender } = renderHeadLayer();

    rerender(
      renderHeadSvg({ lipColor: '#4d62bc', visualState: { ...normal.visualState, expression: 'stupor' } }),
    );
    expect(container.querySelector('ellipse[rx="12.5"]')).toHaveAttribute('ry', '1.4');
    expect(container.querySelector('.head')).toHaveAttribute('data-pupil-state', 'sluggish');
    expect(container.querySelector('.pupil-reflex-ring.left')).toHaveAttribute('opacity', '0.2');

    rerender(
      renderHeadSvg({ lipColor: '#4d62bc', visualState: { ...normal.visualState, expression: 'coma' } }),
    );
    expect(container.querySelector('ellipse[rx="12.5"]')).toHaveAttribute('ry', '0.7');
    expect(container.querySelector('.head')).toHaveAttribute('data-pupil-state', 'sluggish');
    expect(container.querySelector('.pupil-reflex-ring.left')).toHaveAttribute('opacity', '0.12');
  });
}

function registerCriticalHeadTests(): void {
  it('renders critical cyanosis, dilated pupils, sweat, edema, and facial markers', () => {
    const { container, rerender } = renderHeadLayer();

    rerender(renderHeadSvg({ lipColor: '#273a8f', visualState: critical.visualState }));

    expect(container.querySelector('path[stroke="#273a8f"]')).toBeInTheDocument();
    expect(container.querySelector('.head')).toHaveAttribute('data-pupil-state', 'dilated');
    expect(container.querySelector('.pupil.left')).toHaveAttribute('r', '3');
    expect(container.querySelector('.pupil-reflex-ring.left')).toHaveAttribute('opacity', '0.78');
    expect(container.querySelector('.mouth-opening')).toHaveAttribute('opacity', '0.72');
    expect(container.querySelector('.forehead-wrinkle')).toHaveAttribute('opacity', '0.78');
    expect(container.querySelector('.glabellar-crease')).toHaveAttribute('opacity', '0.78');
    expect(container.querySelector('.eyelid-edema.left')).toHaveAttribute('opacity', '0.48');
    expect(container.querySelector('.facial-state-marker')).toHaveAttribute('stroke', '#293a90');
    expect(container.querySelector('.cheek')).toHaveAttribute('fill', '#263b9b');
    expect(container.querySelector('.nasal-flare.left')).toHaveAttribute('opacity', '0.9');
    expect(container.querySelector('.subconjunctival-hemorrhage.left')).toHaveAttribute('opacity', '0.62');
    expect(container.querySelector('.pupil.right')).toHaveAttribute('r', '2.3');
    expect(container.querySelector('.drool-line')).toHaveAttribute('opacity', '0.56');
    expect(container.querySelector('.gum-line')).toHaveAttribute('stroke', '#7860a3');
    expect(container.querySelector('.tongue-edge')).toHaveAttribute('stroke', '#7447a1');
    expect(container.querySelectorAll('.intubation-tooth')).toHaveLength(TOOTH_COUNT);
    expect(container.querySelectorAll('.sweat-drop-shape')).toHaveLength(SWEAT_DROP_COUNT);
    expect(container.querySelectorAll('.sweat-shine')).toHaveLength(BILATERAL_COUNT);
    expect(container.querySelectorAll('.sweat-flow-line')).toHaveLength(BILATERAL_COUNT);
  });
}

function registerProfileVariationTests(): void {
  it('renders demographic hair, sex presentation, and head rotation variants', () => {
    const { container, rerender } = renderHeadLayer();

    rerender(
      renderHeadSvg({
        profile: {
          ageGroup: 'olderAdult',
          hairColor: 'gray',
          headRotation: 'left',
          sexPresentation: 'female',
        },
      }),
    );
    expectOlderAdultFemaleHead(container);

    rerender(
      renderHeadSvg({
        profile: {
          ageGroup: 'adult',
          hairColor: 'darkBrown',
          headRotation: 'right',
          sexPresentation: 'male',
        },
      }),
    );
    expect(container.querySelector('.head')).toHaveAttribute(
      'transform',
      'translate(96 14) scale(0.72) rotate(8 190 118)',
    );
    expect(container.querySelector('.hair-mass')).toHaveAttribute('fill', '#3a2a1d');
    expect(container.querySelector('.hair-highlight')).toHaveAttribute('fill', '#604329');
    expect(container.querySelector('.facial-state-marker')).toHaveAttribute('stroke-width', '2.4');
  });
}

function renderHeadLayer(overrides: Partial<HeadLayerProps> = {}): RenderResult {
  return render(renderHeadSvg(overrides));
}

function renderHeadSvg(overrides: Partial<HeadLayerProps> = {}): ReactElement {
  return (
    <svg>
      <AvatarDefs />
      <HeadLayer
        lipColor="#b96f67"
        profile={DEFAULT_PATIENT_AVATAR_PROFILE}
        visualState={normal.visualState}
        vitals={normal.vitals}
        {...overrides}
      />
    </svg>
  );
}

function expectBaselineHeadStructure(container: HTMLElement): void {
  expect(container.querySelector('.head')).toBeInTheDocument();
  expect(container.querySelector('.head')).toHaveAttribute('data-pupil-state', 'normal');
  expect(container.querySelector('.head')).toHaveAttribute('transform', 'translate(96 14) scale(0.72)');
  expect(container.querySelector('.neck-column')).toBeInTheDocument();
  expect(container.querySelector('.face-highlight')).toBeInTheDocument();
  expect(container.querySelector('.face-oval')).toBeInTheDocument();
  expect(container.querySelector('.skin-overlay')).toBeInTheDocument();
  expect(container.querySelector('.nose-bridge')).toBeInTheDocument();
  expect(container.querySelector('.nose-ridge-highlight')).toBeInTheDocument();
  expect(container.querySelector('.nose-tip')).toBeInTheDocument();
  expect(container.querySelector('.nostril-line')).toBeInTheDocument();
  expect(container.querySelectorAll('.nostril')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.philtrum-shadow')).toBeInTheDocument();
  expect(container.querySelector('.philtrum-groove')).toBeInTheDocument();
  expect(container.querySelector('.chin-shadow')).toBeInTheDocument();
  expect(container.querySelector('.adam-apple')).toBeInTheDocument();
  expect(container.querySelectorAll('.neck-muscle')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.head-ear')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.ear-helix')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.ear-lobe')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.face-asymmetry-contour')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.cheekbone-shadow')).toHaveLength(BILATERAL_COUNT);
}

function expectBaselineFaceState(container: HTMLElement): void {
  expect(container.querySelector('path[stroke="#b96f67"]')).toBeInTheDocument();
  expect(container.querySelectorAll('.brow')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.brow-head-tail')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.iris')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('circle[fill="#0e0907"]')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('ellipse[fill="#f4e9df"]')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.eye-socket-shadow')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.sunken-eye-shadow')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.proptosis-highlight')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.subconjunctival-hemorrhage')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.eyelashes')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.eyelid-thickness')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.pupil-reflex-ring')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.pupil-reflex-ring.left')).toHaveAttribute('opacity', '0.18');
  expect(container.querySelector('.mouth-opening')).toHaveAttribute('opacity', '0.08');
  expect(container.querySelector('.upper-lip-volume')).toBeInTheDocument();
  expect(container.querySelector('.lower-lip-volume')).toBeInTheDocument();
  expect(container.querySelector('.cupid-bow')).toBeInTheDocument();
  expect(container.querySelector('.oral-mucosa')).toBeInTheDocument();
  expect(container.querySelector('.gum-line')).toBeInTheDocument();
  expect(container.querySelector('.tongue-edge')).toBeInTheDocument();
  expect(container.querySelectorAll('.intubation-tooth')).toHaveLength(TOOTH_COUNT);
  expect(container.querySelector('.drool-line')).toHaveAttribute('opacity', '0.02');
  expect(container.querySelector('.fever-flush-wash.face')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.forehead-wrinkle')).toHaveAttribute('opacity', '0.1');
  expect(container.querySelector('.head .pallor-wash.face')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.head .jaundice-wash.face')).toHaveAttribute('opacity', '0');
}

function expectBaselineHairAndFeatures(container: HTMLElement): void {
  expect(container.querySelector('.hair-mass')).toBeInTheDocument();
  expect(container.querySelector('.hair-highlight')).toBeInTheDocument();
  expect(container.querySelector('.hairline-shape')).toBeInTheDocument();
  expect(container.querySelector('.m-recession')).toBeInTheDocument();
  expect(container.querySelectorAll('.hair-strand')).toHaveLength(HAIR_STRAND_COUNT);
  expect(container.querySelectorAll('.hair-flow-lock')).toHaveLength(HAIR_FLOW_LOCK_COUNT);
  expect(container.querySelectorAll('.hair-disarray')).toHaveLength(HAIR_DISARRAY_COUNT);
  expect(container.querySelector('.short-hair-length')).toBeInTheDocument();
  expect(container.querySelectorAll('.gray-hair-strand')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.scalp-shadow')).toBeInTheDocument();
  expect(container.querySelector('.hair-mass')).toHaveAttribute('fill', '#242118');
  expect(container.querySelector('.hair-highlight')).toHaveAttribute('fill', '#3a3327');
  expect(container.querySelectorAll('.cheek')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.blink-lid')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.facial-state-marker')).toHaveAttribute('stroke-opacity', '0.12');
  expect(container.querySelectorAll('.nasal-flare')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.nasal-flare.left')).toHaveAttribute('opacity', '0.1');
  expect(container.querySelectorAll('.eyelid-edema')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.eyelid-edema.left')).toHaveAttribute('opacity', '0');
}

function expectDrowsyHead(container: HTMLElement): void {
  expect(container.querySelector('path[stroke="#4d62bc"]')).toBeInTheDocument();
  expect(container.querySelector('ellipse[rx="12.5"]')).toHaveAttribute('ry', '2.4');
  expect(container.querySelector('.pupil-reflex-ring.left')).toHaveAttribute('opacity', '0.32');
  expect(container.querySelector('.mouth-opening')).toHaveAttribute('opacity', '0.32');
  expect(container.querySelector('.forehead-wrinkle')).toHaveAttribute('opacity', '0.22');
  expect(container.querySelector('.under-eye-shadow.left')).toHaveAttribute('stroke', '#5362a8');
  expect(container.querySelector('.nasal-flare.left')).toHaveAttribute('opacity', '0.28');
}

function expectPaleStrainedHead(container: HTMLElement): void {
  expect(container.querySelector('.head .pallor-wash.face')).toHaveAttribute('opacity', '0.42');
  expect(container.querySelector('.mouth-opening')).toHaveAttribute('opacity', '0.24');
  expect(container.querySelector('.forehead-wrinkle')).toHaveAttribute('opacity', '0.3');
  expect(container.querySelector('.nasal-flare.left')).toHaveAttribute('opacity', '0.34');
}

function expectDistressedHead(container: HTMLElement): void {
  expect(container.querySelector('.mouth-opening')).toHaveAttribute('opacity', '0.44');
  expect(container.querySelector('.forehead-wrinkle')).toHaveAttribute('opacity', '0.52');
  expect(container.querySelector('.glabellar-crease')).toHaveAttribute('opacity', '0.52');
  expect(container.querySelector('.nasal-flare.left')).toHaveAttribute('opacity', '0.62');
  expect(container.querySelector('.facial-state-marker')).toHaveAttribute('stroke-opacity', '0.42');
}

function expectOlderAdultFemaleHead(container: HTMLElement): void {
  expect(container.querySelector('.head')).toHaveAttribute('data-age-group', 'olderAdult');
  expect(container.querySelector('.head')).toHaveAttribute('data-hair-color', 'gray');
  expect(container.querySelector('.head')).toHaveAttribute('data-sex-presentation', 'female');
  expect(container.querySelector('.head')).toHaveAttribute(
    'transform',
    'translate(96 14) scale(0.72) rotate(-8 190 118)',
  );
  expect(container.querySelector('.hair-mass')).toHaveAttribute('fill', '#8f9699');
  expect(container.querySelector('.hair-highlight')).toHaveAttribute('fill', '#c4cbce');
  expect(container.querySelector('.gray-hair-strand')).toHaveAttribute('opacity', '0.64');
  expect(container.querySelector('.age-line')).toHaveAttribute('opacity', '0.46');
  expect(container.querySelector('.facial-state-marker')).toHaveAttribute('stroke-width', '1.4');
}
