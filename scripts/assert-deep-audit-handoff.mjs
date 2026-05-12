import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import process from 'node:process';

const finalSummaryPath = 'artifacts/manual-evidence/final-blocker-summary.json';
const defaultChecklistPath = 'artifacts/manual-evidence/deep-audit-external-evidence-checklist.json';
const defaultRunbookPath = 'artifacts/manual-evidence/deep-audit-external-evidence-runbook.md';

const summary = readJson(finalSummaryPath);
const handoff = summary.externalEvidenceHandoff ?? {};
const checklistPath = handoff.checklist ?? defaultChecklistPath;
const runbookPath = handoff.runbook ?? defaultRunbookPath;
const checklist = readJson(checklistPath);
const runbook = readText(runbookPath);

const expectedBlockerIds = (summary.remainingDeepAuditBlockers ?? []).map((blocker) => blocker.id);
const checklistBlockerIds = (checklist.blockers ?? []).map((blocker) => blocker.id);
const errors = [];

assertEqualSet('handoff blocker ids', checklistBlockerIds, expectedBlockerIds);
assertIncludes(
  'runbook path in final summary',
  [checklistPath, runbookPath],
  [defaultChecklistPath, defaultRunbookPath],
);

for (const blocker of checklist.blockers ?? []) {
  assertRunbookMentions(blocker.id);
  if (blocker.template) assertFileExists(`template for ${blocker.id}`, blocker.template);
  if (blocker.packet) assertFileExists(`packet for ${blocker.id}`, blocker.packet);
  if (blocker.rubric) assertFileExists(`rubric for ${blocker.id}`, blocker.rubric);
  validateBlockerPacket(blocker);
  if (!blocker.requiredArtifact) errors.push(`${blocker.id}: missing requiredArtifact`);
  if (!blocker.minimumPassCondition) errors.push(`${blocker.id}: missing minimumPassCondition`);
  validateMinimumPassCondition(blocker);
}

for (const command of checklist.finalVerificationCommands ?? []) {
  assertRunbookMentions(command);
}

