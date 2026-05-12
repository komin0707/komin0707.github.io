import { useContext } from 'react';
import { SimulationContext, type SimulationContextValue } from './simulationContextValue';

export function useSimulationContext(): SimulationContextValue {
  const value = useContext(SimulationContext);
  if (!value) throw new Error('useSimulationContext must be used inside SimulationProvider');
  return value;
}

export function useSimulationSelector<T>(selector: (value: SimulationContextValue) => T): T {
  return selector(useSimulationContext());
}
