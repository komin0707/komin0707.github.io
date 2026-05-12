import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';
import { manualEvidenceFailureDetail, validateManualEvidence } from './completion-audit-validators.mjs';

const requirementsPath = 'COMPLETE_FIX_REQUIREMENTS.md';
const artifactDirectory = 'artifacts';
const artifactPath = join(artifactDirectory, 'completion-audit.json');
const visualReviewPath = 'artifacts/manual-evidence/visual-screenshot-review.json';
const maxDistBytes = 100_000;
const snykTimeoutMs = Number(process.env.SNYK_TIMEOUT_MS ?? 60_000);
const npmAuditTimeoutMs = Number(process.env.NPM_AUDIT_TIMEOUT_MS ?? 60_000);
const manualEvidenceRequirements = [
  manualEvidenceRequirement(
    845,
    'react-devtools-profiler',
    'artifacts/manual-evidence/react-devtools-profiler.json',
  ),
  manualEvidenceRequirement(873, 'webpagetest', 'artifacts/manual-evidence/webpagetest.json'),
  manualEvidenceRequirement(874, 'chrome-ux-report', 'artifacts/manual-evidence/chrome-ux-report.json'),
  manualEvidenceRequirement(976, 'nvda', 'artifacts/manual-evidence/nvda.json'),
  manualEvidenceRequirement(977, 'jaws', 'artifacts/manual-evidence/jaws.json'),
  manualEvidenceRequirement(978, 'voiceover-mac', 'artifacts/manual-evidence/voiceover-mac.json'),
  manualEvidenceRequirement(979, 'voiceover-ios', 'artifacts/manual-evidence/voiceover-ios.json'),
  manualEvidenceRequirement(980, 'talkback-android', 'artifacts/manual-evidence/talkback-android.json'),
  manualEvidenceRequirement(1105, 'domain-connection', 'artifacts/manual-evidence/domain-connection.json'),
];

const requirements = readFileSync(requirementsPath, 'utf8');
const requirementLines = requirements
  .split('\n')
  .map((line, index) => ({ line: index + 1, rawText: line, text: line.trim() }));
const checkboxRows = requirementLines.filter((entry) => /\[[ xX]\]/.test(entry.rawText));
const malformedChecklistRows = checkboxRows
  .filter((entry) => !/^\d+\.\s+\[[ xX]\]/.test(entry.text))
  .map((entry) => ({ line: entry.line, text: entry.text }));
const checklistItems = requirementLines
  .filter((entry) => /^\d+\.\s+\[[ x]\]/.test(entry.rawText))
  .map((entry) => ({ ...entry, number: Number(entry.text.match(/^(\d+)\./)?.[1] ?? 0) }));
const uncheckedItems = checklistItems.filter((entry) => /^\d+\.\s+\[\s\]/.test(entry.text));
const checkedItems = checklistItems.filter((entry) => /^\d+\.\s+\[x\]/.test(entry.text));
const expectedHighestItemNumber = Math.max(...checklistItems.map((item) => item.number));
const observedItemNumbers = new Set(checklistItems.map((item) => item.number));
const missingItemNumbers = Array.from({ length: expectedHighestItemNumber }, (_, index) => index + 1).filter(
  (number) => !observedItemNumbers.has(number),
);
const duplicateItemNumbers = duplicateNumbers(checklistItems.map((item) => item.number));
const sectionSummary = buildSectionSummary(requirementLines);
const claimedChecklistRows = readClaimedChecklistRows(requirements, expectedHighestItemNumber);
const phaseClaimedChecklistRowsTotal = readPhaseClaimedChecklistRowsTotal(sectionSummary);
const objectiveRowClaim = buildObjectiveRowClaim();
const objectivePhaseClaim = buildObjectivePhaseClaim();

