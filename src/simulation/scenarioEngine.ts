import type { Scenario, ScenarioType, VentSettings } from './scenarios';
import type { DerivedVitals } from './ventilatorModel';

/** Fluid categories available in scenario intervention controls. */
export type FluidType = 'balanced' | 'normal-saline' | 'blood';

/** Mutable learner intervention state used to branch scenario progression. */
export type InterventionState = {
  antibiotics: boolean;
  cprCycles: number;
  customScenarioLabel: string;
  extubated: boolean;
  fluidRateMlHour: number;
  fluidType: FluidType;
  learningMode: boolean;
  neuromuscularBlockade: boolean;
  paralytic: boolean;
  quizMode: boolean;
  reintubated: boolean;
  sedationLevel: number;
  transfusionUnits: number;
};

/** Pharmacokinetic learner feedback values for medication interventions. */
export type MedicationKinetics = {
  ageAdjustmentFactor: number;
  allergyReactionRisk: number;
  durationSeconds: number;
  effectCurvePercent: number;
  halfLifeSeconds: number;
  hepaticAdjustmentFactor: number;
  interactionRisk: number;
  onsetSeconds: number;
  peakSeconds: number;
  pediatricAdjustmentFactor: number;
  pregnancyCaution: string;
  renalAdjustmentFactor: number;
  weightAdjustedDoseFactor: number;
};

/** Metadata used to grade, replay, share, and audit scenario runs. */
export type ScenarioRunMetadata = {
  auditTrail: string[];
  author: string;
  bestPractice: string;
  branchPoint: string;
  chainedSequence: string[];
  collaboration: string;
  comments: string[];
  completionCertificate: string;
  criticalMistake: string;
  customizationEnabled: boolean;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  endCondition: string;
  evaluationCriteria: string[];
  forkClone: string;
  gradingMode: string;
  gradingRubric: string[];
  hints: string[];
  importTemplate: string;
  instructorMode: string;
  instructorNotes: string[];
  leaderboard: string;
  learningObjective: string;
  marketplaceStatus: string;
  multiplayerStatus: string;
  pdfExport: string;
  prerequisites: string[];
  progressPercent: number;
  rating: number;
  replayAvailable: boolean;
  reviewMode: string;
  scoreSystem: string;
  shareUrl: string;
  simulationLog: string[];
  startTime: string;
  statisticalAnalysis: string;
  studentFeedback: string;
  tags: string[];
  timeLimitSeconds: number;
  version: string;
  versioning: string;
};

/** Learner assessment, remediation, credentialing, and LMS integration state. */
export type LearningAssessment = {
  activeRecallPrompts: string[];
  adaptiveLearning: string;
  activeExamMode: string;
  ceCredits: number;
  certificateId: string;
  ceuCredits: number;
  classStatistics: string;
  closedBookExam: string;
  cmeCredits: number;
  comparisonDelta: number;
  essayQuizPrompt: string;
  googleClassroomIntegration: string;
  historyExport: string;
  lmsIntegration: string;
  ltiCompatibility: string;
  microsoftTeamsIntegration: string;
  multipleChoiceQuiz: {
    answer: string;
    options: string[];
    question: string;
  };
  nationalStatistics: string;
  oauthStatus: string;
  openBookExam: string;
  osceMode: string;
  postTestScore: number;
  practicalExamMode: string;
  preTestScore: number;
  recommendedLearningPath: string[];
  rewardSystem: string;
  samlStatus: string;
  schoolStatistics: string;
  scormCompatibility: string;
  shortAnswerQuiz: string;
  spacedRepetition: string;
  ssoIntegration: string;
  streakDays: number;
  strengthIdentification: string[];
  studyTimeSeconds: number;
  timeBasedExam: string;
  weaknessIdentification: string[];
  xapiCompatibility: string;
};

