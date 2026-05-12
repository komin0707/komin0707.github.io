import type { Scenario } from '@/simulation/scenarios';
import type { PatientVisualState } from '@/simulation/ventilatorModel';

type BodyClinicalLinesProps = {
  scenario: Scenario;
  visualState: PatientVisualState;
};

export function BodyClinicalLines({ scenario, visualState }: BodyClinicalLinesProps) {
  const chestTubeOpacity =
    scenario.type === 'pneumothorax' || scenario.type === 'traumaticChestInjury' ? 1 : 0.08;
  const bubblingOpacity = scenario.type === 'pneumothorax' ? 0.88 : 0.08;
  const restraintOpacity = visualState.condition === 'critical' ? 0.52 : 0.08;

  // prettier-ignore
  return (
    <>
      <rect className="bp-cuff" x="408" y="266" width="68" height="31" rx="7" fill="#224c73" stroke="#7fb2d6" strokeWidth="2" transform="rotate(28 442 282)" />
      <path className="bp-hose" d="M459 283 C503 269 530 242 562 214" fill="none" stroke="#7fb2d6" strokeLinecap="round" strokeWidth="2.3" />
      <path className="iv-line" d="M103 330 C74 300 57 276 31 258" fill="none" stroke="#d7f5ff" strokeLinecap="round" strokeWidth="2.2" />
      <rect className="iv-tape" x="93" y="324" width="22" height="8" rx="3" fill="#f4fbff" stroke="#b7d6e6" strokeWidth="1" transform="rotate(28 104 328)" />
      <circle className="hand-dorsum-iv" cx="101" cy="329" r="3.2" fill="#d7f5ff" stroke="#4ca8c8" strokeWidth="0.8" />
      <path className="wrist-iv-line" d="M99 329 C82 316 70 305 58 294" fill="none" stroke="#d7f5ff" strokeLinecap="round" strokeWidth="1.4" />
      <path className="arterial-line" d="M92 334 C62 346 43 355 18 356" fill="none" stroke="#ff6b6b" strokeLinecap="round" strokeWidth="1.8" />
      <rect className="arterial-tape" x="86" y="337" width="18" height="6" rx="3" fill="#fff4f2" stroke="#ff9a9a" strokeWidth="0.9" transform="rotate(12 95 340)" />
      <g className="abg-catheter">
        <circle className="abg-hub" cx="91" cy="336" r="4" fill="#ff6b6b" stroke="#fff4f2" strokeWidth="0.9" />
        <rect x="71" y="318" width="25" height="12" rx="4" fill="#3a1c1c" stroke="#ff9a9a" strokeOpacity="0.76" strokeWidth="0.9" />
        <text aria-hidden="true" className="abg-label" fill="#fff4f2" x="76" y="327">ABG</text>
      </g>
      <path className="temperature-probe" d="M336 224 C396 217 446 199 497 177" fill="none" stroke="#ffd84a" strokeLinecap="round" strokeWidth="1.8" />
      <circle className="temperature-sensor" cx="337" cy="224" r="5" fill="#ffd84a" stroke="#fff2a6" strokeWidth="1.2" />
      <path className="cvc-line" d="M255 186 C316 159 385 141 466 132" fill="none" stroke="#9de7ff" strokeLinecap="round" strokeWidth="2" />
      <rect className="cvc-dressing" x="242" y="178" width="26" height="14" rx="4" fill="#f7fcff" stroke="#bdeeff" strokeOpacity="0.88" strokeWidth="1.2" transform="rotate(-15 255 185)" />
      <g className="chest-tube-system" opacity={chestTubeOpacity}>
        <path className="chest-tube" d="M162 252 C118 264 88 289 70 322" fill="none" stroke="#f7fcff" strokeLinecap="round" strokeWidth="3.2" />
        <rect className="chest-tube-dressing" x="151" y="244" width="28" height="16" rx="4" fill="#f7fcff" stroke="#bdeeff" strokeOpacity="0.82" strokeWidth="1" transform="rotate(-18 165 252)" />
        <rect className="chest-drainage-chamber" x="40" y="314" width="32" height="42" rx="6" fill="rgba(245, 250, 255, 0.3)" stroke="#d8ecf7" strokeOpacity="0.82" strokeWidth="1.3" />
        <rect className="chest-tube-drainage" x="46" y="337" width="20" height="12" rx="3" fill="rgba(178, 67, 56, 0.48)" stroke="#c55f55" strokeOpacity="0.62" strokeWidth="0.8" />
        <circle className="chest-tube-bubble bubble-a" cx="51" cy="330" r="2.4" fill="#d8f2ff" opacity={bubblingOpacity} stroke="#7fb2d6" strokeWidth="0.6" />
        <circle className="chest-tube-bubble bubble-b" cx="60" cy="326" r="2" fill="#d8f2ff" opacity={bubblingOpacity * 0.72} stroke="#7fb2d6" strokeWidth="0.6" />
      </g>
      <g className="patient-wristbands">
        <rect className="wristband patient-id" x="82" y="336" width="25" height="6" rx="2" fill="#f8fcff" stroke="#8aa8b8" strokeWidth="0.6" transform="rotate(-8 94 339)" />
        <rect className="wristband allergy-band" x="82" y="343" width="25" height="5" rx="2" fill="#e53935" stroke="#ffd2d2" strokeWidth="0.5" transform="rotate(-8 94 345)" />
        <rect className="wristband dnr-band" x="475" y="326" width="24" height="5" rx="2" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="0.5" transform="rotate(17 487 328)" />
      </g>
      <g className="soft-restraints" opacity={restraintOpacity}>
        <path className="restraint left" d="M66 331 C82 342 103 344 121 337" fill="none" stroke="#e8e1d6" strokeLinecap="round" strokeWidth="3.2" />
        <path className="restraint right" d="M462 315 C478 326 500 330 516 323" fill="none" stroke="#e8e1d6" strokeLinecap="round" strokeWidth="3" />
      </g>
      <path className="call-bell-cord" d="M516 323 C540 302 562 291 595 288" fill="none" stroke="#ffd84a" strokeLinecap="round" strokeWidth="1.8" />
      <rect className="call-bell" x="592" y="280" width="24" height="16" rx="6" fill="#ffd84a" stroke="#8f7443" strokeWidth="1" />
      <path className="ng-suction-line" d="M238 179 C300 158 357 145 423 146 C452 147 476 158 501 176" fill="none" stroke="#f2d37a" strokeDasharray="5 5" strokeLinecap="round" strokeOpacity="0.7" strokeWidth="1.5" />
      <rect className="suction-canister" x="501" y="165" width="34" height="30" rx="6" fill="rgba(245, 250, 255, 0.32)" stroke="#d8ecf7" strokeOpacity="0.82" strokeWidth="1.1" />
    </>
  );
}
