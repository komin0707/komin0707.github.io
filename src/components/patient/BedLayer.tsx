import type { ReactNode } from 'react';

const BED_FRAME = (
  <>
    <path
      d="M42 72 C174 31 466 31 598 73 L612 283 C472 340 175 340 34 283Z"
      fill="url(#bedBase)"
      stroke="#183850"
      strokeWidth="2"
    />
    <path
      d="M60 92 C183 59 456 58 581 92 L570 285 C442 322 197 322 72 285Z"
      fill="#9aafbb"
      opacity="0.26"
      stroke="#c2d0d8"
      strokeOpacity="0.22"
      strokeWidth="1.5"
    />
    <path
      d="M76 122 C190 95 444 95 562 121 L552 302 C427 335 206 336 86 302Z"
      fill="url(#mattressDepth)"
      opacity="0.78"
      stroke="#557991"
      strokeOpacity="0.38"
      strokeWidth="2"
    />
    <path
      d="M76 81 C117 54 196 51 238 76 C226 118 112 124 68 101Z"
      fill="#d7e2ea"
      opacity="0.9"
      stroke="#eef6fb"
      strokeOpacity="0.55"
      strokeWidth="1.5"
    />
    <path
      d="M79 85 C125 69 187 67 226 81"
      fill="none"
      stroke="#f6fbff"
      strokeOpacity="0.46"
      strokeWidth="3"
    />
    <path
      className="fowler-head-angle"
      d="M76 122 C106 103 148 94 190 96"
      fill="none"
      stroke="#e8f1fb"
      strokeLinecap="round"
      strokeOpacity="0.42"
      strokeWidth="2.2"
    />
    <path
      d="M63 139 C183 165 457 165 578 139"
      fill="none"
      stroke="#93b2c6"
      strokeOpacity="0.32"
      strokeWidth="8"
    />
    <path
      d="M58 303 C189 348 448 349 582 304"
      fill="none"
      stroke="#082033"
      strokeOpacity="0.7"
      strokeWidth="15"
    />
    <rect
      className="bed-footrest"
      x="456"
      y="296"
      width="94"
      height="19"
      rx="6"
      fill="rgba(200, 216, 226, 0.34)"
      stroke="#e8f1fb"
      strokeOpacity="0.42"
      strokeWidth="1.4"
      transform="rotate(-8 503 306)"
    />
    <g className="bed-wheels">
      <circle
        className="bed-wheel front-left"
        cx="87"
        cy="312"
        r="7"
        fill="#0b2538"
        stroke="#9aafbb"
        strokeWidth="1.5"
      />
      <circle
        className="bed-wheel rear-left"
        cx="142"
        cy="326"
        r="6.5"
        fill="#0b2538"
        stroke="#9aafbb"
        strokeWidth="1.4"
      />
      <circle
        className="bed-wheel front-right"
        cx="503"
        cy="326"
        r="6.5"
        fill="#0b2538"
        stroke="#9aafbb"
        strokeWidth="1.4"
      />
      <circle
        className="bed-wheel rear-right"
        cx="559"
        cy="310"
        r="7"
        fill="#0b2538"
        stroke="#9aafbb"
        strokeWidth="1.5"
      />
      <path
        className="bed-wheel-bracket"
        d="M82 305 L93 305 M137 320 L148 320 M498 320 L509 320 M554 303 L565 303"
        fill="none"
        stroke="#c8d8e2"
        strokeLinecap="round"
        strokeOpacity="0.55"
        strokeWidth="1.6"
      />
    </g>
    <g className="bed-position-indicators">
      <path
        className="trendelenburg-indicator"
        d="M110 57 L153 49 L148 58"
        fill="none"
        stroke="#ffd84a"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.52"
        strokeWidth="1.5"
      />
      <path
        className="reverse-trendelenburg-indicator"
        d="M492 50 L535 58 L528 48"
        fill="none"
        stroke="#78d9ff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.46"
        strokeWidth="1.5"
      />
    </g>
  </>
);

const BED_RAILS = (
  <>
    <path
      className="bed-rail left"
      d="M66 162 C73 213 75 260 70 303"
      fill="none"
      stroke="#c8d8e2"
      strokeLinecap="round"
      strokeOpacity="0.62"
      strokeWidth="5"
    />
    <path
      className="bed-rail right"
      d="M575 161 C568 213 566 260 571 303"
      fill="none"
      stroke="#c8d8e2"
      strokeLinecap="round"
      strokeOpacity="0.58"
      strokeWidth="5"
    />
    <path
      className="bed-rail-crossbar"
      d="M69 206 C91 214 111 220 132 224 M570 207 C548 216 527 222 505 226"
      fill="none"
      stroke="#e8f1fb"
      strokeLinecap="round"
      strokeOpacity="0.46"
      strokeWidth="2.2"
    />
  </>
);

const BEDSIDE_MONITOR = (
  <g className="bedside-monitor">
    <rect
      x="492"
      y="62"
      width="72"
      height="48"
      rx="8"
      fill="#061827"
      stroke="#6eaad0"
      strokeOpacity="0.84"
      strokeWidth="1.6"
    />
    <rect
      x="500"
      y="70"
      width="56"
      height="28"
      rx="4"
      fill="#0b2438"
      stroke="#173d59"
      strokeOpacity="0.9"
      strokeWidth="1"
    />
    <path
      className="monitor-trace"
      d="M504 84 L514 84 L519 76 L526 92 L532 84 L552 84"
      fill="none"
      stroke="#35d27f"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      className="monitor-stand"
      d="M528 110 L528 126 M511 126 L546 126"
      fill="none"
      stroke="#6eaad0"
      strokeLinecap="round"
      strokeOpacity="0.68"
      strokeWidth="2.2"
    />
    <path
      className="monitor-cable"
      d="M511 108 C487 128 468 154 449 184"
      fill="none"
      stroke="#253b4c"
      strokeLinecap="round"
      strokeOpacity="0.72"
      strokeWidth="2.4"
    />
  </g>
);

export function BedLayer(): ReactNode {
  return (
    <g className="clinical-bed">
      {BED_FRAME}
      {BED_RAILS}
      {BEDSIDE_MONITOR}
    </g>
  );
}
