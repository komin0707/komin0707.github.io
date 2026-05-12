import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const medicalArtifactPath = 'artifacts/manual-evidence/medical-expert-review-packet.json';
const medicalRubricPath = 'artifacts/manual-evidence/medical-expert-review-rubric.md';
const userArtifactPath = 'artifacts/manual-evidence/user-testing-packet.json';
const userRubricPath = 'artifacts/manual-evidence/user-testing-rubric.md';
const generatedAt = new Date().toISOString();

const medicalPacket = {
  artifactPath: medicalArtifactPath,
  generatedAt,
  limitation:
    'This packet defines the required medical expert review protocol; it is not a completed expert review.',
  requiredReviewerCount: 5,
  result: 'review-packet-ready',
  reviewerSlots: [
    'Critical care physician or intensivist',
    'Respiratory therapist or ventilation specialist',
    'Emergency medicine or anesthesiology clinician',
    'ICU nurse educator',
    'Medical simulation educator',
  ],
  reviewDomains: [
    'Ventilator mode behavior and parameter ranges',
    'ARDS, pneumonia, pneumothorax, airway obstruction, and normal scenario physiology',
    'Alarm severity, terminology, and escalation logic',
    'Drug/intervention timing, indications, and contraindications',
    'Educational debriefing accuracy and learner safety',
  ],
  passCriteria: [
    'All five reviewers are named and role-qualified.',
    'Each review domain receives pass or changes-required status.',
    'All critical safety issues are resolved or explicitly accepted with rationale.',
    'Final artifact includes reviewer date, role, signature/attestation, and unresolved-risk list.',
  ],
  rubricPath: medicalRubricPath,
};

const userPacket = {
  artifactPath: userArtifactPath,
  generatedAt,
  limitation: 'This packet defines the required user testing protocol; it is not completed user testing.',
  requiredParticipantCount: 10,
  requiredCohorts: [
    'Medical students',
    'Respiratory therapy learners',
    'ICU/ER nursing learners',
    'Clinical instructors',
  ],
  result: 'test-packet-ready',
  tasks: [
    'Identify current scenario and patient severity from the first viewport.',
    'Change ventilation mode and explain expected patient response.',
    'Recognize at least one alarm, its likely cause, and next action.',
    'Complete one scenario intervention and read the debriefing feedback.',
    'Use keyboard or assistive navigation for a core task.',
  ],
  passCriteria: [
    'At least 10 participants complete the protocol.',
    'Task completion rate is at least 80% for each core task.',
    'No critical usability issue remains unresolved.',
    'Qualitative feedback is summarized with role/cohort and date.',
  ],
  rubricPath: userRubricPath,
};

mkdirSync(dirname(medicalArtifactPath), { recursive: true });
writeFileSync(medicalArtifactPath, await formatJson(medicalArtifactPath, medicalPacket));
writeFileSync(medicalRubricPath, buildMedicalRubric(medicalPacket));
writeFileSync(userArtifactPath, await formatJson(userArtifactPath, userPacket));
writeFileSync(userRubricPath, buildUserRubric(userPacket));

process.stdout.write(
  `${JSON.stringify(
    {
      medicalArtifactPath,
      medicalResult: medicalPacket.result,
      userArtifactPath,
      userResult: userPacket.result,
    },
    null,
    2,
  )}\n`,
);

function buildMedicalRubric(packet) {
  return `${[
    '# Medical Expert Review Rubric',
    '',
    `Generated: ${packet.generatedAt}`,
    '',
    packet.limitation,
    '',
    '## Reviewer Slots',
    '',
    ...packet.reviewerSlots.map(
      (slot, index) => `${index + 1}. ${slot}: name / credentials / date / attestation`,
    ),
    '',
    '## Review Domains',
    '',
    ...packet.reviewDomains.map((domain) => `- [ ] ${domain}`),
    '',
    '## Pass Criteria',
    '',
    ...packet.passCriteria.map((criterion) => `- [ ] ${criterion}`),
    '',
    '## Findings',
    '',
    '- Critical safety issues:',
    '- Required changes:',
    '- Accepted residual risks:',
    '- Final approval status:',
    '',
  ].join('\n')}\n`;
}

function buildUserRubric(packet) {
  return `${[
    '# User Testing Rubric',
    '',
    `Generated: ${packet.generatedAt}`,
    '',
    packet.limitation,
    '',
    '## Required Cohorts',
    '',
    ...packet.requiredCohorts.map((cohort) => `- [ ] ${cohort}`),
    '',
    '## Tasks',
    '',
    ...packet.tasks.map((task) => `- [ ] ${task}`),
    '',
    '## Pass Criteria',
    '',
    ...packet.passCriteria.map((criterion) => `- [ ] ${criterion}`),
    '',
    '## Participant Results',
    '',
    '| Participant | Cohort | Completed Tasks | Critical Issues | Notes |',
    '| --- | --- | --- | --- | --- |',
    '',
  ].join('\n')}\n`;
}

async function formatJson(path, value) {
  const options = (await resolveConfig(path)) ?? {};
  return format(JSON.stringify(value), { ...options, parser: 'json' });
}
