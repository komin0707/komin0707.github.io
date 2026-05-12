import type { TimeScale } from './simulationSnapshot';

/** Allowed playback speeds for the simulator timeline. */
export const TIME_SCALE_OPTIONS = [1, 2, 5, 10, 60] as const satisfies readonly TimeScale[];
/** Default maximum scenario duration used by timeline progress calculations. */
export const DEFAULT_SCENARIO_DURATION_SECONDS = 3600;
/** Fixed clinical scenario start time for reproducible simulation clocks. */
export const SIMULATION_EPOCH_ISO = '2026-05-12T08:00:00+09:00';

/** Clock format used in the bottom timeline readout. */
export type TimeDisplayFormat = '12h' | '24h';

/** Timeline marker rendered for elapsed events and milestones. */
export type SimulationTimelineMarker = {
  elapsedSeconds: number;
  id: string;
  kind: 'event' | 'milestone' | 'offset';
  label: string;
};

/** Exportable timeline log entry for learner review and audit trails. */
export type SimulationTimeLogEntry = {
  elapsedSeconds: number;
  event: string;
  realTime: string;
  simulationTime: string;
};

/** Full timeline state derived from elapsed simulator time. */
export type SimulationTimeline = {
  elapsedMilliseconds: number;
  elapsedPercent: number;
  elapsedSeconds: number;
  markers: SimulationTimelineMarker[];
  remainingSeconds: number;
  simulationClock12h: string;
  simulationClock24h: string;
  timeZone: string;
};

/** Applies a time scale to a real elapsed delta and clamps the result to zero. */
export function calculateScaledElapsedMilliseconds(
  currentElapsedMilliseconds: number,
  realDeltaMilliseconds: number,
  timeScale: TimeScale,
) {
  return Math.max(0, Math.round(currentElapsedMilliseconds + realDeltaMilliseconds * timeScale));
}

/** Converts seconds to rounded milliseconds with zero clamping. */
export function secondsToMilliseconds(seconds: number) {
  return Math.max(0, Math.round(seconds * 1000));
}

/** Converts milliseconds to seconds while preserving three decimal places. */
export function millisecondsToPreciseSeconds(milliseconds: number) {
  return Number((Math.max(0, milliseconds) / 1000).toFixed(3));
}

/** Formats elapsed milliseconds as HH:MM:SS with optional millisecond precision. */
export function formatElapsedMilliseconds(milliseconds: number, includeMilliseconds = false) {
  const safeMilliseconds = Math.max(0, Math.round(milliseconds));
  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  if (!includeMilliseconds) return `${hours}:${minutes}:${seconds}`;

  const millisecondsPart = (safeMilliseconds % 1000).toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${millisecondsPart}`;
}

/** Formats the simulated wall clock in the requested time zone and 12/24-hour format. */
export function formatSimulationClock(
  elapsedSeconds: number,
  format: TimeDisplayFormat,
  timeZone = getRuntimeTimeZone(),
) {
  const epochMilliseconds = new Date(SIMULATION_EPOCH_ISO).getTime();
  const date = new Date(epochMilliseconds + secondsToMilliseconds(elapsedSeconds));
  return new Intl.DateTimeFormat(format === '24h' ? 'en-GB' : 'en-US', {
    hour: '2-digit',
    hour12: format === '12h',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
  }).format(date);
}

/** Builds all timeline readouts and markers for the current simulator state. */
export function buildSimulationTimeline({
  durationSeconds = DEFAULT_SCENARIO_DURATION_SECONDS,
  elapsedMilliseconds,
  timeZone = getRuntimeTimeZone(),
}: {
  durationSeconds?: number;
  elapsedMilliseconds: number;
  timeZone?: string;
}): SimulationTimeline {
  const elapsedSeconds = millisecondsToPreciseSeconds(elapsedMilliseconds);
  const remainingSeconds = Math.max(0, Number((durationSeconds - elapsedSeconds).toFixed(3)));
  const elapsedPercent = Number(
    Math.min(100, Math.max(0, (elapsedSeconds / Math.max(1, durationSeconds)) * 100)).toFixed(2),
  );

  return {
    elapsedMilliseconds: Math.max(0, Math.round(elapsedMilliseconds)),
    elapsedPercent,
    elapsedSeconds,
    markers: buildTimelineMarkers(elapsedSeconds, durationSeconds),
    remainingSeconds,
    simulationClock12h: formatSimulationClock(elapsedSeconds, '12h', timeZone),
    simulationClock24h: formatSimulationClock(elapsedSeconds, '24h', timeZone),
    timeZone,
  };
}

/** Returns fixed scenario milestones plus the current elapsed-time marker. */
export function buildTimelineMarkers(
  elapsedSeconds: number,
  durationSeconds = DEFAULT_SCENARIO_DURATION_SECONDS,
): SimulationTimelineMarker[] {
  const fixedMarkers: SimulationTimelineMarker[] = [
    { elapsedSeconds: 0, id: 'scenario-start', kind: 'event', label: 'Scenario start' },
    { elapsedSeconds: 300, id: 'five-minute-check', kind: 'milestone', label: '5 min reassessment' },
    { elapsedSeconds: 900, id: 'fifteen-minute-abg', kind: 'milestone', label: '15 min ABGA' },
    { elapsedSeconds: 1800, id: 'thirty-minute-review', kind: 'milestone', label: '30 min review' },
    { elapsedSeconds: durationSeconds, id: 'scenario-limit', kind: 'event', label: 'Scenario limit' },
  ];

  return [
    ...fixedMarkers.filter((marker) => marker.elapsedSeconds <= durationSeconds),
    {
      elapsedSeconds,
      id: 'current-time',
      kind: 'offset',
      label: `Current +${formatElapsedMilliseconds(secondsToMilliseconds(elapsedSeconds), true)}`,
    } satisfies SimulationTimelineMarker,
  ].sort((left, right) => left.elapsedSeconds - right.elapsedSeconds);
}

/** Builds a compact current-time audit log for export and display. */
export function buildCurrentTimeLog({
  elapsedSeconds,
  isPaused,
  scenarioLabel,
  timeScale,
  timeZone = getRuntimeTimeZone(),
}: {
  elapsedSeconds: number;
  isPaused: boolean;
  scenarioLabel: string;
  timeScale: TimeScale;
  timeZone?: string;
}): SimulationTimeLogEntry[] {
  const clock24h = formatSimulationClock(elapsedSeconds, '24h', timeZone);
  const clock12h = formatSimulationClock(elapsedSeconds, '12h', timeZone);

  return [
    {
      elapsedSeconds: 0,
      event: 'scenario-start',
      realTime: formatSimulationClock(0, '24h', timeZone),
      simulationTime: '00:00:00.000',
    },
    {
      elapsedSeconds,
      event: `${scenarioLabel} ${isPaused ? 'paused' : 'running'} ${timeScale}x`,
      realTime: `${clock24h} / ${clock12h}`,
      simulationTime: formatElapsedMilliseconds(secondsToMilliseconds(elapsedSeconds), true),
    },
  ];
}

/** Serializes timeline log entries as CSV with safe field escaping. */
export function exportTimeLogCsv(entries: readonly SimulationTimeLogEntry[]) {
  const header = ['elapsed_seconds', 'simulation_time', 'real_time', 'event'];
  return [
    header,
    ...entries.map((entry) => [entry.elapsedSeconds, entry.simulationTime, entry.realTime, entry.event]),
  ]
    .map((row) => row.map(escapeCsvField).join(','))
    .join('\n');
}

function escapeCsvField(value: number | string) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function getRuntimeTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
