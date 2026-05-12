import { type RenderResult, render } from '@testing-library/react';
import type { ComponentProps, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';
import { AvatarDefs, BodyLayer } from './patientAvatarSvgParts';

type BodyLayerProps = ComponentProps<typeof BodyLayer>;

const ELECTRODE_COUNT = 10;
const LUNG_LOBE_LINE_COUNT = 3;
const ALVEOLUS_COUNT = 4;
const PRECORDIAL_LEAD_COUNT = 5;
const BILATERAL_COUNT = 2;
const FINGERTIP_CYANOSIS_COUNT = 4;
const MOTTLING_SPOT_COUNT = 6;

const normal = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal);
const pneumonia = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
const pneumothorax = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumothorax);
const critical = calculateSimulation(
  { ...DEFAULT_SETTINGS, fio2: 21, peep: 20, tidalVolume: 1000, flow: 100 },
  SCENARIOS.ards,
);

describe('patient avatar body SVG parts', () => {
  registerHealthyBodyTests();
  registerIllnessBodyTests();
  registerChestMotionSideTests();
});

function registerHealthyBodyTests(): void {
  it('renders healthy body anatomy, monitoring lines, posture, and baseline perfusion', () => {
    const { container } = renderBodyLayer();

    expectHealthyLungAndClinicalFindings(container);
    expectMonitoringLines(container);
    expectAdultBodyPosture(container);
    expectBaselinePerfusion(container);
  });
}

function registerIllnessBodyTests(): void {
  it('renders pneumonia, pallor, jaundice, obstruction, pneumothorax, and ARDS body states', () => {
    const { container, rerender } = renderBodyLayer();

    rerender(renderBodySvg({ scenario: SCENARIOS.pneumonia, visualState: pneumonia.visualState }));
    expectPneumoniaBody(container);

    rerender(renderBodySvg({ visualState: { ...normal.visualState, condition: 'watch', skinTone: 'pale' } }));
    expect(container.querySelector('.body .pallor-wash.torso')).toHaveAttribute('opacity', '0.42');

    rerender(
      renderBodySvg({ visualState: { ...normal.visualState, condition: 'watch', skinTone: 'jaundiced' } }),
    );
    expect(container.querySelector('.body .jaundice-wash.torso')).toHaveAttribute('opacity', '0.44');

    rerender(
      renderBodySvg({
        scenario: SCENARIOS.airwayObstruction,
        visualState: calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.airwayObstruction).visualState,
      }),
    );
    expectAirwayObstructionBody(container);

    rerender(renderBodySvg({ scenario: SCENARIOS.pneumothorax, visualState: pneumothorax.visualState }));
    expectPneumothoraxBody(container);

    rerender(renderBodySvg({ scenario: SCENARIOS.ards, visualState: critical.visualState }));
    expectArdsBody(container);
  });
}

function registerChestMotionSideTests(): void {
  it('renders right-sided and legacy left-sided reduced chest motion', () => {
    const { container, rerender } = renderBodyLayer();

    rerender(
      renderBodySvg({
        scenario: {
          ...SCENARIOS.pneumothorax,
          oneSideChestMotionReduced: false,
          reducedChestMotionSide: 'right',
        },
        visualState: { ...normal.visualState, rightChestReduced: true },
      }),
    );
    expect(container.querySelector('.chest-motion.right-reduced')).toBeInTheDocument();
    expect(container.querySelector('.anatomy-lung.collapsed.right')).toBeInTheDocument();

    const legacyScenario = { ...SCENARIOS.pneumothorax };
    Reflect.deleteProperty(legacyScenario, 'reducedChestMotionSide');

    rerender(
      renderBodySvg({
        scenario: legacyScenario,
        visualState: { ...pneumothorax.visualState, leftChestReduced: true },
      }),
    );
    expect(container.querySelector('.anatomy-lung.collapsed.left')).toBeInTheDocument();
  });
}

function renderBodyLayer(overrides: Partial<BodyLayerProps> = {}): RenderResult {
  return render(renderBodySvg(overrides));
}

function renderBodySvg(overrides: Partial<BodyLayerProps> = {}): ReactElement {
  return (
    <svg>
      <AvatarDefs />
      <BodyLayer scenario={SCENARIOS.normal} visualState={normal.visualState} {...overrides} />
    </svg>
  );
}

