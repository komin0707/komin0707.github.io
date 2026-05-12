import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/assert-deep-audit-handoff.mjs');

describe('deep audit external evidence handoff verifier', () => {
  it('passes when the handoff checklist matches current deep audit blockers', async () => {
    const workspace = await createHandoffWorkspace();

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      blockerCount: 5,
      checklist: 'artifacts/manual-evidence/deep-audit-external-evidence-checklist.json',
      result: 'passed',
      runbook: 'artifacts/manual-evidence/deep-audit-external-evidence-runbook.md',
    });
  });

  it('fails when the handoff omits a current deep audit blocker', async () => {
    const workspace = await createHandoffWorkspace();
    const checklistPath = join(
      workspace,
      'artifacts/manual-evidence/deep-audit-external-evidence-checklist.json',
    );
    const checklist = readJson(checklistPath);
    checklist.blockers = checklist.blockers.filter((blocker) => blocker.id !== 'user-testing');
    writeJson(checklistPath, checklist);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('handoff blocker ids');
    expect(result.stderr).toContain('user-testing');
  });

  it('fails when minimum pass conditions omit concrete external evidence requirements', async () => {
    const workspace = await createHandoffWorkspace();
    const checklistPath = join(
      workspace,
      'artifacts/manual-evidence/deep-audit-external-evidence-checklist.json',
    );
    const checklist = readJson(checklistPath);
    checklist.blockers.find((blocker) => blocker.id === 'user-testing').minimumPassCondition =
      '10 participants pass';
    writeJson(checklistPath, checklist);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('user-testing: minimumPassCondition missing');
    expect(result.stderr).toContain('scenarioIdentification');
  });
});

async function createHandoffWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), 'deep-audit-handoff-'));
  const evidenceDir = join(workspace, 'artifacts/manual-evidence');
  mkdirSync(evidenceDir, { recursive: true });

  const blockerIds = [
    'previous-complete-fix-requirements',
    'human-like-patient-visual-review',
    'multi-environment-verification',
    'medical-expert-review',
    'user-testing',
  ];
  writeJson(join(evidenceDir, 'final-blocker-summary.json'), {
    externalEvidenceHandoff: {
      checklist: 'artifacts/manual-evidence/deep-audit-external-evidence-checklist.json',
      runbook: 'artifacts/manual-evidence/deep-audit-external-evidence-runbook.md',
    },
    remainingDeepAuditBlockers: blockerIds.map((id) => ({ id })),
  });

  writeJson(join(evidenceDir, 'deep-audit-external-evidence-checklist.json'), {
    blockers: blockerIds.map((id) => buildChecklistBlocker(id)),
    finalVerificationCommands: [
      'npm run record:multi-environment-evidence',
      'npm run check:deep-audit-completion',
      'npm run write:final-blocker-summary',
      'npm run check:completion-consistency',
    ],
  });

  writeFileSync(
    join(evidenceDir, 'deep-audit-external-evidence-runbook.md'),
    [
      'This runbook must not be used as completion evidence by itself.',
      ...blockerIds,
      'npm run record:multi-environment-evidence',
      'npm run check:deep-audit-completion',
      'npm run write:final-blocker-summary',
      'npm run check:completion-consistency',
    ].join('\n'),
  );
  writePacketFixtures(evidenceDir);

  return workspace;
}

function buildChecklistBlocker(id) {
  const base = {
    id,
    minimumPassCondition: minimumPassConditionFor(id),
    requiredArtifact: `artifacts/manual-evidence/${id}.json`,
  };
  const additions = {
    'human-like-patient-visual-review': {
      packet: 'artifacts/manual-evidence/patient-visual-review-packet.json',
      rubric: 'artifacts/manual-evidence/patient-visual-review-rubric.md',
      template: 'artifacts/manual-evidence/patient-visual-review-results.template.json',
    },
    'medical-expert-review': {
      packet: 'artifacts/manual-evidence/medical-expert-review-packet.json',
      rubric: 'artifacts/manual-evidence/medical-expert-review-rubric.md',
      template: 'artifacts/manual-evidence/medical-expert-review-results.template.json',
    },
    'multi-environment-verification': {
      template: 'artifacts/manual-evidence/external-multi-environment-results.template.json',
    },
    'user-testing': {
      packet: 'artifacts/manual-evidence/user-testing-packet.json',
      rubric: 'artifacts/manual-evidence/user-testing-rubric.md',
      template: 'artifacts/manual-evidence/user-testing-results.template.json',
    },
  };
  return { ...base, ...(additions[id] ?? {}) };
}

function minimumPassConditionFor(id) {
  return (
    {
      'human-like-patient-visual-review':
        'Named reviewer with real role, attestation, reviewedAt on or after the visual review packet checkedAt, all 5 named scenario capture reviews (normal, pneumonia, ards, airwayObstruction, pneumothorax), real reviewer notes for each capture, and no unresolved critical issues.',
      'medical-expert-review':
        '5 named role-qualified reviewers covering critical care/intensivist, respiratory therapy/ventilation specialist, emergency medicine/anesthesiology, ICU nurse educator, and medical simulation educator; each reviewer includes credentials, reviewedAt on or after the medical review packet generatedAt, attestation, 5 required passed domain reviews with real reviewer notes, and no unresolved critical safety issues.',
      'user-testing':
        '10 participants covering Medical students, Respiratory therapy learners, ICU/ER nursing learners, and Clinical instructors; testedAt on or after the user-testing packet generatedAt, all 5 named task completion rates (scenarioIdentification, modeChange, alarmRecognition, debriefRead, assistiveNavigation) >=0.8, favorable feedback >=0.8, qualitative summary, and no unresolved critical usability issues.',
    }[id] ?? `${id} pass condition`
  );
}

