import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const requirementsPath = 'DEEP_AUDIT_REQUIREMENTS_V2.md';
const previousRequirementsPath = 'COMPLETE_FIX_REQUIREMENTS.md';
const completionAuditPath = 'artifacts/completion-audit.json';
const artifactPath = 'artifacts/manual-evidence/deep-audit-completion-audit.json';
const finalCommandEvidencePath = 'artifacts/manual-evidence/final-command-evidence.json';
const multiEnvironmentEvidencePath = 'artifacts/manual-evidence/multi-environment-verification.json';
const strictAccessibilityEvidencePath = 'artifacts/manual-evidence/strict-accessibility-scan.json';

const requirements = readFileSync(requirementsPath, 'utf8');
const checklistRows = parseChecklistRows(requirements);
const sectionSummaries = buildSectionSummaries(requirements);
const phaseSummaries = buildPhaseSummaries(sectionSummaries);
const phaseCoverageStatus = phaseCoverageStatusFor(phaseSummaries, sectionSummaries);
const sectionCountMismatches = sectionSummaries.filter(
  (section) => section.claimedCount !== null && section.claimedCount !== section.total,
);
const checkedRows = checklistRows.filter((row) => row.checked);
const uncheckedRows = checklistRows.filter((row) => !row.checked);
const previousChecklistRows = parseChecklistRows(readOptionalText(previousRequirementsPath));
const duplicatedPreviousRows = findDuplicatedPreviousRows(checklistRows, previousChecklistRows);
const numbers = checklistRows.map((row) => row.number);
const highestNumber = Math.max(...numbers);
const missingNumbers = Array.from({ length: highestNumber }, (_, index) => index + 1).filter(
  (number) => !numbers.includes(number),
);
const duplicateNumbers = numbers.filter((number, index) => numbers.indexOf(number) !== index);
const completionAudit = readOptionalJson(completionAuditPath);
const packageJson = readOptionalJson('package.json');
const packageScripts = packageJson?.scripts ?? {};
const finalVerificationCommands = extractFinalVerificationCommands(requirements);
const commandManifest = finalVerificationCommands.map((command) => ({
  command,
  packageScriptExists: command.startsWith('npm run ')
    ? Boolean(packageScripts[command.replace(/^npm run\s+/, '').split(/\s+/)[0]])
    : command === 'npm install' || command === 'npm test',
  durableEvidence: durableEvidenceForCommand(command),
}));