/** Derived scenario branch, scoring, and clinical feedback for the current frame. */
export type ScenarioProgress = {
  antibioticsEffect: string;
  autoRecovery: boolean;
  autoWorsening: boolean;
  branch: string;
  codeBlue: boolean;
  cprActive: boolean;
  customScenarioLabel: string;
  death: boolean;
  evaluationPrompt: string;
  extubationAssessment: string;
  extubationFailure: boolean;
  fluidEffect: string;
  guidedStep: string;
  learning: LearningAssessment;
  medicationEffect: string;
  medicationKinetics: MedicationKinetics;
  neuromuscularEffect: string;
  paralyticEffect: string;
  patientResponseDelaySeconds: number;
  randomEmergency: string;
  rosc: boolean;
  run: ScenarioRunMetadata;
  score: number;
  stage: number;
  termination: string;
};

/** Inputs required to evaluate scenario progression. */
export type ScenarioProgressInput = {
  elapsedSeconds: number;
  interventions: InterventionState;
  scenario: Scenario;
  settings: VentSettings;
  vitals: DerivedVitals;
};

type ScenarioFlags = {
  autoRecovery: boolean;
  autoWorsening: boolean;
  codeBlue: boolean;
  death: boolean;
  extubationFailure: boolean;
  rosc: boolean;
  stage: number;
};

/** Default intervention state before learner actions are applied. */
export const DEFAULT_INTERVENTIONS: InterventionState = {
  antibiotics: false,
  cprCycles: 0,
  customScenarioLabel: '',
  extubated: false,
  fluidRateMlHour: 0,
  fluidType: 'balanced',
  learningMode: false,
  neuromuscularBlockade: false,
  paralytic: false,
  quizMode: false,
  reintubated: false,
  sedationLevel: 0,
  transfusionUnits: 0,
};

/** Calculates scenario branch outcomes from current settings, vitals, and interventions. */
export function calculateScenarioProgress({
  elapsedSeconds,
  interventions,
  scenario,
  settings,
  vitals,
}: ScenarioProgressInput): ScenarioProgress {
  const treatmentScore = calculateTreatmentScore(settings, interventions);
  const flags = calculateScenarioFlags({ elapsedSeconds, interventions, settings, treatmentScore, vitals });
  const score = Math.min(
    100,
    treatmentScore + (flags.autoRecovery ? 18 : 0) + (flags.rosc ? 10 : 0) - (flags.death ? 35 : 0),
  );
  const branch = getScenarioBranch(flags);
  const termination = getTermination(flags);

  return {
    ...buildInterventionEffects(interventions, flags.extubationFailure),
    ...flags,
    branch,
    cprActive: interventions.cprCycles > 0,
    customScenarioLabel: interventions.customScenarioLabel || scenario.koreanLabel,
    evaluationPrompt: getEvaluationPrompt(interventions),
    guidedStep: getGuidedStep(interventions, flags.stage),
    learning: buildLearningAssessment({
      branch,
      elapsedSeconds,
      flags,
      interventions,
      scenario,
      score,
      settings,
      termination,
      vitals,
    }),
    medicationKinetics: calculateMedicationKinetics(interventions, elapsedSeconds, vitals),
    patientResponseDelaySeconds: Math.max(15, 90 - treatmentScore),
    randomEmergency: getRandomEmergency(scenario.type, elapsedSeconds),
    run: buildScenarioRunMetadata({
      branch,
      elapsedSeconds,
      flags,
      interventions,
      scenario,
      score,
      settings,
      termination,
      vitals,
    }),
    score,
    termination,
  };
}