function writePacketFixtures(evidenceDir) {
  const png = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex',
  );
  const pngPath = join(evidenceDir, 'patient-visual-review/normal.png');
  mkdirSync(join(evidenceDir, 'patient-visual-review'), { recursive: true });
  writeFileSync(pngPath, png);
  const screenshot = {
    path: 'artifacts/manual-evidence/patient-visual-review/normal.png',
    sha256: createHash('sha256').update(png).digest('hex'),
    sizeBytes: png.length,
  };
  writeJson(join(evidenceDir, 'patient-visual-review-packet.json'), {
    captures: ['normal', 'pneumonia', 'ards', 'airwayObstruction', 'pneumothorax'].map((id) => ({
      attributes: { scenario: id },
      boundingBox: { height: 1, width: 1 },
      id,
      screenshot,
    })),
    result: 'review-packet-ready',
    reviewerRubricPath: 'artifacts/manual-evidence/patient-visual-review-rubric.md',
    rubric: ['one', 'two', 'three', 'four', 'five'],
  });
  writeFileSync(join(evidenceDir, 'patient-visual-review-rubric.md'), 'visual rubric');
  writeJson(join(evidenceDir, 'patient-visual-review-results.template.json'), {
    captureReviews: ['normal', 'pneumonia', 'ards', 'airwayObstruction', 'pneumothorax'].map((scenario) => ({
      notes: `Required notes for ${scenario}`,
      scenario,
      status: 'passed',
    })),
    result: 'passed',
    reviewedAt: 'YYYY-MM-DDTHH:mm:ss.sssZ',
    reviewer: {
      attestation: 'Required reviewer attestation',
      name: 'Required reviewer name',
      role: 'Required reviewer role',
    },
    unresolvedCriticalIssues: [],
  });

  writeJson(join(evidenceDir, 'medical-expert-review-packet.json'), {
    passCriteria: ['one', 'two', 'three', 'four'],
    requiredReviewerCount: 5,
    result: 'review-packet-ready',
    reviewDomains: ['one', 'two', 'three', 'four', 'five'],
    reviewerSlots: ['one', 'two', 'three', 'four', 'five'],
    rubricPath: 'artifacts/manual-evidence/medical-expert-review-rubric.md',
  });
  writeFileSync(join(evidenceDir, 'medical-expert-review-rubric.md'), 'medical rubric');
  writeJson(join(evidenceDir, 'medical-expert-review-results.template.json'), {
    result: 'passed',
    reviews: [
      'Critical care physician or intensivist',
      'Respiratory therapist or ventilation specialist',
      'Emergency medicine or anesthesiology clinician',
      'ICU nurse educator',
      'Medical simulation educator',
    ].map((role, index) => ({
      attestation: 'Required reviewer attestation',
      credentials: 'Required reviewer credentials',
      domainReviews: ['one', 'two', 'three', 'four', 'five'].map((domain) => ({
        domain,
        notes: 'Required domain reviewer notes',
        status: 'passed',
      })),
      name: `Required reviewer ${index + 1}`,
      reviewedAt: 'YYYY-MM-DDTHH:mm:ss.sssZ',
      role,
    })),
    unresolvedCriticalIssues: [],
  });

  writeJson(join(evidenceDir, 'user-testing-packet.json'), {
    passCriteria: ['one', 'two', 'three', 'four'],
    requiredCohorts: ['one', 'two', 'three', 'four'],
    requiredParticipantCount: 10,
    result: 'test-packet-ready',
    rubricPath: 'artifacts/manual-evidence/user-testing-rubric.md',
    tasks: ['one', 'two', 'three', 'four', 'five'],
  });
  writeFileSync(join(evidenceDir, 'user-testing-rubric.md'), 'user rubric');
  writeJson(join(evidenceDir, 'user-testing-results.template.json'), {
    favorableFeedbackRate: 0.8,
    participants: [
      ['P01', 'Medical students'],
      ['P02', 'Medical students'],
      ['P03', 'Medical students'],
      ['P04', 'Respiratory therapy learners'],
      ['P05', 'Respiratory therapy learners'],
      ['P06', 'Respiratory therapy learners'],
      ['P07', 'ICU/ER nursing learners'],
      ['P08', 'ICU/ER nursing learners'],
      ['P09', 'Clinical instructors'],
      ['P10', 'Clinical instructors'],
    ].map(([id, cohort]) => ({ cohort, id })),
    qualitativeSummary: 'Required qualitative summary by cohort and date',
    result: 'passed',
    taskCompletionRates: {
      alarmRecognition: 0.8,
      assistiveNavigation: 0.8,
      debriefRead: 0.8,
      modeChange: 0.8,
      scenarioIdentification: 0.8,
    },
    testedAt: 'YYYY-MM-DDTHH:mm:ss.sssZ',
    unresolvedCriticalIssues: [],
  });

  writeJson(join(evidenceDir, 'external-multi-environment-results.template.json'), {
    results: ['Firefox desktop', 'Edge desktop', 'Linux Chromium', 'iOS Safari'].map((label) => ({
      label,
      observedAccessibility: {},
      screenshot: { path: `${label}.png`, sha256: 'REQUIRED' },
    })),
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2));
}
