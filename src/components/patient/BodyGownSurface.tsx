type BodyGownSurfaceProps = { erythemaOpacity: number };

export function BodyGownSurface({ erythemaOpacity }: BodyGownSurfaceProps) {
  return (
    <>
      <g className="clinical-gown-surface">
        <path
          className="gown-chest-panel"
          d="M145 214 C186 193 280 197 333 222 C318 264 287 292 239 295 C193 297 161 264 145 214Z"
          fill="rgba(206, 241, 247, 0.22)"
          stroke="#bdeeff"
          strokeLinecap="round"
          strokeOpacity="0.42"
          strokeWidth="1.6"
        />
        <path
          className="gown-abdomen-panel"
          d="M119 291 C209 267 362 279 497 321 L505 359 L108 359Z"
          fill="rgba(37, 113, 135, 0.22)"
          stroke="#7ac7d8"
          strokeLinecap="round"
          strokeOpacity="0.28"
          strokeWidth="1.4"
        />
        <path
          className="gown-breath-fold"
          d="M164 238 C203 225 290 232 322 252 M147 311 C240 291 372 300 477 331"
          fill="none"
          stroke="#daf8ff"
          strokeLinecap="round"
          strokeOpacity="0.26"
          strokeWidth="1.8"
        />
        <path
          className="gown-tie-back"
          d="M323 222 C342 213 360 213 377 223 M341 220 L352 232 M356 219 L345 232"
          fill="none"
          stroke="#daf8ff"
          strokeLinecap="round"
          strokeOpacity="0.34"
          strokeWidth="1.4"
        />
        <path
          className="hospital-sheet-wrinkle"
          d="M124 334 C206 309 355 315 493 348 M99 304 C197 279 356 287 527 334"
          fill="none"
          stroke="#b9e5ef"
          strokeLinecap="round"
          strokeOpacity="0.24"
          strokeWidth="1.5"
        />
        <path
          className="sheet-shadow"
          d="M96 351 C212 336 397 340 552 358"
          fill="none"
          stroke="#123247"
          strokeLinecap="round"
          strokeOpacity="0.38"
          strokeWidth="2"
        />
      </g>

      <g className="erythema-rash" opacity={erythemaOpacity}>
        <circle className="erythema-spot chest-a" cx="181" cy="229" r="4.6" fill="#c1121f" stroke="none" />
        <circle className="erythema-spot chest-b" cx="315" cy="243" r="4" fill="#c1121f" stroke="none" />
        <circle className="erythema-spot forearm" cx="405" cy="275" r="3.6" fill="#c1121f" stroke="none" />
      </g>
    </>
  );
}
