import { type ReactNode, Suspense, lazy } from 'react';
import type { Scenario, VentMode } from '@/simulation/scenarios';
import {
  type DerivedVitals,
  type PatientCondition,
  type PatientVisualState,
  getConditionLabel,
} from '@/simulation/ventilatorModel';
import './Panel.css';
import './PatientConditionPanel.css';

const PatientAvatar2D = lazy(() =>
  import('@/components/patient/PatientAvatar2D').then((module) => ({ default: module.PatientAvatar2D })),
);

type PatientConditionPanelProps = {
  condition: PatientCondition;
  description: string;
  fio2: number;
  inspiratoryTime: number;
  mode: VentMode;
  scenario: Scenario;
  visualState: PatientVisualState;
  vitals: DerivedVitals;
};

const SPO2_DANGER_THRESHOLD = 90;
const PAO2_FIO2_DANGER_THRESHOLD = 200;
const PACO2_DANGER_THRESHOLD = 55;
const COMPLIANCE_DANGER_THRESHOLD = 25;
const RESISTANCE_DANGER_THRESHOLD = 20;

const trend = (bad: boolean, direction: 'up' | 'down'): ReactNode => (
  <span aria-hidden="true" className={bad ? 'trend danger' : 'trend'} data-direction={direction} />
);

/** Primary patient status panel that couples vitals with the SVG bedside avatar. */
export function PatientConditionPanel(props: PatientConditionPanelProps): ReactNode {
  const { condition, description, scenario, visualState } = props;

  return (
    <section className="panel patient-panel">
      <h2>
        환자 상태 <span>(PATIENT CONDITION)</span>
      </h2>
      <div className="patient-stage">
        <ConditionCard condition={condition} vitals={props.vitals} />
        <Suspense
          fallback={
            <div
              aria-label="환자 이미지 로딩"
              className="patient-avatar patient-avatar-loading"
              data-testid="patient-avatar-loading"
              role="img"
            />
          }
        >
          <PatientAvatar2D
            fio2={props.fio2}
            inspiratoryTime={props.inspiratoryTime}
            mode={props.mode}
            scenario={scenario}
            visualState={visualState}
            vitals={props.vitals}
          />
        </Suspense>
      </div>
      <p className="status-description">{description}</p>
      <p aria-live="polite" className="sr-only" role="status">
        환자 시각 상태: {scenario.koreanLabel}, {getConditionLabel(condition)}, 표정 {visualState.expression},
        피부 {visualState.skinTone}, 폐 {visualState.lungColor}, 호흡 움직임{' '}
        {visualState.chestMotionAmplitude.toFixed(1)}
      </p>
    </section>
  );
}

function ConditionCard({
  condition,
  vitals,
}: {
  condition: PatientCondition;
  vitals: DerivedVitals;
}): ReactNode {
  return (
    <div className="condition-card">
      <span className="eyebrow">컨디션</span>
      <strong className={`condition-label ${condition}`}>{getConditionLabel(condition)}</strong>
      <dl>
        <VitalRow
          bad={vitals.spo2 < SPO2_DANGER_THRESHOLD}
          direction="down"
          label="SpO2"
          value={`${vitals.spo2}%`}
        />
        <VitalRow
          bad={vitals.pao2fio2 < PAO2_FIO2_DANGER_THRESHOLD}
          direction="down"
          label="P/F"
          value={vitals.pao2fio2}
        />
        <VitalRow
          bad={vitals.paco2 > PACO2_DANGER_THRESHOLD}
          direction="up"
          label="CO2"
          value={vitals.paco2}
        />
        <VitalRow
          bad={vitals.compliance < COMPLIANCE_DANGER_THRESHOLD}
          direction="down"
          label="순응도"
          value={vitals.compliance}
        />
        <VitalRow
          bad={vitals.resistance > RESISTANCE_DANGER_THRESHOLD}
          direction="up"
          label="기도 저항"
          value={vitals.resistance}
        />
      </dl>
    </div>
  );
}

function VitalRow({
  bad,
  direction,
  label,
  value,
}: {
  bad: boolean;
  direction: 'up' | 'down';
  label: string;
  value: ReactNode;
}): ReactNode {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={bad ? 'danger-text' : ''}>
        {value} {trend(bad, direction)}
      </dd>
    </div>
  );
}
