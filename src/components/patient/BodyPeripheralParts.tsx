type BodyPeripheralCyanosisProps = { peripheralCyanosisOpacity: number };
type BodyPeripheralMottlingProps = { mottlingOpacity: number };

export function BodyArmPerfusion() {
  // prettier-ignore
  return (
    <>
      <g className="clinical-arm-positioning">
        <path className="arm-board left" d="M51 316 C71 297 102 285 137 283 L121 347 C89 352 63 342 51 316Z" fill="rgba(68, 122, 151, 0.28)" stroke="#8fc5dc" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.38" strokeWidth="1.6" />
        <path className="arm-board right" d="M383 260 C421 269 457 289 505 318 L489 345 C448 321 408 300 371 294Z" fill="rgba(68, 122, 151, 0.24)" stroke="#8fc5dc" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.34" strokeWidth="1.6" />
        <path className="extended-arm-posture left" d="M118 236 C93 263 80 299 77 338" fill="none" stroke="#7b463e" strokeLinecap="round" strokeOpacity="0.28" strokeWidth="2" />
        <path className="extended-arm-posture right" d="M337 233 C391 249 432 281 469 326" fill="none" stroke="#7b463e" strokeLinecap="round" strokeOpacity="0.24" strokeWidth="2" />
        <path className="elbow-contour left" d="M111 260 C101 278 95 300 95 323" fill="none" stroke="#b9e5ef" strokeLinecap="round" strokeOpacity="0.34" strokeWidth="1.7" />
        <path className="elbow-contour right" d="M386 252 C412 267 438 290 463 318" fill="none" stroke="#b9e5ef" strokeLinecap="round" strokeOpacity="0.3" strokeWidth="1.7" />
        <rect className="wrist-rest left" x="71" y="328" width="46" height="15" rx="5" fill="rgba(222, 240, 250, 0.18)" stroke="#d8f2ff" strokeOpacity="0.48" strokeWidth="1.1" transform="rotate(-8 94 335)" />
        <rect className="wrist-rest right" x="465" y="313" width="48" height="15" rx="5" fill="rgba(222, 240, 250, 0.16)" stroke="#d8f2ff" strokeOpacity="0.42" strokeWidth="1.1" transform="rotate(18 489 320)" />
      </g>

      <path d="M118 236 C91 263 78 297 75 338 L115 337 C121 300 136 275 163 253Z" fill="url(#skinClinical)" opacity="0.86" stroke="#7b463e" strokeOpacity="0.22" strokeWidth="1.5" />
      <path d="M335 234 C387 248 426 279 465 328 L501 318 C458 259 415 224 361 207Z" fill="url(#skinClinical)" opacity="0.82" stroke="#7b463e" strokeOpacity="0.22" strokeWidth="1.5" />
      <ellipse cx="95" cy="340" rx="18" ry="13" fill="url(#skinClinical)" stroke="#7b463e" strokeOpacity="0.24" />
      <ellipse className="hand-edema left" cx="96" cy="341" rx="22" ry="15" fill="rgba(238, 241, 220, 0.12)" stroke="#e7d6a4" strokeOpacity="0.26" strokeWidth="0.8" />
      <path d="M83 337 C91 333 100 333 109 337 M83 344 C93 347 103 347 113 343" fill="none" stroke="#74453e" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="1.2" />
      <path className="hand-fingers left-hand" d="M81 339 L91 336 M83 344 L94 342 M88 348 L99 347 M102 337 L113 335" fill="none" stroke="#6e4039" strokeLinecap="round" strokeOpacity="0.5" strokeWidth="1.1" />
      <path className="natural-finger-crease left-hand" d="M90 336 C91 338 92 340 93 342 M98 342 C99 344 100 346 101 348" fill="none" stroke="#8c554c" strokeLinecap="round" strokeOpacity="0.34" strokeWidth="0.7" />
      <path className="finger-cyanosis left-hand" d="M81 339 L91 336 M83 344 L94 342 M88 348 L99 347" fill="none" stroke="#4d62bc" strokeLinecap="round" strokeOpacity="0.54" strokeWidth="1.6" />
      <path className="nail-bed left-hand" d="M87 337 L91 336 M91 343 L95 342 M96 348 L100 347" fill="none" stroke="#f0c0bb" strokeLinecap="round" strokeOpacity="0.74" strokeWidth="1.1" />
      <path className="finger-clubbing left-hand" d="M80 339 C84 335 90 335 93 338 M87 348 C92 345 99 345 102 348" fill="none" stroke="#9f6b5e" strokeLinecap="round" strokeOpacity="0.26" strokeWidth="1.1" />
      <rect className="spo2-probe" x="72" y="331" width="22" height="13" rx="4" fill="#d6eef8" stroke="#68c7f0" strokeWidth="1.4" />
      <path className="spo2-wire" d="M74 337 C50 326 40 304 24 292" fill="none" stroke="#68c7f0" strokeLinecap="round" strokeWidth="2" />
      <ellipse cx="493" cy="322" rx="19" ry="12" fill="url(#skinClinical)" stroke="#7b463e" strokeOpacity="0.2" />
      <ellipse className="hand-edema right" cx="493" cy="322" rx="23" ry="14" fill="rgba(238, 241, 220, 0.1)" stroke="#e7d6a4" strokeOpacity="0.22" strokeWidth="0.8" />
      <path className="hand-fingers right-hand" d="M480 320 L490 316 M483 325 L495 322 M488 330 L500 328 M499 318 L510 317" fill="none" stroke="#6e4039" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="1.1" />
      <path className="natural-finger-crease right-hand" d="M489 317 C490 319 491 321 492 323 M496 323 C497 325 498 327 499 329" fill="none" stroke="#8c554c" strokeLinecap="round" strokeOpacity="0.3" strokeWidth="0.7" />
      <path className="finger-cyanosis right-hand" d="M480 320 L490 316 M483 325 L495 322 M488 330 L500 328" fill="none" stroke="#4d62bc" strokeLinecap="round" strokeOpacity="0.48" strokeWidth="1.5" />
      <path className="nail-bed right-hand" d="M486 318 L490 316 M491 324 L496 322 M496 329 L501 328" fill="none" stroke="#f0c0bb" strokeLinecap="round" strokeOpacity="0.68" strokeWidth="1" />
      <path className="finger-clubbing right-hand" d="M479 320 C483 316 490 315 493 318 M487 330 C493 327 500 326 503 329" fill="none" stroke="#9f6b5e" strokeLinecap="round" strokeOpacity="0.24" strokeWidth="1" />
    </>
  );
}

