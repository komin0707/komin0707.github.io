import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
  LungOverlay,
  PATIENT_AVATAR_COORDINATE_FRAME_TRANSFORM,
  PATIENT_AVATAR_VIEWBOX_VALUE,
  PatientAvatar2D,
} from '@/components/patient';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';

type PatientAvatarProps = ComponentProps<typeof PatientAvatar2D>;

const LUNG_SECRETION_COUNT = 5;
const pneumonia = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
const normal = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal);
const critical = calculateSimulation(
  { ...DEFAULT_SETTINGS, fio2: 21, peep: 20, tidalVolume: 1000, flow: 100 },
  SCENARIOS.ards,
);
const baseAvatarProps = {
  fio2: DEFAULT_SETTINGS.fio2,
  inspiratoryTime: DEFAULT_SETTINGS.inspiratoryTime,
  mode: DEFAULT_SETTINGS.mode,
  scenario: SCENARIOS.normal,
  visualState: normal.visualState,
  vitals: normal.vitals,
} satisfies PatientAvatarProps;

describe('patient avatar component rendering', () => {
  registerPatientAvatarBaselineTests();
  registerPatientAvatarStateTests();
  registerPatientAvatarBreathingTests();
  registerPatientAvatarAttributeTests();
  registerLungOverlayTests();
});

function registerPatientAvatarBaselineTests(): void {
  it('PatientAvatar2D renders stable baseline anatomy, labels, and animation variables', () => {
    render(renderPatientAvatar());
    const patientAvatar = screen.getByTestId('patient-avatar');
    const patientGraphic = screen.getByRole('img', { name: /상태 기반 삽관 환자 이미지/ });
    const patientSvg = patientAvatar.querySelector('.patient-avatar-svg');

    expectStableBaselineAttributes(patientAvatar);
    expect(patientGraphic).toBe(patientAvatar);
    expect(patientSvg).toHaveAttribute('aria-hidden', 'true');
    expect(patientSvg).toHaveAttribute('viewBox', PATIENT_AVATAR_VIEWBOX_VALUE);
    expect(patientSvg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    expect(document.querySelector('.patient-avatar-coordinate-frame')).toHaveAttribute(
      'transform',
      PATIENT_AVATAR_COORDINATE_FRAME_TRANSFORM,
    );
    expectBaselineEffects();
  });
}

function registerPatientAvatarStateTests(): void {
  it('PatientAvatar2D updates alarm, condition, source, and pneumothorax variants', () => {
    const { rerender } = render(renderPatientAvatar());
    rerender(
      renderPatientAvatar({
        scenario: SCENARIOS.pneumonia,
        visualState: drowsyPneumoniaState(),
        vitals: pneumonia.vitals,
      }),
    );
    expectDrowsyPneumonia();

    rerender(
      renderPatientAvatar({
        fio2: 21,
        scenario: SCENARIOS.ards,
        visualState: critical.visualState,
        vitals: critical.vitals,
      }),
    );
    expectCriticalArds();

    rerender(
      renderPatientAvatar({ visualState: { ...normal.visualState, alarmGlow: true, condition: 'watch' } }),
    );
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-alarm-level', 'warning');

    rerender(renderPatientAvatar({ mode: 'PSV' }));
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-source', 'spontaneous');

    const pneumothorax = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumothorax);
    rerender(
      renderPatientAvatar({
        scenario: SCENARIOS.pneumothorax,
        visualState: pneumothorax.visualState,
        vitals: pneumothorax.vitals,
      }),
    );
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-left-chest-reduced', 'true');
  });
}

