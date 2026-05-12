import { SCENARIOS } from '@/simulation/scenarios';

export type ScenarioLearningObjective = {
  bloomLevels: string[];
  objective: string;
};

const scenarioObjectives = Object.fromEntries(
  Object.values(SCENARIOS).map((scenario) => [
    scenario.type,
    {
      bloomLevels: ['remember', 'understand', 'apply', 'analyze', 'evaluate'],
      objective: `Manage ${scenario.label} ventilation by linking physiology, monitoring, intervention timing, and debrief decisions.`,
    },
  ]),
) as Record<keyof typeof SCENARIOS, ScenarioLearningObjective>;

export const EDUCATIONAL_VALUE_MANIFEST = {
  assessments: {
    formative: 'live score, branch feedback, and guided step cues during the scenario',
    postTest: 'scenarioEngine.learning.postTestScore and debrief quiz',
    preTest: 'scenarioEngine.learning.preTestScore before the intervention branch',
    summative: 'OSCE checklist, practical exam mode, certificate, CE/CME/CEU fields',
  },
  clinicalReasoning: {
    darNote: 'Data-Action-Response note template for respiratory status changes',
    differentialDiagnosisTrainer:
      'compare hypoxemia causes: shunt, derecruitment, obstruction, embolism, edema',
    etymology: [
      'atelectasis: incomplete expansion',
      'pneumothorax: air in chest',
      'dyspnea: difficult breathing',
    ],
    exercises: [
      'prioritize ABGA interpretation',
      'choose next ventilator adjustment',
      'name rescue escalation',
    ],
    mnemonics: [
      'DOPES: Displacement, Obstruction, Pneumothorax, Equipment, Stacking',
      'MOVE: Mask, Oxygen, Ventilation, Equipment',
    ],
    problemBasedLearning: 'case opens with physiology problem before the learner sees a solution',
    soapNote: 'Subjective-Objective-Assessment-Plan note scaffold for debrief',
    standardAbbreviations: ['ARDS', 'ABGA', 'PEEP', 'FiO2', 'PIP', 'Vt', 'RR', 'EtCO2', 'SpO2'],
  },
  feedback: {
    answerExplanation: 'protective answer and best-practice rationale are included per scenario',
    corrective: 'critical mistake feedback names unsafe pressure, tidal volume, PEEP, or delayed rescue',
    delayed: 'review mode and spaced repetition schedule after endpoint',
    hints: ['physiology cue', 'scenario-specific cue', 'debrief cue'],
    immediate: 'guided step, score, branch, and intervention effect update in the panel',
    positiveReinforcement: 'badge, practice points, certificate, and strength identification',
    wrongAnswerAnalysis: 'weaknessIdentification and recommendedLearningPath explain remediation',
  },
  learningDelivery: {
    caseBasedLearning: 'each scenario is a case with branch, score, endpoint, and debrief',
    flippedClassroom: 'open-book reference mode supports pre-class preparation and in-class OSCE',
    justInTimeLearning: 'hints and active recall prompts appear during scenario decisions',
    microlearning: 'scenario modules fit a short ventilator drill with one objective',
    moocCompatibility: 'SCORM, xAPI, LTI, LMS export, Google Classroom, and Teams package fields',
    recertification: 'certificate id plus CE/CME/CEU credit metadata',
    refresherCourses: 'spaced repetition and recommended learning path schedule repeat practice',
    teamBasedLearning: 'observer dashboard, instructor notes, and collaboration comments',
  },
  media: {
    anatomicalIllustration: '2D patient anatomy, airway, lung fields, and chest motion overlays',
    medicalPodcast: 'audio guide hooks and podcast-ready scenario narration script',
    procedureVideo: 'video tutorial slot for airway/ventilator procedure review',
    schematicDiagram: 'waveform, pressure-volume, heatmap, and ventilator schematic panels',
    xrayCtImaging: 'imaging prompt slots for X-ray/CT interpretation during debrief',
  },
  references: {
    cochraneReview: 'https://www.cochranelibrary.com/',
    europeanGuideline: 'https://www.esicm.org/',
    japaneseGuideline: 'https://www.jsicm.org/',
    koreanGuideline: 'https://www.ksccm.org/',
    medicalTextbook: 'Tobin Principles and Practice of Mechanical Ventilation; Marino ICU Book',
    nejmCase: 'https://www.nejm.org/medical-articles/clinical-cases',
    pubMed: 'https://pubmed.ncbi.nlm.nih.gov/?term=mechanical+ventilation+ARDS',
    societyGuidelines: ['ATS', 'ESICM', 'KSCCM'],
    upToDate: 'https://www.uptodate.com/contents/search',
    usGuideline: 'https://www.thoracic.org/',
    whoGuideline: 'https://www.who.int/health-topics/oxygen',
  },
  scenarioObjectives,
  simulationEncounters: {
    clinicalReasoningEncounter:
      'branching virtual patient encounter with vitals, settings, treatment, and debrief',
    osceChecklist: [
      'scene safety',
      'oxygenation assessment',
      'ventilator adjustment',
      'reassessment',
      'handoff',
    ],
    standardizedPatient: 'scripted patient condition, expected cues, and instructor notes',
    virtualPatient: 'scenario state acts as a virtual ventilated patient encounter',
  },
} as const;
