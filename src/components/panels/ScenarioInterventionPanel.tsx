import { type ReactNode, useId } from 'react';
import { sanitizePlainTextInput } from '@/lib';
import type { InterventionState, ScenarioProgress } from '@/simulation/scenarioEngine';
import './ScenarioInterventionPanel.css';

type ScenarioInterventionPanelProps = {
  interventions: InterventionState;
  onChange: <K extends keyof InterventionState>(key: K, value: InterventionState[K]) => void;
  progress: ScenarioProgress;
};

// prettier-ignore
export function ScenarioInterventionPanel({ interventions, onChange, progress }: Readonly<ScenarioInterventionPanelProps>): ReactNode {
  const customScenarioId = useId();

  // prettier-ignore
  return (
    <section className="scenario-intervention-panel" aria-label="시나리오 처치">
      <div className="scenario-stage-row"><strong>Stage {progress.stage}</strong><span>Score {progress.score}</span><span>{progress.termination}</span></div>
      <div aria-label="시나리오 진행 상황" aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress.score} className="sr-only" role="progressbar">
        Stage {progress.stage}, score {progress.score}, {progress.termination}
      </div>
      <label className="custom-scenario-field" htmlFor={customScenarioId}>
        <span>사용자 정의 시나리오</span>
        <input aria-label="사용자 정의 시나리오" id={customScenarioId} onChange={(event) => onChange('customScenarioLabel', sanitizePlainTextInput(event.target.value, 80))} placeholder="Custom scenario" type="text" value={interventions.customScenarioLabel} />
      </label>
      <div className="scenario-actions-grid">
        <button type="button" onClick={() => onChange('learningMode', !interventions.learningMode)}>{interventions.learningMode ? 'Learning on' : 'Learning off'}</button>
        <button type="button" onClick={() => onChange('quizMode', !interventions.quizMode)}>{interventions.quizMode ? 'Quiz on' : 'Quiz off'}</button>
        <button type="button" onClick={() => onChange('antibiotics', !interventions.antibiotics)}>Antibiotics</button>
        <button type="button" onClick={() => onChange('sedationLevel', (interventions.sedationLevel + 1) % 5)}>Sedation {interventions.sedationLevel}</button>
        <button type="button" onClick={() => onChange('paralytic', !interventions.paralytic)}>Paralytic</button>
        <button type="button" onClick={() => onChange('neuromuscularBlockade', !interventions.neuromuscularBlockade)}>NMB</button>
        <button type="button" onClick={() => onChange('fluidRateMlHour', interventions.fluidRateMlHour ? 0 : 150)}>Fluid {interventions.fluidRateMlHour}</button>
        <button type="button" onClick={() => onChange('transfusionUnits', interventions.transfusionUnits + 1)}>Blood {interventions.transfusionUnits}</button>
        <button type="button" onClick={() => onChange('extubated', !interventions.extubated)}>Extubate</button>
        <button type="button" onClick={() => onChange('reintubated', true)}>Reintubate</button>
        <button type="button" onClick={() => onChange('cprCycles', interventions.cprCycles + 1)}>CPR {interventions.cprCycles}</button>
        <button type="button" onClick={() => onChange('fluidType', interventions.fluidType === 'balanced' ? 'normal-saline' : 'balanced')}>{interventions.fluidType}</button>
      </div>
      <div className="scenario-progress-grid">
        <span>{progress.customScenarioLabel}</span><span>{progress.guidedStep}</span><span>{progress.evaluationPrompt}</span><span>{progress.medicationEffect}</span><span>{progress.paralyticEffect}</span><span>{progress.neuromuscularEffect}</span><span>{progress.antibioticsEffect}</span><span>{progress.fluidEffect}</span><span>{progress.extubationAssessment}</span><span>{progress.randomEmergency}</span><span>{progress.branch}</span><span>Response {progress.patientResponseDelaySeconds}s</span><span title="medication kinetics">Drug curve {progress.medicationKinetics.effectCurvePercent}% onset {progress.medicationKinetics.onsetSeconds}s peak {progress.medicationKinetics.peakSeconds}s half-life {progress.medicationKinetics.halfLifeSeconds}s dose x{progress.medicationKinetics.weightAdjustedDoseFactor}</span><span title="scenario run metadata">Run {progress.run.version} · {progress.run.progressPercent}% · difficulty {progress.run.difficultyLevel}/5 · {progress.run.reviewMode}</span><span>Objective {progress.run.learningObjective}</span><span>Hint {progress.run.hints[0]}</span><span>Rubric {progress.run.gradingRubric.length} criteria</span><span>Share {progress.run.shareUrl}</span><span>{progress.run.pdfExport}</span><span>{progress.run.completionCertificate}</span><span>{progress.run.instructorMode}</span><span title="learning assessment">Learning pre {progress.learning.preTestScore} post {progress.learning.postTestScore} delta {progress.learning.comparisonDelta} · {progress.learning.activeExamMode}</span><span>{progress.learning.multipleChoiceQuiz.question}</span><span>{progress.learning.shortAnswerQuiz}</span><span>{progress.learning.essayQuizPrompt}</span><span>{progress.learning.osceMode}</span><span>{progress.learning.practicalExamMode}</span><span>{progress.learning.timeBasedExam}</span><span>{progress.learning.openBookExam} / {progress.learning.closedBookExam}</span><span>Weak {progress.learning.weaknessIdentification.join(', ')}</span><span>Strong {progress.learning.strengthIdentification.join(', ')}</span><span>Path {progress.learning.recommendedLearningPath.join(' > ')}</span><span>{progress.learning.adaptiveLearning}</span><span>{progress.learning.spacedRepetition}</span><span>{progress.learning.activeRecallPrompts[0]}</span><span>Streak {progress.learning.streakDays} · {progress.learning.rewardSystem}</span><span>Study {progress.learning.studyTimeSeconds}s · {progress.learning.classStatistics}</span><span>{progress.learning.schoolStatistics} · {progress.learning.nationalStatistics}</span><span>{progress.learning.certificateId} · CE {progress.learning.ceCredits} CME {progress.learning.cmeCredits} CEU {progress.learning.ceuCredits}</span><span>{progress.learning.lmsIntegration}</span><span>{progress.learning.scormCompatibility}</span><span>{progress.learning.xapiCompatibility}</span><span>{progress.learning.ltiCompatibility}</span><span>{progress.learning.ssoIntegration}</span><span>{progress.learning.oauthStatus}</span><span>{progress.learning.samlStatus}</span><span>{progress.learning.googleClassroomIntegration}</span><span>{progress.learning.microsoftTeamsIntegration}</span>
      </div>
    </section>
  );
}
