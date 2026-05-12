import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  PATIENT_AVATAR_BASE_COORDINATE_SPACE,
  PATIENT_AVATAR_COORDINATE_FRAME_TRANSFORM,
  PATIENT_AVATAR_LAYER_BOUNDS,
  PATIENT_AVATAR_PROFILE_OPTIONS,
  PATIENT_AVATAR_SUPINE_GEOMETRY,
  PATIENT_AVATAR_VIEWBOX,
  PATIENT_AVATAR_VIEWBOX_VALUE,
  PatientAvatar2D,
} from '@/components/patient';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';
import { readSimulatorCss } from '@/test/readSimulatorCss';

const normal = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal);

describe('component geometry contracts', () => {
  it('keeps the patient avatar SVG viewBox and CSS aspect ratio in sync', () => {
    render(
      <PatientAvatar2D
        fio2={DEFAULT_SETTINGS.fio2}
        inspiratoryTime={DEFAULT_SETTINGS.inspiratoryTime}
        mode={DEFAULT_SETTINGS.mode}
        scenario={SCENARIOS.normal}
        visualState={normal.visualState}
        vitals={normal.vitals}
      />,
    );

    const patientGraphic = screen.getByRole('img', { name: /상태 기반 삽관 환자 이미지/ });
    const patientSvg = patientGraphic.querySelector('.patient-avatar-svg');
    expectAvatarViewBoxContract(patientSvg);
  });

  it('documents normalized patient avatar layer bounds and supine projection constraints', () => {
    expect(PATIENT_AVATAR_LAYER_BOUNDS.bed).toEqual({ maxX: 612, maxY: 360, minX: 34, minY: 31 });
    expect(PATIENT_AVATAR_LAYER_BOUNDS.body.minX).toBeGreaterThanOrEqual(0);
    expect(PATIENT_AVATAR_LAYER_BOUNDS.body.maxX).toBeLessThanOrEqual(
      PATIENT_AVATAR_BASE_COORDINATE_SPACE.width,
    );
    expect(PATIENT_AVATAR_LAYER_BOUNDS.head.minY).toBeLessThan(PATIENT_AVATAR_LAYER_BOUNDS.body.minY);
    expect(PATIENT_AVATAR_LAYER_BOUNDS.airway.maxX).toBeGreaterThan(PATIENT_AVATAR_LAYER_BOUNDS.head.maxX);
    expect(PATIENT_AVATAR_SUPINE_GEOMETRY.cameraAngle).toBe('supine-oblique');
    expect(PATIENT_AVATAR_SUPINE_GEOMETRY.patientRotation).toBe('aligned-to-bed-long-axis');
    expect(PATIENT_AVATAR_SUPINE_GEOMETRY.monitorQuadrant).toBe('upper-right');
    expect(PATIENT_AVATAR_SUPINE_GEOMETRY.projectedHeadToBodyRatio).toEqual({ max: 0.34, min: 0.14 });
    expect(PATIENT_AVATAR_SUPINE_GEOMETRY.projectedShoulderToHeadRatio).toEqual({
      max: 3.8,
      min: 1.9,
    });
    expect(PATIENT_AVATAR_SUPINE_GEOMETRY.projectedArmToTorsoRatio).toEqual({ max: 1.15, min: 0.55 });
    expect(PATIENT_AVATAR_SUPINE_GEOMETRY.projectedLegToTorsoRatio).toEqual({ max: 1.45, min: 0.65 });
    expect(PATIENT_AVATAR_PROFILE_OPTIONS.hairColor).toEqual(['black', 'darkBrown', 'gray']);
    expect(PATIENT_AVATAR_PROFILE_OPTIONS.ageGroup).toEqual(['adult', 'olderAdult']);
    expect(PATIENT_AVATAR_PROFILE_OPTIONS.sexPresentation).toEqual(['neutral', 'female', 'male']);
    expect(PATIENT_AVATAR_PROFILE_OPTIONS.headRotation).toEqual(['supine', 'left', 'right']);
  });
});

function expectAvatarViewBoxContract(patientGraphic: Element | null): void {
  const simulatorCss = readSimulatorCss();
  const aspectRatioMatch = /\.patient-avatar\s*\{[\s\S]*?aspect-ratio:\s*(\d+)\s*\/\s*(\d+);/.exec(
    simulatorCss,
  );
  const viewBoxRatio = PATIENT_AVATAR_VIEWBOX.width / PATIENT_AVATAR_VIEWBOX.height;

  if (!aspectRatioMatch) throw new Error('Missing .patient-avatar aspect-ratio CSS rule');

  const [, cssWidth, cssHeight] = aspectRatioMatch;
  const cssAspectRatio = Number(cssWidth) / Number(cssHeight);

  expect(patientGraphic).not.toBeNull();
  expect(patientGraphic).toHaveAttribute('viewBox', PATIENT_AVATAR_VIEWBOX_VALUE);
  expect(patientGraphic).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  expect(document.querySelector('.patient-avatar-coordinate-frame')).toHaveAttribute(
    'transform',
    PATIENT_AVATAR_COORDINATE_FRAME_TRANSFORM,
  );
  expect(cssAspectRatio).toBeCloseTo(viewBoxRatio, 8);
  expect(simulatorCss).not.toContain('viewBox="0 0 640 360"');
}