const distExists = existsSync('dist');
const distFiles = distExists ? listFiles('dist') : [];
const distBytes = distFiles.reduce((total, file) => total + statSync(file).size, 0);
const distRasterAssets = distFiles.filter((file) => /\.(?:avif|gif|jpe?g|png|webp)$/i.test(file));
const compressedAssets = distFiles.filter((file) => /\.(?:br|gz)$/i.test(file));
const primaryDistFiles = distFiles.filter((file) => !/\.(?:br|gz)$/i.test(file));
const primaryDistBytes = primaryDistFiles.reduce((total, file) => total + statSync(file).size, 0);
const primaryJsCssFiles = primaryDistFiles.filter((file) => /^dist\/assets\/.+\.(?:css|js)$/i.test(file));
const primaryJsCssBytes = primaryJsCssFiles.reduce((total, file) => total + statSync(file).size, 0);
const brotliJsCssTransferBytes = primaryJsCssFiles.reduce(
  (total, file) => total + brotliTransferBytes(file),
  0,
);
const hasBuildOutput = distExists && distFiles.length > 0 && primaryJsCssFiles.length > 0;
const forbiddenPatterns = runCommand('node', ['scripts/assert-forbidden-patterns.mjs']);
const testRealism = runCommand('node', ['scripts/assert-test-realism.mjs']);
const git = runCommand('git', ['rev-parse', '--is-inside-work-tree']);
const npmAudit = runCommand('npm', ['audit', '--audit-level=moderate'], { timeout: npmAuditTimeoutMs });
const licensePolicy = runCommand('npm', ['run', 'check:licenses']);
const sbomCommand = runCommand('npm', ['run', 'check:sbom']);
const snyk = runCommand('npx', ['--yes', 'snyk', 'test'], { timeout: snykTimeoutMs });
const sbom = readSbomEvidence();
const screenshotEvidence = ['artifacts/patient-avatar-current.png', 'artifacts/simulator-current.png'].map(
  readPngEvidence,
);
const visualReviewEvidence = readVisualReviewEvidence(screenshotEvidence);
const manualEvidence = manualEvidenceRequirements.map(readManualEvidence);

const audit = {
  blockers: buildBlockers(),
  checkedAt: new Date().toISOString(),
  checklist: {
    checked: checkedItems.length,
    duplicateItemNumbers,
    expectedHighestItemNumber,
    malformedChecklistRows,
    missingItemNumbers,
    observedTotal: checklistItems.length,
    sections: sectionSummary,
    unchecked: uncheckedItems.length,
  },
  commands: {
    forbiddenPatterns,
    git,
    licensePolicy,
    npmAudit,
    sbom: sbomCommand,
    snyk,
    testRealism,
  },
  dist: {
    compressedAssetCount: compressedAssets.length,
    exists: distExists,
    fileCount: distFiles.length,
    hasBuildOutput,
    maxBytes: maxDistBytes,
    primaryBytesNoCompressedSidecars: primaryDistBytes,
    primaryJsCssBytes,
    primaryJsCssFiles,
    rasterAssets: distRasterAssets,
    transferBrotliJsCssBytes: brotliJsCssTransferBytes,
    totalBytes: distBytes,
    withinBrotliTransferBudget: brotliJsCssTransferBytes < maxDistBytes,
    withinPrimaryBudget: brotliJsCssTransferBytes < maxDistBytes,
    withinRawBudget: primaryJsCssBytes < maxDistBytes,
  },
  manualEvidence,
  objectivePhaseClaim,
  objectiveRowClaim,
  screenshots: screenshotEvidence,
  sbom,
  visualReview: visualReviewEvidence,
  status:
    uncheckedItems.length === 0 &&
    missingItemNumbers.length === 0 &&
    duplicateItemNumbers.length === 0 &&
    malformedChecklistRows.length === 0 &&
    objectiveRowClaim.satisfied &&
    objectivePhaseClaim.satisfied &&
    hasBuildOutput &&
    brotliJsCssTransferBytes < maxDistBytes &&
    distRasterAssets.length === 0 &&
    forbiddenPatterns.exitCode === 0 &&
    testRealism.exitCode === 0 &&
    git.exitCode === 0 &&
    npmAudit.exitCode === 0 &&
    licensePolicy.exitCode === 0 &&
    sbomCommand.exitCode === 0 &&
    snyk.exitCode === 0 &&
    sbom.valid &&
    manualEvidence.every((evidence) => evidence.valid) &&
    visualReviewEvidence.valid &&
    screenshotEvidence.every(
      (screenshot) => screenshot.exists && screenshot.width > 0 && screenshot.height > 0,
    )
      ? 'complete'
      : 'incomplete',
  uncheckedItems: uncheckedItems.map((item) => ({
    ...item,
    evidence: evidenceForUncheckedItem(item.number),
  })),
};

