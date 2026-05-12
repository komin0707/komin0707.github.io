import type { SecretionSpot } from './BodyLungFields';

type BodyLungBaseProps = {
  hyperinflationOpacity: number;
  leftLungClass: string;
  pleuralAirOpacity: number;
  rightLungClass: string;
};

type BodyLungFindingsProps = { groundGlassOpacity: number };
type BodyLungSecretionsProps = { secretionColor: string; visibleSecretionSpots: readonly SecretionSpot[] };

export function BodyLungBase({
  hyperinflationOpacity,
  leftLungClass,
  pleuralAirOpacity,
  rightLungClass,
}: BodyLungBaseProps) {
  return (
    <>
      <LungPair leftLungClass={leftLungClass} rightLungClass={rightLungClass} />
      <HyperinflationOutline hyperinflationOpacity={hyperinflationOpacity} />
      <PleuralAirPocket pleuralAirOpacity={pleuralAirOpacity} />
      <LungLandmarks />
    </>
  );
}

function LungPair({
  leftLungClass,
  rightLungClass,
}: Pick<BodyLungBaseProps, 'leftLungClass' | 'rightLungClass'>) {
  return (
    <>
      <path
        className={leftLungClass}
        d="M198 236 C174 260 174 311 196 335 C212 352 240 333 251 300 C263 266 246 238 221 229 C211 225 203 228 198 236Z"
        fill="url(#lungTissue)"
        stroke="#7e3342"
        strokeOpacity="0.9"
        strokeWidth="2"
      />
      <path
        className={rightLungClass}
        d="M292 239 C323 254 341 299 327 330 C316 352 284 341 265 307 C248 276 261 247 283 235 C287 233 290 235 292 239Z"
        fill="url(#lungTissue)"
        stroke="#7e3342"
        strokeOpacity="0.9"
        strokeWidth="2"
      />
    </>
  );
}

function HyperinflationOutline({ hyperinflationOpacity }: Pick<BodyLungBaseProps, 'hyperinflationOpacity'>) {
  return (
    <g className="hyperinflation-outline" opacity={hyperinflationOpacity}>
      <path
        className="hyperinflation-lung left"
        d="M187 226 C154 254 151 322 188 349 C213 369 252 340 263 300 C276 253 238 217 205 218 C197 219 191 222 187 226Z"
        fill="none"
        stroke="#f7d56b"
        strokeDasharray="5 5"
        strokeLinecap="round"
        strokeOpacity="0.74"
        strokeWidth="2.4"
      />
      <path
        className="hyperinflation-lung right"
        d="M286 228 C326 237 356 294 340 336 C325 373 279 352 255 310 C232 270 253 231 280 223 C283 222 285 225 286 228Z"
        fill="none"
        stroke="#f7d56b"
        strokeDasharray="5 5"
        strokeLinecap="round"
        strokeOpacity="0.74"
        strokeWidth="2.4"
      />
    </g>
  );
}

function PleuralAirPocket({ pleuralAirOpacity }: Pick<BodyLungBaseProps, 'pleuralAirOpacity'>) {
  return (
    <path
      className="pleural-air-pocket"
      d="M174 236 C153 265 153 315 181 342 C176 313 179 270 199 236 C190 231 181 231 174 236Z"
      fill="rgba(174, 230, 255, 0.28)"
      opacity={pleuralAirOpacity}
      stroke="#bcefff"
      strokeDasharray="4 5"
      strokeLinecap="round"
      strokeOpacity="0.72"
      strokeWidth="2"
    />
  );
}

function LungLandmarks() {
  return (
    <>
      <LungLobeLines />
      <HeartPosition />
      <LungHighlights />
      <AlveolarFields />
    </>
  );
}

function LungLobeLines() {
  return (
    <>
      <path
        className="lung-lobe-line left-lung-lobe"
        d="M210 261 C225 282 234 305 235 331"
        fill="none"
        stroke="#ffd7d7"
        strokeLinecap="round"
        strokeOpacity="0.32"
        strokeWidth="1.5"
      />
      <path
        className="lung-lobe-line right-upper-lobe"
        d="M286 257 C302 271 314 287 320 305"
        fill="none"
        stroke="#ffd7d7"
        strokeLinecap="round"
        strokeOpacity="0.32"
        strokeWidth="1.5"
      />
      <path
        className="lung-lobe-line right-middle-lobe"
        d="M274 287 C291 292 309 302 322 316"
        fill="none"
        stroke="#ffd7d7"
        strokeLinecap="round"
        strokeOpacity="0.3"
        strokeWidth="1.4"
      />
    </>
  );
}

