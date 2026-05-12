import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SCENARIOS } from './scenarios';
import { DEFAULT_INTERVENTIONS, calculateScenarioProgress } from './scenarioEngine';
import { calculateSimulation } from './ventilatorModel';

const MIN_RECOVERY_SCORE = 40;

describe('scenario engine', () => {
  registerTreatmentProgressTests();
  registerEndpointBranchTests();
  registerRecoveryAndEmergencyTests();
});

function registerTreatmentProgressTests(): void {
  it('calculates learning, evaluation, treatments, recovery, branching, and endpoint state', () => {
    const settings = { ...DEFAULT_SETTINGS, fio2: 80, peep: 10, tidalVolume: 420 };
    const simulation = calculateSimulation(settings, SCENARIOS.pneumonia);
    const progress = calculateScenarioProgress({
      elapsedSeconds: 900,
      interventions: {
        ...DEFAULT_INTERVENTIONS,
        antibiotics: true,
        customScenarioLabel: 'Custom pneumonia',
        fluidRateMlHour: 150,
        learningMode: true,
        quizMode: true,
        sedationLevel: 2,
        transfusionUnits: 1,
      },
      scenario: SCENARIOS.pneumonia,
      settings,
      vitals: simulation.vitals,
    });

    expect(progress.customScenarioLabel).toBe('Custom pneumonia');
    expect(progress.guidedStep).toContain('Stage');
    expect(progress.evaluationPrompt).toContain('Score');
    expect(progress.medicationEffect).toContain('Sedation level 2');
    expect(progress.medicationKinetics.effectCurvePercent).toBeGreaterThan(0);
    expect(progress.medicationKinetics.onsetSeconds).toBe(45);
    expect(progress.medicationKinetics.peakSeconds).toBe(180);
    expect(progress.medicationKinetics.durationSeconds).toBe(1800);
    expect(progress.medicationKinetics.halfLifeSeconds).toBe(900);
    expect(progress.medicationKinetics.interactionRisk).toBeGreaterThan(0);
    expect(progress.medicationKinetics.allergyReactionRisk).toBeGreaterThanOrEqual(0.02);
    expect(progress.medicationKinetics.weightAdjustedDoseFactor).toBeGreaterThan(0);
    expect(progress.medicationKinetics.renalAdjustmentFactor).toBeLessThanOrEqual(1);
    expect(progress.medicationKinetics.hepaticAdjustmentFactor).toBeLessThanOrEqual(1);
    expect(progress.medicationKinetics.ageAdjustmentFactor).toBeLessThanOrEqual(1);
    expect(progress.medicationKinetics.pediatricAdjustmentFactor).toBeGreaterThan(0);
    expect(progress.medicationKinetics.pregnancyCaution).toContain('Pregnancy');
    expect(progress.antibioticsEffect).toContain('improving');
    expect(progress.fluidEffect).toContain('150 mL/hr');
    expect(progress.score).toBeGreaterThan(MIN_RECOVERY_SCORE);
    expect(progress.branch).toMatch(/wean support|continue observation|escalate/);
    expect(progress.run.startTime).toBe('T+00:00:00');
    expect(progress.run.branchPoint).toContain('branch');
    expect(progress.run.endCondition).toBe(progress.termination);
    expect(progress.run.scoreSystem).toContain('100-point');
    expect(progress.run.evaluationCriteria.join(' ')).toContain('Ventilator settings');
    expect(progress.run.bestPractice).toContain('Treat infection');
    expect(progress.run.criticalMistake).toBe('No critical mistake detected');
    expect(progress.run.learningObjective).toContain('physiology');
    expect(progress.run.difficultyLevel).toBeGreaterThanOrEqual(1);
    expect(progress.run.timeLimitSeconds).toBeGreaterThan(0);
    expect(progress.run.hints.length).toBeGreaterThanOrEqual(2);
    expect(progress.run.reviewMode).toMatch(/review|debrief/);
    expect(progress.run.replayAvailable).toBe(true);
    expect(progress.run.shareUrl).toContain('#/scenario/pneumonia');
    expect(progress.run.customizationEnabled).toBe(true);
    expect(progress.run.author).toContain('Vent 2D');
    expect(progress.run.version).toMatch(/scenario-v/);
    expect(progress.run.tags).toContain('infection');
    expect(progress.run.prerequisites).toContain('ABGA interpretation');
    expect(progress.run.chainedSequence).toContain('debrief');
    expect(progress.run.gradingRubric.length).toBeGreaterThanOrEqual(4);
    expect(progress.run.studentFeedback).toMatch(/Strong|Review|Continue/);
    expect(progress.run.instructorNotes.length).toBeGreaterThan(0);
    expect(progress.run.simulationLog).toContainEqual(expect.stringContaining('SpO2'));
    expect(progress.run.statisticalAnalysis).toContain('score=');
    expect(progress.run.progressPercent).toBe(50);
    expect(progress.run.completionCertificate).toContain('Certificate');
    expect(progress.run.leaderboard).toContain('local-pneumonia');
    expect(progress.run.multiplayerStatus).toContain('observer');
    expect(progress.run.instructorMode).toContain('observer');
    expect(progress.run.gradingMode).toContain('active');
    expect(progress.run.auditTrail).toContainEqual(expect.stringContaining('termination'));
    expect(progress.run.pdfExport).toBe('scenario-report-pneumonia.pdf');
    expect(progress.run.importTemplate).toBe('custom-scenario://pneumonia/v1');
    expect(progress.run.marketplaceStatus).toContain('local');
    expect(progress.run.versioning).toContain('semantic');
    expect(progress.run.forkClone).toContain('pneumonia');
    expect(progress.run.collaboration).toContain('Instructor');
    expect(progress.run.comments.length).toBeGreaterThan(0);
    expect(progress.run.rating).toBeGreaterThan(1);
    expect(progress.learning.multipleChoiceQuiz.options).toContain(
      progress.learning.multipleChoiceQuiz.answer,
    );
    expect(progress.learning.shortAnswerQuiz).toContain('gas exchange');
    expect(progress.learning.essayQuizPrompt).toContain('clinical rationale');
    expect(progress.learning.osceMode).toContain('OSCE station');
    expect(progress.learning.practicalExamMode).toContain('Practical exam');
    expect(progress.learning.timeBasedExam).toContain('time limit');
    expect(progress.learning.openBookExam).toContain('open-book');
    expect(progress.learning.closedBookExam).toContain('closed-book');
    expect(progress.learning.preTestScore).toBeLessThan(progress.learning.postTestScore);
    expect(progress.learning.comparisonDelta).toBe(
      progress.learning.postTestScore - progress.learning.preTestScore,
    );
    expect(progress.learning.weaknessIdentification.length).toBeGreaterThan(0);
    expect(progress.learning.strengthIdentification.length).toBeGreaterThan(0);
    expect(progress.learning.recommendedLearningPath).toContain('ABGA interpretation refresh');
    expect(progress.learning.adaptiveLearning).toContain('Next module');
    expect(progress.learning.spacedRepetition).toContain('review');
    expect(progress.learning.activeRecallPrompts.length).toBeGreaterThanOrEqual(3);
    expect(progress.learning.streakDays).toBeGreaterThan(0);
    expect(progress.learning.rewardSystem).toMatch(/badge|points/);
    expect(progress.learning.studyTimeSeconds).toBe(900);
    expect(progress.learning.classStatistics).toContain('class median');
    expect(progress.learning.schoolStatistics).toContain('school cohort');
    expect(progress.learning.nationalStatistics).toContain('national benchmark');
    expect(progress.learning.certificateId).toBeTruthy();
    expect(progress.learning.ceCredits).toBeGreaterThanOrEqual(0);
    expect(progress.learning.cmeCredits).toBeGreaterThanOrEqual(0);
    expect(progress.learning.ceuCredits).toBeGreaterThanOrEqual(0);
    expect(progress.learning.historyExport).toContain('scenario,elapsed_seconds');
    expect(progress.learning.lmsIntegration).toContain('Moodle');
    expect(progress.learning.scormCompatibility).toContain('SCORM');
    expect(progress.learning.xapiCompatibility).toContain('xAPI');
    expect(progress.learning.ltiCompatibility).toContain('LTI');
    expect(progress.learning.ssoIntegration).toContain('SSO');
    expect(progress.learning.oauthStatus).toContain('OAuth');
    expect(progress.learning.samlStatus).toContain('SAML');
    expect(progress.learning.googleClassroomIntegration).toContain('Google Classroom');
    expect(progress.learning.microsoftTeamsIntegration).toContain('Teams');
  });
}

