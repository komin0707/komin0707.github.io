import { PATIENT_AVATAR_PALETTE } from './patientAvatarPalette';

type BodyTorsoBaseProps = { jaundiceOpacity: number; pallorOpacity: number };
type BodyFeetEdemaProps = { edemaOpacity: number };

export function BodyTorsoBase({ jaundiceOpacity, pallorOpacity }: BodyTorsoBaseProps) {
  // prettier-ignore
  return (
    <>
      <path d="M188 156 C207 179 239 185 260 162 L269 205 C251 224 204 222 184 201Z" fill="url(#skinClinical)" stroke="#7b463e" strokeOpacity="0.28" strokeWidth="1.5" />
      <path className="skin-overlay" d="M188 156 C207 179 239 185 260 162 L269 205 C251 224 204 222 184 201Z" fill={PATIENT_AVATAR_PALETTE.skin.cyanosisOverlay} stroke="none" />
      <path className="pallor-wash neck" d="M188 156 C207 179 239 185 260 162 L269 205 C251 224 204 222 184 201Z" fill="rgba(238, 241, 220, 0.46)" opacity={pallorOpacity} stroke="none" />
      <path className="jaundice-wash neck" d="M188 156 C207 179 239 185 260 162 L269 205 C251 224 204 222 184 201Z" fill={PATIENT_AVATAR_PALETTE.skin.jaundiceOverlay} opacity={jaundiceOpacity} stroke="none" />

      <path d="M135 218 C164 181 221 174 282 184 C355 196 412 238 468 314 L500 359 L104 359 L112 286 C116 257 123 235 135 218Z" fill="url(#skinClinical)" stroke="#7b463e" strokeOpacity="0.24" strokeWidth="1.5" />
      <path className="skin-overlay" d="M135 218 C164 181 221 174 282 184 C355 196 412 238 468 314 L500 359 L104 359 L112 286 C116 257 123 235 135 218Z" fill={PATIENT_AVATAR_PALETTE.skin.cyanosisOverlay} stroke="none" />
      <g className="adult-supine-silhouette">
        <path className="shoulder-plane" d="M129 217 C158 176 220 166 286 181 C326 190 364 212 398 246" fill="none" stroke="#5d3935" strokeLinecap="round" strokeOpacity="0.48" strokeWidth="2.2" />
        <path className="adult-torso-boundary" d="M145 215 C180 188 278 191 333 222 C328 263 294 303 238 304 C184 304 151 262 145 215Z" fill="rgba(255, 218, 202, 0.08)" stroke="#673d38" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.36" strokeWidth="1.8" />
        <path className="adult-midline" d="M232 201 C233 246 241 302 253 357" fill="none" stroke="#7a4740" strokeDasharray="6 9" strokeLinecap="round" strokeOpacity="0.3" strokeWidth="1.4" />
        <path className="recumbent-left-leg-axis" d="M185 300 C183 323 184 342 190 358" fill="none" stroke="#d8f2ff" strokeLinecap="round" strokeOpacity="0.32" strokeWidth="2" />
        <path className="recumbent-right-leg-axis" d="M322 303 C339 324 348 342 350 358" fill="none" stroke="#d8f2ff" strokeLinecap="round" strokeOpacity="0.3" strokeWidth="2" />
      </g>
      <path className="pallor-wash torso" d="M135 218 C164 181 221 174 282 184 C355 196 412 238 468 314 L500 359 L104 359 L112 286 C116 257 123 235 135 218Z" fill="rgba(238, 241, 220, 0.44)" opacity={pallorOpacity} stroke="none" />
      <path className="jaundice-wash torso" d="M135 218 C164 181 221 174 282 184 C355 196 412 238 468 314 L500 359 L104 359 L112 286 C116 257 123 235 135 218Z" fill={PATIENT_AVATAR_PALETTE.skin.jaundiceOverlay} opacity={jaundiceOpacity} stroke="none" />
    </>
  );
}

