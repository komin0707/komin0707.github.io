import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';
import { DEFAULT_PATIENT_AVATAR_PROFILE } from './patientAvatarGeometry';
import { AirwayLayer, AvatarDefs, BedLayer, BodyLayer, HeadLayer } from './patientAvatarSvgParts';

const pneumonia = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
const critical = calculateSimulation(
  { ...DEFAULT_SETTINGS, fio2: 21, peep: 20, tidalVolume: 1000, flow: 100 },
  SCENARIOS.ards,
);

describe('patient avatar SVG parts', () => {
  it('renders path, circle, and rect primitives with explicit paint attributes', () => {
    const { container } = render(
      <svg>
        <AvatarDefs />
        <BedLayer />
        <BodyLayer scenario={SCENARIOS.pneumonia} visualState={pneumonia.visualState} />
        <HeadLayer
          lipColor="#273a8f"
          profile={DEFAULT_PATIENT_AVATAR_PROFILE}
          visualState={critical.visualState}
          vitals={critical.vitals}
        />
        <AirwayLayer fio2={21} ieRatio={1.1} visualState={critical.visualState} vitals={critical.vitals} />
      </svg>,
    );

    const paintedElements = [...container.querySelectorAll('path, circle, rect')];
    expect(paintedElements.length).toBeGreaterThan(50);
    for (const element of paintedElements) {
      expect(element, element.outerHTML).toHaveAttribute('fill');
      expect(element, element.outerHTML).toHaveAttribute('stroke');
    }
  });

  it('renders reusable SVG definitions and bed geometry', () => {
    const { container } = render(
      <svg>
        <AvatarDefs />
        <BedLayer />
      </svg>,
    );

    expect(container.querySelector('linearGradient#bedBase')).toBeInTheDocument();
    expect(container.querySelector('radialGradient#skinClinical')).toBeInTheDocument();
    expect(container.querySelector('filter#softShadow')).toBeInTheDocument();
    expect(container.querySelector('.clinical-bed')).toBeInTheDocument();
    expect(container.querySelectorAll('.bed-rail')).toHaveLength(2);
    expect(container.querySelector('.bed-rail-crossbar')).toBeInTheDocument();
    expect(container.querySelector('.fowler-head-angle')).toBeInTheDocument();
    expect(container.querySelector('.bed-footrest')).toBeInTheDocument();
    expect(container.querySelectorAll('.bed-wheel')).toHaveLength(4);
    expect(container.querySelector('.trendelenburg-indicator')).toBeInTheDocument();
    expect(container.querySelector('.reverse-trendelenburg-indicator')).toBeInTheDocument();
    expect(container.querySelector('.bedside-monitor')).toBeInTheDocument();
    expect(container.querySelector('.monitor-trace')).toHaveAttribute('stroke', '#35d27f');
    expect(container.querySelector('.monitor-cable')).toBeInTheDocument();
  });
});
