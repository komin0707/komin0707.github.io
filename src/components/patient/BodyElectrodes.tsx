import { ECG_LEAD_MARKERS } from './avatarSvgShared';

const AVATAR_LEAD_PATHS = [
  ['avatar-lead', 'M178 251 C145 236 122 214 96 194', 'rgba(36, 48, 58, 0.65)', '2.2'],
  ['avatar-lead', 'M315 253 C365 237 405 212 449 184', 'rgba(36, 48, 58, 0.65)', '2.2'],
  ['avatar-lead', 'M226 244 C210 222 190 205 165 189', 'rgba(36, 48, 58, 0.65)', '2.2'],
  ['avatar-lead', 'M276 246 C312 219 352 202 405 178', 'rgba(36, 48, 58, 0.65)', '2.2'],
  ['avatar-lead', 'M249 340 C226 351 190 356 149 355', 'rgba(36, 48, 58, 0.65)', '2.2'],
  ['avatar-lead precordial-lead', 'M242 252 C279 229 331 204 404 178', 'rgba(36, 48, 58, 0.56)', '1.8'],
  ['avatar-lead precordial-lead', 'M257 261 C292 236 337 210 408 184', 'rgba(36, 48, 58, 0.54)', '1.8'],
  ['avatar-lead precordial-lead', 'M273 273 C306 244 347 218 413 191', 'rgba(36, 48, 58, 0.52)', '1.8'],
  ['avatar-lead precordial-lead', 'M292 286 C322 256 358 228 421 201', 'rgba(36, 48, 58, 0.5)', '1.8'],
  ['avatar-lead precordial-lead', 'M313 296 C339 265 371 236 430 211', 'rgba(36, 48, 58, 0.48)', '1.8'],
] as const;

const ELECTRODES = [
  ['electrode lead-ra', '178', '251', '10', '2'],
  ['electrode lead-la', '315', '253', '10', '2'],
  ['electrode lead-v1', '226', '244', '8.5', '2'],
  ['electrode lead-v2', '242', '252', '7.2', '1.8'],
  ['electrode lead-v3', '257', '261', '7.2', '1.8'],
  ['electrode lead-v4', '273', '273', '7.2', '1.8'],
  ['electrode lead-v5', '292', '286', '7.2', '1.8'],
  ['electrode lead-v6', '313', '296', '7.2', '1.8'],
  ['electrode lead-rl', '276', '246', '8.5', '2'],
  ['electrode lead-ll small', '249', '340', '9', '2'],
] as const;

export function BodyElectrodes() {
  return (
    <>
      {AVATAR_LEAD_PATHS.map(([className, d, stroke, strokeWidth]) => (
        <path
          className={className}
          d={d}
          fill="none"
          key={d}
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      ))}
      {ELECTRODES.map(([className, cx, cy, r, strokeWidth]) => (
        <circle
          className={className}
          cx={cx}
          cy={cy}
          fill="url(#electrodePad)"
          key={className}
          r={r}
          stroke="#eefaff"
          strokeWidth={strokeWidth}
        />
      ))}
      <EcgLeadCodes />
    </>
  );
}

function EcgLeadCodes() {
  return (
    <>
      {ECG_LEAD_MARKERS.map((marker) => (
        <g className={`ecg-lead-code ${marker.className}`} key={marker.className}>
          <circle
            cx={marker.cx}
            cy={marker.cy}
            r="4.2"
            fill={marker.fill}
            stroke="#eefaff"
            strokeWidth="0.8"
          />
          <text
            aria-hidden="true"
            className="ecg-lead-label"
            dominantBaseline="middle"
            fill={marker.textFill}
            textAnchor="middle"
            x={marker.cx}
            y={marker.cy + 0.3}
          >
            {marker.label}
          </text>
        </g>
      ))}
    </>
  );
}
