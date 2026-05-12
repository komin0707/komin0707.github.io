import { useEffect, type Dispatch, type SetStateAction } from 'react';

export function useMemoryPressurePause(setPaused: Dispatch<SetStateAction<boolean>>) {
  useEffect(() => {
    const pauseForMemoryPressure = () => {
      document.documentElement.dataset.memoryPressure = 'detected';
      setPaused(true);
    };

    window.addEventListener('memorypressure', pauseForMemoryPressure);
    return () => window.removeEventListener('memorypressure', pauseForMemoryPressure);
  }, [setPaused]);
}