export function BodyPeripheralCyanosis({ peripheralCyanosisOpacity }: BodyPeripheralCyanosisProps) {
  return (
    <g className="peripheral-cyanosis-caps" opacity={peripheralCyanosisOpacity}>
      <FingertipCyanosisCaps />
      <ToeCyanosisCaps />
    </g>
  );
}

function FingertipCyanosisCaps() {
  return (
    <>
      <LeftFingertipCyanosisCaps />
      <RightFingertipCyanosisCaps />
    </>
  );
}

function LeftFingertipCyanosisCaps() {
  return (
    <>
      <ellipse
        className="fingertip-cyanosis left index"
        cx="88"
        cy="338"
        rx="4.6"
        ry="2.7"
        fill="#293a90"
        stroke="#5b8dff"
        strokeOpacity="0.66"
        strokeWidth="0.8"
        transform="rotate(-15 88 338)"
      />
      <ellipse
        className="fingertip-cyanosis left middle"
        cx="94"
        cy="344"
        rx="4.8"
        ry="2.8"
        fill="#293a90"
        stroke="#5b8dff"
        strokeOpacity="0.66"
        strokeWidth="0.8"
        transform="rotate(-9 94 344)"
      />
    </>
  );
}

function RightFingertipCyanosisCaps() {
  return (
    <>
      <ellipse
        className="fingertip-cyanosis right index"
        cx="487"
        cy="319"
        rx="4.7"
        ry="2.6"
        fill="#293a90"
        stroke="#5b8dff"
        strokeOpacity="0.62"
        strokeWidth="0.8"
        transform="rotate(-18 487 319)"
      />
      <ellipse
        className="fingertip-cyanosis right middle"
        cx="494"
        cy="326"
        rx="4.8"
        ry="2.8"
        fill="#293a90"
        stroke="#5b8dff"
        strokeOpacity="0.62"
        strokeWidth="0.8"
        transform="rotate(-10 494 326)"
      />
    </>
  );
}

function ToeCyanosisCaps() {
  return (
    <>
      <ellipse
        className="toe-cyanosis-cap left"
        cx="190"
        cy="354"
        rx="18"
        ry="5.2"
        fill="#293a90"
        stroke="#5b8dff"
        strokeOpacity="0.54"
        strokeWidth="0.9"
      />
      <ellipse
        className="toe-cyanosis-cap right"
        cx="350"
        cy="354"
        rx="18"
        ry="5.2"
        fill="#293a90"
        stroke="#5b8dff"
        strokeOpacity="0.54"
        strokeWidth="0.9"
      />
    </>
  );
}

export function BodyPeripheralMottling({ mottlingOpacity }: BodyPeripheralMottlingProps) {
  return (
    <>
      <g className="peripheral-mottling" opacity={mottlingOpacity}>
        <path
          className="mottling-spot chest"
          d="M178 230 C188 219 205 221 209 235 C201 244 184 243 178 230Z"
          fill="rgba(55, 65, 142, 0.42)"
          stroke="none"
        />
        <path
          className="mottling-spot chest"
          d="M287 232 C300 224 316 231 315 245 C303 252 289 246 287 232Z"
          fill="rgba(50, 60, 134, 0.38)"
          stroke="none"
        />
        <circle
          className="mottling-spot left-hand"
          cx="102"
          cy="346"
          r="5.4"
          fill="rgba(45, 58, 138, 0.42)"
          stroke="none"
        />
        <circle
          className="mottling-spot right-hand"
          cx="493"
          cy="327"
          r="5.8"
          fill="rgba(45, 58, 138, 0.38)"
          stroke="none"
        />
        <path
          className="mottling-spot left-foot"
          d="M180 352 C189 347 199 350 202 356 C194 360 184 358 180 352Z"
          fill="rgba(45, 58, 138, 0.4)"
          stroke="none"
        />
        <path
          className="mottling-spot right-foot"
          d="M340 353 C350 347 361 350 365 356 C356 360 345 358 340 353Z"
          fill="rgba(45, 58, 138, 0.4)"
          stroke="none"
        />
      </g>
    </>
  );
}