function HeartPosition() {
  return (
    <path
      className="heart-position"
      d="M249 282 C252 269 267 265 275 276 C284 265 300 272 301 286 C302 304 280 317 274 326 C267 316 246 303 249 282Z"
      fill="rgba(153, 36, 66, 0.44)"
      stroke="#ffd2d8"
      strokeOpacity="0.42"
      strokeWidth="1.4"
    />
  );
}

function LungHighlights() {
  return (
    <>
      <path
        className="lung-highlight"
        d="M207 251 C194 276 197 312 209 329 C221 341 237 316 244 295"
        fill="none"
        stroke="rgba(255, 226, 226, 0.36)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        className="lung-highlight"
        d="M290 253 C309 274 316 310 306 328 C296 345 280 320 271 299"
        fill="none"
        stroke="rgba(255, 226, 226, 0.36)"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </>
  );
}

function AlveolarFields() {
  return (
    <g className="alveolar-fields">
      <circle className="alveolus left upper" cx="215" cy="278" r="3.2" fill="none" stroke="#ffd7d7" />
      <circle className="alveolus left lower" cx="225" cy="309" r="3.8" fill="none" stroke="#ffd7d7" />
      <circle className="alveolus right upper" cx="295" cy="279" r="3.1" fill="none" stroke="#ffd7d7" />
      <circle className="alveolus right lower" cx="294" cy="313" r="3.6" fill="none" stroke="#ffd7d7" />
    </g>
  );
}

export function BodyLungFindings({ groundGlassOpacity }: BodyLungFindingsProps) {
  return (
    <>
      <path
        className="infiltrate"
        d="M199 269 C216 257 237 266 241 285 C225 296 205 290 199 269Z"
        fill="rgba(226, 231, 238, 0.72)"
        stroke="#ffe2c6"
        strokeOpacity="0.46"
        strokeWidth="1.2"
      />
      <path
        className="infiltrate"
        d="M273 274 C291 262 314 272 316 291 C299 301 280 294 273 274Z"
        fill="rgba(226, 231, 238, 0.72)"
        stroke="#ffe2c6"
        strokeOpacity="0.46"
        strokeWidth="1.2"
      />
      <GroundGlassPattern groundGlassOpacity={groundGlassOpacity} />
    </>
  );
}

function GroundGlassPattern({ groundGlassOpacity }: BodyLungFindingsProps) {
  return (
    <g className="ground-glass-pattern" opacity={groundGlassOpacity}>
      <path
        className="ground-glass-opacity left-upper"
        d="M190 254 C204 241 229 245 239 262 C225 274 199 271 190 254Z"
        fill="rgba(226, 236, 245, 0.46)"
        stroke="#f8fcff"
        strokeOpacity="0.46"
        strokeWidth="1"
      />
      <path
        className="ground-glass-opacity left-lower"
        d="M198 300 C213 288 239 294 243 315 C225 325 205 318 198 300Z"
        fill="rgba(226, 236, 245, 0.4)"
        stroke="#f8fcff"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
      <path
        className="ground-glass-opacity right-upper"
        d="M278 258 C295 247 315 255 322 274 C306 285 286 277 278 258Z"
        fill="rgba(226, 236, 245, 0.46)"
        stroke="#f8fcff"
        strokeOpacity="0.46"
        strokeWidth="1"
      />
      <path
        className="ground-glass-opacity right-lower"
        d="M270 302 C289 291 314 301 315 322 C298 333 277 322 270 302Z"
        fill="rgba(226, 236, 245, 0.4)"
        stroke="#f8fcff"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
    </g>
  );
}

export function BodyLungAirways() {
  return (
    <>
      <path
        className="trachea-visible"
        d="M232 159 L237 222 C221 236 209 260 201 292 M237 222 C259 238 274 263 286 296"
        fill="none"
        stroke="rgba(229, 239, 248, 0.46)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
      />
      <path
        className="bronchi-main"
        d="M237 222 C216 245 204 272 198 307 M213 267 C201 282 194 302 190 329 M237 222 C260 245 277 273 287 309 M274 268 C290 284 300 306 306 331"
        fill="none"
        stroke="rgba(203, 218, 237, 0.5)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </>
  );
}

export function BodyLungSecretions({ secretionColor, visibleSecretionSpots }: BodyLungSecretionsProps) {
  return (
    <>
      {visibleSecretionSpots.map((spot) => (
        <circle
          className="secretion"
          cx={spot.cx}
          cy={spot.cy}
          fill={secretionColor}
          key={`${spot.cx}-${spot.cy}`}
          r={spot.r}
          stroke="#fff1a8"
          strokeWidth="0.8"
        />
      ))}
    </>
  );
}
