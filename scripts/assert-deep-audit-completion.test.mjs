import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/assert-deep-audit-completion.mjs');

describe('deep audit completion verifier', () => {
  it('verifies zero-error accessibility when strict axe, Lighthouse, contrast, and one-hour memory pass', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const zeroErrors = audit.explicitCriteria.find(
      (criterion) => criterion.id === 'zero-errors-and-accessibility',
    );

    expect(audit.status).toBe('incomplete');
    expect(zeroErrors).toMatchObject({
      id: 'zero-errors-and-accessibility',
      status: 'verified',
    });
    expect(zeroErrors.finding).toContain('Strict accessibility scan result=passed');
    expect(zeroErrors.finding).toContain('lighthouse accessibility=1');
    expect(zeroErrors.finding).toContain('one-hour memory=verified');
    expect(audit.promptToArtifactChecklist.phasePlan).toMatchObject({
      status: 'verified',
    });
    expect(audit.promptToArtifactChecklist.phasePlan.finding).toContain('9 phases map');
  });

  it('verifies completed visual, medical expert, and user testing result artifacts', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();
    writeCompletedExternalReviewResults(workspace);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const criterionById = Object.fromEntries(
      audit.explicitCriteria.map((criterion) => [criterion.id, criterion]),
    );

    expect(criterionById['human-like-patient-visual-review'].status).toBe('verified');
    expect(criterionById['medical-expert-review'].status).toBe('verified');
    expect(criterionById['user-testing'].status).toBe('verified');
    expect(audit.status).toBe('incomplete');
  });

  it('blocks external review results that miss required reviewer roles or user cohorts', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();
    writeCompletedExternalReviewResults(workspace);

    const medicalReviewPath = join(workspace, 'artifacts/manual-evidence/medical-expert-review-results.json');
    const medicalReview = readJson(medicalReviewPath);
    medicalReview.reviews[2].role = 'General reviewer';
    writeJson(medicalReviewPath, medicalReview);

    const userTestingPath = join(workspace, 'artifacts/manual-evidence/user-testing-results.json');
    const userTesting = readJson(userTestingPath);
    userTesting.participants = userTesting.participants.map((participant) =>
      participant.cohort === 'ICU/ER nursing learners'
        ? { ...participant, cohort: 'Clinical instructors' }
        : participant,
    );
    writeJson(userTestingPath, userTesting);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const criterionById = Object.fromEntries(
      audit.explicitCriteria.map((criterion) => [criterion.id, criterion]),
    );

    expect(criterionById['medical-expert-review'].status).toBe('blocked');
    expect(criterionById['medical-expert-review'].finding).toContain(
      'Missing medical reviewer role categories',
    );
    expect(criterionById['user-testing'].status).toBe('blocked');
    expect(criterionById['user-testing'].finding).toContain('Missing user-testing cohorts');
  });

  it('blocks external review results dated before their review packets', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();
    writeCompletedExternalReviewResults(workspace);
    writeJson(join(workspace, 'artifacts/manual-evidence/patient-visual-review-packet.json'), {
      checkedAt: '2026-05-13T00:00:00.000Z',
      result: 'review-packet-ready',
    });
    writeJson(join(workspace, 'artifacts/manual-evidence/medical-expert-review-packet.json'), {
      generatedAt: '2026-05-13T00:00:00.000Z',
      result: 'review-packet-ready',
    });
    writeJson(join(workspace, 'artifacts/manual-evidence/user-testing-packet.json'), {
      generatedAt: '2026-05-13T00:00:00.000Z',
      result: 'test-packet-ready',
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const criterionById = Object.fromEntries(
      audit.explicitCriteria.map((criterion) => [criterion.id, criterion]),
    );

    expect(criterionById['human-like-patient-visual-review'].status).toBe('blocked');
    expect(criterionById['human-like-patient-visual-review'].finding).toContain('is before packet date');
    expect(criterionById['medical-expert-review'].status).toBe('blocked');
    expect(criterionById['medical-expert-review'].finding).toContain('before packet');
    expect(criterionById['user-testing'].status).toBe('blocked');
    expect(criterionById['user-testing'].finding).toContain('is before packet date');
  });

  it('blocks medical review placeholder notes and missing named user-testing tasks', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();
    writeCompletedExternalReviewResults(workspace);

    const medicalReviewPath = join(workspace, 'artifacts/manual-evidence/medical-expert-review-results.json');
    const medicalReview = readJson(medicalReviewPath);
    medicalReview.reviews[0].domainReviews[0].notes = 'Required: clinical accuracy notes';
    writeJson(medicalReviewPath, medicalReview);

    const userTestingPath = join(workspace, 'artifacts/manual-evidence/user-testing-results.json');
    const userTesting = readJson(userTestingPath);
    delete userTesting.taskCompletionRates.assistiveNavigation;
    userTesting.taskCompletionRates.unmappedTask = 1;
    writeJson(userTestingPath, userTesting);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const criterionById = Object.fromEntries(
      audit.explicitCriteria.map((criterion) => [criterion.id, criterion]),
    );

    expect(criterionById['medical-expert-review'].status).toBe('blocked');
    expect(criterionById['medical-expert-review'].finding).toContain('reviewer notes');
    expect(criterionById['user-testing'].status).toBe('blocked');
    expect(criterionById['user-testing'].finding).toContain(
      'Missing user-testing task completion rates: assistiveNavigation',
    );
  });

  it('blocks patient visual review results that miss required scenarios or real notes', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();
    writeCompletedExternalReviewResults(workspace);

    const visualReviewPath = join(workspace, 'artifacts/manual-evidence/patient-visual-review-results.json');
    const visualReview = readJson(visualReviewPath);
    visualReview.captureReviews = visualReview.captureReviews
      .filter((capture) => capture.scenario !== 'pneumothorax')
      .map((capture) => ({
        ...capture,
        notes: 'Required: human reviewer notes',
      }));
    writeJson(visualReviewPath, visualReview);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const visualReviewCriterion = audit.explicitCriteria.find(
      (criterion) => criterion.id === 'human-like-patient-visual-review',
    );

    expect(visualReviewCriterion).toMatchObject({
      status: 'blocked',
    });
    expect(visualReviewCriterion.finding).toContain('Missing patient visual review scenarios');
  });

  it('blocks exact duplicates between previous and deep audit checklist rows', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();
    writeFileSync(
      join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md'),
      ['1. [X] Requirement 42', '2. [x] Previous-only requirement'].join('\n'),
    );

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const nonOverlap = audit.explicitCriteria.find((criterion) => criterion.id === 'deep-items-non-overlap');

    expect(nonOverlap).toMatchObject({
      status: 'blocked',
    });
    expect(nonOverlap.finding).toContain('1 exact duplicate DEEP rows');
    expect(audit.promptToArtifactChecklist.nonOverlap).toMatchObject({
      duplicateCount: 1,
      status: 'blocked',
    });
  });

  it('blocks mismatches between section heading counts and actual checklist rows', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();
    writeFileSync(
      join(workspace, 'DEEP_AUDIT_REQUIREMENTS_V2.md'),
      ['## Section A (2개)', '1. [x] Requirement 1', '2. [x] Requirement 2', '3. [x] Requirement 3']
        .concat(Array.from({ length: 1177 }, (_, index) => `${index + 4}. [x] Requirement ${index + 4}`))
        .join('\n'),
    );

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const sectionCounts = audit.explicitCriteria.find((criterion) => criterion.id === 'deep-section-counts');

    expect(sectionCounts).toMatchObject({
      status: 'blocked',
    });
    expect(sectionCounts.finding).toContain('claimed 2 actual 1180');
    expect(audit.promptToArtifactChecklist.sectionCounts).toMatchObject({
      status: 'blocked',
    });
  });

  it('blocks passed multi-environment artifacts without concrete render evidence per environment', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();
    writeJson(join(workspace, 'artifacts/manual-evidence/multi-environment-verification.json'), {
      requiredEnvironments: [
        'Chrome desktop',
        'Firefox desktop',
        'Safari macOS',
        'Edge desktop',
        'Linux Chromium',
        'Android Chrome',
        'iOS Safari',
        'tablet',
        '4K',
        'ultra-wide',
        'portrait',
        'landscape',
      ],
      result: 'passed',
      results: [
        'Chrome desktop',
        'Firefox desktop',
        'Safari macOS',
        'Edge desktop',
        'Linux Chromium',
        'Android Chrome',
        'iOS Safari',
        'tablet',
        '4K',
        'ultra-wide',
        'portrait',
        'landscape',
      ].map((label) => ({
        label,
        result: 'passed',
      })),
      unavailable: [],
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const multiEnvironment = audit.explicitCriteria.find(
      (criterion) => criterion.id === 'multi-environment-verification',
    );

    expect(multiEnvironment).toMatchObject({
      status: 'blocked',
    });
    expect(multiEnvironment.finding).toContain('invalid evidence labels=Chrome desktop');
  });

  it('blocks multi-environment screenshots whose declared dimensions do not match the PNG', async () => {
    const workspace = await createWorkspaceWithZeroErrorEvidence();
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
      'hex',
    );
    const screenshotPath = join(workspace, 'artifacts/manual-evidence/external-multi-env.png');
    writeFileSync(screenshotPath, png);
    const labels = [
      'Chrome desktop',
      'Firefox desktop',
      'Safari macOS',
      'Edge desktop',
      'Linux Chromium',
      'Android Chrome',
      'iOS Safari',
      'tablet',
      '4K',
      'ultra-wide',
      'portrait',
      'landscape',
    ];
    writeJson(join(workspace, 'artifacts/manual-evidence/multi-environment-verification.json'), {
      requiredEnvironments: labels,
      result: 'passed',
      results: labels.map((label) => ({
        browserName: label,
        checkedAt: '2026-05-12T00:00:00.000Z',
        label,
        observedAccessibility: {
          documentTitle: 'Vent Simulator 2D',
          patientAvatarVisible: true,
          simulatorHeadingVisible: true,
          url: 'https://example.test',
        },
        platform: 'External',
        result: 'passed',
        screenshot: {
          height: 99,
          path: 'artifacts/manual-evidence/external-multi-env.png',
          sha256: createHash('sha256').update(png).digest('hex'),
          width: 99,
        },
      })),
      unavailable: [],
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'));
    const multiEnvironment = audit.explicitCriteria.find(
      (criterion) => criterion.id === 'multi-environment-verification',
    );

    expect(multiEnvironment).toMatchObject({
      status: 'blocked',
    });
    expect(multiEnvironment.finding).toContain('invalid evidence labels=Chrome desktop');
  });
});