mkdirSync(artifactDirectory, { recursive: true });
writeFileSync(artifactPath, await formatJson(artifactPath, audit));
process.stdout.write(
  `${JSON.stringify({ artifactPath, blockerCount: audit.blockers.length, status: audit.status }, null, 2)}\n`,
);

if (audit.status !== 'complete') {
  process.exitCode = 1;
}

function buildBlockers() {
  const blockers = [];
  if (missingItemNumbers.length > 0) {
    blockers.push({
      detail: `Checklist numbering skips ${missingItemNumbers.join(', ')}`,
      id: 'checklist-numbering-gap',
    });
  }
  if (duplicateItemNumbers.length > 0) {
    blockers.push({
      detail: `Checklist numbering duplicates ${duplicateItemNumbers.join(', ')}`,
      id: 'checklist-numbering-duplicate',
    });
  }
  if (malformedChecklistRows.length > 0) {
    blockers.push({
      detail: `Malformed checklist rows at lines ${malformedChecklistRows.map((row) => row.line).join(', ')}`,
      id: 'checklist-malformed-row',
    });
  }
  if (objectiveRowClaim.enabled && !objectiveRowClaim.satisfied) {
    blockers.push({
      detail: `Objective checklist row claim mismatch: claimed ${String(
        objectiveRowClaim.claimedChecklistRows,
      )}, actual ${String(objectiveRowClaim.actualChecklistRowsObserved)}, delta ${String(
        objectiveRowClaim.checklistRowDeltaFromClaim,
      )}`,
      id: 'objective-row-claim',
    });
  }
  if (objectivePhaseClaim.enabled && !objectivePhaseClaim.satisfied) {
    blockers.push({
      detail: `Objective phase checklist claim mismatch: phase claims ${String(
        objectivePhaseClaim.phaseClaimedChecklistRowsTotal,
      )}, actual ${String(objectivePhaseClaim.actualChecklistRowsObserved)}, actual-phase delta ${String(
        objectivePhaseClaim.checklistRowDeltaFromPhaseClaims,
      )}, phase-total delta ${String(objectivePhaseClaim.phaseClaimsDeltaFromClaimedTotal)}`,
      id: 'objective-phase-claim',
    });
  }
  if (uncheckedItems.length > 0) {
    blockers.push(...uncheckedItems.map((item) => blockerForUncheckedItem(item.number, item.text)));
  }
  const uncheckedNumbers = new Set(uncheckedItems.map((item) => item.number));
  if (!hasBuildOutput) {
    blockers.push({
      detail: distBuildOutputFailure(),
      id: 'dist-build-output',
    });
  }
  if (brotliJsCssTransferBytes >= maxDistBytes && !uncheckedNumbers.has(826)) {
    blockers.push({
      detail: formatDistBudgetFailure(),
      id: 'dist-raw-size',
    });
  }
  if (distRasterAssets.length > 0) {
    blockers.push({
      detail: `${distRasterAssets.length} raster assets found in dist`,
      id: 'dist-raster-assets',
    });
  }
  if (forbiddenPatterns.exitCode !== 0) {
    blockers.push({
      detail: firstLine(forbiddenPatterns.stderr || forbiddenPatterns.stdout),
      id: 'forbidden-patterns',
    });
  }
  if (testRealism.exitCode !== 0) {
    blockers.push({
      detail: firstLine(testRealism.stderr || testRealism.stdout),
      id: 'test-realism',
    });
  }
  const missingScreenshots = screenshotEvidence.filter((screenshot) => !screenshot.exists);
  if (missingScreenshots.length > 0) {
    blockers.push({
      detail: `Missing screenshot artifacts: ${missingScreenshots.map((screenshot) => screenshot.path).join(', ')}`,
      id: 'visual-screenshot-evidence',
    });
  }
  if (!visualReviewEvidence.valid) {
    blockers.push({
      detail: visualReviewEvidence.detail,
      id: 'visual-screenshot-review',
    });
  }
  const missingManualEvidence = manualEvidence.filter(
    (evidence) => !evidence.valid && !uncheckedNumbers.has(evidence.itemNumber),
  );
  if (missingManualEvidence.length > 0) {
    blockers.push(
      ...missingManualEvidence.map((evidence) => ({
        detail: `${evidence.itemNumber}. ${manualEvidenceFailureDetail(evidence)}`,
        id: evidence.id,
      })),
    );
  }
  if (git.exitCode !== 0 && !uncheckedNumbers.has(824)) {
    blockers.push({ detail: firstLine(git.stderr), id: 'git-worktree' });
  }
  if (npmAudit.exitCode !== 0 && !uncheckedNumbers.has(1013)) {
    blockers.push({ detail: firstLine(npmAudit.stderr || npmAudit.stdout), id: 'npm-audit' });
  }
  if (licensePolicy.exitCode !== 0) {
    blockers.push({ detail: firstLine(licensePolicy.stderr || licensePolicy.stdout), id: 'license-policy' });
  }
  if (sbomCommand.exitCode !== 0) {
    blockers.push({ detail: firstLine(sbomCommand.stderr || sbomCommand.stdout), id: 'sbom-command' });
  }
  if (!sbom.valid) {
    blockers.push({ detail: sbom.detail, id: 'sbom' });
  }
  if (snyk.exitCode !== 0 && !uncheckedNumbers.has(1023)) {
    blockers.push({ detail: firstLine(snyk.stderr || snyk.stdout), id: 'snyk' });
  }
  return blockers;
}

