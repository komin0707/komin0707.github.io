import { useEffect, useState } from 'react';

export type ViewportMetrics = {
  scrollBucket: 'bottom' | 'middle' | 'top';
  width: number;
};

export function useThrottledViewportMetrics() {
  const [metrics, setMetrics] = useState(readViewportMetrics);

  useEffect(() => {
    let frameId: number | null = null;

    const updateMetrics = () => {
      frameId = null;
      setMetrics((currentMetrics) => {
        const nextMetrics = readViewportMetrics();
        if (
          currentMetrics.scrollBucket === nextMetrics.scrollBucket &&
          currentMetrics.width === nextMetrics.width
        ) {
          return currentMetrics;
        }
        return nextMetrics;
      });
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateMetrics);
    };

    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('scroll', scheduleUpdate, { passive: true });

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
    };
  }, []);

  return metrics;
}

function readViewportMetrics(): ViewportMetrics {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  const scrollRatio = maxScroll === 0 ? 0 : window.scrollY / maxScroll;
  const scrollBucket = scrollRatio > 0.85 ? 'bottom' : scrollRatio > 0.15 ? 'middle' : 'top';

  return {
    scrollBucket,
    width: window.innerWidth,
  };
}
