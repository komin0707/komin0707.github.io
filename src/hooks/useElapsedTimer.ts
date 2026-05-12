import { useCallback, useEffect, useState } from 'react';
import {
  calculateScaledElapsedMilliseconds,
  millisecondsToPreciseSeconds,
  secondsToMilliseconds,
} from '@/simulation/simulationTime';
import type { TimeScale } from '@/simulation/simulationSnapshot';

const INITIAL_ELAPSED_SECONDS = 765;
const TIMER_TICK_INTERVAL_MS = 100;

export function useElapsedTimer(paused: boolean, timeScale: TimeScale) {
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(
    secondsToMilliseconds(INITIAL_ELAPSED_SECONDS),
  );

  useEffect(() => {
    if (paused) return undefined;
    const id = window.setInterval(
      () =>
        setElapsedMilliseconds((milliseconds) =>
          calculateScaledElapsedMilliseconds(milliseconds, TIMER_TICK_INTERVAL_MS, timeScale),
        ),
      TIMER_TICK_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [paused, timeScale]);

  const resetElapsedSeconds = useCallback(
    () => setElapsedMilliseconds(secondsToMilliseconds(INITIAL_ELAPSED_SECONDS)),
    [],
  );
  const jumpToElapsedSeconds = useCallback(
    (seconds: number) => setElapsedMilliseconds(secondsToMilliseconds(seconds)),
    [],
  );
  const rewindElapsedSeconds = useCallback(
    (seconds: number) =>
      setElapsedMilliseconds((current) => Math.max(0, current - secondsToMilliseconds(seconds))),
    [],
  );

  return {
    elapsedMilliseconds,
    elapsedSeconds: Math.floor(millisecondsToPreciseSeconds(elapsedMilliseconds)),
    jumpToElapsedSeconds,
    resetElapsedSeconds,
    rewindElapsedSeconds,
  };
}
