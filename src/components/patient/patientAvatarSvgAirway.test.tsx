import { type RenderResult, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';
import { DEFAULT_PATIENT_AVATAR_PROFILE } from './patientAvatarGeometry';
import { AirwayLayer, AvatarDefs, BedLayer, BodyLayer, HeadLayer } from './patientAvatarSvgParts';

const normal = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal);
const pneumonia = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
const pneumothorax = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumothorax);
const critical = calculateSimulation(
  { ...DEFAULT_SETTINGS, fio2: 21, peep: 20, tidalVolume: 1000, flow: 100 },
  SCENARIOS.ards,
);
const MASK_STRAP_COUNT = 4;
const ETT_DEPTH_MARK_COUNT = 3;
const HUMIDIFIER_CONDENSATE_COUNT = 4;
const HME_FILTER_LINE_COUNT = 1;

describe('patient avatar airway SVG parts', () => {
  registerAirwayLayerTests();
  registerScenarioMarkerTests();
});

function registerAirwayLayerTests(): void {
  it('renders airway tubing, warning state, and peak pressure label', () => {
    const { container, rerender } = renderAirwayLayer();

    expectDefaultAirwayParts(container);
    expectVentCircuitLabels(container);

    rerender(
      <svg>
        <AvatarDefs />
        <AirwayLayer fio2={21} ieRatio={1.1} visualState={critical.visualState} vitals={critical.vitals} />
      </svg>,
    );
    expectWarningAirwayParts(container);
  });
}

function renderAirwayLayer(): RenderResult {
  return render(
    <svg>
      <AvatarDefs />
      <AirwayLayer
        fio2={DEFAULT_SETTINGS.fio2}
        ieRatio={2.75}
        visualState={normal.visualState}
        vitals={normal.vitals}
      />
    </svg>,
  );
}

function expectDefaultAirwayParts(container: HTMLElement): void {
  expect(container.querySelector('.airway')).toBeInTheDocument();
  expect(container.querySelector('.proximal-airway')).toHaveAttribute(
    'transform',
    'translate(96 14) scale(0.72)',
  );
  expect(container.querySelector('.tube-warning.active')).not.toBeInTheDocument();
  expect(container.querySelector('.tube-depth-indicator.active')).not.toBeInTheDocument();
  expect(container.querySelector('.airway-mask-shell')).toHaveAttribute('fill', 'url(#maskShell)');
  expect(container.querySelector('.airway-mask-highlight')).toHaveAttribute('stroke', '#adbfcb');
  expect(container.querySelector('.ett-mouth-seal')).toHaveAttribute('rx', '10');
  expect(container.querySelector('.mask-connector-shadow')).toHaveAttribute('opacity', '0.26');
  expect(container.querySelectorAll('.mask-strap')).toHaveLength(MASK_STRAP_COUNT);
  expect(container.querySelector('.ett-tube')).toBeInTheDocument();
  expect(container.querySelector('.ett-inner-highlight')).toBeInTheDocument();
  expect(container.querySelectorAll('.ett-depth-mark')).toHaveLength(ETT_DEPTH_MARK_COUNT);
  expect(container.querySelector('.ng-tube')).toBeInTheDocument();
  expect(container.querySelector('.ng-tube-anchor')).toBeInTheDocument();
  expect(container.querySelector('.ng-tube-label')).toHaveTextContent('NG');
  expect(container.querySelectorAll('.vent-circuit')).toHaveLength(2);
  expect(container.querySelector('.hme-filter')).toBeInTheDocument();
  expect(container.querySelectorAll('.hme-filter path')).toHaveLength(HME_FILTER_LINE_COUNT);
  expect(container.querySelector('.exhalation-valve-blink')).toHaveAttribute('fill', '#56b8ff');
  expect(container.querySelector('.peep-valve-position')).toHaveAttribute('data-peep', '5');
  expect(container.querySelector('.peep-valve-position rect')).toHaveAttribute('stroke', '#78d9ff');
  expect(container.querySelector('.pip-label')).toHaveTextContent('17.3 PIP');
  expect(container.querySelector('.peep-label')).toHaveTextContent('5 PEEP');
  expect(container.querySelector('.minute-ventilation-label')).toHaveTextContent('MV 8');
  expect(container.querySelector('.fio2-indicator')).toHaveAttribute('data-fio2', '40');
  expect(container.querySelector('.fio2-label')).toHaveTextContent('FiO2 40%');
  expect(container.querySelector('.fio2-fill')).toHaveAttribute('width', '17');
  expect(container.querySelector('.y-piece-connector')).toBeInTheDocument();
  expect(container.querySelector('.humidifier-chamber')).toHaveTextContent('H2O');
  expect(container.querySelector('.humidifier-water')).toBeInTheDocument();
  expect(container.querySelectorAll('.humidifier-condensate circle')).toHaveLength(
    HUMIDIFIER_CONDENSATE_COUNT,
  );
}

