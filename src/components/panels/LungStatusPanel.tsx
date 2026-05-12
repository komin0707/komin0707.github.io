import type { CSSProperties } from 'react';
import type { Scenario } from '@/simulation/scenarios';
import type { DerivedVitals, PatientVisualState } from '@/simulation/ventilatorModel';
import './LungStatusPanel.css';
import './Panel.css';

type LungStatusPanelProps = {
  scenario: Scenario;
  visualState: PatientVisualState;
  vitals: DerivedVitals;
};

export function LungStatusPanel({ scenario, visualState, vitals }: LungStatusPanelProps) {
  return (
    <section className="panel compact-panel lung-panel">
      <h2>
        폐 상태 <span>(LUNG STATUS)</span>
      </h2>
      <div className="lung-status-content">
        <svg className="mini-lung" viewBox="0 0 120 100" aria-hidden="true">
          <path d="M56 18 L56 48 C44 52 32 66 24 88 C17 80 18 48 32 31 C39 23 47 19 56 18Z" />
          <path d="M64 18 L64 48 C76 52 88 66 96 88 C103 80 102 48 88 31 C81 23 73 19 64 18Z" />
          <path d="M60 10 L60 55" />
          <circle cx="37" cy="58" r="3" opacity={scenario.secretionLevel} />
          <circle cx="83" cy="63" r="4" opacity={scenario.secretionLevel} />
        </svg>
        <dl>
          <div>
            <dt>순응도 (Compliance)</dt>
            <dd className={vitals.compliance < 25 ? 'danger-text' : ''}>{vitals.compliance} mL/cmH2O</dd>
          </div>
          <div>
            <dt>Cstat</dt>
            <dd>{vitals.staticCompliance} mL/cmH2O</dd>
          </div>
          <div>
            <dt>Cdyn</dt>
            <dd>{vitals.dynamicCompliance} mL/cmH2O</dd>
          </div>
          <div>
            <dt>기도 저항 (Resistance)</dt>
            <dd className={vitals.resistance > 20 ? 'danger-text' : ''}>{vitals.resistance} cmH2O/L/s</dd>
          </div>
          <div>
            <dt>Raw</dt>
            <dd>{vitals.airwayResistance} cmH2O/L/s</dd>
          </div>
          <div>
            <dt>Auto-PEEP</dt>
            <dd className={vitals.autoPeep > 3 ? 'danger-text' : ''}>{vitals.autoPeep} cmH2O</dd>
          </div>
          <div>
            <dt>Driving P</dt>
            <dd className={vitals.drivingPressureSafe ? '' : 'danger-text'}>
              {vitals.drivingPressure} cmH2O {vitals.drivingPressureSafe ? '<15 OK' : '>=15'}
            </dd>
          </div>
          <div>
            <dt>Mech Power</dt>
            <dd>{vitals.mechanicalPower} J/min</dd>
          </div>
          <div>
            <dt>Stress index</dt>
            <dd>{vitals.stressIndex}</dd>
          </div>
          <div>
            <dt>P-V LIP/UIP</dt>
            <dd>
              {vitals.lowerInflectionPoint}/{vitals.upperInflectionPoint} cmH2O
            </dd>
          </div>
          <div>
            <dt>Optimal PEEP</dt>
            <dd>{vitals.optimalPeep} cmH2O</dd>
          </div>
          <div>
            <dt>기능적 잔기량 (FRC)</dt>
            <dd>{vitals.frc} mL</dd>
          </div>
          <div>
            <dt>Vd/Vt</dt>
            <dd>{Math.round(vitals.deadSpaceFraction * 100)}%</dd>
          </div>
          <div>
            <dt>Shunt Qs/Qt</dt>
            <dd>{Math.round(vitals.shuntFraction * 100)}%</dd>
          </div>
          <div>
            <dt>V/Q mismatch</dt>
            <dd>{Math.round(vitals.vqMismatchIndex * 100)}%</dd>
          </div>
          <div>
            <dt>Diffusion limit</dt>
            <dd>{Math.round(vitals.diffusionLimitationIndex * 100)}%</dd>
          </div>
          <div>
            <dt>Alveolar V</dt>
            <dd>{vitals.alveolarVentilation} L/min</dd>
          </div>
          <div>
            <dt>MV</dt>
            <dd>{vitals.minuteVentilation} L/min</dd>
          </div>
          <div>
            <dt>Vt spont/mand</dt>
            <dd>
              {vitals.spontaneousTidalVolume}/{vitals.mandatoryTidalVolume} mL
            </dd>
          </div>
          <div>
            <dt>RSBI</dt>
            <dd className={vitals.rsbi < 105 ? '' : 'danger-text'}>{vitals.rsbi}</dd>
          </div>
          <div>
            <dt>NIF / VC</dt>
            <dd>
              {vitals.negativeInspiratoryForce} cmH2O / {vitals.vitalCapacity} mL
            </dd>
          </div>
          <div>
            <dt>Stress/strain</dt>
            <dd>
              {vitals.transpulmonaryStress}/{vitals.strain}
            </dd>
          </div>
          <div>
            <dt>CO / VR</dt>
            <dd>
              {vitals.cardiacOutput} L/min / {Math.round(vitals.venousReturnIndex)}
            </dd>
          </div>
          <div>
            <dt>ITP / RV load</dt>
            <dd>
              {vitals.intrathoracicPressure} cmH2O / {vitals.rightVentricleAfterload}
            </dd>
          </div>
          <div>
            <dt>PVR</dt>
            <dd>{vitals.pulmonaryVascularResistance} dynes</dd>
          </div>
          <div>
            <dt>CO2 pattern</dt>
            <dd>{vitals.co2RetentionPattern}</dd>
          </div>
          <div>
            <dt>O2 pattern</dt>
            <dd>{vitals.oxygenationPattern}</dd>
          </div>
          <div>
            <dt>PBW 6 mL/kg</dt>
            <dd>
              {vitals.predictedBodyWeight} kg {'->'} {vitals.lungProtectiveTidalVolume} mL
            </dd>
          </div>
          <div>
            <dt>Pplat</dt>
            <dd className={vitals.plateauSafe ? '' : 'danger-text'}>
              {vitals.plateau} cmH2O {vitals.plateauSafe ? '<30 OK' : '>=30'}
            </dd>
          </div>
          <div>
            <dt>Permissive CO2</dt>
            <dd>{vitals.permissiveHypercapnia ? 'eligible' : 'not eligible'}</dd>
          </div>
          <div>
            <dt>분비물</dt>
            <dd>
              <span
                className="secretion-dots"
                style={{ '--active-dots': Math.round(visualState.secretionOpacity * 6) } as CSSProperties}
              />
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
