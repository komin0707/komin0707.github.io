import { describe, expect, it } from 'vitest';
import {
  buildCurrentTimeLog,
  buildSimulationTimeline,
  calculateScaledElapsedMilliseconds,
  exportTimeLogCsv,
  formatElapsedMilliseconds,
  formatSimulationClock,
  secondsToMilliseconds,
} from './simulationTime';

describe('simulation time controls', () => {
  it('scales real elapsed time exactly for D.2 playback speeds', () => {
    expect(calculateScaledElapsedMilliseconds(0, 1000, 1)).toBe(1000);
    expect(calculateScaledElapsedMilliseconds(0, 1000, 2)).toBe(2000);
    expect(calculateScaledElapsedMilliseconds(0, 1000, 5)).toBe(5000);
    expect(calculateScaledElapsedMilliseconds(0, 1000, 10)).toBe(10000);
    expect(calculateScaledElapsedMilliseconds(0, 60000, 60)).toBe(3600000);
  });

  it('formats elapsed time with millisecond precision and both clock formats', () => {
    expect(secondsToMilliseconds(12.345)).toBe(12345);
    expect(formatElapsedMilliseconds(3723456, true)).toBe('01:02:03.456');
    expect(formatSimulationClock(0, '24h', 'Asia/Seoul')).toBe('08:00:00');
    expect(formatSimulationClock(3600, '12h', 'Asia/Seoul')).toMatch(/09:00:00 AM/);
  });

  it('builds timeline markers, remaining time, time zone, and CSV event export', () => {
    const timeline = buildSimulationTimeline({
      durationSeconds: 3600,
      elapsedMilliseconds: 900123,
      timeZone: 'Asia/Seoul',
    });

    expect(timeline.elapsedSeconds).toBe(900.123);
    expect(timeline.remainingSeconds).toBe(2699.877);
    expect(timeline.elapsedPercent).toBe(25);
    expect(timeline.markers.map((marker) => marker.id)).toEqual(
      expect.arrayContaining(['scenario-start', 'current-time', 'fifteen-minute-abg', 'scenario-limit']),
    );
    expect(timeline.timeZone).toBe('Asia/Seoul');

    const csv = exportTimeLogCsv(
      buildCurrentTimeLog({
        elapsedSeconds: timeline.elapsedSeconds,
        isPaused: true,
        scenarioLabel: 'ARDS',
        timeScale: 60,
        timeZone: 'Asia/Seoul',
      }),
    );

    expect(csv).toContain('elapsed_seconds,simulation_time,real_time,event');
    expect(csv).toContain('ARDS paused 60x');
  });
});