async function createWorkspaceWithZeroErrorEvidence() {
  const workspace = await mkdtemp(join(tmpdir(), 'deep-audit-'));
  mkdirSync(join(workspace, 'artifacts/manual-evidence'), { recursive: true });

  writeFileSync(join(workspace, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  writeFileSync(join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md'), buildPreviousRequirements(1150));
  writeFileSync(join(workspace, 'DEEP_AUDIT_REQUIREMENTS_V2.md'), buildCheckedRequirements(1180));
  writeJson(join(workspace, 'artifacts/completion-audit.json'), {
    dist: {
      maxBytes: 100_000,
      primaryBytesNoCompressedSidecars: 90_000,
      totalBytes: 95_000,
      transferBrotliJsCssBytes: 40_000,
      withinBrotliTransferBudget: true,
      withinPrimaryBudget: true,
      withinRawBudget: true,
    },
    status: 'complete',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/phase-gate-command-results.json'), {
    commands: {
      build: { command: 'npm run build', exitCode: 0 },
      contrast: { command: 'npm run check:contrast', exitCode: 0 },
      lint: { command: 'npm run lint', exitCode: 0 },
      lintCss: { command: 'npm run lint:css', exitCode: 0 },
      typeCheck: { command: 'npm run type-check', exitCode: 0 },
    },
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/strict-accessibility-scan.json'), {
    consoleErrorCount: 0,
    incomplete: [],
    result: 'passed',
    violationCount: 0,
  });
  writeJson(join(workspace, 'artifacts/lighthouse-summary.json'), {
    summary: {
      scores: {
        accessibility: 1,
      },
    },
  });
  writeJson(join(workspace, 'artifacts/memory-profile-1hour.json'), {
    budgets: {
      maxDocumentsGrowth: 0,
      maxFinalHeapGrowthBytes: 8_000_000,
      maxJsEventListenersGrowth: 40,
      maxNodesGrowth: 120,
      maxUsedHeapBytes: 90_000_000,
      minDurationMs: 3_600_000,
    },
    profile: {
      actualDurationMs: 3_600_000,
      domGrowth: {
        documents: 0,
        jsEventListeners: 0,
        nodes: 0,
      },
      finalHeapGrowthBytes: 0,
      maxUsedHeapBytes: 10_000_000,
    },
  });

  return workspace;
}

function buildCheckedRequirements(count) {
  if (count !== 1180) {
    return [`## Section A (${count}개)`]
      .concat(Array.from({ length: count }, (_, index) => `${index + 1}. [x] Requirement ${index + 1}`))
      .join('\n');
  }

  const sections = [
    ['🩺 SECTION A: 의학적 정확성 (200개)', 200],
    ['🎨 SECTION B: UI 시각적 디테일 (220개)', 220],
    ['🔌 SECTION C: 인터랙션 디테일 (150개)', 150],
    ['🎯 SECTION D: 시뮬레이션 정확성 (150개)', 150],
    ['♿ SECTION E: 접근성 세부 (100개)', 100],
    ['🌐 SECTION F: 국제화/현지화 (100개)', 100],
    ['🚀 SECTION G: 성능 미세 최적화 (110개)', 110],
    ['🔒 SECTION H: 보안 강화 (50개)', 50],
    ['📊 SECTION I: 분석/모니터링 (50개)', 50],
    ['🎓 SECTION J: 교육적 가치 (50개)', 50],
  ];
  let nextNumber = 1;
  return sections
    .flatMap(([title, sectionCount]) => {
      const rows = [`## ${title}`];
      for (let index = 0; index < sectionCount; index += 1) {
        rows.push(`${nextNumber}. [x] Requirement ${nextNumber}`);
        nextNumber += 1;
      }
      return rows;
    })
    .join('\n');
}

function buildPreviousRequirements(count) {
  return Array.from(
    { length: count },
    (_, index) => `${index + 1}. [x] Previous requirement ${index + 1}`,
  ).join('\n');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2));
}

function writeCompletedExternalReviewResults(workspace) {
  const domains = [
    'Ventilator mode behavior and parameter ranges',
    'Scenario physiology',
    'Alarm severity and terminology',
    'Intervention timing and contraindications',
    'Educational debriefing accuracy',
  ];
  writeJson(join(workspace, 'artifacts/manual-evidence/patient-visual-review-results.json'), {
    captureReviews: ['normal', 'pneumonia', 'ards', 'airwayObstruction', 'pneumothorax'].map((scenario) => ({
      notes: `Reviewer inspected ${scenario} capture for patient morphology, bedside context, respiratory cues, pathology, and readability.`,
      scenario,
      status: 'passed',
    })),
    result: 'passed',
    reviewedAt: '2026-05-12T00:00:00.000Z',
    reviewer: {
      attestation: 'I inspected all captures and approve the patient visual realism for educational use.',
      name: 'Reviewer One',
      role: 'Clinical simulation reviewer',
    },
    unresolvedCriticalIssues: [],
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/medical-expert-review-results.json'), {
    result: 'passed',
    reviews: Array.from({ length: 5 }, (_, index) => ({
      attestation: 'I certify the reviewed domains are acceptable for educational simulation use.',
      credentials: `Credential ${index + 1}`,
      domainReviews: domains.map((domain) => ({
        domain,
        notes: `${domain} reviewed against the simulator behavior and accepted for educational use.`,
        status: 'passed',
      })),
      name: `Medical Reviewer ${index + 1}`,
      reviewedAt: '2026-05-12T00:00:00.000Z',
      role: [
        'Critical care physician',
        'Respiratory therapist',
        'Emergency medicine clinician',
        'ICU nurse educator',
        'Medical simulation educator',
      ][index],
    })),
    unresolvedCriticalIssues: [],
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/user-testing-results.json'), {
    favorableFeedbackRate: 0.9,
    participants: Array.from({ length: 10 }, (_, index) => ({
      cohort:
        index < 3
          ? 'Medical students'
          : index < 6
            ? 'Respiratory therapy learners'
            : index < 8
              ? 'ICU/ER nursing learners'
              : 'Clinical instructors',
      id: `P${index + 1}`,
    })),
    qualitativeSummary:
      'Medical students, respiratory therapy learners, ICU/ER nursing learners, and clinical instructors completed the protocol on 2026-05-12 with favorable educational feedback.',
    result: 'passed',
    taskCompletionRates: {
      alarmRecognition: 0.9,
      assistiveNavigation: 0.8,
      debriefRead: 1,
      modeChange: 0.9,
      scenarioIdentification: 1,
    },
    testedAt: '2026-05-12T00:00:00.000Z',
    unresolvedCriticalIssues: [],
  });
}
