import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LungStatusPanel, ModeSafetyPanel, PatientConditionPanel } from '@/components';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';

const pneumonia = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
const normal = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal);
const critical = calculateSimulation(
  { ...DEFAULT_SETTINGS, fio2: 21, peep: 20, tidalVolume: 1000, flow: 100 },
  SCENARIOS.ards,
);

describe('patient status panels', () => {
  registerLungStatusPanelTests();
  registerPatientConditionPanelTests();
  registerModeSafetyPanelTests();
});

function registerLungStatusPanelTests(): void {
  it('LungStatusPanel reflects compliance, resistance, FRC, and secretion state', () => {
    render(
      <LungStatusPanel
        scenario={SCENARIOS.pneumonia}
        visualState={pneumonia.visualState}
        vitals={pneumonia.vitals}
      />,
    );

    expect(screen.getByText(/25 mL\/cmH2O/)).toBeInTheDocument();
    expect(screen.getByText(/18 cmH2O\/L\/s/)).toBeInTheDocument();
    expect(screen.getByText('1200 mL')).toBeInTheDocument();
    expect(screen.getByText('Cstat')).toBeInTheDocument();
    expect(screen.getByText('Cdyn')).toBeInTheDocument();
    expect(screen.getByText('Auto-PEEP')).toBeInTheDocument();
    expect(screen.getByText('Driving P')).toBeInTheDocument();
    expect(screen.getByText('Mech Power')).toBeInTheDocument();
    expect(screen.getByText('P-V LIP/UIP')).toBeInTheDocument();
    expect(screen.getByText('Shunt Qs/Qt')).toBeInTheDocument();
    expect(screen.getByText('V/Q mismatch')).toBeInTheDocument();
    expect(screen.getByText('Diffusion limit')).toBeInTheDocument();
    expect(screen.getByText('CO / VR')).toBeInTheDocument();
    expect(screen.getByText('ITP / RV load')).toBeInTheDocument();
    expect(screen.getByText('PVR')).toBeInTheDocument();
    expect(screen.getByText('CO2 pattern')).toBeInTheDocument();
    expect(screen.getByText('O2 pattern')).toBeInTheDocument();
    expect(screen.getByText('PBW 6 mL/kg')).toBeInTheDocument();
    expect(document.querySelector('.secretion-dots')).toHaveStyle({ '--active-dots': '4' });

    const criticalArds = calculateSimulation(
      { ...DEFAULT_SETTINGS, peep: 20, tidalVolume: 1000, flow: 100 },
      SCENARIOS.ards,
    );
    const { container } = render(
      <LungStatusPanel
        scenario={SCENARIOS.ards}
        visualState={criticalArds.visualState}
        vitals={{ ...criticalArds.vitals, resistance: 24 }}
      />,
    );
    expect(container.querySelectorAll('.danger-text')).toHaveLength(5);
  });
}

function registerPatientConditionPanelTests(): void {
  it('PatientConditionPanel renders trend classes and description text', async () => {
    const { rerender } = renderPneumoniaConditionPanel();

    expect(screen.getByText('악화')).toHaveClass('worsening');
    expect(screen.getByText(/저산소혈증/)).toBeInTheDocument();
    expect(await screen.findByTestId('patient-avatar')).toHaveAttribute('data-lip-color', 'blue');

    rerender(renderNormalConditionPanel());
    expect(screen.getByText('안정')).toHaveClass('stable');

    rerender(renderCriticalConditionPanel());
    expect(screen.getByText('위중')).toHaveClass('critical');
    expect(document.querySelectorAll('.condition-card .danger-text')).toHaveLength(5);
  });
}

function registerModeSafetyPanelTests(): void {
  it('ModeSafetyPanel renders standby and inactive mode safety states', () => {
    render(
      <ModeSafetyPanel
        safety={{
          apneaBackupActive: false,
          apneaDetected: false,
          adjunctControlSummary: ['Manual breath button'],
          autoBackupMode: null,
          inverseRatioVentilation: false,
          modeControlSummary: ['AC-VC volume target'],
          modeDetail: 'AC-VC delivers mandatory volume-targeted breaths.',
          modeTransitionTrigger: 'AC trigger 2.0 L/min',
          safetyWarning: 'Mode transition safety check passed',
        }}
      />,
    );

    expect(screen.getByLabelText('모드 안전 상태')).toHaveTextContent('No apnea');
    expect(screen.getByLabelText('모드 안전 상태')).toHaveTextContent('Backup standby');
    expect(screen.getByLabelText('모드 안전 상태')).toHaveTextContent('IRV off');

    render(
      <ModeSafetyPanel
        safety={{
          apneaBackupActive: true,
          apneaDetected: true,
          adjunctControlSummary: ['Manual breath button'],
          autoBackupMode: 'SIMV',
          inverseRatioVentilation: true,
          modeControlSummary: ['SIMV spontaneous breath preservation'],
          modeDetail: 'SIMV preserves spontaneous breaths between mandatory breaths.',
          modeTransitionTrigger: 'SIMV trigger 2.0 L/min',
          safetyWarning: 'Inverse ratio ventilation active',
        }}
      />,
    );
    expect(screen.getByText('IRV active')).toBeInTheDocument();
  });
}

function renderPneumoniaConditionPanel(): ReturnType<typeof render> {
  return render(
    <PatientConditionPanel
      condition={pneumonia.condition}
      description={pneumonia.description}
      fio2={DEFAULT_SETTINGS.fio2}
      inspiratoryTime={DEFAULT_SETTINGS.inspiratoryTime}
      mode={DEFAULT_SETTINGS.mode}
      scenario={SCENARIOS.pneumonia}
      visualState={pneumonia.visualState}
      vitals={pneumonia.vitals}
    />,
  );
}

function renderNormalConditionPanel(): React.ReactElement {
  return (
    <PatientConditionPanel
      condition={normal.condition}
      description={normal.description}
      fio2={DEFAULT_SETTINGS.fio2}
      inspiratoryTime={DEFAULT_SETTINGS.inspiratoryTime}
      mode={DEFAULT_SETTINGS.mode}
      scenario={SCENARIOS.normal}
      visualState={normal.visualState}
      vitals={normal.vitals}
    />
  );
}

function renderCriticalConditionPanel(): React.ReactElement {
  return (
    <PatientConditionPanel
      condition="critical"
      description={critical.description}
      fio2={21}
      inspiratoryTime={DEFAULT_SETTINGS.inspiratoryTime}
      mode={DEFAULT_SETTINGS.mode}
      scenario={SCENARIOS.ards}
      visualState={critical.visualState}
      vitals={{
        ...critical.vitals,
        compliance: 18,
        paco2: 72,
        pao2fio2: 120,
        resistance: 28,
        spo2: 81,
      }}
    />
  );
}
