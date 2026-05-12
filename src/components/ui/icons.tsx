import type { ReactNode, SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number;
};

type IconPrimitive =
  | readonly ['circle', number, number, number]
  | readonly ['path', string]
  | readonly ['rect', number, number, number, number, number?];

type IconDefinition = readonly IconPrimitive[];
type IconComponent = (props: IconProps) => ReactNode;

const activity = [
  [
    'path',
    'M22 12h-2.5a2 2 0 0 0-1.9 1.5l-2.4 8.3a.3.3 0 0 1-.5 0L9.2 2.2a.3.3 0 0 0-.5 0l-2.3 8.3A2 2 0 0 1 4.5 12H2',
  ],
] as const;
const alertTriangle = [
  ['path', 'm21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3'],
  ['path', 'M12 9v4'],
  ['path', 'M12 17h.01'],
] as const;
const bell = [
  ['path', 'M10.3 21a2 2 0 0 0 3.4 0'],
  [
    'path',
    'M3.3 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .7-1.7C19.4 14 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.4 6-2.7 7.3',
  ],
] as const;
const bellOff = [
  ['path', 'M10.3 21a2 2 0 0 0 3.4 0'],
  ['path', 'M17 17H4a1 1 0 0 1-.7-1.7C4.6 14 6 12.5 6 8a6 6 0 0 1 .3-1.7'],
  ['path', 'm2 2 20 20'],
  ['path', 'M8.7 3A6 6 0 0 1 18 8c0 2.7.8 4.7 1.7 6'],
] as const;
const bellRing = [
  ['path', 'M10.3 21a2 2 0 0 0 3.4 0'],
  ['path', 'M22 8c0-2.3-.8-4.3-2-6'],
  [
    'path',
    'M3.3 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .7-1.7C19.4 14 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.4 6-2.7 7.3',
  ],
  ['path', 'M4 2C2.8 3.7 2 5.7 2 8'],
] as const;
const camera = [
  [
    'path',
    'M14 4a2 2 0 0 1 1.8 1.1l.4.9A2 2 0 0 0 18 7h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2a2 2 0 0 0 1.8-1l.5-.9A2 2 0 0 1 10 4z',
  ],
  ['circle', 12, 13, 3],
] as const;
const download = [
  ['path', 'M12 15V3'],
  ['path', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'],
  ['path', 'm7 10 5 5 5-5'],
] as const;
const eye = [
  ['path', 'M2.1 12.3a1 1 0 0 1 0-.6 10.8 10.8 0 0 1 19.8 0 1 1 0 0 1 0 .6 10.8 10.8 0 0 1-19.8 0'],
  ['circle', 12, 12, 3],
] as const;
const helpCircle = [
  ['circle', 12, 12, 10],
  ['path', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3'],
  ['path', 'M12 17h.01'],
] as const;
const history = [
  ['path', 'M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8'],
  ['path', 'M3 3v5h5'],
  ['path', 'M12 7v5l4 2'],
] as const;
const languages = [
  ['path', 'm5 8 6 6'],
  ['path', 'm4 14 6-6 2-3'],
  ['path', 'M2 5h12'],
  ['path', 'M7 2h1'],
  ['path', 'm22 22-5-10-5 10'],
  ['path', 'M14 18h6'],
] as const;
const pause = [
  ['rect', 5, 3, 5, 18, 1],
  ['rect', 14, 3, 5, 18, 1],
] as const;
const pauseCircle = [
  ['circle', 12, 12, 10],
  ['path', 'M10 15V9'],
  ['path', 'M14 15V9'],
] as const;
const play = [['path', 'M5 5a2 2 0 0 1 3-1.7l12 7a2 2 0 0 1 0 3.4l-12 7A2 2 0 0 1 5 19z']] as const;
const playCircle = [
  ['circle', 12, 12, 10],
  ['path', 'M9 9a1 1 0 0 1 1.5-.9l5 3a1 1 0 0 1 0 1.8l-5 3A1 1 0 0 1 9 15z'],
] as const;
const printer = [
  ['path', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'],
  ['path', 'M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6'],
  ['rect', 6, 14, 12, 8, 1],
] as const;
const rotateCcw = [
  ['path', 'M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8'],
  ['path', 'M3 3v5h5'],
] as const;
const serverCog = [
  ['path', 'M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5'],
  ['path', 'M4.5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5'],
  ['path', 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7'],
  ['path', 'M6 6h.01'],
  ['path', 'M6 18h.01'],
] as const;
const settings = [
  [
    'path',
    'M9.7 4.1a2.3 2.3 0 0 1 4.6 0 2.3 2.3 0 0 0 3.3 1.9 2.3 2.3 0 0 1 2.3 4 2.3 2.3 0 0 0 0 4 2.3 2.3 0 0 1-2.3 4 2.3 2.3 0 0 0-3.3 1.9 2.3 2.3 0 0 1-4.6 0A2.3 2.3 0 0 0 6.4 18a2.3 2.3 0 0 1-2.3-4 2.3 2.3 0 0 0 0-4 2.3 2.3 0 0 1 2.3-4 2.3 2.3 0 0 0 3.3-1.9',
  ],
  ['circle', 12, 12, 3],
] as const;
const upload = [
  ['path', 'M12 3v12'],
  ['path', 'm17 8-5-5-5 5'],
  ['path', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'],
] as const;
const volume2 = [
  [
    'path',
    'M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z',
  ],
  ['path', 'M16 9a5 5 0 0 1 0 6'],
  ['path', 'M19.4 18.4a9 9 0 0 0 0-12.8'],
] as const;
const zoomIn = [
  ['circle', 11, 11, 8],
  ['path', 'M21 21l-4.4-4.4'],
  ['path', 'M11 8v6'],
  ['path', 'M8 11h6'],
] as const;
const zoomOut = [
  ['circle', 11, 11, 8],
  ['path', 'M21 21l-4.4-4.4'],
  ['path', 'M8 11h6'],
] as const;

function createIcon(definition: IconDefinition): IconComponent {
  return function Icon({ size = 24, ...props }: IconProps) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
        width={size}
        {...props}
      >
        {definition.map(renderIconPrimitive)}
      </svg>
    );
  };
}

function renderIconPrimitive(primitive: IconPrimitive, index: number): ReactNode {
  if (primitive[0] === 'path') return <path d={primitive[1]} key={index} />;
  if (primitive[0] === 'circle')
    return <circle cx={primitive[1]} cy={primitive[2]} key={index} r={primitive[3]} />;
  return (
    <rect
      height={primitive[4]}
      key={index}
      rx={primitive[5]}
      width={primitive[3]}
      x={primitive[1]}
      y={primitive[2]}
    />
  );
}

/** Heartbeat waveform icon used for activity and trend controls. */
export const Activity = createIcon(activity);
/** Warning triangle icon used for alerts and safety notices. */
export const AlertTriangle = createIcon(alertTriangle);
/** Bell icon used for enabled alarm controls. */
export const Bell = createIcon(bell);
/** Muted bell icon used for disabled alarm controls. */
export const BellOff = createIcon(bellOff);
/** Ringing bell icon used for active alarm indicators. */
export const BellRing = createIcon(bellRing);
/** Camera icon used for screenshot and capture actions. */
export const Camera = createIcon(camera);
/** Download arrow icon used for export actions. */
export const Download = createIcon(download);
/** Eye icon used for visibility and preview controls. */
export const Eye = createIcon(eye);
/** Help circle icon used for guidance and support affordances. */
export const HelpCircle = createIcon(helpCircle);
/** History arrow icon used for timeline and restore actions. */
export const History = createIcon(history);
/** Languages icon used for locale switching controls. */
export const Languages = createIcon(languages);
/** Pause bars icon used for pausing playback. */
export const Pause = createIcon(pause);
/** Circled pause icon used for paused-state controls. */
export const PauseCircle = createIcon(pauseCircle);
/** Play triangle icon used for starting or resuming playback. */
export const Play = createIcon(play);
/** Circled play icon used for primary playback controls. */
export const PlayCircle = createIcon(playCircle);
/** Printer icon used for print actions. */
export const Printer = createIcon(printer);
/** Counterclockwise arrow icon used for reset actions. */
export const RotateCcw = createIcon(rotateCcw);
/** Server gear icon used for system and infrastructure settings. */
export const ServerCog = createIcon(serverCog);
/** Gear icon used for settings controls. */
export const Settings = createIcon(settings);
/** Upload arrow icon used for import actions. */
export const Upload = createIcon(upload);
/** Speaker icon used for audio and voice controls. */
export const Volume2 = createIcon(volume2);
/** Magnifier plus icon used for zoom-in controls. */
export const ZoomIn = createIcon(zoomIn);
/** Magnifier minus icon used for zoom-out controls. */
export const ZoomOut = createIcon(zoomOut);