function buildObjectiveRowClaim() {
  if (!Number.isFinite(claimedChecklistRows) || claimedChecklistRows <= 0) {
    return {
      actualChecklistRowsObserved: checklistItems.length,
      claimedChecklistRows: null,
      checklistRowDeltaFromClaim: null,
      enabled: false,
      satisfied: true,
      status: 'not_applicable',
    };
  }

  return {
    actualChecklistRowsObserved: checklistItems.length,
    claimedChecklistRows,
    checklistRowDeltaFromClaim: checklistItems.length - claimedChecklistRows,
    enabled: true,
    satisfied: checklistItems.length === claimedChecklistRows,
    status: checklistItems.length === claimedChecklistRows ? 'matched' : 'mismatch',
  };
}

function buildObjectivePhaseClaim() {
  if (!objectiveRowClaim.enabled) {
    return {
      actualChecklistRowsObserved: checklistItems.length,
      checklistRowDeltaFromPhaseClaims: null,
      enabled: false,
      phaseClaimedChecklistRowsTotal: null,
      phaseClaimsDeltaFromClaimedTotal: null,
      satisfied: true,
      status: 'not_applicable',
    };
  }

  const checklistRowDeltaFromPhaseClaims = checklistItems.length - phaseClaimedChecklistRowsTotal;
  const phaseClaimsDeltaFromClaimedTotal = phaseClaimedChecklistRowsTotal - claimedChecklistRows;

  return {
    actualChecklistRowsObserved: checklistItems.length,
    checklistRowDeltaFromPhaseClaims,
    enabled: true,
    phaseClaimedChecklistRowsTotal,
    phaseClaimsDeltaFromClaimedTotal,
    satisfied: checklistRowDeltaFromPhaseClaims === 0 && phaseClaimsDeltaFromClaimedTotal === 0,
    status:
      checklistRowDeltaFromPhaseClaims === 0 && phaseClaimsDeltaFromClaimedTotal === 0
        ? 'matched'
        : 'mismatch',
  };
}

function readClaimedChecklistRows(source, fallback) {
  if (Object.hasOwn(process.env, 'COMPLETION_CLAIMED_CHECKLIST_ROWS')) {
    const environmentClaim = Number(process.env.COMPLETION_CLAIMED_CHECKLIST_ROWS);
    return Number.isFinite(environmentClaim) ? environmentClaim : fallback;
  }

  const finalDefinitionClaim = source.match(/완료\s*=\s*([\d,]+)\s*항목\s*중\s*([\d,]+)\s*모두/);
  if (finalDefinitionClaim && finalDefinitionClaim[1] === finalDefinitionClaim[2]) {
    return Number(finalDefinitionClaim[1].replaceAll(',', ''));
  }

  const documentTotalClaim = source.match(/이 문서의\s*([\d,]+)개\s*항목을\s*\*\*모두\*\*/);
  if (documentTotalClaim) return Number(documentTotalClaim[1].replaceAll(',', ''));

  return fallback;
}

