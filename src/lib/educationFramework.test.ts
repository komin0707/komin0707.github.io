import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '@/simulation/scenarios';
import { EDUCATIONAL_VALUE_MANIFEST } from './educationFramework';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('educational value framework', () => {
  it('defines learning objectives and Bloom levels for every scenario', () => {
    const objectiveEntries = Object.entries(EDUCATIONAL_VALUE_MANIFEST.scenarioObjectives);

    expect(objectiveEntries).toHaveLength(Object.keys(SCENARIOS).length);
    for (const [scenarioType, objective] of objectiveEntries) {
      expect(Object.hasOwn(SCENARIOS, scenarioType)).toBe(true);
      expect(objective.objective).toContain('ventilation');
      expect(objective.bloomLevels).toEqual(['remember', 'understand', 'apply', 'analyze', 'evaluate']);
    }
  });

  it('covers assessment, feedback, references, clinical reasoning, media, encounters, and recertification', () => {
    const manifest = EDUCATIONAL_VALUE_MANIFEST;
    const educationRunbook = read('docs/EDUCATION_FRAMEWORK.md');

    expect(manifest.assessments.preTest).toContain('preTestScore');
    expect(manifest.assessments.postTest).toContain('postTestScore');
    expect(manifest.assessments.formative).toContain('guided step');
    expect(manifest.assessments.summative).toContain('OSCE');
    expect(manifest.feedback.immediate).toContain('guided step');
    expect(manifest.feedback.delayed).toContain('spaced repetition');
    expect(manifest.feedback.positiveReinforcement).toContain('badge');
    expect(manifest.feedback.corrective).toContain('critical mistake');
    expect(manifest.feedback.hints).toHaveLength(3);
    expect(manifest.feedback.answerExplanation).toContain('best-practice');
    expect(manifest.feedback.wrongAnswerAnalysis).toContain('weaknessIdentification');
    expect(manifest.references.medicalTextbook).toContain('Mechanical Ventilation');
    expect(manifest.references.pubMed).toContain('pubmed.ncbi.nlm.nih.gov');
    expect(manifest.references.upToDate).toContain('uptodate.com');
    expect(manifest.references.cochraneReview).toContain('cochranelibrary.com');
    expect(manifest.references.nejmCase).toContain('nejm.org');
    expect(manifest.references.societyGuidelines).toEqual(['ATS', 'ESICM', 'KSCCM']);
    expect(manifest.references.koreanGuideline).toContain('ksccm.org');
    expect(manifest.references.japaneseGuideline).toContain('jsicm.org');
    expect(manifest.references.usGuideline).toContain('thoracic.org');
    expect(manifest.references.europeanGuideline).toContain('esicm.org');
    expect(manifest.references.whoGuideline).toContain('who.int');
    expect(manifest.clinicalReasoning.soapNote).toContain('Subjective');
    expect(manifest.clinicalReasoning.darNote).toContain('Data-Action-Response');
    expect(manifest.clinicalReasoning.mnemonics.join(' ')).toContain('DOPES');
    expect(manifest.clinicalReasoning.mnemonics.join(' ')).toContain('MOVE');
    expect(manifest.clinicalReasoning.etymology).toContain('atelectasis: incomplete expansion');
    expect(manifest.clinicalReasoning.standardAbbreviations).toContain('FiO2');
    expect(manifest.media.anatomicalIllustration).toContain('2D patient anatomy');
    expect(manifest.media.schematicDiagram).toContain('waveform');
    expect(manifest.media.xrayCtImaging).toContain('X-ray/CT');
    expect(manifest.media.procedureVideo).toContain('video tutorial');
    expect(manifest.media.medicalPodcast).toContain('audio guide');
    expect(manifest.simulationEncounters.virtualPatient).toContain('virtual');
    expect(manifest.simulationEncounters.standardizedPatient).toContain('scripted');
    expect(manifest.simulationEncounters.osceChecklist).toContain('handoff');
    expect(manifest.simulationEncounters.clinicalReasoningEncounter).toContain('branching');
    expect(manifest.clinicalReasoning.differentialDiagnosisTrainer).toContain('hypoxemia');
    expect(manifest.clinicalReasoning.problemBasedLearning).toContain('physiology problem');
    expect(manifest.learningDelivery.caseBasedLearning).toContain('case');
    expect(manifest.learningDelivery.teamBasedLearning).toContain('observer');
    expect(manifest.learningDelivery.flippedClassroom).toContain('open-book');
    expect(manifest.learningDelivery.moocCompatibility).toContain('SCORM');
    expect(manifest.learningDelivery.microlearning).toContain('short');
    expect(manifest.learningDelivery.justInTimeLearning).toContain('during scenario');
    expect(manifest.learningDelivery.refresherCourses).toContain('spaced repetition');
    expect(manifest.learningDelivery.recertification).toContain('CE/CME/CEU');
    expect(educationRunbook).toContain('Education Framework');
  });
});