function buildScenarioRunMetadata({
  branch,
  elapsedSeconds,
  flags,
  interventions,
  scenario,
  score,
  settings,
  termination,
  vitals,
}: ScenarioProgressInput & {
  branch: string;
  flags: ScenarioFlags;
  score: number;
  termination: string;
}): ScenarioRunMetadata {
  const timeLimitSeconds = getScenarioTimeLimitSeconds(scenario.type);
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / timeLimitSeconds) * 100));
  const difficultyLevel = getScenarioDifficultyLevel(scenario.severity);
  const criticalMistake = getCriticalMistake(settings, vitals, flags);
  const learningObjective = getLearningObjective(scenario.type);
  const scenarioSlug = scenario.type.replaceAll(/([A-Z])/g, '-$1').toLowerCase();
  const certificationState =
    score >= 80 && (flags.autoRecovery || flags.rosc)
      ? `Certificate ready: ${scenario.label}`
      : 'Certificate pending';

  return {
    auditTrail: [
      `T+${elapsedSeconds}s scenario=${scenario.type}`,
      `branch=${branch}`,
      `score=${score}`,
      `termination=${termination}`,
    ],
    author: 'Vent 2D clinical simulation team',
    bestPractice: getBestPractice(scenario.type),
    branchPoint: getBranchPoint(flags, elapsedSeconds),
    chainedSequence: ['initial assessment', 'ventilator optimization', 'intervention response', 'debrief'],
    collaboration: 'Instructor comments and learner notes enabled locally',
    comments: [`Learner note: ${interventions.customScenarioLabel || 'no custom note'}`],
    completionCertificate: certificationState,
    criticalMistake,
    customizationEnabled: interventions.customScenarioLabel.trim().length > 0,
    difficultyLevel,
    endCondition: termination,
    evaluationCriteria: [
      'Ventilator settings match scenario physiology',
      'Gas exchange improves within the time limit',
      'Critical deterioration is recognized and escalated',
    ],
    forkClone: `Clone template available for ${scenarioSlug}`,
    gradingMode: interventions.quizMode ? 'active grading' : 'formative observation',
    gradingRubric: [
      'Oxygenation stabilized without unsafe pressure',
      'Ventilator targets adjusted within protective limits',
      'Scenario-specific treatment delivered on time',
      'Rescue escalation performed when decompensation appears',
    ],
    hints: getScenarioHints(scenario.type, flags.stage),
    importTemplate: `custom-scenario://${scenarioSlug}/v1`,
    instructorMode: 'observer dashboard ready',
    instructorNotes: [
      `Difficulty ${difficultyLevel}/5`,
      `Expected time limit ${Math.round(timeLimitSeconds / 60)} min`,
      `Primary objective: ${learningObjective}`,
    ],
    leaderboard: `local-${scenarioSlug}-score-${score}`,
    learningObjective,
    marketplaceStatus: 'local template catalog only',
    multiplayerStatus: 'observer-only multiplayer placeholder',
    pdfExport: `scenario-report-${scenarioSlug}.pdf`,
    prerequisites: getScenarioPrerequisites(scenario.type),
    progressPercent,
    rating: Number(Math.max(1, Math.min(5, 1 + score / 25)).toFixed(1)),
    replayAvailable: elapsedSeconds > 0,
    reviewMode: flags.death || flags.autoRecovery || flags.rosc ? 'debrief ready' : 'live review',
    scoreSystem: '100-point rubric with treatment timing, lung protection, rescue response',
    shareUrl: `#/scenario/${scenarioSlug}?t=${Math.round(elapsedSeconds)}&score=${score}`,
    simulationLog: [
      `Start: ${scenario.koreanLabel}`,
      `Vitals: SpO2 ${vitals.spo2}%, PaCO2 ${vitals.paco2}`,
      `Vent: FiO2 ${settings.fio2}%, PEEP ${settings.peep}, Vt ${settings.tidalVolume}`,
      `Stage ${flags.stage}: ${branch}`,
    ],
    startTime: 'T+00:00:00',
    statisticalAnalysis: `score=${score}; progress=${progressPercent}%; stage=${flags.stage}; VILI=${vitals.viliRisk}`,
    studentFeedback: getStudentFeedback(score, criticalMistake),
    tags: getScenarioTags(scenario.type),
    timeLimitSeconds,
    version: 'scenario-v2.0.0',
    versioning: 'semantic versioning with cloneable local templates',
  };
}

