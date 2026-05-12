import type { AvatarSvgPartsProps } from './patientAvatarSvgTypes';

type AirwayCircuitProps = Pick<AvatarSvgPartsProps, 'visualState'>;

export function AirwayCircuit({ visualState }: AirwayCircuitProps) {
  // prettier-ignore
  return (
    <>
      <path className="vent-circuit inspiration-tube" d="M219 139 C275 142 327 155 375 174 C438 199 499 194 616 194" opacity="0.74" stroke="url(#tubeGradient)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path className="vent-circuit expiration-tube" d="M220 161 C276 169 329 184 376 205 C440 234 505 238 622 232" opacity="0.66" stroke="url(#tubeGradient)" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M230 140 C284 145 332 157 376 174" stroke="#f8fcff" strokeWidth="2.4" fill="none" opacity="0.55" />
      <path d="M231 162 C285 171 334 186 377 205" stroke="#f8fcff" strokeWidth="2.2" fill="none" opacity="0.46" />
      <path d="M230 140 C284 145 332 157 376 174" className={visualState.tubePressureWarning ? 'tube-warning active' : 'tube-warning'} fill="none" stroke="rgba(255, 69, 69, 0)" strokeLinecap="round" strokeWidth="7" />
      <g className={visualState.tubePressureWarning ? 'tube-depth-indicator active' : 'tube-depth-indicator'}>
        <path className="tube-depth-arrow" d="M220 210 L240 218 M234 210 L240 218 L229 221" fill="none" stroke="#ff4545" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <rect x="238" y="211" width="35" height="14" rx="5" fill="#331717" stroke="#ff4545" strokeOpacity="0.82" strokeWidth="1" />
        <text aria-hidden="true" className="tube-depth-label" fill="#fff4f2" x="244" y="221">DEPTH</text>
      </g>
      <path d="M470 184 C489 172 512 175 528 191 C510 203 488 201 470 190Z" fill="url(#blueCircuit)" stroke="#c6e7ff" strokeWidth="1.4" />
      <path d="M466 220 C487 208 512 211 530 228 C510 241 487 237 466 228Z" fill="url(#blueCircuit)" stroke="#c6e7ff" strokeWidth="1.4" />
      <g className="hme-filter" aria-hidden="true">
        <rect x="430" y="189" width="34" height="29" rx="7" fill="#d8edf7" stroke="#6aa8ce" strokeOpacity="0.82" strokeWidth="1.6" />
        <path d="M438 197 L456 197 M438 203 L456 203 M438 209 L456 209" fill="none" stroke="#5f8cab" strokeLinecap="round" strokeOpacity="0.62" strokeWidth="1.2" />
      </g>
      <circle className="y-piece-connector" cx="468" cy="203" r="12" fill="#cfeeff" stroke="#6aa8ce" strokeOpacity="0.86" strokeWidth="2.2" />
      <path className="y-piece-joint" d="M457 199 C466 203 475 204 485 200 M456 207 C466 211 476 211 486 207" fill="none" stroke="#5e8baa" strokeLinecap="round" strokeOpacity="0.7" strokeWidth="1.5" />
      <path className="flow-arrow inspiratory-flow" d="M260 137 C318 143 370 156 417 174 C457 189 502 190 575 190" fill="none" stroke="#f8fcff" strokeLinecap="round" strokeDasharray="10 13" strokeWidth="3" />
      <path className="flow-arrow expiratory-flow" d="M258 164 C318 174 370 189 418 209 C461 227 508 229 581 224" fill="none" stroke="#56b8ff" strokeLinecap="round" strokeDasharray="10 13" strokeWidth="3" />
      <path className="exhalation-valve-blink" d="M601 225 C611 218 624 220 631 231 C621 238 610 236 601 225Z" fill="#56b8ff" stroke="#d9f7ff" strokeOpacity="0.78" strokeWidth="1.2" />
    </>
  );
}