function readPhaseClaimedChecklistRowsTotal(sections) {
  const observedSectionTotal = sections.reduce((total, section) => total + section.total, 0);
  return observedSectionTotal > 0 ? observedSectionTotal : 250 + 200 + 200 + 200 + 100 + 100 + 150;
}

function distBuildOutputFailure() {
  if (!distExists) return 'Missing dist build output. Run npm run build before auditing completion.';
  if (distFiles.length === 0)
    return 'dist build output is empty. Run npm run build before auditing completion.';
  return 'dist build output has no primary JS/CSS assets under dist/assets. Run npm run build before auditing completion.';
}

function readSbomEvidence() {
  const path = 'artifacts/sbom.json';
  if (!existsSync(path)) {
    return {
      componentCount: 0,
      detail: `Missing SBOM artifact: ${path}`,
      exists: false,
      path,
      valid: false,
    };
  }

  const parsed = parseJsonFile(path);
  if (!parsed.ok) {
    return {
      componentCount: 0,
      detail: parsed.error,
      exists: true,
      parseError: parsed.error,
      path,
      valid: false,
    };
  }

  const value = parsed.value;
  const componentCount = Array.isArray(value.components) ? value.components.length : 0;
  const applicationName = value.metadata?.component?.name;
  const failures = [
    ...(value.bomFormat === 'CycloneDX' ? [] : ['bomFormat must be CycloneDX']),
    ...(typeof value.specVersion === 'string' && value.specVersion.length > 0 ? [] : ['missing specVersion']),
    ...(typeof applicationName === 'string' && applicationName.length > 0
      ? []
      : ['missing metadata.component.name']),
    ...(componentCount > 0 ? [] : ['components must not be empty']),
  ];

  return {
    applicationName: applicationName ?? null,
    componentCount,
    detail:
      failures.length === 0
        ? `CycloneDX SBOM includes ${String(componentCount)} component(s) for ${applicationName}.`
        : failures.join('; '),
    exists: true,
    path,
    specVersion: value.specVersion ?? null,
    valid: failures.length === 0,
  };
}

function readPngEvidence(path) {
  if (!existsSync(path)) {
    return { exists: false, height: 0, path, sha256: '', sizeBytes: 0, width: 0 };
  }
  const content = readFileSync(path);
  return {
    exists: true,
    height: content.readUInt32BE(20),
    path,
    sha256: createHash('sha256').update(content).digest('hex'),
    sizeBytes: content.byteLength,
    width: content.readUInt32BE(16),
  };
}

function readVisualReviewEvidence(screenshots) {
  if (!existsSync(visualReviewPath)) {
    return {
      detail: `Missing visual screenshot review artifact: ${visualReviewPath}`,
      exists: false,
      path: visualReviewPath,
      valid: false,
    };
  }

  const parsed = parseJsonFile(visualReviewPath);
  if (!parsed.ok) {
    return {
      detail: parsed.error,
      exists: true,
      parseError: parsed.error,
      path: visualReviewPath,
      valid: false,
    };
  }

  const value = parsed.value;
  const screenshotReviews = Array.isArray(value.screenshots) ? value.screenshots : [];
  const screenshotFailures = screenshots.flatMap((screenshot) => {
    const review = screenshotReviews.find((candidate) => candidate?.path === screenshot.path);
    if (!review) return [`missing review for ${screenshot.path}`];
    const failures = [];
    if (review.sha256 !== screenshot.sha256) failures.push(`stale hash for ${screenshot.path}`);
    if (review.width !== screenshot.width) failures.push(`stale width for ${screenshot.path}`);
    if (review.height !== screenshot.height) failures.push(`stale height for ${screenshot.path}`);
    if (!Array.isArray(review.observed) || review.observed.length === 0) {
      failures.push(`missing observed features for ${screenshot.path}`);
    }
    return failures;
  });
  const missingFields = ['verifiedAt', 'verifier', 'result', 'evidence'].filter(
    (field) => !hasNonEmptyField(value, field),
  );
  const hasObservedClinicalFeatures =
    Array.isArray(value.observedClinicalFeatures) && value.observedClinicalFeatures.length > 0;
  const failures = [
    ...missingFields.map((field) => `missing ${field}`),
    ...(value.result === 'passed' ? [] : ['result must be passed']),
    ...(hasObservedClinicalFeatures ? [] : ['missing observedClinicalFeatures']),
    ...screenshotFailures,
  ];

  return {
    detail:
      failures.length === 0
        ? 'Visual screenshot review matches the current screenshot hashes and dimensions.'
        : failures.join('; '),
    exists: true,
    path: visualReviewPath,
    reviewedScreenshotCount: screenshotReviews.length,
    valid: failures.length === 0,
    verifiedAt: value.verifiedAt ?? null,
  };
}

