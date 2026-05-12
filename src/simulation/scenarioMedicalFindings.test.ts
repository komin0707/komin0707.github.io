import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS } from './scenarios';
import { buildScenarioMedicalFindings } from './scenarioMedicalFindings';
import { calculateSimulation } from './ventilatorModel';

describe('scenario medical findings', () => {
  it('adds every deep-audit respiratory and critical-care scenario requested in A.3 items 80-100', () => {
    const requiredScenarioTypes = [
      'pulmonaryEmbolism',
      'pulmonaryFibrosis',
      'aspirationPneumonia',
      'drowning',
      'burnInhalation',
      'covidArds',
      'atelectasis',
      'pulmonaryEdema',
      'diaphragmParalysis',
      'neuromuscularDisease',
      'opioidOverdose',
      'sepsisRespiratoryFailure',
      'traumaticChestInjury',
      'cardiogenicShock',
      'postCardiacArrest',
      'stroke',
      'traumaticBrainInjury',
      'diabeticKetoacidosis',
      'chronicKidneyDisease',
      'hepaticEncephalopathy',
      'paralyticMedication',
    ] as const;

    for (const scenarioType of requiredScenarioTypes) {
      const scenario = SCENARIOS[scenarioType];
      const simulation = calculateSimulation(DEFAULT_SETTINGS, scenario);
      const findings = buildScenarioMedicalFindings(scenario, simulation.vitals);

      expect(scenario.description.length).toBeGreaterThan(20);
      expect(simulation.vitals.spo2).toBeGreaterThanOrEqual(65);
      expect(simulation.clinical.xray.length).toBeGreaterThan(8);
      expect(findings.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('documents pneumonia, ARDS, obstruction, and pneumothorax diagnostic cues', () => {
    const pneumonia = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
    const ards = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.ards);
    const obstruction = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.airwayObstruction);
    const pneumothorax = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumothorax);

    expect(buildScenarioMedicalFindings(SCENARIOS.pneumonia, pneumonia.vitals)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('unilateral right lower lobe'),
        expect.stringContaining('CAP pattern'),
        expect.stringContaining('Neutrophil'),
        expect.stringContaining('Fever pattern'),
      ]),
    );
    expect(buildScenarioMedicalFindings(SCENARIOS.ards, ards.vitals)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Berlin ARDS: acute onset within 1 week'),
        expect.stringContaining('bilateral opacities'),
        expect.stringContaining('PCWP 14 mmHg (<18)'),
        expect.stringContaining('Prone positioning'),
      ]),
    );
    expect(buildScenarioMedicalFindings(SCENARIOS.airwayObstruction, obstruction.vitals)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('asthma/COPD'),
        expect.stringContaining('bronchospasm'),
        expect.stringContaining('former smoker'),
        expect.stringContaining(`Auto-PEEP ${obstruction.vitals.autoPeep}`),
      ]),
    );
    expect(buildScenarioMedicalFindings(SCENARIOS.pneumothorax, pneumothorax.vitals)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('simple left pneumothorax'),
        expect.stringContaining('mediastinal shift risk'),
        expect.stringContaining('Chest tube cue'),
        expect.stringContaining(`Leak rate ${pneumothorax.vitals.leak}%`),
      ]),
    );
  });
});
