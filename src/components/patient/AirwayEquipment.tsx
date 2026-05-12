import type { AvatarSvgPartsProps } from './patientAvatarSvgTypes';

type AirwayEquipmentProps = Pick<AvatarSvgPartsProps, 'vitals'> & { fio2: number; ieRatio: number };

export function AirwayEquipment({ fio2, ieRatio, vitals }: AirwayEquipmentProps) {
  const fio2FillWidth = Math.round(((Math.min(100, Math.max(21, fio2)) - 21) / 79) * 70);

  // prettier-ignore
  return (
    <>
      <g className="humidifier-chamber">
        <rect x="548" y="178" width="42" height="54" rx="8" fill="rgba(211, 239, 255, 0.24)" stroke="#9bd7f2" strokeOpacity="0.82" strokeWidth="1.6" />
        <rect className="humidifier-water" x="554" y="210" width="30" height="15" rx="5" fill="rgba(120, 217, 255, 0.44)" stroke="#d9f7ff" strokeOpacity="0.7" strokeWidth="0.9" />
        <path className="humidifier-heater-line" d="M556 188 C563 193 570 193 577 188 M556 198 C563 203 570 203 577 198" fill="none" stroke="#f7d56b" strokeLinecap="round" strokeOpacity="0.76" strokeWidth="1.4" />
        <text aria-hidden="true" className="humidifier-label" fill="#d8f2ff" x="558" y="205">H2O</text>
      </g>
      <g className="humidifier-condensate">
        <circle cx="348" cy="158" r="2.8" fill="#d9f7ff" stroke="#7ccff4" strokeOpacity="0.72" strokeWidth="0.7" />
        <circle cx="416" cy="178" r="2.2" fill="#d9f7ff" stroke="#7ccff4" strokeOpacity="0.66" strokeWidth="0.7" />
        <circle cx="356" cy="193" r="2.4" fill="#9ee7ff" stroke="#d9f7ff" strokeOpacity="0.58" strokeWidth="0.7" />
        <circle cx="445" cy="217" r="2.6" fill="#9ee7ff" stroke="#d9f7ff" strokeOpacity="0.58" strokeWidth="0.7" />
      </g>
      <g className="fio2-indicator" data-fio2={fio2}>
        <text x="430" y="143" className="fio2-label">FiO2 {fio2}%</text>
        <rect className="fio2-track" x="430" y="148" width="70" height="8" rx="4" fill="#12314a" stroke="#5f96b8" strokeOpacity="0.72" strokeWidth="1" />
        <rect className="fio2-fill" x="430" y="148" width={fio2FillWidth} height="8" rx="4" fill="#78d9ff" stroke="#d9f7ff" strokeOpacity="0.64" strokeWidth="0.8" />
      </g>
      <text x="423" y="184" className="breath-phase-label inspiration-label">INSP</text>
      <text x="426" y="225" className="breath-phase-label expiration-label">EXP</text>
      <text x="423" y="240" className="breath-phase-label ie-ratio-label">I:E 1:{ieRatio.toFixed(1)}</text>
      <g className="peep-valve-position" data-peep={vitals.peep}>
        <rect x="598" y="237" width="42" height="19" rx="7" fill="#122f46" stroke="#78d9ff" strokeOpacity="0.72" strokeWidth="1.2" />
        <circle cx={606 + Math.min(26, Math.max(0, vitals.peep * 1.6))} cy="246.5" r="5.4" fill="#78d9ff" stroke="#d9f7ff" strokeOpacity="0.78" strokeWidth="0.8" />
      </g>
      <g className="corrugated-tube">
        <path d="M492 181 L499 201" fill="none" stroke="rgba(229, 247, 255, 0.52)" strokeLinecap="round" strokeWidth="2" />
        <path d="M515 184 L521 201" fill="none" stroke="rgba(229, 247, 255, 0.52)" strokeLinecap="round" strokeWidth="2" />
        <path d="M542 188 L548 200" fill="none" stroke="rgba(229, 247, 255, 0.52)" strokeLinecap="round" strokeWidth="2" />
        <path d="M491 212 L498 238" fill="none" stroke="rgba(229, 247, 255, 0.52)" strokeLinecap="round" strokeWidth="2" />
        <path d="M516 217 L522 239" fill="none" stroke="rgba(229, 247, 255, 0.52)" strokeLinecap="round" strokeWidth="2" />
        <path d="M543 224 L548 238" fill="none" stroke="rgba(229, 247, 255, 0.52)" strokeLinecap="round" strokeWidth="2" />
      </g>
      <text x="512" y="176" className={vitals.pip > 28 ? 'pip-label danger-text' : 'pip-label'}>{vitals.pip} PIP</text>
      <text x="512" y="158" className="peep-label">{vitals.peep} PEEP</text>
      <text x="505" y="251" className="minute-ventilation-label">MV {vitals.minuteVentilation}</text>
    </>
  );
}