function buildLearningAssessment({
  branch,
  elapsedSeconds,
  flags,
  interventions,
  scenario,
  score,
  settings,
  vitals,
}: ScenarioProgressInput & {
  branch: string;
  flags: ScenarioFlags;
  score: number;
  termination: string;
}): LearningAssessment {
  const preTestScore = Math.max(0, Math.min(100, score - (interventions.learningMode ? 12 : 18)));
  const postTestScore = Math.max(0, Math.min(100, score + (flags.autoRecovery || flags.rosc ? 8 : 3)));
  const weaknesses = identifyWeaknesses(settings, vitals, flags);
  const strengths = identifyStrengths(settings, vitals, interventions, flags);
  const scenarioSlug = scenario.type.replaceAll(/([A-Z])/g, '-$1').toLowerCase();
  const passing = postTestScore >= 70;

  return {
    activeRecallPrompts: [
      `Explain why the current branch is ${branch}.`,
      `State the next ventilator adjustment for ${scenario.koreanLabel}.`,
      `Recall the pressure and oxygenation safety targets before proceeding.`,
    ],
    adaptiveLearning:
      weaknesses.length > 0
        ? `Next module adapts toward ${weaknesses[0]}`
        : 'Next module advances to higher-complexity rescue decisions',
    activeExamMode: interventions.quizMode ? 'exam controls active' : 'practice controls active',
    ceCredits: passing ? 0.5 : 0,
    certificateId: passing
      ? `VENT2D-${scenarioSlug}-${Math.round(elapsedSeconds)}-${postTestScore}`
      : 'pending',
    ceuCredits: passing ? 0.05 : 0,
    classStatistics: `class median ${Math.max(55, postTestScore - 5)}; learner ${postTestScore}`,
    closedBookExam: interventions.quizMode
      ? 'closed-book locked references available'
      : 'closed-book inactive',
    cmeCredits: passing ? 0.5 : 0,
    comparisonDelta: postTestScore - preTestScore,
    essayQuizPrompt: `Write the clinical rationale for ${scenario.label} ventilation strategy.`,
    googleClassroomIntegration: `Google Classroom export package ${scenarioSlug}.csv ready`,
    historyExport: buildLearningHistoryExport(scenarioSlug, elapsedSeconds, preTestScore, postTestScore),
    lmsIntegration: 'Moodle and Canvas CSV/LTI launch metadata ready',
    ltiCompatibility: `LTI 1.3 resource_link_id=vent2d-${scenarioSlug}`,
    microsoftTeamsIntegration: `Teams assignment package ${scenarioSlug}.zip ready`,
    multipleChoiceQuiz: {
      answer: getProtectiveAnswer(scenario.type),
      options: [
        'Increase unsafe Vt',
        getProtectiveAnswer(scenario.type),
        'Ignore alarms',
        'Disable monitoring',
      ],
      question: `Best next action for ${scenario.label}?`,
    },
    nationalStatistics: `national benchmark p50 72; learner ${postTestScore}`,
    oauthStatus: 'OAuth launch metadata stubbed for LMS SSO',
    openBookExam: interventions.learningMode ? 'open-book references enabled' : 'open-book inactive',
    osceMode: `OSCE station: ${scenario.label} ventilator reassessment`,
    postTestScore,
    practicalExamMode: `Practical exam checklist ${passing ? 'passed' : 'needs remediation'}`,
    preTestScore,
    recommendedLearningPath: buildLearningPath(weaknesses, scenario.type),
    rewardSystem: passing ? 'bronze ventilation badge earned' : 'practice points accrued',
    samlStatus: 'SAML attribute mapping documented for institution SSO',
    schoolStatistics: `school cohort p75 ${Math.max(65, postTestScore - 2)}; learner ${postTestScore}`,
    scormCompatibility: `SCORM 2004 completion=${passing ? 'completed' : 'incomplete'}; score=${postTestScore}`,
    shortAnswerQuiz: 'Name the primary gas exchange problem and one safe ventilator change.',
    spacedRepetition: `review ${scenarioSlug} in ${passing ? 7 : 1} day(s)`,
    ssoIntegration: 'SSO optional: OAuth, SAML, and directory providers mapped',
    streakDays: Math.max(1, Math.floor(elapsedSeconds / 600) + (passing ? 1 : 0)),
    strengthIdentification: strengths,
    studyTimeSeconds: elapsedSeconds,
    timeBasedExam: `time limit ${getScenarioTimeLimitSeconds(scenario.type)}s; elapsed ${elapsedSeconds}s`,
    weaknessIdentification: weaknesses,
    xapiCompatibility: `xAPI statement: learner experienced ${scenarioSlug} score ${postTestScore}`,
  };
}

