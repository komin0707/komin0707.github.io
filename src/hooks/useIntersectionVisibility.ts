import { useEffect, useRef, useState } from 'react';

type IdleWindow = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
};

export function useIntersectionVisibility<TElement extends Element>() {
  const elementRef = useRef<TElement | null>(null);
  const [isVisible, setIsVisible] = useState(() => !('IntersectionObserver' in window));

  useEffect(() => {
    const element = elementRef.current;
    let idleHandle: number | null = null;
    if (!element) return undefined;
    if (!('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          idleHandle = scheduleIdleUpdate(() => setIsVisible(true));
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      if (idleHandle !== null) cancelIdleUpdate(idleHandle);
    };
  }, []);

  return { elementRef, isVisible };
}

function scheduleIdleUpdate(callback: () => void) {
  const idleWindow = window as IdleWindow;
  if (idleWindow.requestIdleCallback) {
    return idleWindow.requestIdleCallback(callback, { timeout: 250 });
  }
  return window.setTimeout(callback, 0);
}

function cancelIdleUpdate(handle: number) {
  const idleWindow = window as IdleWindow;
  if (idleWindow.cancelIdleCallback) {
    idleWindow.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
}