function expectVentCircuitLabels(container: HTMLElement): void {
  expect(container.querySelector('.inspiration-label')).toHaveTextContent('INSP');
  expect(container.querySelector('.expiration-label')).toHaveTextContent('EXP');
  expect(container.querySelector('.ie-ratio-label')).toHaveTextContent('I:E 1:2.8');
  expect(container.querySelector('.inspiratory-flow')).toHaveAttribute('stroke', '#f8fcff');
  expect(container.querySelector('.expiratory-flow')).toHaveAttribute('stroke', '#56b8ff');
}

function expectWarningAirwayParts(container: HTMLElement): void {
  expect(container.querySelector('.tube-warning.active')).toBeInTheDocument();
  expect(container.querySelector('.tube-depth-indicator.active')).toHaveTextContent('DEPTH');
  expect(container.querySelector('.pip-label.danger-text')).toHaveTextContent(`${critical.vitals.pip} PIP`);
}

function registerScenarioMarkerTests(): void {
  it('renders distinct visual markers for every patient scenario state', () => {
    const cases = [
      { scenario: SCENARIOS.normal, state: normal.visualState, expectedLung: '.anatomy-lung.healthy' },
      { scenario: SCENARIOS.pneumonia, state: pneumonia.visualState, expectedLung: '.anatomy-lung.inflamed' },
      {
        scenario: SCENARIOS.ards,
        state: critical.visualState,
        expectedLung: '.anatomy-lung.stiff',
      },
      {
        scenario: SCENARIOS.airwayObstruction,
        state: calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.airwayObstruction).visualState,
        expectedLung: '.anatomy-lung.inflamed',
      },
      {
        scenario: SCENARIOS.pneumothorax,
        state: pneumothorax.visualState,
        expectedLung: '.anatomy-lung.collapsed.left',
      },
    ];

    for (const item of cases) {
      const { container, unmount } = render(
        <svg>
          <AvatarDefs />
          <BedLayer />
          <BodyLayer scenario={item.scenario} visualState={item.state} />
          <HeadLayer
            lipColor="#273a8f"
            profile={DEFAULT_PATIENT_AVATAR_PROFILE}
            visualState={item.state}
            vitals={critical.vitals}
          />
          <AirwayLayer
            fio2={DEFAULT_SETTINGS.fio2}
            ieRatio={2.75}
            visualState={item.state}
            vitals={critical.vitals}
          />
        </svg>,
      );

      expect(container.querySelector(item.expectedLung)).toBeInTheDocument();
      expect(container.querySelector('.infiltrate')).toHaveAttribute('fill', 'rgba(226, 231, 238, 0.72)');
      expect(container.querySelector('.secretion')).toHaveAttribute('fill');
      expect(container.querySelector('.tube-warning')).toHaveAttribute('stroke');
      unmount();
    }
  });
}