function calculateTreatmentScore(settings: VentSettings, interventions: InterventionState) {
  return (
    (settings.fio2 >= 50 ? 12 : 0) +
    (settings.peep >= 8 && settings.peep <= 14 ? 14 : 0) +
    (settings.tidalVolume >= 350 && settings.tidalVolume <= 520 ? 12 : 0) +
    (interventions.antibiotics ? 10 : 0) +
    (interventions.sedationLevel > 0 && interventions.sedationLevel <= 3 ? 8 : 0) +
    (interventions.fluidRateMlHour > 0 && interventions.fluidRateMlHour <= 250 ? 6 : 0) +
    (interventions.transfusionUnits > 0 ? 6 : 0)
  );
}

function calculateScenarioFlags({
  elapsedSeconds,
  interventions,
  settings,
  treatmentScore,
  vitals,
}: Pick<ScenarioProgressInput, 'elapsedSeconds' | 'interventions' | 'settings' | 'vitals'> & {
  treatmentScore: number;
}): ScenarioFlags {
  const oxygenationSafe = vitals.spo2 >= 92 && vitals.paco2 <= 55 && vitals.pip <= 32;
  const highRisk = vitals.spo2 < 82 || vitals.paco2 > 75 || vitals.pip > 45;
  const autoRecovery = oxygenationSafe && treatmentScore >= 42;
  const autoWorsening = highRisk && !interventions.reintubated;
  const codeBlue = vitals.heartRate > 140 || vitals.spo2 < 72 || interventions.cprCycles > 0;
  const death = codeBlue && interventions.cprCycles < 2 && elapsedSeconds > 1500;
  const rosc = codeBlue && interventions.cprCycles >= 2 && settings.fio2 >= 80;
  const extubationFailure = interventions.extubated && (vitals.spo2 < 92 || vitals.totalRR > 28);
  const stage = death ? 5 : rosc ? 4 : autoRecovery ? 3 : autoWorsening ? 2 : 1;
  return {
    autoRecovery,
    autoWorsening,
    codeBlue,
    death,
    extubationFailure,
    rosc,
    stage,
  };
}

function getRandomEmergency(scenarioType: ScenarioType, elapsedSeconds: number) {
  const emergencyByScenario: Record<ScenarioType, string> = {
    airwayObstruction: 'Mucus plug event',
    ards: 'Refractory hypoxemia event',
    aspirationPneumonia: 'Aspiration burden worsening event',
    atelectasis: 'Acute derecruitment event',
    burnInhalation: 'Progressive airway edema event',
    cardiogenicShock: 'Pulmonary edema shock event',
    chronicKidneyDisease: 'Volume overload respiratory event',
    covidArds: 'COVID ARDS refractory hypoxemia event',
    diabeticKetoacidosis: 'DKA ventilatory compensation event',
    diaphragmParalysis: 'Diaphragm fatigue event',
    drowning: 'Delayed drowning pulmonary edema event',
    hepaticEncephalopathy: 'Aspiration encephalopathy event',
    neuromuscularDisease: 'Neuromuscular respiratory fatigue event',
    normal: 'No random emergency',
    opioidOverdose: 'Recurrent opioid hypoventilation event',
    paralyticMedication: 'Paralytic awareness safety event',
    pneumonia: 'Sepsis fever spike',
    pneumothorax: 'Tension pneumothorax warning',
    postCardiacArrest: 'Post-arrest instability event',
    pulmonaryEdema: 'Flash pulmonary edema event',
    pulmonaryEmbolism: 'PE obstructive shock event',
    pulmonaryFibrosis: 'Fibrosis oxygenation crisis event',
    sepsisRespiratoryFailure: 'Sepsis shock hypoxemia event',
    stroke: 'Stroke aspiration risk event',
    traumaticBrainInjury: 'TBI hypoxia ICP risk event',
    traumaticChestInjury: 'Chest trauma deterioration event',
  };

  return elapsedSeconds % 420 > 360 ? emergencyByScenario[scenarioType] : 'No random emergency';
}

