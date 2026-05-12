import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_INTERVENTIONS, type ScenarioProgress } from '@/simulation/scenarioEngine';
import { ScenarioInterventionPanel } from './ScenarioInterventionPanel';

const ACTIVE_FLUID_RATE = 150;
const progress: ScenarioProgress = {
  antibioticsEffect: 'No antibiotics yet',
  autoRecovery: false,
  autoWorsening: false,
  branch: 'Observation',
  codeBlue: false,
  cprActive: false,
  customScenarioLabel: 'Custom',
  death: false,
  evaluationPrompt: 'Evaluation inactive',
  extubationAssessment: 'Intubated',
  extubationFailure: false,
  fluidEffect: 'No fluid bolus',
  guidedStep: 'Assess oxygenation',
  learning: {
    activeExamMode: 'practice controls active',
    activeRecallPrompts: ['Explain branch'],
    adaptiveLearning: 'Next module adapts',
    ceCredits: 0,
    certificateId: 'pending',
    ceuCredits: 0,
    classStatistics: 'class median 65; learner 50',
    closedBookExam: 'closed-book inactive',
    cmeCredits: 0,
    comparisonDelta: 10,
    essayQuizPrompt: 'Write rationale',
    googleClassroomIntegration: 'Google Classroom export package normal.csv ready',
    historyExport: 'scenario,elapsed_seconds,pre_test,post_test,delta\nnormal,0,40,50,10',
    lmsIntegration: 'Moodle and Canvas CSV/LTI launch metadata ready',
    ltiCompatibility: 'LTI 1.3 resource_link_id=vent2d-normal',
    microsoftTeamsIntegration: 'Teams assignment package normal.zip ready',
    multipleChoiceQuiz: {
      answer: 'Reassess gas exchange and adjust support safely',
      options: ['Reassess gas exchange and adjust support safely'],
      question: 'Best next action?',
    },
    nationalStatistics: 'national benchmark p50 72; learner 50',
    oauthStatus: 'OAuth launch metadata stubbed for LMS SSO',
    openBookExam: 'open-book inactive',
    osceMode: 'OSCE station',
    postTestScore: 50,
    practicalExamMode: 'Practical exam checklist needs remediation',
    preTestScore: 40,
    recommendedLearningPath: ['ABGA interpretation refresh'],
    rewardSystem: 'practice points accrued',
    samlStatus: 'SAML attribute mapping documented for institution SSO',
    schoolStatistics: 'school cohort p75 65; learner 50',
    scormCompatibility: 'SCORM 2004 completion=incomplete; score=50',
    shortAnswerQuiz: 'Name the primary gas exchange problem.',
    spacedRepetition: 'review normal in 1 day(s)',
    ssoIntegration: 'SSO optional: OAuth, SAML, and directory providers mapped',
    streakDays: 1,
    strengthIdentification: ['baseline assessment'],
    studyTimeSeconds: 0,
    timeBasedExam: 'time limit 900s; elapsed 0s',
    weaknessIdentification: ['advanced scenario prioritization'],
    xapiCompatibility: 'xAPI statement',
  },
  medicationEffect: 'No sedation',
  medicationKinetics: {
    ageAdjustmentFactor: 1,
    allergyReactionRisk: 0.02,
    durationSeconds: 0,
    effectCurvePercent: 0,
    halfLifeSeconds: 0,
    hepaticAdjustmentFactor: 1,
    interactionRisk: 0,
    onsetSeconds: 0,
    peakSeconds: 0,
    pediatricAdjustmentFactor: 1,
    pregnancyCaution: 'Pregnancy adjustment requires obstetric consultation',
    renalAdjustmentFactor: 1,
    weightAdjustedDoseFactor: 1,
  },
  neuromuscularEffect: 'Spontaneous effort preserved',
  paralyticEffect: 'No paralytic',
  patientResponseDelaySeconds: 90,
  randomEmergency: 'None',
  rosc: false,
  run: {
    auditTrail: ['T+0s scenario=normal'],
    author: 'Vent 2D clinical simulation team',
    bestPractice: 'Stabilize oxygenation',
    branchPoint: 'T+0s observation branch',
    chainedSequence: ['assessment', 'optimization'],
    collaboration: 'Instructor comments enabled',
    comments: ['No note'],
    completionCertificate: 'Certificate pending',
    criticalMistake: 'No critical mistake detected',
    customizationEnabled: false,
    difficultyLevel: 2,
    endCondition: 'Continue scenario',
    evaluationCriteria: ['Oxygenation improves'],
    forkClone: 'Clone template available',
    gradingMode: 'formative observation',
    gradingRubric: ['Oxygenation stabilized', 'Treatment delivered'],
    hints: ['Assess oxygenation first'],
    importTemplate: 'custom-scenario://normal/v1',
    instructorMode: 'observer dashboard ready',
    instructorNotes: ['Difficulty 2/5'],
    leaderboard: 'local-normal-score-50',
    learningObjective: 'Match ventilator support to physiology.',
    marketplaceStatus: 'local template catalog only',
    multiplayerStatus: 'observer-only multiplayer placeholder',
    pdfExport: 'scenario-report-normal.pdf',
    prerequisites: ['Basic ventilator modes'],
    progressPercent: 50,
    rating: 3,
    replayAvailable: true,
    reviewMode: 'live review',
    scoreSystem: '100-point rubric',
    shareUrl: '#/scenario/normal?t=0&score=50',
    simulationLog: ['Start: normal'],
    startTime: 'T+00:00:00',
    statisticalAnalysis: 'score=50',
    studentFeedback: 'Continue practicing',
    tags: ['ventilation'],
    timeLimitSeconds: 900,
    version: 'scenario-v2.0.0',
    versioning: 'semantic versioning',
  },
  score: 50,
  stage: 1,
  termination: 'Continue scenario',
};

describe('ScenarioInterventionPanel', () => {
  it('toggles fluid rate and fluid type from both branch states', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ScenarioInterventionPanel
        interventions={DEFAULT_INTERVENTIONS}
        onChange={onChange}
        progress={progress}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fluid 0' }));
    fireEvent.click(screen.getByRole('button', { name: 'balanced' }));
    rerender(
      <ScenarioInterventionPanel
        interventions={{
          ...DEFAULT_INTERVENTIONS,
          fluidRateMlHour: ACTIVE_FLUID_RATE,
          fluidType: 'normal-saline',
        }}
        onChange={onChange}
        progress={progress}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fluid 150' }));
    fireEvent.click(screen.getByRole('button', { name: 'normal-saline' }));

    expect(onChange).toHaveBeenCalledWith('fluidRateMlHour', ACTIVE_FLUID_RATE);
    expect(onChange).toHaveBeenCalledWith('fluidType', 'normal-saline');
    expect(onChange).toHaveBeenCalledWith('fluidRateMlHour', 0);
    expect(onChange).toHaveBeenCalledWith('fluidType', 'balanced');
    expect(screen.getByTitle('medication kinetics')).toHaveTextContent('Drug curve 0%');
    expect(screen.getByTitle('learning assessment')).toHaveTextContent('Learning pre 40 post 50');
  });
});