function expectHealthyLungAndClinicalFindings(container: HTMLElement): void {
  expect(container.querySelectorAll('.anatomy-lung.healthy')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.body.normal')).toBeInTheDocument();
  expect(container.querySelectorAll('.lung-lobe-line')).toHaveLength(LUNG_LOBE_LINE_COUNT);
  expect(container.querySelectorAll('.alveolus')).toHaveLength(ALVEOLUS_COUNT);
  expect(container.querySelector('.left-lung-lobe')).toBeInTheDocument();
  expect(container.querySelector('.right-upper-lobe')).toBeInTheDocument();
  expect(container.querySelector('.right-middle-lobe')).toBeInTheDocument();
  expect(container.querySelector('.pleural-air-pocket')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.ground-glass-pattern')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.hyperinflation-outline')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.heart-position')).toBeInTheDocument();
}

function expectMonitoringLines(container: HTMLElement): void {
  expect(container.querySelectorAll('.electrode')).toHaveLength(ELECTRODE_COUNT);
  expect(container.querySelectorAll('.avatar-lead')).toHaveLength(ELECTRODE_COUNT);
  expect(container.querySelectorAll('.precordial-lead')).toHaveLength(PRECORDIAL_LEAD_COUNT);
  expect(container.querySelectorAll('.ecg-lead-code')).toHaveLength(ELECTRODE_COUNT);
  expectEcgLeadColors(container);
  expect([...container.querySelectorAll('.ecg-lead-label')].map((label) => label.textContent)).toEqual([
    'RA',
    'LA',
    'V1',
    'V2',
    'V3',
    'V4',
    'V5',
    'V6',
    'RL',
    'LL',
  ]);
  expect(container.querySelector('.spo2-probe')).toBeInTheDocument();
  expect(container.querySelector('.bp-cuff')).toBeInTheDocument();
  expect(container.querySelector('.iv-line')).toBeInTheDocument();
  expect(container.querySelector('.arterial-line')).toBeInTheDocument();
  expect(container.querySelector('.temperature-probe')).toBeInTheDocument();
  expect(container.querySelector('.cvc-line')).toBeInTheDocument();
  expect(container.querySelector('.foley-catheter')).toBeInTheDocument();
}

function expectEcgLeadColors(container: HTMLElement): void {
  expect(container.querySelector('.ecg-lead-code.lead-ra circle')).toHaveAttribute('fill', '#f8fcff');
  expect(container.querySelector('.ecg-lead-code.lead-la circle')).toHaveAttribute('fill', '#1f2937');
  expect(container.querySelector('.ecg-lead-code.lead-v1 circle')).toHaveAttribute('fill', '#8b5a2b');
  expect(container.querySelector('.ecg-lead-code.lead-v6 circle')).toHaveAttribute('fill', '#f97316');
  expect(container.querySelector('.ecg-lead-code.lead-rl circle')).toHaveAttribute('fill', '#35d27f');
  expect(container.querySelector('.ecg-lead-code.lead-ll circle')).toHaveAttribute('fill', '#e53935');
}

function expectAdultBodyPosture(container: HTMLElement): void {
  expect(container.querySelector('.adult-recumbent-proportions')).toBeInTheDocument();
  expect(container.querySelector('.body-axis-line')).toHaveAttribute('stroke-dasharray', '7 9');
  expect(container.querySelector('.pelvis-contour')).toBeInTheDocument();
  expect(container.querySelectorAll('.leg-contour')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.knee-rise')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.thigh-contour')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.foot')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.shoulder-anatomy-contour')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.clavicle-detail')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.suprasternal-retraction')).toHaveAttribute('opacity', '0.08');
  expect(container.querySelectorAll('.neck-muscle-tension')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.pectus-excavatum-shadow')).toBeInTheDocument();
  expect(container.querySelector('.pectus-carinatum-highlight')).toBeInTheDocument();
  expect(container.querySelector('.chest-hair')).toHaveAttribute('opacity', '0.34');
  expect(container.querySelectorAll('.nipple')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.skinny-rib-contour')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.abdomen-contour')).toBeInTheDocument();
  expect(container.querySelector('.abdominal-breathing')).toHaveAttribute('opacity', '0.0576');
  expect(container.querySelector('.abdominal-paradox')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.umbilicus')).toBeInTheDocument();
  expect(container.querySelector('.obese-abdomen-option')).toBeInTheDocument();
  expect(container.querySelector('.abdominal-surgery-scar')).toBeInTheDocument();
  expect(container.querySelector('.sternotomy-scar')).toBeInTheDocument();
  expect(container.querySelector('.cabg-scar')).toBeInTheDocument();
  expect(container.querySelector('.gown-neckline')).toBeInTheDocument();
  expect(container.querySelector('.gown-center-seam')).toBeInTheDocument();
  expect(container.querySelector('.gown-tie-back')).toBeInTheDocument();
  expect(container.querySelector('.hospital-sheet-wrinkle')).toBeInTheDocument();
  expect(container.querySelector('.sheet-shadow')).toBeInTheDocument();
  expect(container.querySelector('.adult-supine-silhouette')).toBeInTheDocument();
  expect(container.querySelector('.clinical-arm-positioning')).toBeInTheDocument();
  expect(container.querySelectorAll('.arm-board')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.extended-arm-posture')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.wrist-rest')).toHaveLength(BILATERAL_COUNT);
}