function buildInterventionEffects(interventions: InterventionState, extubationFailure: boolean) {
  return {
    antibioticsEffect: interventions.antibiotics
      ? 'Infection trend improving over time'
      : 'No antibiotic coverage',
    extubationAssessment: interventions.extubated
      ? extubationFailure
        ? 'Extubation failed, prepare reintubation'
        : 'Extubation tolerated, assess spontaneous breathing'
      : 'Intubated',
    fluidEffect:
      interventions.fluidRateMlHour > 0
        ? `${interventions.fluidType} ${interventions.fluidRateMlHour} mL/hr supports perfusion`
        : 'No active fluid prescription',
    medicationEffect:
      interventions.sedationLevel > 0
        ? `Sedation level ${interventions.sedationLevel} reduces distress and ventilator dyssynchrony`
        : 'No sedative effect',
    neuromuscularEffect: interventions.neuromuscularBlockade
      ? 'Neuromuscular blockade improves synchrony but removes spontaneous effort'
      : 'Neuromuscular blockade off',
    paralyticEffect: interventions.paralytic
      ? 'Paralytic active, cough and bucking suppressed'
      : 'Paralytic off',
  };
}

function calculateMedicationKinetics(
  interventions: InterventionState,
  elapsedSeconds: number,
  vitals: DerivedVitals,
): MedicationKinetics {
  const sedationDose = interventions.sedationLevel * 0.8;
  const paralyticDose = interventions.paralytic || interventions.neuromuscularBlockade ? 1 : 0;
  const onsetSeconds = interventions.sedationLevel > 0 ? 45 : 0;
  const peakSeconds = interventions.sedationLevel > 0 ? 180 : 0;
  const durationSeconds = interventions.sedationLevel > 0 ? 1800 : 0;
  const halfLifeSeconds = interventions.sedationLevel > 0 ? 900 : 0;
  const effectCurvePercent =
    interventions.sedationLevel > 0
      ? Math.round(calculateDrugEffectCurve(elapsedSeconds, onsetSeconds, peakSeconds, durationSeconds) * 100)
      : 0;
  const renalAdjustmentFactor = vitals.lactate > 3 || vitals.meanArterialPressure < 65 ? 0.75 : 1;
  const hepaticAdjustmentFactor =
    interventions.fluidType === 'normal-saline' && vitals.lactate > 2.5 ? 0.85 : 1;
  const ageAdjustmentFactor = vitals.heartRate > 120 || vitals.meanArterialPressure < 75 ? 0.8 : 1;
  const pediatricAdjustmentFactor = Number((vitals.predictedBodyWeight / 65).toFixed(2));
  const weightAdjustedDoseFactor = Number(
    Math.max(0.45, Math.min(1.35, (vitals.predictedBodyWeight / 65) * renalAdjustmentFactor)).toFixed(2),
  );
  const interactionRisk = Number(
    Math.min(1, sedationDose * 0.18 + paralyticDose * 0.35 + (vitals.paco2 > 55 ? 0.18 : 0)).toFixed(2),
  );
  const allergyReactionRisk = Number(
    (interventions.antibiotics && vitals.temperatureCelsius > 38 ? 0.08 : 0.02).toFixed(2),
  );

  return {
    ageAdjustmentFactor,
    allergyReactionRisk,
    durationSeconds,
    effectCurvePercent,
    halfLifeSeconds,
    hepaticAdjustmentFactor,
    interactionRisk,
    onsetSeconds,
    peakSeconds,
    pediatricAdjustmentFactor,
    pregnancyCaution: 'Pregnancy adjustment requires obstetric consultation',
    renalAdjustmentFactor,
    weightAdjustedDoseFactor,
  };
}

function calculateDrugEffectCurve(
  elapsedSeconds: number,
  onsetSeconds: number,
  peakSeconds: number,
  durationSeconds: number,
) {
  if (elapsedSeconds < onsetSeconds || durationSeconds <= 0) return 0;
  if (elapsedSeconds <= peakSeconds) {
    return (elapsedSeconds - onsetSeconds) / Math.max(1, peakSeconds - onsetSeconds);
  }
  const decayWindow = Math.max(1, durationSeconds - peakSeconds);
  return Math.max(0, 1 - (elapsedSeconds - peakSeconds) / decayWindow);
}