if (!runbook.includes('must not be used as completion evidence')) {
  errors.push('runbook must explicitly state it is not completion evidence');
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(
  `${JSON.stringify(
    {
      blockerCount: checklistBlockerIds.length,
      checklist: checklistPath,
      result: 'passed',
      runbook: runbookPath,
    },
    null,
    2,
  )}\n`,
);

function readJson(path) {
  if (!existsSync(path)) throw new Error(`Missing JSON artifact: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readText(path) {
  if (!existsSync(path)) throw new Error(`Missing text artifact: ${path}`);
  return readFileSync(path, 'utf8');
}

function assertEqualSet(label, actual, expected) {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    errors.push(`${label}: expected ${JSON.stringify(expectedSorted)}, got ${JSON.stringify(actualSorted)}`);
  }
}

function assertIncludes(label, actual, expected) {
  for (const value of expected) {
    if (!actual.includes(value)) errors.push(`${label}: missing ${value}`);
  }
}

function assertFileExists(label, path) {
  if (!existsSync(path)) errors.push(`${label}: missing ${path}`);
}

function assertRunbookMentions(value) {
  if (!runbook.includes(value)) errors.push(`runbook missing ${value}`);
}

function validateBlockerPacket(blocker) {
  if (
    ['human-like-patient-visual-review', 'medical-expert-review', 'user-testing'].includes(blocker.id) &&
    !blocker.packet
  ) {
    errors.push(`${blocker.id}: missing packet path`);
    return;
  }
  if (
    ['medical-expert-review', 'user-testing', 'multi-environment-verification'].includes(blocker.id) &&
    !blocker.template
  ) {
    errors.push(`${blocker.id}: missing template path`);
    return;
  }
  if (blocker.id === 'human-like-patient-visual-review') validatePatientVisualReviewPacket(blocker);
  if (blocker.id === 'medical-expert-review') validateMedicalExpertPacket(blocker);
  if (blocker.id === 'user-testing') validateUserTestingPacket(blocker);
  if (blocker.id === 'multi-environment-verification') validateMultiEnvironmentTemplate(blocker);
  if (['human-like-patient-visual-review', 'medical-expert-review', 'user-testing'].includes(blocker.id)) {
    validateTemplateJson(blocker.id, blocker.template);
  }
}

function validateMinimumPassCondition(blocker) {
  const condition = String(blocker.minimumPassCondition ?? '');
  if (blocker.id === 'human-like-patient-visual-review') {
    for (const term of [
      'normal',
      'pneumonia',
      'ards',
      'airwayObstruction',
      'pneumothorax',
      'notes',
      'on or after',
      'checkedAt',
    ]) {
      if (!condition.includes(term)) errors.push(`${blocker.id}: minimumPassCondition missing ${term}`);
    }
  }
  if (blocker.id === 'medical-expert-review') {
    for (const term of [
      'critical care',
      'respiratory',
      'emergency',
      'ICU nurse',
      'simulation educator',
      'notes',
      'on or after',
      'generatedAt',
    ]) {
      if (!condition.toLowerCase().includes(term.toLowerCase())) {
        errors.push(`${blocker.id}: minimumPassCondition missing ${term}`);
      }
    }
  }
  if (blocker.id === 'user-testing') {
    for (const term of [
      'Medical students',
      'Respiratory therapy learners',
      'ICU/ER nursing learners',
      'Clinical instructors',
      'testedAt',
      'on or after',
      'generatedAt',
      'scenarioIdentification',
      'modeChange',
      'alarmRecognition',
      'debriefRead',
      'assistiveNavigation',
      'qualitative summary',
    ]) {
      if (!condition.includes(term)) errors.push(`${blocker.id}: minimumPassCondition missing ${term}`);
    }
  }
}

function validatePatientVisualReviewPacket(blocker) {
  const packet = readJson(blocker.packet);
  if (packet.result !== 'review-packet-ready')
    errors.push(`${blocker.id}: packet is not review-packet-ready`);
  if (packet.reviewerRubricPath !== blocker.rubric) errors.push(`${blocker.id}: packet rubric path mismatch`);
  if (!Array.isArray(packet.rubric) || packet.rubric.length < 5) {
    errors.push(`${blocker.id}: packet must include at least 5 rubric criteria`);
  }

  const captures = Array.isArray(packet.captures) ? packet.captures : [];
  const expectedCaptureIds = ['normal', 'pneumonia', 'ards', 'airwayObstruction', 'pneumothorax'];
  assertEqualSet(
    `${blocker.id} capture ids`,
    captures.map((capture) => capture.id),
    expectedCaptureIds,
  );

  for (const capture of captures) {
    if (!capture.screenshot?.path) {
      errors.push(`${blocker.id}/${capture.id}: missing screenshot path`);
      continue;
    }
    validateScreenshotEvidence(`${blocker.id}/${capture.id}`, capture.screenshot);
    if (!capture.boundingBox || capture.boundingBox.width <= 0 || capture.boundingBox.height <= 0) {
      errors.push(`${blocker.id}/${capture.id}: invalid patient bounding box`);
    }
    if (capture.attributes?.scenario !== capture.id) {
      errors.push(`${blocker.id}/${capture.id}: scenario attribute does not match capture id`);
    }
  }
}

function validateMedicalExpertPacket(blocker) {
  const packet = readJson(blocker.packet);
  if (packet.result !== 'review-packet-ready')
    errors.push(`${blocker.id}: packet is not review-packet-ready`);
  if (packet.rubricPath !== blocker.rubric) errors.push(`${blocker.id}: packet rubric path mismatch`);
  if (packet.requiredReviewerCount !== 5) errors.push(`${blocker.id}: requiredReviewerCount must be 5`);
  if (!Array.isArray(packet.reviewerSlots) || packet.reviewerSlots.length < 5) {
    errors.push(`${blocker.id}: expected at least 5 reviewer slots`);
  }
  if (!Array.isArray(packet.reviewDomains) || packet.reviewDomains.length < 5) {
    errors.push(`${blocker.id}: expected at least 5 review domains`);
  }
  if (!Array.isArray(packet.passCriteria) || packet.passCriteria.length < 4) {
    errors.push(`${blocker.id}: expected concrete pass criteria`);
  }
}

function validateUserTestingPacket(blocker) {
  const packet = readJson(blocker.packet);
  if (packet.result !== 'test-packet-ready') errors.push(`${blocker.id}: packet is not test-packet-ready`);
  if (packet.rubricPath !== blocker.rubric) errors.push(`${blocker.id}: packet rubric path mismatch`);
  if (packet.requiredParticipantCount !== 10)
    errors.push(`${blocker.id}: requiredParticipantCount must be 10`);
  if (!Array.isArray(packet.requiredCohorts) || packet.requiredCohorts.length < 4) {
    errors.push(`${blocker.id}: expected at least 4 required cohorts`);
  }
  if (!Array.isArray(packet.tasks) || packet.tasks.length < 5) {
    errors.push(`${blocker.id}: expected at least 5 user-testing tasks`);
  }
  if (!Array.isArray(packet.passCriteria) || packet.passCriteria.length < 4) {
    errors.push(`${blocker.id}: expected concrete pass criteria`);
  }
}

function validateMultiEnvironmentTemplate(blocker) {
  const template = readJson(blocker.template);
  const expectedLabels = ['Firefox desktop', 'Edge desktop', 'Linux Chromium', 'iOS Safari'];
  const results = Array.isArray(template.results) ? template.results : [];
  assertEqualSet(
    `${blocker.id} template labels`,
    results.map((result) => result.label),
    expectedLabels,
  );
  for (const result of results) {
    if (!result.screenshot?.path || !result.screenshot?.sha256) {
      errors.push(`${blocker.id}/${result.label}: missing screenshot template fields`);
    }
    if (!result.observedAccessibility) {
      errors.push(`${blocker.id}/${result.label}: missing observedAccessibility template`);
    }
  }
}

function validateTemplateJson(blockerId, path) {
  const template = readJson(path);
  if (template.result !== 'passed')
    errors.push(`${blockerId}: result template must show required passed shape`);
  if (blockerId === 'human-like-patient-visual-review') validatePatientVisualReviewTemplate(template);
  if (blockerId === 'medical-expert-review') validateMedicalExpertReviewTemplate(template);
  if (blockerId === 'user-testing') validateUserTestingTemplate(template);
}

function validatePatientVisualReviewTemplate(template) {
  const captures = Array.isArray(template.captureReviews) ? template.captureReviews : [];
  assertEqualSet(
    'human-like-patient-visual-review template scenarios',
    captures.map((capture) => capture.scenario),
    ['normal', 'pneumonia', 'ards', 'airwayObstruction', 'pneumothorax'],
  );
  for (const capture of captures) {
    if (capture.status !== 'passed') {
      errors.push(`human-like-patient-visual-review/${capture.scenario}: template status must be passed`);
    }
    if (!capture.notes) {
      errors.push(`human-like-patient-visual-review/${capture.scenario}: missing notes template field`);
    }
  }
  if (!template.reviewedAt) errors.push('human-like-patient-visual-review: missing reviewedAt template');
  if (!template.reviewer?.name || !template.reviewer?.role || !template.reviewer?.attestation) {
    errors.push('human-like-patient-visual-review: missing reviewer name/role/attestation template');
  }
  if (!Array.isArray(template.unresolvedCriticalIssues)) {
    errors.push('human-like-patient-visual-review: unresolvedCriticalIssues must be an array');
  }
}

function validateMedicalExpertReviewTemplate(template) {
  const reviews = Array.isArray(template.reviews) ? template.reviews : [];
  if (reviews.length !== 5) errors.push('medical-expert-review: template must include 5 reviews');
  const roleText = reviews.map((review) => String(review.role ?? '')).join(' | ');
  for (const term of [
    'Critical care',
    'Respiratory therapist',
    'Emergency medicine',
    'ICU nurse',
    'simulation educator',
  ]) {
    if (!roleText.toLowerCase().includes(term.toLowerCase())) {
      errors.push(`medical-expert-review: template missing role ${term}`);
    }
  }
  for (const [index, review] of reviews.entries()) {
    if (!review.name || !review.role || !review.credentials || !review.reviewedAt || !review.attestation) {
      errors.push(`medical-expert-review/${String(index + 1)}: missing reviewer identity fields`);
    }
    const domains = Array.isArray(review.domainReviews) ? review.domainReviews : [];
    if (domains.length < 5) {
      errors.push(`medical-expert-review/${String(index + 1)}: expected at least 5 domain reviews`);
    }
    for (const domain of domains) {
      if (domain.status !== 'passed') {
        errors.push(`medical-expert-review/${String(index + 1)}: domain template status must be passed`);
      }
      if (!domain.domain || !domain.notes) {
        errors.push(`medical-expert-review/${String(index + 1)}: missing domain/notes template fields`);
      }
    }
  }
  if (!Array.isArray(template.unresolvedCriticalIssues)) {
    errors.push('medical-expert-review: unresolvedCriticalIssues must be an array');
  }
}

function validateUserTestingTemplate(template) {
  const participants = Array.isArray(template.participants) ? template.participants : [];
  if (participants.length !== 10) errors.push('user-testing: template must include 10 participants');
  assertEqualSet(
    'user-testing template cohorts',
    [...new Set(participants.map((participant) => participant.cohort))],
    ['Medical students', 'Respiratory therapy learners', 'ICU/ER nursing learners', 'Clinical instructors'],
  );
  for (const participant of participants) {
    if (!participant.id || !participant.cohort) errors.push('user-testing: participant missing id/cohort');
  }
  for (const task of [
    'scenarioIdentification',
    'modeChange',
    'alarmRecognition',
    'debriefRead',
    'assistiveNavigation',
  ]) {
    if (!(task in (template.taskCompletionRates ?? {}))) {
      errors.push(`user-testing: template missing taskCompletionRates.${task}`);
    }
  }
  if (!template.testedAt) errors.push('user-testing: missing testedAt template');
  if (template.favorableFeedbackRate === undefined)
    errors.push('user-testing: missing favorableFeedbackRate');
  if (!template.qualitativeSummary) errors.push('user-testing: missing qualitativeSummary template');
  if (!Array.isArray(template.unresolvedCriticalIssues)) {
    errors.push('user-testing: unresolvedCriticalIssues must be an array');
  }
}

function validateScreenshotEvidence(label, screenshot) {
  if (!existsSync(screenshot.path)) {
    errors.push(`${label}: missing screenshot file ${screenshot.path}`);
    return;
  }

  const source = readFileSync(screenshot.path);
  const stat = statSync(screenshot.path);
  const png = readPngDimensions(source);
  const actualSha = createHash('sha256').update(source).digest('hex');

  if (screenshot.sizeBytes !== stat.size) {
    errors.push(
      `${label}: screenshot size mismatch expected ${String(screenshot.sizeBytes)} got ${String(stat.size)}`,
    );
  }
  if (screenshot.sha256 !== actualSha) {
    errors.push(`${label}: screenshot sha256 mismatch`);
  }
  if (!png || png.width <= 0 || png.height <= 0) {
    errors.push(`${label}: screenshot is not a readable PNG`);
  }
}

function readPngDimensions(source) {
  const pngSignature = '89504e470d0a1a0a';
  if (source.length < 24 || source.subarray(0, 8).toString('hex') !== pngSignature) return null;
  return {
    height: source.readUInt32BE(20),
    width: source.readUInt32BE(16),
  };
}