function duplicateNumbers(numbers) {
  const seen = new Set();
  const duplicates = new Set();
  for (const number of numbers) {
    if (seen.has(number)) {
      duplicates.add(number);
    } else {
      seen.add(number);
    }
  }
  return [...duplicates].sort((left, right) => left - right);
}

function buildSectionSummary(lines) {
  const sections = [];
  let currentSection = null;

  for (const entry of lines) {
    const heading = entry.text.match(/^##\s+(.+)/);
    if (heading) {
      currentSection = {
        checked: 0,
        firstItem: null,
        lastItem: null,
        title: heading[1],
        total: 0,
        unchecked: 0,
      };
      sections.push(currentSection);
      continue;
    }

    const item = entry.text.match(/^(\d+)\.\s+\[([ x])\]/);
    if (!item || !currentSection) continue;

    const itemNumber = Number(item[1]);
    currentSection.total += 1;
    currentSection.firstItem ??= itemNumber;
    currentSection.lastItem = itemNumber;
    if (item[2] === 'x') {
      currentSection.checked += 1;
    } else {
      currentSection.unchecked += 1;
    }
  }

  return sections.filter((section) => section.total > 0);
}

function blockerForUncheckedItem(number, text) {
  const evidence = evidenceForUncheckedItem(number);
  return {
    detail: `${number}. ${evidence.detail}`,
    id: evidence.id,
    source: text,
  };
}

function evidenceForUncheckedItem(number) {
  if (number === 824) {
    return {
      detail:
        git.exitCode === 0
          ? 'Git worktree exists; image cache removal still unchecked.'
          : firstLine(git.stderr),
      id: 'git-image-cache-removal',
      kind: 'local-git',
      status: git.exitCode === 0 ? 'unverified' : 'blocked',
    };
  }
  if (number === 826) {
    return {
      detail: formatDistBudgetFailure(),
      id: 'dist-raw-size',
      kind: 'local-build',
      status: primaryDistBytes < maxDistBytes && primaryJsCssBytes < maxDistBytes ? 'unverified' : 'failed',
    };
  }
  if (number === 845)
    return manualEvidenceForItem(number, 'Requires a recorded React DevTools Profiler session.');
  if (number === 873)
    return manualEvidenceForItem(number, 'Requires a WebPageTest run artifact for a deployed URL.');
  if (number === 874)
    return manualEvidenceForItem(
      number,
      'Requires Chrome UX Report field data for a connected production domain.',
    );
  if ([976, 977, 978, 979, 980].includes(number)) {
    return manualEvidenceForItem(number, 'Requires real screen reader/device verification evidence.');
  }
  if (number === 1023) {
    return {
      detail:
        snyk.exitCode === 0
          ? 'Snyk scan passed but checklist remains unchecked.'
          : firstLine(snyk.stderr || snyk.stdout),
      id: 'snyk',
      kind: 'external-authenticated-scan',
      status: snyk.exitCode === 0 ? 'unverified' : 'blocked',
    };
  }
  if (number === 1105) return manualEvidenceForItem(number, 'Requires deployed domain connection evidence.');
  return manualEvidence(
    `unchecked-${number}`,
    'No automated evidence mapping exists for this unchecked item.',
  );
}

function manualEvidenceForItem(number, detail) {
  const evidence = manualEvidence.find((entry) => entry.itemNumber === number);
  if (!evidence) return manualEvidenceSummary(`unchecked-${number}`, detail, 'unverified');
  return manualEvidenceSummary(
    evidence.id,
    evidence.valid ? `Manual evidence exists at ${evidence.path}.` : `${detail} Expected ${evidence.path}.`,
    evidence.valid ? 'verified' : 'unverified',
  );
}

function formatDistBudgetFailure() {
  return [
    `primary dist is ${primaryDistBytes} bytes`,
    `primary dist/assets JS+CSS is ${primaryJsCssBytes} bytes`,
    `Brotli JS+CSS transfer is ${brotliJsCssTransferBytes} bytes`,
    `all dist files including compressed sidecars are ${distBytes} bytes`,
    `required Brotli JS+CSS transfer < ${maxDistBytes} bytes`,
  ].join('; ');
}

function brotliTransferBytes(file) {
  const sidecarPath = `${file}.br`;
  return existsSync(sidecarPath) ? statSync(sidecarPath).size : statSync(file).size;
}

function manualEvidenceSummary(id, detail, status) {
  return {
    detail,
    id,
    kind: 'manual-external',
    status,
  };
}

function manualEvidenceRequirement(itemNumber, id, path) {
  return {
    id,
    itemNumber,
    path,
    requiredFields: ['verifiedAt', 'verifier', 'result', 'evidence'],
  };
}

function readManualEvidence(requirement) {
  const supportingEvidence = supportingEvidenceForRequirement(requirement);
  if (!existsSync(requirement.path)) {
    return {
      ...requirement,
      exists: false,
      missingFields: requirement.requiredFields,
      supportingEvidence,
      valid: false,
    };
  }

  const parsed = parseJsonFile(requirement.path);
  if (!parsed.ok) {
    return {
      ...requirement,
      exists: true,
      missingFields: requirement.requiredFields,
      parseError: parsed.error,
      supportingEvidence,
      valid: false,
    };
  }

  const missingFields = requirement.requiredFields.filter((field) => !hasNonEmptyField(parsed.value, field));
  const semanticError = validateManualEvidence(requirement, parsed.value);
  return {
    ...requirement,
    exists: true,
    missingFields,
    semanticError,
    supportingEvidence,
    valid: missingFields.length === 0 && semanticError === null,
  };
}

function supportingEvidenceForRequirement(requirement) {
  if (requirement.id !== 'chrome-ux-report') return [];
  return [
    summarizeSupportingJson('artifacts/manual-evidence/chrome-ux-report-monitoring.json', (value) => ({
      apiKeySource: value.apiKeySource ?? null,
      fieldDataAvailable: value.fieldDataAvailable ?? null,
      result: value.result ?? null,
      verifiedAt: value.verifiedAt ?? null,
    })),
    summarizeSupportingJson('artifacts/manual-evidence/chrome-ux-report-credentials.json', (value) => ({
      monitorApiKeySource: value.monitorApiKeySource ?? null,
      result: value.result ?? null,
      usableByCurrentMonitor: value.usableByCurrentMonitor ?? null,
      verifiedAt: value.verifiedAt ?? null,
    })),
    summarizeSupportingJson('artifacts/manual-evidence/pagespeed-live-probe-current.json', (value) => ({
      errorCode: value.error?.code ?? null,
      hasLoadingExperience: value.hasLoadingExperience ?? null,
      hasOriginLoadingExperience: value.hasOriginLoadingExperience ?? null,
      result: value.result ?? null,
      verifiedAt: value.verifiedAt ?? null,
    })),
    summarizeSupportingJson('artifacts/manual-evidence/crux-live-probe-current.json', (value) => ({
      errorCode: value.error?.code ?? null,
      hasRecord: value.hasRecord ?? null,
      result: value.result ?? null,
      verifiedAt: value.verifiedAt ?? null,
    })),
  ];
}

function summarizeSupportingJson(path, summarize) {
  if (!existsSync(path)) return { exists: false, path };
  const parsed = parseJsonFile(path);
  if (!parsed.ok) return { exists: true, parseError: parsed.error, path };
  return {
    exists: true,
    path,
    ...summarize(parsed.value),
  };
}

function parseJsonFile(path) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error), ok: false };
  }
}

function hasNonEmptyField(value, field) {
  return (
    typeof value === 'object' && value !== null && field in value && String(value[field]).trim().length > 0
  );
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: false,
    timeout: options.timeout ?? 10_000,
  });
  return {
    exitCode: result.status ?? 1,
    signal: result.signal,
    stderr: truncate(result.stderr),
    stdout: truncate(result.stdout),
  };
}

function firstLine(value) {
  return (
    value
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) ?? 'No diagnostic output.'
  );
}

function truncate(value) {
  return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
}

async function formatJson(path, value) {
  return format(JSON.stringify(value), { ...((await resolveConfig(path)) ?? {}), parser: 'json' });
}