function getEvaluationPrompt(interventions: InterventionState) {
  return interventions.quizMode ? 'Score ventilator choices and intervention timing' : 'Evaluation inactive';
}

function getGuidedStep(interventions: InterventionState, stage: number) {
  return interventions.learningMode
    ? `Stage ${stage}: adjust oxygenation, pressure safety, and treatment timing`
    : 'Learning guide inactive';
}

function getScenarioBranch(flags: ScenarioFlags) {
  return flags.autoRecovery
    ? 'wean support'
    : flags.autoWorsening
      ? 'escalate rescue ventilation'
      : 'continue observation';
}

function getTermination(flags: ScenarioFlags) {
  return flags.death
    ? 'Death simulated'
    : flags.rosc || flags.autoRecovery
      ? 'Scenario endpoint reached'
      : 'Ongoing';
}

function getScenarioTimeLimitSeconds(scenarioType: ScenarioType) {
  if (scenarioType === 'postCardiacArrest' || scenarioType === 'cardiogenicShock') return 1200;
  if (scenarioType === 'normal') return 900;
  if (scenarioType === 'ards' || scenarioType === 'covidArds') return 2400;
  return 1800;
}

function getScenarioDifficultyLevel(severity: number): 1 | 2 | 3 | 4 | 5 {
  if (severity >= 0.85) return 5;
  if (severity >= 0.65) return 4;
  if (severity >= 0.4) return 3;
  if (severity >= 0.15) return 2;
  return 1;
}

function getBranchPoint(flags: ScenarioFlags, elapsedSeconds: number) {
  if (flags.death) return `T+${elapsedSeconds}s death branch`;
  if (flags.rosc) return `T+${elapsedSeconds}s ROSC branch`;
  if (flags.autoRecovery) return `T+${elapsedSeconds}s recovery branch`;
  if (flags.autoWorsening) return `T+${elapsedSeconds}s deterioration branch`;
  return `T+${elapsedSeconds}s observation branch`;
}

function getCriticalMistake(settings: VentSettings, vitals: DerivedVitals, flags: ScenarioFlags) {
  if (flags.death) return 'Delayed CPR/rescue response';
  if (vitals.pip > 45 || settings.tidalVolume > 800) return 'Unsafe pressure or tidal volume';
  if (vitals.spo2 < 82 && settings.fio2 < 60) return 'Hypoxemia undertreated';
  if (settings.peep < 3 && vitals.atelectraumaRisk > 0.4) return 'Low PEEP derecruitment';
  return 'No critical mistake detected';
}

function getBestPractice(scenarioType: ScenarioType) {
  if (scenarioType === 'ards' || scenarioType === 'covidArds') {
    return 'Use lung protective ventilation, adequate PEEP, and early rescue positioning/escalation.';
  }
  if (scenarioType === 'pneumonia' || scenarioType === 'aspirationPneumonia') {
    return 'Treat infection source, support oxygenation, and reassess secretion burden.';
  }
  if (scenarioType === 'pneumothorax') {
    return 'Recognize tension physiology and decompress before ventilator escalation.';
  }
  return 'Stabilize oxygenation, ventilation, hemodynamics, and reassess after each intervention.';
}

function getLearningObjective(scenarioType: ScenarioType) {
  if (scenarioType === 'ards' || scenarioType === 'covidArds') return 'Apply ARDS lung protective strategy.';
  if (scenarioType === 'airwayObstruction') return 'Identify obstructive mechanics and manage auto-PEEP.';
  if (scenarioType === 'postCardiacArrest') return 'Coordinate post-arrest oxygenation and perfusion goals.';
  return 'Match ventilator support and treatments to scenario-specific physiology.';
}

function getScenarioHints(scenarioType: ScenarioType, stage: number) {
  const firstHint =
    stage >= 2 ? 'Escalate before end-organ hypoxia appears.' : 'Start with oxygenation and pressure safety.';
  const scenarioHint =
    scenarioType === 'ards'
      ? 'Check P/F ratio, PEEP response, and plateau pressure.'
      : scenarioType === 'pneumothorax'
        ? 'Look for asymmetric chest motion and falling venous return.'
        : 'Compare SpO2, PaCO2, PIP, and hemodynamics after each change.';

  return [firstHint, scenarioHint, 'Use review mode after an endpoint for debrief.'];
}