const explicitCriteria = [
  {
    evidence: [`${requirementsPath}: numbered checklist rows`],
    id: 'deep-checklist-count',
    requirement: 'DEEP_AUDIT_REQUIREMENTS_V2.md has 1,180 numbered checklist rows.',
    status: checklistRows.length === 1180 ? 'verified' : 'blocked',
    finding: `${String(checklistRows.length)} rows observed.`,
  },
  {
    evidence: [`${requirementsPath}: checked rows`],
    id: 'deep-checklist-all-checked',
    requirement: 'All 1,180 DEEP checklist rows are checked.',
    status:
      checkedRows.length === 1180 &&
      uncheckedRows.length === 0 &&
      missingNumbers.length === 0 &&
      duplicateNumbers.length === 0
        ? 'verified'
        : 'blocked',
    finding: `${String(checkedRows.length)}/${String(checklistRows.length)} checked; unchecked=${String(
      uncheckedRows.length,
    )}; missing=${missingNumbers.join(',') || 'none'}; duplicates=${duplicateNumbers.join(',') || 'none'}.`,
  },
  {
    evidence: [requirementsPath, previousRequirementsPath],
    id: 'deep-items-non-overlap',
    requirement: 'The 1,180 DEEP checklist rows are not exact duplicates of previous checklist rows.',
    status: duplicatedPreviousRows.length === 0 ? 'verified' : 'blocked',
    finding:
      duplicatedPreviousRows.length === 0
        ? `0 exact duplicate DEEP rows found against ${String(previousChecklistRows.length)} previous rows.`
        : `${String(duplicatedPreviousRows.length)} exact duplicate DEEP rows found against previous checklist rows: ${duplicatedPreviousRows
            .slice(0, 10)
            .map((entry) => `${entry.deep.number}->${entry.previous.map((row) => row.number).join('/')}`)
            .join(', ')}.`,
    duplicates: duplicatedPreviousRows,
  },
  {
    evidence: [requirementsPath],
    id: 'deep-section-counts',
    requirement: 'DEEP section headings reconcile with the actual checked row ranges.',
    status: sectionCountMismatches.length === 0 ? 'verified' : 'blocked',
    finding:
      sectionCountMismatches.length === 0
        ? `${String(sectionSummaries.length)} sections reconcile with their heading counts.`
        : `${String(sectionCountMismatches.length)} section count mismatches: ${sectionCountMismatches
            .map(
              (section) =>
                `${section.title} claimed ${String(section.claimedCount)} actual ${String(section.total)}`,
            )
            .join('; ')}.`,
    sections: sectionSummaries,
  },
  {
    evidence: [requirementsPath],
    id: 'deep-phase-plan-map',
    requirement: 'Phase 8-16 plan maps to the DEEP checklist sections and totals 1,180 canonical rows.',
    status: phaseCoverageStatus.status,
    finding: phaseCoverageStatus.finding,
    phases: phaseSummaries,
  },
  {
    evidence: [completionAuditPath],
    id: 'previous-complete-fix-requirements',
    requirement: 'Previous COMPLETE_FIX_REQUIREMENTS.md objective is also complete.',
    status: completionAudit?.status === 'complete' ? 'verified' : 'blocked',
    finding: completionAudit
      ? `completion audit status=${completionAudit.status}; blockers=${(completionAudit.blockers ?? [])
          .map((blocker) => blocker.id)
          .join(', ')}`
      : 'completion audit artifact is missing.',
  },
  {
    evidence: ['latest terminal runs', 'artifacts/manual-evidence/phase-gate-command-results.json'],
    id: 'final-command-gates',
    requirement: 'All final build, test, documentation, performance, memory, and policy commands pass.',
    status: commandManifest.every((entry) => entry.durableEvidence.status === 'verified')
      ? 'verified'
      : 'blocked',
    finding: `${String(commandManifest.filter((entry) => entry.durableEvidence.status === 'verified').length)}/${String(
      commandManifest.length,
    )} listed final commands have durable pass evidence in this audit.`,
  },
  {
    evidence: [
      'artifacts/manual-evidence/visual-screenshot-review.json',
      'artifacts/patient-avatar-current.png',
      'artifacts/manual-evidence/patient-visual-review-results.json',
    ],
    id: 'human-like-patient-visual-review',
    requirement: 'Patient looks like a real patient, not a schematic, with natural breathing animations.',
    status: humanVisualReviewStatus().status,
    finding: humanVisualReviewStatus().finding,
  },
  {
    evidence: [multiEnvironmentEvidencePath],
    id: 'multi-environment-verification',
    requirement:
      'Chrome, Firefox, Safari macOS/iOS, Edge, Linux Chromium, Android Chrome, iOS Safari, tablet, 4K, ultra-wide, portrait, and landscape are verified.',
    status: multiEnvironmentStatus().status,
    finding: multiEnvironmentStatus().finding,
  },
  {
    evidence: [
      'artifacts/manual-evidence/deep-audit-completion-audit.json',
      'artifacts/manual-evidence/medical-expert-review-results.json',
    ],
    id: 'medical-expert-review',
    requirement:
      'At least 5 medical experts certify simulation accuracy, terminology, scenarios, alarms, drugs, and education value.',
    status: medicalExpertReviewStatus().status,
    finding: medicalExpertReviewStatus().finding,
  },
  {
    evidence: [
      'artifacts/manual-evidence/deep-audit-completion-audit.json',
      'artifacts/manual-evidence/user-testing-results.json',
    ],
    id: 'user-testing',
    requirement:
      'At least 10 medical students and listed clinician/teacher roles complete user testing with favorable feedback.',
    status: userTestingStatus().status,
    finding: userTestingStatus().finding,
  },
  {
    evidence: ['artifacts/completion-audit.json:dist', 'latest terminal run: npm run check:bundle-size'],
    id: 'bundle-under-100kb',
    requirement: 'Brotli-compressed JS/CSS transfer remains below 100 KB.',
    status:
      completionAudit?.dist?.transferBrotliJsCssBytes < completionAudit?.dist?.maxBytes
        ? 'verified'
        : 'blocked',
    finding: completionAudit?.dist
      ? `Brotli JS/CSS transfer=${String(completionAudit.dist.transferBrotliJsCssBytes)} bytes; budget=${String(
          completionAudit.dist.maxBytes,
        )} bytes; raw primary JS/CSS=${String(completionAudit.dist.primaryJsCssBytes)} bytes.`
      : 'No completion audit dist evidence found.',
  },
  {
    evidence: ['artifacts/completion-audit.json', strictAccessibilityEvidencePath, 'latest terminal runs'],
    id: 'zero-errors-and-accessibility',
    requirement:
      '0 console errors, 0 type errors, 0 lint errors, 0 a11y errors, no memory leak, WCAG AAA/100% accessibility.',
    status: zeroErrorsAndAccessibilityStatus().status,
    finding: zeroErrorsAndAccessibilityStatus().finding,
  },
];

const artifact = {
  artifactPath,
  checkedAt: new Date().toISOString(),
  objective:
    'Complete all 1,180 DEEP_AUDIT_REQUIREMENTS_V2.md items and satisfy the true completion definition, including previous COMPLETE checklist, command gates, visual/clinical confirmation, medical expert review, and user testing.',
  checklist: {
    checked: checkedRows.length,
    duplicateNumbers: [...new Set(duplicateNumbers)],
    highestNumber,
    missingNumbers,
    sections: sectionSummaries,
    total: checklistRows.length,
    unchecked: uncheckedRows.length,
  },
  commandManifest,
  explicitCriteria,
  promptToArtifactChecklist: buildPromptToArtifactChecklist(),
  status: explicitCriteria.every((criterion) => criterion.status === 'verified') ? 'complete' : 'incomplete',
};

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(artifactPath, await formatJson(artifactPath, artifact));
process.stdout.write(
  `${JSON.stringify(
    {
      artifactPath,
      checklist: artifact.checklist,
      blockedCriteria: explicitCriteria
        .filter((criterion) => criterion.status !== 'verified')
        .map((criterion) => criterion.id),
      status: artifact.status,
    },
    null,
    2,
  )}\n`,
);

if (artifact.status !== 'complete') {
  process.exitCode = 1;
}