export function BodyDrapeAndLegs() {
  // prettier-ignore
  return (
    <>
      <path d="M93 251 C184 220 295 221 397 254 C459 274 506 297 548 335 L551 360 L72 360 L76 306 C79 280 84 263 93 251Z" fill="url(#blueDrape)" opacity="0.98" stroke="#0e3a52" strokeOpacity="0.7" strokeWidth="2" />
      <path className="leg-contour left" d="M188 268 C179 297 176 326 183 358" fill="none" stroke="#74b7c8" strokeLinecap="round" strokeOpacity="0.34" strokeWidth="3" />
      <path className="leg-contour right" d="M325 271 C337 300 344 329 343 358" fill="none" stroke="#74b7c8" strokeLinecap="round" strokeOpacity="0.3" strokeWidth="3" />
      <path className="blanket-fold" d="M117 294 C219 270 371 278 493 321" fill="none" stroke="#79c0d2" strokeLinecap="round" strokeOpacity="0.22" strokeWidth="2" />
      <g className="adult-recumbent-proportions">
        <path className="body-axis-line" d="M232 210 C244 252 258 303 274 357" fill="none" stroke="#b9e5ef" strokeDasharray="7 9" strokeLinecap="round" strokeOpacity="0.22" strokeWidth="1.5" />
        <path className="pelvis-contour" d="M163 300 C211 282 303 286 365 315 C335 342 222 347 163 300Z" fill="rgba(111, 192, 211, 0.14)" stroke="#9ed7e8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.34" strokeWidth="1.8" />
        <path className="knee-rise left" d="M154 323 C178 309 211 309 235 324 C211 337 178 336 154 323Z" fill="rgba(129, 205, 220, 0.15)" stroke="#9ed7e8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.36" strokeWidth="1.6" />
        <path className="knee-rise right" d="M303 327 C330 312 366 315 392 333 C364 344 330 342 303 327Z" fill="rgba(129, 205, 220, 0.13)" stroke="#9ed7e8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.32" strokeWidth="1.6" />
        <path className="thigh-contour left" d="M178 285 C176 312 179 337 187 358" fill="none" stroke="#b9e5ef" strokeLinecap="round" strokeOpacity="0.3" strokeWidth="1.8" />
        <path className="thigh-contour right" d="M317 288 C332 314 344 337 350 358" fill="none" stroke="#b9e5ef" strokeLinecap="round" strokeOpacity="0.28" strokeWidth="1.8" />
        <path className="ankle-axis" d="M150 352 C198 344 305 345 385 354" fill="none" stroke="#d8f2ff" strokeLinecap="round" strokeOpacity="0.2" strokeWidth="1.5" />
      </g>
      <path className="foley-catheter" d="M292 342 C361 352 454 354 552 335" fill="none" stroke="#f2d37a" strokeLinecap="round" strokeWidth="2.2" />
      <g className="foley-bag">
        <rect x="545" y="316" width="35" height="35" rx="7" fill="rgba(245, 250, 255, 0.34)" stroke="#d8ecf7" strokeOpacity="0.86" strokeWidth="1.4" />
        <rect x="551" y="336" width="23" height="10" rx="3" fill="rgba(235, 190, 70, 0.48)" stroke="#f2d37a" strokeOpacity="0.72" strokeWidth="0.8" />
        <circle cx="552" cy="335" r="3.2" fill="#f2d37a" stroke="#8f7443" strokeWidth="0.8" />
      </g>
    </>
  );
}

export function BodyFeetEdema({ edemaOpacity }: BodyFeetEdemaProps) {
  return (
    <>
      <BodyFeet />
      <FootEdemaMarkers edemaOpacity={edemaOpacity} />
    </>
  );
}

function BodyFeet() {
  return (
    <>
      <ellipse
        className="foot left-foot"
        cx="190"
        cy="354"
        rx="24"
        ry="10"
        fill="url(#skinClinical)"
        stroke="#7b463e"
        strokeOpacity="0.2"
      />
      <ellipse
        className="foot right-foot"
        cx="350"
        cy="354"
        rx="24"
        ry="10"
        fill="url(#skinClinical)"
        stroke="#7b463e"
        strokeOpacity="0.2"
      />
      <path
        className="toe-cyanosis"
        d="M177 354 C184 357 195 357 203 354 M337 354 C344 357 356 357 364 354"
        fill="none"
        stroke="#4d62bc"
        strokeLinecap="round"
        strokeOpacity="0.38"
        strokeWidth="2"
      />
    </>
  );
}

function FootEdemaMarkers({ edemaOpacity }: BodyFeetEdemaProps) {
  return (
    <g className="edema-markers" opacity={edemaOpacity}>
      <path
        className="edema-swelling left-foot"
        d="M160 351 C171 340 206 339 220 351 C211 360 174 360 160 351Z"
        fill="rgba(238, 241, 220, 0.18)"
        stroke="#e7d6a4"
        strokeLinecap="round"
        strokeOpacity="0.72"
        strokeWidth="2"
      />
      <path
        className="edema-swelling right-foot"
        d="M322 351 C334 340 368 340 382 352 C371 360 334 360 322 351Z"
        fill="rgba(238, 241, 220, 0.18)"
        stroke="#e7d6a4"
        strokeLinecap="round"
        strokeOpacity="0.72"
        strokeWidth="2"
      />
      <path
        className="edema-pitting left"
        d="M181 349 C187 352 197 352 204 349"
        fill="none"
        stroke="#fff4c5"
        strokeLinecap="round"
        strokeOpacity="0.78"
        strokeWidth="1.4"
      />
      <path
        className="edema-pitting right"
        d="M343 349 C350 352 360 352 367 349"
        fill="none"
        stroke="#fff4c5"
        strokeLinecap="round"
        strokeOpacity="0.78"
        strokeWidth="1.4"
      />
    </g>
  );
}