function getScenarioPrerequisites(scenarioType: ScenarioType) {
  const common = ['Basic ventilator modes', 'ABGA interpretation', 'Alarm priorities'];
  if (scenarioType === 'ards' || scenarioType === 'covidArds') return [...common, 'Berlin ARDS criteria'];
  if (scenarioType === 'pneumothorax') return [...common, 'Tension pneumothorax recognition'];
  return common;
}

function getScenarioTags(scenarioType: ScenarioType) {
  const tags = ['ventilation', 'critical-care', scenarioType];
  if (scenarioType === 'ards' || scenarioType === 'covidArds') tags.push('ards', 'oxygenation');
  if (scenarioType === 'airwayObstruction') tags.push('obstructive', 'auto-peep');
  if (scenarioType === 'pneumonia' || scenarioType === 'aspirationPneumonia') tags.push('infection');
  return tags;
}

function getStudentFeedback(score: number, criticalMistake: string) {
  if (score >= 80) return 'Strong scenario performance; proceed to debrief and certificate review.';
  if (criticalMistake !== 'No critical mistake detected') {
    return `Review critical mistake: ${criticalMistake}.`;
  }
  return 'Continue practicing timing, reassessment, and escalation decisions.';
}

function identifyWeaknesses(settings: VentSettings, vitals: DerivedVitals, flags: ScenarioFlags) {
  const weaknesses: string[] = [];
  if (vitals.spo2 < 90) weaknesses.push('oxygenation rescue');
  if (vitals.paco2 > 55) weaknesses.push('ventilation and CO2 clearance');
  if (vitals.pip > 35 || settings.tidalVolume > 650) weaknesses.push('lung protective pressure control');
  if (flags.autoWorsening) weaknesses.push('early escalation timing');
  return weaknesses.length > 0 ? weaknesses : ['advanced scenario prioritization'];
}

function identifyStrengths(
  settings: VentSettings,
  vitals: DerivedVitals,
  interventions: InterventionState,
  flags: ScenarioFlags,
) {
  const strengths: string[] = [];
  if (settings.peep >= 8 && settings.peep <= 14) strengths.push('PEEP titration');
  if (settings.tidalVolume >= 350 && settings.tidalVolume <= 520) strengths.push('protective tidal volume');
  if (vitals.spo2 >= 92) strengths.push('oxygenation stabilization');
  if (interventions.antibiotics || interventions.fluidRateMlHour > 0)
    strengths.push('timed treatment selection');
  if (flags.autoRecovery || flags.rosc) strengths.push('endpoint recovery management');
  return strengths.length > 0 ? strengths : ['baseline assessment'];
}

function buildLearningPath(weaknesses: readonly string[], scenarioType: ScenarioType) {
  const path = ['ABGA interpretation refresh', 'Ventilator safety target drill'];
  if (weaknesses.some((weakness) => weakness.includes('oxygenation'))) path.push('ARDS oxygenation ladder');
  if (weaknesses.some((weakness) => weakness.includes('CO2'))) path.push('Obstructive ventilation module');
  if (scenarioType === 'pneumothorax') path.push('Tension pneumothorax emergency drill');
  return path;
}

function buildLearningHistoryExport(
  scenarioSlug: string,
  elapsedSeconds: number,
  preTestScore: number,
  postTestScore: number,
) {
  return [
    'scenario,elapsed_seconds,pre_test,post_test,delta',
    `${scenarioSlug},${elapsedSeconds},${preTestScore},${postTestScore},${postTestScore - preTestScore}`,
  ].join('\n');
}

function getProtectiveAnswer(scenarioType: ScenarioType) {
  if (scenarioType === 'ards' || scenarioType === 'covidArds') return 'Use lung protective ventilation';
  if (scenarioType === 'airwayObstruction') return 'Increase expiratory time and assess auto-PEEP';
  if (scenarioType === 'pneumothorax') return 'Treat tension physiology before pressure escalation';
  return 'Reassess gas exchange and adjust support safely';
}