function extractFinalVerificationCommands(source) {
  const commands = [...source.matchAll(/^npm (?:run [^\n#]+|install|test)(?:\s+#.*)?$/gm)].map((match) =>
    match[0].replace(/\s+#.*$/, '').trim(),
  );
  return [...new Set(commands)];
}

function durableEvidenceForCommand(command) {
  const phaseGates = readOptionalJson('artifacts/manual-evidence/phase-gate-command-results.json');
  const commandResult = Object.values(phaseGates?.commands ?? {}).find((entry) => entry.command === command);
  if (commandResult) {
    return {
      artifact: 'artifacts/manual-evidence/phase-gate-command-results.json',
      exitCode: commandResult.exitCode,
      status: commandResult.exitCode === 0 ? 'verified' : 'blocked',
    };
  }

  const finalCommandEvidence = readOptionalJson(finalCommandEvidencePath);
  const finalCommandResult = finalCommandEvidence?.commands?.[command];
  if (finalCommandResult) {
    return {
      artifact: finalCommandEvidencePath,
      exitCode: finalCommandResult.exitCode,
      result: finalCommandResult.result,
      status:
        finalCommandResult.result === 'passed' || finalCommandResult.exitCode === 0 ? 'verified' : 'blocked',
    };
  }

  const longMemoryEvidence = durableLongMemoryEvidenceForCommand(command);
  if (longMemoryEvidence) return longMemoryEvidence;

  if (command === 'npm run check:test-realism') {
    const realism = readOptionalJson('artifacts/manual-evidence/test-realism.json');
    return {
      artifact: 'artifacts/manual-evidence/test-realism.json',
      result: realism?.result,
      status: realism?.result === 'passed' ? 'verified' : 'blocked',
    };
  }

  if (command === 'npm run test:e2e' && existsSync('test-results')) {
    return {
      artifact: 'latest terminal run and test-results directory',
      status: 'weak',
    };
  }

  return {
    artifact: null,
    status: 'blocked',
  };
}

function buildPromptToArtifactChecklist() {
  const criterionById = new Map(explicitCriteria.map((criterion) => [criterion.id, criterion]));

  return {
    objectiveRestatement:
      'Deliver all 1,180 DEEP_AUDIT_REQUIREMENTS_V2.md checklist items, preserve the previous COMPLETE_FIX_REQUIREMENTS.md completion contract, pass every final command gate, and satisfy visual, clinical, expert, user, accessibility, memory, bundle, multi-environment, and release-quality evidence requirements.',
    numberedChecklist: {
      evidence: [`${requirementsPath}: numbered checklist rows`, artifactPath],
      finding: criterionById.get('deep-checklist-all-checked')?.finding,
      requirement: '1,180 / 1,180 DEEP checklist rows are present, unique, consecutive, and checked.',
      status: criterionById.get('deep-checklist-all-checked')?.status,
    },
    nonOverlap: {
      duplicateCount: duplicatedPreviousRows.length,
      evidence: [requirementsPath, previousRequirementsPath, artifactPath],
      finding: criterionById.get('deep-items-non-overlap')?.finding,
      requirement: 'DEEP checklist items do not exactly duplicate previous checklist items.',
      status: criterionById.get('deep-items-non-overlap')?.status,
    },
    sectionCounts: {
      evidence: [requirementsPath, artifactPath],
      finding: criterionById.get('deep-section-counts')?.finding,
      mismatches: sectionCountMismatches,
      requirement: 'DEEP section heading counts match actual checklist rows.',
      sections: sectionSummaries,
      status: criterionById.get('deep-section-counts')?.status,
    },
    phasePlan: {
      evidence: [requirementsPath, artifactPath],
      finding: criterionById.get('deep-phase-plan-map')?.finding,
      phases: phaseSummaries,
      requirement: 'Phase 8-16 plan is mapped to concrete DEEP sections and row ranges.',
      status: criterionById.get('deep-phase-plan-map')?.status,
    },
    priorObjective: {
      evidence: [completionAuditPath],
      finding: criterionById.get('previous-complete-fix-requirements')?.finding,
      requirement:
        'Previous COMPLETE_FIX_REQUIREMENTS.md objective is complete before this objective is claimed complete.',
      status: criterionById.get('previous-complete-fix-requirements')?.status,
    },
    finalVerificationCommands: commandManifest.map((entry) => ({
      command: entry.command,
      evidence: entry.durableEvidence.artifact ?? 'missing durable command evidence',
      exitCode: entry.durableEvidence.exitCode,
      result: entry.durableEvidence.result,
      status: entry.durableEvidence.status,
    })),
    trueCompletionCriteria: [
      criterionById.get('human-like-patient-visual-review'),
      criterionById.get('medical-expert-review'),
      criterionById.get('user-testing'),
      criterionById.get('multi-environment-verification'),
      criterionById.get('bundle-under-100kb'),
      criterionById.get('zero-errors-and-accessibility'),
    ].map((criterion) => ({
      evidence: criterion?.evidence ?? [],
      finding: criterion?.finding ?? 'criterion missing from audit',
      requirement: criterion?.requirement ?? 'unknown',
      status: criterion?.status ?? 'blocked',
    })),
    blockers: explicitCriteria
      .filter((criterion) => criterion.status !== 'verified')
      .map((criterion) => ({
        evidence: criterion.evidence,
        finding: criterion.finding,
        id: criterion.id,
        requirement: criterion.requirement,
        status: criterion.status,
      })),
  };
}

function durableLongMemoryEvidenceForCommand(command) {
  const expectations = {
    'npm run check:memory:10min': {
      minDurationMs: 600_000,
      paths: ['artifacts/memory-profile-10min.json', 'artifacts/memory-profile-1hour.json'],
    },
    'npm run check:memory:30min': {
      minDurationMs: 1_800_000,
      paths: ['artifacts/memory-profile-30min.json', 'artifacts/memory-profile-1hour.json'],
    },
    'npm run check:memory:1hour': {
      minDurationMs: 3_600_000,
      paths: ['artifacts/memory-profile-1hour.json'],
    },
  };
  const expectation = expectations[command];
  if (!expectation) return null;

  for (const path of expectation.paths) {
    const artifact = readOptionalJson(path);
    const profile = artifact?.profile;
    const budgets = artifact?.budgets;
    if (!profile || !budgets) continue;
    const passed =
      profile.actualDurationMs >= expectation.minDurationMs &&
      profile.actualDurationMs >= (budgets.minDurationMs ?? expectation.minDurationMs) &&
      profile.maxUsedHeapBytes <= budgets.maxUsedHeapBytes &&
      profile.finalHeapGrowthBytes <= budgets.maxFinalHeapGrowthBytes &&
      profile.domGrowth?.nodes <= budgets.maxNodesGrowth &&
      profile.domGrowth?.documents <= budgets.maxDocumentsGrowth &&
      profile.domGrowth?.jsEventListeners <= budgets.maxJsEventListenersGrowth;

    return {
      artifact: path,
      actualDurationMs: profile.actualDurationMs,
      minDurationMs: expectation.minDurationMs,
      status: passed ? 'verified' : 'blocked',
    };
  }

  return {
    artifact: null,
    minDurationMs: expectation.minDurationMs,
    status: 'blocked',
  };
}

function readOptionalJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readOptionalText(path) {
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

function parseChecklistRows(source) {
  return [...source.matchAll(/^\s*(\d+)\.\s*\[([ xX])\]\s*(.+?)\s*$/gm)].map((match) => ({
    checked: match[2].toLowerCase() === 'x',
    normalizedText: normalizeChecklistText(match[3]),
    number: Number(match[1]),
    text: match[3],
  }));
}

function findDuplicatedPreviousRows(currentRows, previousRows) {
  const previousByText = new Map();
  for (const previousRow of previousRows) {
    const rows = previousByText.get(previousRow.normalizedText) ?? [];
    rows.push(previousRow);
    previousByText.set(previousRow.normalizedText, rows);
  }

  return currentRows
    .filter((row) => previousByText.has(row.normalizedText))
    .map((row) => ({
      deep: {
        number: row.number,
        text: row.text,
      },
      previous: previousByText.get(row.normalizedText).map((previousRow) => ({
        number: previousRow.number,
        text: previousRow.text,
      })),
    }));
}

function buildSectionSummaries(source) {
  const summaries = [];
  let currentSection = null;

  for (const line of source.split(/\r?\n/)) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      currentSection = {
        checked: 0,
        claimedCount: readClaimedSectionCount(heading[1]),
        first: null,
        last: null,
        title: heading[1],
        total: 0,
      };
      summaries.push(currentSection);
      continue;
    }

    const row = /^\s*(\d+)\.\s*\[([ xX])\]\s*(.+?)\s*$/.exec(line);
    if (!row) continue;
    if (!currentSection) {
      currentSection = {
        checked: 0,
        claimedCount: null,
        first: null,
        last: null,
        title: '(before first section)',
        total: 0,
      };
      summaries.push(currentSection);
    }

    const number = Number(row[1]);
    currentSection.total += 1;
    if (row[2].toLowerCase() === 'x') currentSection.checked += 1;
    currentSection.first ??= number;
    currentSection.last = number;
  }

  return summaries.filter((section) => section.total > 0);
}

function readClaimedSectionCount(title) {
  const match = /(\d+)\s*개/.exec(title);
  return match ? Number(match[1]) : null;
}

function buildPhaseSummaries(sections) {
  const phaseDefinitions = [
    phaseDefinition('Phase 8', '의학적 정확성', 200, ['의학적 정확성']),
    phaseDefinition('Phase 9', 'UI 시각적 디테일', 200, ['UI 시각적 디테일']),
    phaseDefinition('Phase 10', '인터랙션 디테일', 150, ['인터랙션 디테일']),
    phaseDefinition('Phase 11', '시뮬레이션 정확성', 150, ['시뮬레이션 정확성']),
    phaseDefinition('Phase 12', '접근성 세부', 100, ['접근성 세부']),
    phaseDefinition('Phase 13', '국제화', 100, ['국제화/현지화']),
    phaseDefinition('Phase 14', '성능 미세', 100, ['성능 미세 최적화']),
    phaseDefinition('Phase 15', '보안 + 분석', 100, ['보안 강화', '분석/모니터링']),
    phaseDefinition('Phase 16', '교육 가치 + 최종 검증', 50, ['교육적 가치']),
  ];

  return phaseDefinitions.map((definition) => {
    const matchedSections = sections.filter((section) =>
      definition.sectionTitleIncludes.some((sectionTitle) => section.title.includes(sectionTitle)),
    );
    const actualRows = matchedSections.reduce((total, section) => total + section.total, 0);
    return {
      ...definition,
      actualRows,
      rowDeltaFromPromptPlan: actualRows - definition.promptPlanRows,
      sections: matchedSections.map((section) => ({
        first: section.first,
        last: section.last,
        title: section.title,
        total: section.total,
      })),
      status: matchedSections.length === definition.sectionTitleIncludes.length ? 'mapped' : 'missing',
    };
  });
}

function phaseDefinition(phase, topic, promptPlanRows, sectionTitleIncludes) {
  return {
    phase,
    promptPlanRows,
    sectionTitleIncludes,
    topic,
  };
}

function phaseCoverageStatusFor(phases, sections) {
  const mappedSectionTitles = new Set(
    phases.flatMap((phase) => phase.sections.map((section) => section.title)),
  );
  const unmappedSections = sections.filter((section) => !mappedSectionTitles.has(section.title));
  const missingPhases = phases.filter((phase) => phase.status !== 'mapped');
  const actualRows = phases.reduce((total, phase) => total + phase.actualRows, 0);
  const promptPlanRows = phases.reduce((total, phase) => total + phase.promptPlanRows, 0);
  const status =
    missingPhases.length === 0 && unmappedSections.length === 0 && actualRows === 1180
      ? 'verified'
      : 'blocked';

  return {
    finding:
      status === 'verified'
        ? `9 phases map to ${String(sections.length)} DEEP sections; canonical rows=${String(
            actualRows,
          )}; prompt plan rows=${String(promptPlanRows)}; expanded rows=${String(actualRows - promptPlanRows)}.`
        : `Phase mapping incomplete; missing phases=${
            missingPhases.map((phase) => phase.phase).join(', ') || 'none'
          }; unmapped sections=${
            unmappedSections.map((section) => section.title).join(', ') || 'none'
          }; canonical rows=${String(actualRows)}.`,
    status,
  };
}

function normalizeChecklistText(text) {
  return text
    .toLowerCase()
    .replace(/[`*_()[\]{}:;,.!?/\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function multiEnvironmentStatus() {
  const evidence = readOptionalJson(multiEnvironmentEvidencePath);
  if (!evidence) {
    return {
      finding: 'No durable multi-environment verification artifact was found.',
      status: 'blocked',
    };
  }
  const unavailable = Array.isArray(evidence.unavailable) ? evidence.unavailable : [];
  const passed = Array.isArray(evidence.results)
    ? evidence.results.filter((result) => result.result === 'passed').length
    : 0;
  const resultValidation = validateMultiEnvironmentResults(evidence);

  if (evidence.result === 'passed' && unavailable.length === 0 && resultValidation.status === 'verified') {
    return {
      finding: `${passed}/${evidence.requiredEnvironments?.length ?? passed} required environments passed; ${resultValidation.finding}`,
      status: 'verified',
    };
  }

  return {
    finding: `${passed}/${evidence.requiredEnvironments?.length ?? 'unknown'} environments passed; missing or unavailable: ${
      unavailable.join(', ') || 'unknown'
    }. ${resultValidation.finding}`,
    status: 'blocked',
  };
}

function validateMultiEnvironmentResults(evidence) {
  const required = Array.isArray(evidence.requiredEnvironments) ? evidence.requiredEnvironments : [];
  const results = Array.isArray(evidence.results) ? evidence.results : [];
  const passedByLabel = new Map(
    results.filter((result) => result.result === 'passed').map((result) => [result.label, result]),
  );
  const missingPassedLabels = required.filter((label) => !passedByLabel.has(label));
  const invalidPassedLabels = required
    .map((label) => [label, passedByLabel.get(label)])
    .filter(([, result]) => result && !multiEnvironmentResultHasEvidence(result))
    .map(([label]) => label);

  if (required.length > 0 && missingPassedLabels.length === 0 && invalidPassedLabels.length === 0) {
    return {
      finding: `${String(required.length)} required environment results include concrete render evidence.`,
      status: 'verified',
    };
  }

  return {
    finding: `Multi-environment evidence incomplete; missing passed labels=${
      missingPassedLabels.join(', ') || 'none'
    }; invalid evidence labels=${invalidPassedLabels.join(', ') || 'none'}.`,
    status: 'blocked',
  };
}

function multiEnvironmentResultHasEvidence(result) {
  if (screenshotEvidencePassed(result.screenshot)) {
    const observedAccessibility = result.observedAccessibility ?? {};
    return (
      Boolean(result.browserName) &&
      Boolean(result.platform) &&
      Boolean(result.checkedAt) &&
      observedAccessibility.patientAvatarVisible === true &&
      observedAccessibility.simulatorHeadingVisible === true &&
      String(observedAccessibility.documentTitle ?? '').includes('Vent Simulator 2D') &&
      String(observedAccessibility.url ?? '').length > 0
    );
  }

  const patientBox = result.patientBox ?? {};
  return (
    result.titleVisible === true &&
    result.consoleErrorCount === 0 &&
    Number(patientBox.width) > 0 &&
    Number(patientBox.height) > 0
  );
}

function screenshotEvidencePassed(screenshot) {
  const screenshotPath = screenshot?.path;
  if (!screenshotPath || !existsSync(String(screenshotPath))) return false;
  if (Number(screenshot.width) <= 0 || Number(screenshot.height) <= 0) return false;
  if (!screenshot.sha256 || String(screenshot.sha256).includes('REQUIRED')) return false;

  const source = readFileSync(String(screenshotPath));
  const dimensions = readPngDimensions(source);
  if (
    !dimensions ||
    dimensions.width !== Number(screenshot.width) ||
    dimensions.height !== Number(screenshot.height)
  ) {
    return false;
  }

  const actualHash = createHash('sha256').update(source).digest('hex');
  return actualHash === screenshot.sha256;
}

function readPngDimensions(source) {
  const pngSignature = '89504e470d0a1a0a';
  if (source.length < 24 || source.subarray(0, 8).toString('hex') !== pngSignature) return null;
  return {
    height: source.readUInt32BE(20),
    width: source.readUInt32BE(16),
  };
}

function humanVisualReviewStatus() {
  const completedReview = readOptionalJson('artifacts/manual-evidence/patient-visual-review-results.json');
  if (completedReview) {
    const captureReviews = completedReview.captureReviews ?? completedReview.captures ?? [];
    const reviewer = completedReview.reviewer ?? {};
    const unresolvedCriticalIssues = completedReview.unresolvedCriticalIssues ?? [];
    const scenarioCoverage = patientVisualScenarioCoverage(captureReviews);
    const packet = readOptionalJson('artifacts/manual-evidence/patient-visual-review-packet.json');
    const reviewTiming = evidenceDateStatus(completedReview.reviewedAt, packet?.checkedAt);
    const passed =
      completedReview.result === 'passed' &&
      captureReviews.length >= 5 &&
      scenarioCoverage.status === 'verified' &&
      captureReviews.every(
        (capture) => capture.status === 'passed' && hasRealValue(capture.notes ?? capture.comment),
      ) &&
      hasRealValue(reviewer.name) &&
      hasRealValue(reviewer.role) &&
      hasRealValue(reviewer.attestation) &&
      hasRealValue(completedReview.reviewedAt) &&
      reviewTiming.status === 'verified' &&
      unresolvedCriticalIssues.length === 0;

    return {
      finding: passed
        ? `Human visual review passed with ${String(captureReviews.length)} capture reviews by ${reviewer.name}.`
        : `Human visual review results artifact exists but is incomplete: require real reviewer name/role/attestation/date after the review packet, all 5 named scenario capture reviews with reviewer notes, and no unresolved critical issues. ${scenarioCoverage.finding} ${reviewTiming.finding}`,
      status: passed ? 'verified' : 'blocked',
    };
  }

  const packet = readOptionalJson('artifacts/manual-evidence/patient-visual-review-packet.json');
  const packetFinding =
    packet?.result === 'review-packet-ready'
      ? ` Scenario visual review packet is ready with ${String(packet.captures?.length ?? 0)} captures at ${packet.artifactPath}.`
      : ' Scenario visual review packet is missing.';

  return {
    finding: `Visual screenshot review artifact exists, but the objective asks for subjective visual and clinical confirmation; this still needs human reviewer sign-off.${packetFinding}`,
    status: 'blocked',
  };
}

function patientVisualScenarioCoverage(captureReviews) {
  const scenarios = new Set(
    captureReviews.map((capture) => String(capture.scenario ?? capture.id ?? '').trim()),
  );
  const missing = ['normal', 'pneumonia', 'ards', 'airwayObstruction', 'pneumothorax'].filter(
    (scenario) => !scenarios.has(scenario),
  );

  return {
    finding:
      missing.length === 0
        ? 'All required patient visual review scenarios are represented.'
        : `Missing patient visual review scenarios: ${missing.join(', ')}.`,
    status: missing.length === 0 ? 'verified' : 'blocked',
  };
}

function medicalExpertReviewStatus() {
  const completedReview = readOptionalJson('artifacts/manual-evidence/medical-expert-review-results.json');
  if (completedReview) {
    const reviews = completedReview.reviews ?? completedReview.reviewers ?? [];
    const unresolvedCriticalIssues = completedReview.unresolvedCriticalIssues ?? [];
    const roleCoverage = medicalReviewerRoleCoverage(reviews);
    const packet = readOptionalJson('artifacts/manual-evidence/medical-expert-review-packet.json');
    const timingCoverage = medicalReviewTimingCoverage(reviews, packet?.generatedAt);
    const passed =
      completedReview.result === 'passed' &&
      reviews.length >= 5 &&
      roleCoverage.status === 'verified' &&
      timingCoverage.status === 'verified' &&
      reviews.every((review) => {
        const domains = review.domainReviews ?? review.reviewDomains ?? review.domains ?? [];
        const domainCoverage = medicalDomainCoverage(domains);
        return (
          hasRealValue(review.name) &&
          hasRealValue(review.role) &&
          hasRealValue(review.credentials) &&
          hasRealValue(review.reviewedAt) &&
          hasRealValue(review.attestation) &&
          domainCoverage.status === 'verified' &&
          domains.every(
            (domain) => domain.status === 'passed' && hasRealValue(domain.notes ?? domain.comment),
          )
        );
      }) &&
      unresolvedCriticalIssues.length === 0;

    return {
      finding: passed
        ? `Medical expert review passed with ${String(reviews.length)} named reviewers and no unresolved critical safety issues.`
        : `Medical expert review results artifact exists but is incomplete: require 5 named role-qualified reviewers, credentials, dates after the review packet, attestations, the required clinical role coverage, 5 required passed domains with reviewer notes per reviewer, and no unresolved critical safety issues. ${roleCoverage.finding} ${timingCoverage.finding}`,
      status: passed ? 'verified' : 'blocked',
    };
  }

  return {
    finding: externalReviewPacketFinding(
      'artifacts/manual-evidence/medical-expert-review-packet.json',
      'No durable artifact with 5 named medical expert reviews was found.',
      'Medical expert review packet is ready, but completed reviewer attestations are still missing.',
    ),
    status: 'blocked',
  };
}

function userTestingStatus() {
  const completedTesting = readOptionalJson('artifacts/manual-evidence/user-testing-results.json');
  if (completedTesting) {
    const participants = completedTesting.participants ?? completedTesting.participantResults ?? [];
    const taskCompletionRates = Object.values(completedTesting.taskCompletionRates ?? {});
    const unresolvedCriticalIssues = completedTesting.unresolvedCriticalIssues ?? [];
    const favorableFeedbackRate =
      completedTesting.favorableFeedbackRate ?? completedTesting.positiveFeedbackRate;
    const cohortCoverage = userTestingCohortCoverage(participants);
    const taskCoverage = userTestingTaskCoverage(completedTesting.taskCompletionRates ?? {});
    const packet = readOptionalJson('artifacts/manual-evidence/user-testing-packet.json');
    const testTiming = evidenceDateStatus(completedTesting.testedAt, packet?.generatedAt);
    const passed =
      completedTesting.result === 'passed' &&
      hasRealValue(completedTesting.testedAt) &&
      testTiming.status === 'verified' &&
      participants.length >= 10 &&
      participants.every((participant) => hasRealValue(participant.id) && hasRealValue(participant.cohort)) &&
      cohortCoverage.status === 'verified' &&
      taskCoverage.status === 'verified' &&
      taskCompletionRates.length >= 5 &&
      taskCompletionRates.every((rate) => Number(rate) >= 0.8) &&
      Number(favorableFeedbackRate) >= 0.8 &&
      hasRealValue(completedTesting.qualitativeSummary) &&
      unresolvedCriticalIssues.length === 0;

    return {
      finding: passed
        ? `User testing passed with ${String(participants.length)} participants, task completion >=80%, favorable feedback >=80%, and no unresolved critical issues.`
        : `User testing results artifact exists but is incomplete: require test date after the user-testing packet, 10 participants covering all required cohorts, the 5 named task completion rates >=80%, favorable feedback >=80%, qualitative summary, and no unresolved critical usability issues. ${cohortCoverage.finding} ${taskCoverage.finding} ${testTiming.finding}`,
      status: passed ? 'verified' : 'blocked',
    };
  }

  return {
    finding: externalReviewPacketFinding(
      'artifacts/manual-evidence/user-testing-packet.json',
      'No durable user testing artifact covering the requested cohorts was found.',
      'User testing packet is ready, but completed participant results are still missing.',
    ),
    status: 'blocked',
  };
}

function medicalReviewerRoleCoverage(reviews) {
  const roleText = reviews.map((review) => String(review.role ?? '').toLowerCase()).join(' | ');
  const missing = [
    ['critical care physician/intensivist', /\b(critical care|intensivist)\b/],
    ['respiratory therapist/ventilation specialist', /\b(respiratory therapist|ventilation specialist)\b/],
    ['emergency medicine/anesthesiology clinician', /\b(emergency medicine|anesthesiology|anesthetist)\b/],
    ['ICU nurse educator', /\b(icu nurse educator|nurse educator)\b/],
    ['medical simulation educator', /\b(medical simulation educator|simulation educator)\b/],
  ]
    .filter(([, pattern]) => !pattern.test(roleText))
    .map(([label]) => label);

  return {
    finding:
      missing.length === 0
        ? 'All required medical reviewer role categories are represented.'
        : `Missing medical reviewer role categories: ${missing.join(', ')}.`,
    status: missing.length === 0 ? 'verified' : 'blocked',
  };
}

function medicalReviewTimingCoverage(reviews, packetGeneratedAt) {
  const blocked = reviews
    .map((review, index) => ({
      index: index + 1,
      timing: evidenceDateStatus(review.reviewedAt, packetGeneratedAt),
    }))
    .filter((entry) => entry.timing.status !== 'verified');

  return {
    finding:
      blocked.length === 0
        ? 'All medical review dates are valid and ordered against the packet when available.'
        : `Medical review dates invalid or before packet for reviewers: ${blocked
            .map((entry) => String(entry.index))
            .join(', ')}.`,
    status: blocked.length === 0 ? 'verified' : 'blocked',
  };
}

function medicalDomainCoverage(domains) {
  const domainText = domains
    .map((domain) => String(domain.domain ?? domain.name ?? '').toLowerCase())
    .join(' | ');
  const missing = [
    ['ventilator mode behavior and parameter ranges', /\b(ventilator mode|mode behavior|parameter range)/],
    ['scenario physiology', /\b(scenario physiology|ards|pneumonia|pneumothorax|airway obstruction)/],
    ['alarm severity and terminology', /\b(alarm severity|alarm.*terminology|terminology)/],
    [
      'drug/intervention timing and contraindications',
      /\b(drug|intervention timing|contraindication|indication)/,
    ],
    ['educational debriefing accuracy', /\b(education|educational|debriefing|learner safety)/],
  ]
    .filter(([, pattern]) => !pattern.test(domainText))
    .map(([label]) => label);

  return {
    finding:
      missing.length === 0
        ? 'All required medical review domains are represented.'
        : `Missing medical review domains: ${missing.join(', ')}.`,
    status: missing.length === 0 ? 'verified' : 'blocked',
  };
}

function userTestingCohortCoverage(participants) {
  const cohorts = new Set(participants.map((participant) => String(participant.cohort ?? '').toLowerCase()));
  const missing = [
    'Medical students',
    'Respiratory therapy learners',
    'ICU/ER nursing learners',
    'Clinical instructors',
  ].filter((cohort) => !cohorts.has(cohort.toLowerCase()));

  return {
    finding:
      missing.length === 0
        ? 'All required user-testing cohorts are represented.'
        : `Missing user-testing cohorts: ${missing.join(', ')}.`,
    status: missing.length === 0 ? 'verified' : 'blocked',
  };
}

function userTestingTaskCoverage(taskCompletionRates) {
  const missing = [
    'scenarioIdentification',
    'modeChange',
    'alarmRecognition',
    'debriefRead',
    'assistiveNavigation',
  ].filter((task) => !(task in taskCompletionRates));

  return {
    finding:
      missing.length === 0
        ? 'All required user-testing task completion rates are represented.'
        : `Missing user-testing task completion rates: ${missing.join(', ')}.`,
    status: missing.length === 0 ? 'verified' : 'blocked',
  };
}

function hasRealValue(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 && !/^(required|yyyy-mm-dd|todo|tbd|n\/a)/i.test(text);
}

function externalReviewPacketFinding(path, missingFinding, readyFinding) {
  const packet = readOptionalJson(path);
  return packet?.result?.endsWith?.('ready') ? `${readyFinding} Artifact: ${path}.` : missingFinding;
}

function evidenceDateStatus(evidenceDate, notBeforeDate) {
  const evidenceTime = Date.parse(String(evidenceDate ?? ''));
  if (!Number.isFinite(evidenceTime)) {
    return {
      finding: `Evidence date ${String(evidenceDate ?? 'missing')} is not a valid ISO timestamp.`,
      status: 'blocked',
    };
  }

  if (!notBeforeDate) {
    return {
      finding: 'Evidence date is a valid timestamp; no packet timestamp was available for ordering.',
      status: 'verified',
    };
  }

  const notBeforeTime = Date.parse(String(notBeforeDate));
  if (!Number.isFinite(notBeforeTime)) {
    return {
      finding: `Packet date ${String(notBeforeDate)} is not a valid ISO timestamp.`,
      status: 'blocked',
    };
  }

  return {
    finding:
      evidenceTime >= notBeforeTime
        ? `Evidence date ${String(evidenceDate)} is on or after packet date ${String(notBeforeDate)}.`
        : `Evidence date ${String(evidenceDate)} is before packet date ${String(notBeforeDate)}.`,
    status: evidenceTime >= notBeforeTime ? 'verified' : 'blocked',
  };
}

function zeroErrorsAndAccessibilityStatus() {
  const strictAccessibility = readOptionalJson(strictAccessibilityEvidencePath);
  if (!strictAccessibility) {
    return {
      finding:
        'No strict accessibility scan artifact was found; this audit still needs fresh console and axe evidence.',
      status: 'blocked',
    };
  }

  const incomplete = Array.isArray(strictAccessibility.incomplete) ? strictAccessibility.incomplete : [];
  const seriousIncomplete = incomplete.filter(
    (entry) => entry.impact === 'critical' || entry.impact === 'serious',
  );
  const strictFinding = `Strict accessibility scan result=${strictAccessibility.result}; violations=${String(
    strictAccessibility.violationCount,
  )}; consoleErrors=${String(strictAccessibility.consoleErrorCount)}; incomplete=${String(incomplete.length)}.`;
  const lighthouse = readOptionalJson('artifacts/lighthouse-summary.json');
  const lighthouseAccessibility = lighthouse?.summary?.scores?.accessibility;
  const localGateEvidence = [
    durableEvidenceForCommand('npm run type-check'),
    durableEvidenceForCommand('npm run lint'),
    durableEvidenceForCommand('npm run lint:css'),
    durableEvidenceForCommand('npm run build'),
    durableEvidenceForCommand('npm run check:contrast'),
    durableLongMemoryEvidenceForCommand('npm run check:memory:1hour'),
  ];
  const localGatesVerified = localGateEvidence.every((entry) => entry?.status === 'verified');
  const localGateFinding = `local gates verified=${String(localGatesVerified)}; lighthouse accessibility=${String(
    lighthouseAccessibility ?? 'missing',
  )}; one-hour memory=${durableLongMemoryEvidenceForCommand('npm run check:memory:1hour')?.status ?? 'missing'}.`;

  if (
    strictAccessibility.result === 'passed' &&
    strictAccessibility.violationCount === 0 &&
    strictAccessibility.consoleErrorCount === 0 &&
    incomplete.length === 0 &&
    seriousIncomplete.length === 0 &&
    lighthouseAccessibility === 1 &&
    localGatesVerified
  ) {
    return {
      finding: `${strictFinding} ${localGateFinding}`,
      status: 'verified',
    };
  }

  return {
    finding: `${strictFinding} Serious or critical incomplete axe checks remain: ${
      seriousIncomplete.map((entry) => `${entry.id}(${String(entry.nodes?.length ?? 0)})`).join(', ') ||
      'none'
    }. ${localGateFinding}`,
    status: 'weak',
  };
}

async function formatJson(path, value) {
  const options = (await resolveConfig(path)) ?? {};
  return format(JSON.stringify(value), { ...options, parser: 'json' });
}