function registerPatientAvatarBreathingTests(): void {
  it('PatientAvatar2D renders apnea and abnormal respiratory pattern variants', () => {
    const { rerender } = render(renderPatientAvatar({ vitals: { ...normal.vitals, totalRR: 8 } }));
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'bradypnea');
    expect(screen.getByTestId('patient-avatar')).toHaveStyle({ '--breath-speed': '4.50s' });

    rerender(renderPatientAvatar({ apneaSeconds: 17, vitals: { ...normal.vitals, totalRR: 4 } }));
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'apnea');
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-apnea-seconds', '17');
    expect(document.querySelector('.apnea-time-badge')).toHaveTextContent('APNEA 17s');
    expect(document.querySelector('.effect-apnea-hold')).toBeInTheDocument();

    rerender(
      renderPatientAvatar({
        scenario: SCENARIOS.ards,
        visualState: critical.visualState,
        vitals: { ...critical.vitals, baseExcess: -8, hco3: 16, ph: 7.18, totalRR: 30 },
      }),
    );
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'kussmaul');

    rerender(
      renderPatientAvatar({
        visualState: { ...normal.visualState, condition: 'watch' },
        vitals: { ...normal.vitals, paco2: 64, totalRR: 8 },
      }),
    );
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'cheyne-stokes');

    rerender(
      renderPatientAvatar({
        scenario: SCENARIOS.stroke,
        vitals: { ...normal.vitals, paco2: 54, totalRR: 13 },
      }),
    );
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'biot');

    rerender(
      renderPatientAvatar({
        scenario: SCENARIOS.airwayObstruction,
        vitals: { ...normal.vitals, paco2: 58, totalRR: 11 },
      }),
    );
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'apneustic');

    rerender(
      renderPatientAvatar({
        visualState: { ...normal.visualState, condition: 'watch' },
        vitals: { ...normal.vitals, totalRR: 18 },
      }),
    );
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'sighing');

    rerender(
      renderPatientAvatar({
        visualState: critical.visualState,
        vitals: { ...critical.vitals, paco2: 50, totalRR: 7 },
      }),
    );
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'agonal');

    rerender(renderPatientAvatar({ vitals: { ...normal.vitals, totalRR: 4 } }));
    expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-apnea-seconds', '15');
    expect(document.querySelector('.apnea-time-badge')).toHaveTextContent('APNEA ≥15s');
  });
}

function registerPatientAvatarAttributeTests(): void {
  it('PatientAvatar2D exposes visual condition, skin tone, lip color, and expression data attributes', () => {
    const visualStates = [
      normal.visualState,
      { ...normal.visualState, condition: 'watch', expression: 'strained', skinTone: 'pale' },
      { ...pneumonia.visualState, condition: 'worsening', expression: 'distressed', lipColor: 'blue' },
      critical.visualState,
    ] as const;
    const { rerender } = render(renderPatientAvatar({ visualState: visualStates[0] }));

    for (const visualState of visualStates) {
      rerender(
        renderPatientAvatar({
          visualState,
          vitals: visualState.condition === 'critical' ? critical.vitals : normal.vitals,
        }),
      );
      expectVisualStateAttributes(visualState);
    }
  });
}

function renderPatientAvatar(overrides: Partial<PatientAvatarProps> = {}): ReactElement {
  return <PatientAvatar2D {...baseAvatarProps} {...overrides} />;
}

function expectStableBaselineAttributes(patientAvatar: HTMLElement): void {
  expect(patientAvatar).toHaveAttribute('data-condition', 'stable');
  expect(patientAvatar).toHaveAttribute('data-alarm-level', 'none');
  expect(patientAvatar).toHaveAttribute('data-breath-pattern', 'regular');
  expect(patientAvatar).toHaveAttribute('data-breath-source', 'mechanical');
  expect(patientAvatar).toHaveAttribute('data-ie-ratio', '1:2.8');
  expect(patientAvatar).toHaveAttribute('data-inspiration-duration', '1.50');
  expect(patientAvatar).toHaveAttribute('data-expiration-duration', '3.00');
  expect(patientAvatar).toHaveAttribute('data-trigger-mode', 'sync');
  expect(patientAvatar).toHaveAttribute('data-inspiratory-hold', 'false');
  expect(patientAvatar).toHaveAttribute('data-expiratory-hold', 'false');
  expect(patientAvatar).toHaveStyle({
    '--alarm-speed': '1.10s',
    '--breath-speed': '3.75s',
    '--cyanosis-opacity': '0',
    '--lung-pulse-speed': '2.17s',
    '--pressure-compression-opacity': '0',
    '--tube-warning-opacity': '0',
    '--visual-expiration-duration': '3.00s',
    '--visual-inspiration-duration': '1.50s',
  });
}