function expectBaselinePerfusion(container: HTMLElement): void {
  expect(container.querySelectorAll('.hand-fingers')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.natural-finger-crease')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.nail-bed')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.finger-clubbing')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.hand-edema')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.finger-cyanosis')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.fingertip-cyanosis')).toHaveLength(FINGERTIP_CYANOSIS_COUNT);
  expect(container.querySelectorAll('.toe-cyanosis-cap')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.peripheral-cyanosis-caps')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.body .pallor-wash.torso')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.body .jaundice-wash.torso')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.peripheral-mottling')).toHaveAttribute('opacity', '0');
  expect(container.querySelectorAll('.mottling-spot')).toHaveLength(MOTTLING_SPOT_COUNT);
  expect(container.querySelectorAll('.accessory-muscle')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.accessory-muscle.left')).toHaveAttribute('opacity', '0.08');
  expect(container.querySelectorAll('.intercostal-retraction')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.clinical-decompensation-posture')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.stable-posture-markers')).toHaveAttribute('opacity', '0.34');
  expect(container.querySelector('.erythema-rash')).toHaveAttribute('opacity', '0');
  expect(container.querySelector('.hand-dorsum-iv')).toBeInTheDocument();
  expect(container.querySelector('.wrist-iv-line')).toBeInTheDocument();
  expect(container.querySelectorAll('.wristband')).toHaveLength(3);
  expect(container.querySelector('.wristband.patient-id')).toBeInTheDocument();
  expect(container.querySelector('.wristband.allergy-band')).toBeInTheDocument();
  expect(container.querySelector('.wristband.dnr-band')).toBeInTheDocument();
  expect(container.querySelectorAll('.restraint')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.soft-restraints')).toHaveAttribute('opacity', '0.08');
  expect(container.querySelector('.call-bell-cord')).toBeInTheDocument();
  expect(container.querySelector('.call-bell')).toBeInTheDocument();
  expect(container.querySelector('.foley-bag')).toBeInTheDocument();
  expect(container.querySelector('.ng-suction-line')).toBeInTheDocument();
  expect(container.querySelector('.suction-canister')).toBeInTheDocument();
}

function expectPneumoniaBody(container: HTMLElement): void {
  expect(container.querySelectorAll('.anatomy-lung.inflamed')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelectorAll('.secretion')).toHaveLength(ALVEOLUS_COUNT);
  expect(container.querySelector('.secretion')).toHaveAttribute('fill', '#ffd352');
  expect(container.querySelector('.erythema-rash')).toHaveAttribute('opacity', '0.32');
  expect(container.querySelector('.accessory-muscle.left')).toHaveAttribute('opacity', '0.64');
  expect(container.querySelector('.intercostal-retraction.upper')).toHaveAttribute('opacity', '0.64');
}

function expectAirwayObstructionBody(container: HTMLElement): void {
  expect(container.querySelectorAll('.secretion')).toHaveLength(MOTTLING_SPOT_COUNT);
  expect(container.querySelector('.secretion')).toHaveAttribute('fill', '#b8c63d');
  expect(container.querySelector('.hyperinflation-outline')).toHaveAttribute('opacity', '0.68');
  expect(container.querySelectorAll('.hyperinflation-lung')).toHaveLength(BILATERAL_COUNT);
}

function expectPneumothoraxBody(container: HTMLElement): void {
  expect(container.querySelector('.anatomy-lung.collapsed')).toBeInTheDocument();
  expect(container.querySelector('.chest-motion.left-reduced')).toBeInTheDocument();
  expect(container.querySelector('.pleural-air-pocket')).toHaveAttribute('opacity', '0.78');
}

function expectArdsBody(container: HTMLElement): void {
  expect(container.querySelector('.peripheral-mottling')).toHaveAttribute('opacity', '0.82');
  expect(container.querySelector('.edema-markers')).toHaveAttribute('opacity', '0.72');
  expect(container.querySelectorAll('.edema-swelling')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.ground-glass-pattern')).toHaveAttribute('opacity', '0.66');
  expect(container.querySelectorAll('.ground-glass-opacity')).toHaveLength(ALVEOLUS_COUNT);
  expect(container.querySelector('.anatomy-lung.stiff')).toBeInTheDocument();
  expect(container.querySelector('.clinical-decompensation-posture')).toHaveAttribute('opacity', '0.9');
  expect(container.querySelector('.suprasternal-retraction')).toHaveAttribute('opacity', '0.88');
  expect(container.querySelector('.abdominal-paradox')).toHaveAttribute('opacity', '0.432');
  expect(container.querySelector('.soft-restraints')).toHaveAttribute('opacity', '0.52');
  expect(container.querySelector('.peripheral-cyanosis-caps')).toHaveAttribute('opacity', '0.82');
  expect(container.querySelectorAll('.raised-shoulder-line')).toHaveLength(BILATERAL_COUNT);
  expect(container.querySelector('.sternal-tug')).toBeInTheDocument();
}