function registerEndpointBranchTests(): void {
  it('models extubation failure, CPR, death, ROSC, and reintubation branches', () => {
    const simulation = calculateSimulation(
      { ...DEFAULT_SETTINGS, fio2: 21, respiratoryRate: 4 },
      SCENARIOS.ards,
    );
    const extubationFailure = calculateScenarioProgress({
      elapsedSeconds: 100,
      interventions: {
        ...DEFAULT_INTERVENTIONS,
        extubated: true,
      },
      scenario: SCENARIOS.ards,
      settings: DEFAULT_SETTINGS,
      vitals: simulation.vitals,
    });
    const death = calculateScenarioProgress({
      elapsedSeconds: 1800,
      interventions: {
        ...DEFAULT_INTERVENTIONS,
        cprCycles: 1,
      },
      scenario: SCENARIOS.ards,
      settings: DEFAULT_SETTINGS,
      vitals: simulation.vitals,
    });
    const rosc = calculateScenarioProgress({
      elapsedSeconds: 1800,
      interventions: {
        ...DEFAULT_INTERVENTIONS,
        cprCycles: 2,
        reintubated: true,
      },
      scenario: SCENARIOS.ards,
      settings: { ...DEFAULT_SETTINGS, fio2: 100 },
      vitals: simulation.vitals,
    });

    expect(extubationFailure.extubationFailure).toBe(true);
    expect(extubationFailure.extubationAssessment).toContain('failed');
    expect(death.codeBlue).toBe(true);
    expect(death.death).toBe(true);
    expect(rosc.rosc).toBe(true);
    expect(rosc.termination).toContain('endpoint');
  });
}

function registerRecoveryAndEmergencyTests(): void {
  it('models auto-recovery branch and timed scenario emergencies', () => {
    const recoverySettings = { ...DEFAULT_SETTINGS, fio2: 80, peep: 10, tidalVolume: 420 };
    const recoverySimulation = calculateSimulation(recoverySettings, SCENARIOS.normal);
    const recovery = calculateScenarioProgress({
      elapsedSeconds: 1200,
      interventions: {
        ...DEFAULT_INTERVENTIONS,
        antibiotics: true,
        fluidRateMlHour: 150,
        sedationLevel: 2,
        transfusionUnits: 1,
      },
      scenario: SCENARIOS.normal,
      settings: recoverySettings,
      vitals: recoverySimulation.vitals,
    });
    const emergency = calculateScenarioProgress({
      elapsedSeconds: 400,
      interventions: DEFAULT_INTERVENTIONS,
      scenario: SCENARIOS.ards,
      settings: DEFAULT_SETTINGS,
      vitals: recoverySimulation.vitals,
    });

    expect(recovery.autoRecovery).toBe(true);
    expect(recovery.stage).toBe(3);
    expect(recovery.branch).toBe('wean support');
    expect(emergency.randomEmergency).toBe('Refractory hypoxemia event');
  });
}
