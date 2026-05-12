import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';

export const mockSettings = DEFAULT_SETTINGS;
export const mockScenario = SCENARIOS.pneumonia;
export const mockSimulation = calculateSimulation(mockSettings, mockScenario);