function expectBaselineEffects(): void {
  expect(document.querySelector('.effect-tube-warning')).toBeInTheDocument();
  expect(document.querySelector('.effect-breath-chest')).toBeInTheDocument();
  expect(document.querySelector('.effect-spontaneous-trigger')).toBeInTheDocument();
  expect(document.querySelector('.effect-cycling-cue')).toBeInTheDocument();
  expect(document.querySelector('.effect-sync-indicator')).toBeInTheDocument();
  expect(document.querySelector('.effect-double-trigger')).toBeInTheDocument();
  expect(document.querySelector('.effect-wasted-trigger')).toBeInTheDocument();
  expect(document.querySelector('.effect-auto-trigger')).toBeInTheDocument();
  expect(document.querySelector('.effect-inspiratory-hold')).toBeInTheDocument();
  expect(document.querySelector('.effect-expiratory-hold')).toBeInTheDocument();
  expect(document.querySelector('.effect-circuit-inflation')).toBeInTheDocument();
  expect(document.querySelector('.effect-circuit-collapse')).toBeInTheDocument();
  expect(document.querySelector('.effect-apnea-recovery')).toBeInTheDocument();
  expect(document.querySelector('.effect-pressure-compression')).toBeInTheDocument();
  expect(document.querySelector('.effect-pursed-lip-breath')).toBeInTheDocument();
  expect(document.querySelectorAll('.effect-asynchrony-jolt')).toHaveLength(2);
  expect(document.querySelector('.fio2-label')).toHaveTextContent('FiO2 40%');
  expect(document.querySelector('.ie-ratio-label')).toHaveTextContent('I:E 1:2.8');
}

function drowsyPneumoniaState(): PatientAvatarProps['visualState'] {
  return { ...pneumonia.visualState, expression: 'drowsy' };
}

function expectDrowsyPneumonia(): void {
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-expression', 'drowsy');
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-alarm-level', 'critical');
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'tachypnea');
  expect(screen.getByTestId('patient-avatar')).toHaveStyle({
    '--alarm-speed': '0.85s',
    '--breath-speed': '1.59s',
    '--cyanosis-opacity': '0.5',
    '--tube-warning-opacity': '1',
  });
}

function expectCriticalArds(): void {
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-condition', 'critical');
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-alarm-level', 'critical');
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'gasping');
  expect(screen.getByTestId('patient-avatar')).toHaveStyle({
    '--alarm-speed': '0.68s',
    '--pressure-compression-opacity': '1',
  });
}

function expectVisualStateAttributes(visualState: PatientAvatarProps['visualState']): void {
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-condition', visualState.condition);
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-expression', visualState.expression);
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-skin-tone', visualState.skinTone);
  expect(screen.getByTestId('patient-avatar')).toHaveAttribute('data-lip-color', visualState.lipColor);
}

function registerLungOverlayTests(): void {
  it('LungOverlay renders left, right, inflamed, secretion, and collapsed SVG details', () => {
    const { container, rerender } = render(
      <svg>
        <LungOverlay side="left" scenario={SCENARIOS.pneumonia} visualState={pneumonia.visualState} />
      </svg>,
    );
    expect(container.querySelector('.lung-detail.left.inflamed')).toBeInTheDocument();
    expect(container.querySelectorAll('.secretion')).toHaveLength(LUNG_SECRETION_COUNT);

    const pneumothorax = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumothorax);
    rerender(
      <svg>
        <LungOverlay side="left" scenario={SCENARIOS.pneumothorax} visualState={pneumothorax.visualState} />
      </svg>,
    );
    expect(container.querySelector('.lung-detail.left.collapsed')).toBeInTheDocument();

    rerender(
      <svg>
        <LungOverlay side="right" scenario={SCENARIOS.pneumothorax} visualState={pneumothorax.visualState} />
      </svg>,
    );
    expect(container.querySelector('.lung-detail.right.collapsed')).toBeInTheDocument();
  });
}
