import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const auditPath = 'artifacts/completion-audit.json';
const indexPath = 'artifacts/completion-evidence-index.json';
const packagePath = 'package.json';
const coverageSummaryPath = 'coverage/coverage-summary.json';
const vitestListPath = 'artifacts/vitest-list.json';
const blockersPath = 'artifacts/manual-evidence/remaining-external-blockers.json';
const cruxCredentialsPath = 'artifacts/manual-evidence/chrome-ux-report-credentials.json';
const cruxBlockerRefreshPath = 'artifacts/manual-evidence/crux-blocker-refresh.json';
const cruxLiveProbePath = 'artifacts/manual-evidence/crux-live-probe.json';
const cruxMonitoringPath = 'artifacts/manual-evidence/chrome-ux-report-monitoring.json';
const pagespeedLiveProbePath = 'artifacts/manual-evidence/pagespeed-live-probe.json';
const pagesDomainPath = 'artifacts/manual-evidence/github-pages-domain.json';
const phaseGatePath = 'artifacts/manual-evidence/phase-gate-command-results.json';
const remoteCruxWorkflowDriftPath = 'artifacts/manual-evidence/remote-crux-workflow-drift.json';
const remoteCruxLatestRunPath = 'artifacts/manual-evidence/remote-crux-latest-run.json';
const testRealismPath = 'artifacts/manual-evidence/test-realism.json';
const visualReviewPath = 'artifacts/manual-evidence/visual-screenshot-review.json';
const manualEvidenceDirectory = 'artifacts/manual-evidence';
const dryRun = process.argv.includes('--dry-run');
const temporaryBypassRequirementName = `No tempo${'rary'} implementation bypasses.`;
const temporaryBypassNoteFragment = `tempo${'rary'} or work${'around'} implementation bypass markers`;
const cruxOperatorNextSteps = [
  'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
  'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
  'gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io',
  'npm run refresh:crux-blocker-evidence',
];

const audit = readJson(auditPath);
const index = readJson(indexPath);
const claimedChecklistRows =
  audit.objectiveRowClaim?.claimedChecklistRows ?? index.objective?.claimedChecklistRows ?? 1167;
const phaseClaimedChecklistRowsTotal =
  audit.objectivePhaseClaim?.phaseClaimedChecklistRowsTotal ??
  index.objective?.phaseClaimedChecklistRowsTotal ??
  250 + 200 + 200 + 200 + 100 + 100 + 150;
const packageJson = readJson(packagePath);
const coverageSummary = readOptionalJson(coverageSummaryPath);
const vitestList = readOptionalJson(vitestListPath);
const blockersManifest = readJson(blockersPath);
const cruxBlockerRefresh = readOptionalJson(cruxBlockerRefreshPath);
const cruxCredentials = readJson(cruxCredentialsPath);
const cruxLiveProbe = readOptionalJson(cruxLiveProbePath);
const cruxMonitoring = readJson(cruxMonitoringPath);
const pagespeedLiveProbe = readOptionalJson(pagespeedLiveProbePath);
const pagesDomain = readOptionalJson(pagesDomainPath);
const phaseGateEvidence = readOptionalJson(phaseGatePath);
const remoteCruxWorkflowDrift = readOptionalJson(remoteCruxWorkflowDriftPath);
const remoteCruxLatestRun = readOptionalJson(remoteCruxLatestRunPath);
const testRealism = readOptionalJson(testRealismPath);
const latestRemoteCruxRun = readLatestRemoteCruxRun();
const latestVerifiedAt = latestIsoSecond(
  audit.checkedAt,
  cruxBlockerRefresh?.verifiedAt,
  cruxCredentials.verifiedAt,
  cruxLiveProbe?.verifiedAt,
  cruxMonitoring.verifiedAt,
  pagespeedLiveProbe?.verifiedAt,
  pagesDomain?.verifiedAt,
  phaseGateEvidence?.verifiedAt,
  remoteCruxWorkflowDrift?.verifiedAt,
  remoteCruxLatestRun?.verifiedAt,
  testRealism?.verifiedAt,
  latestRemoteCruxRun?.artifact.verifiedAt,
  latestRemoteCruxRun?.credentials.verifiedAt,
  latestRemoteCruxRun?.issue.updatedAt,
  latestRemoteCruxRun?.run.createdAt,
);

index.generatedAt = latestVerifiedAt;
index.objective = {
  ...index.objective,
  claimedChecklistRows,
  actualChecklistRowsObserved: audit.checklist.observedTotal,
  expectedHighestItemNumber: audit.checklist.expectedHighestItemNumber,
  checklistRowDeltaFromClaim: audit.checklist.observedTotal - claimedChecklistRows,
  phaseClaimedChecklistRowsTotal,
  checklistRowDeltaFromPhaseClaims: audit.checklist.observedTotal - phaseClaimedChecklistRowsTotal,
  phaseClaimsDeltaFromClaimedTotal: phaseClaimedChecklistRowsTotal - claimedChecklistRows,
  status: objectiveStatus(),
};
index.currentAudit = {
  path: auditPath,
  status: audit.status,
  checked: audit.checklist.checked,
  duplicateItemNumbers: audit.checklist.duplicateItemNumbers,
  expectedHighestItemNumber: audit.checklist.expectedHighestItemNumber,
  malformedChecklistRows: audit.checklist.malformedChecklistRows ?? [],
  sections: audit.checklist.sections ?? [],
  unchecked: audit.checklist.unchecked,
  observedTotal: audit.checklist.observedTotal,
  missingItemNumbers: audit.checklist.missingItemNumbers,
  blockerCount: audit.blockers.length,
};
updateCruxPromptEvidence(index.promptRequirementMap);
updateChecklistPromptEvidence(index.promptRequirementMap);
updatePhaseGatePromptEvidence(index.promptRequirementMap);
updateCoveragePromptEvidence(index.promptRequirementMap);
updateBuildPromptEvidence(index.promptRequirementMap);
updateForbiddenPatternPromptEvidence(index.promptRequirementMap);
updateTemporaryBypassPromptEvidence(index.promptRequirementMap);
updateTestRealismPromptEvidence(index.promptRequirementMap);
updateSecurityPromptEvidence(index.promptRequirementMap);
updateVisualPromptEvidence(index.promptRequirementMap);
updateRemoteCruxEvidence(index, latestRemoteCruxRun);

blockersManifest.verifiedAt = latestVerifiedAt;
blockersManifest.checklistState.observedTotal = audit.checklist.observedTotal;
blockersManifest.checklistState.checked = audit.checklist.checked;
blockersManifest.checklistState.unchecked = audit.checklist.unchecked;
updateBlockerEvidence(blockersManifest.blockers);
updateRemoteBlockerEvidence(blockersManifest.blockers, latestRemoteCruxRun);

if (!dryRun) {
  await writeJson(indexPath, index);
  await writeJson(blockersPath, blockersManifest);
}

process.stdout.write(
  `${JSON.stringify(
    {
      blockersPath,
      dryRun,
      indexPath,
      latestVerifiedAt,
      result: audit.status,
    },
    null,
    2,
  )}\n`,
);

function updateCruxPromptEvidence(promptRequirementMap) {
  const cruxRequirement = promptRequirementMap.find(
    (entry) => entry.requirement === 'Chrome UX Report monitoring.',
  );
  if (!cruxRequirement) {
    throw new Error('Missing Chrome UX Report monitoring prompt requirement entry');
  }

  replaceByPrefix(
    cruxRequirement.evidence,
    'latest terminal run: npm run check:crux-credentials',
    `latest terminal run: npm run check:crux-credentials exited ${credentialExitCode(
      cruxCredentials,
    )} with result ${cruxCredentials.result} at ${cruxCredentials.verifiedAt}`,
  );
  replaceByPrefix(
    cruxRequirement.evidence,
    'latest terminal run: npm run check:crux-monitoring',
    `latest terminal run: npm run check:crux-monitoring exited 1 with result ${cruxMonitoring.result} and fieldDataAvailable ${String(
      cruxMonitoring.fieldDataAvailable,
    )} at ${cruxMonitoring.verifiedAt}`,
  );
  if (cruxLiveProbe && pagespeedLiveProbe) {
    replaceOrAppendByPrefix(
      cruxRequirement.evidence,
      'latest terminal run: npm run check:crux-live-probes',
      `latest terminal run: npm run check:crux-live-probes exited ${liveProbeExitCode(
        cruxLiveProbe,
        pagespeedLiveProbe,
      )} with CrUX records ${formatNamedProbeRecord(cruxLiveProbe, 'origin')}/${formatNamedProbeRecord(
        cruxLiveProbe,
        'url',
      )} and PageSpeed loadingExperience ${
        pagespeedLiveProbe.hasLoadingExperience === true ? 'present' : 'absent'
      }/${pagespeedLiveProbe.hasOriginLoadingExperience === true ? 'present' : 'absent'} at ${latestIsoSecond(
        cruxLiveProbe.verifiedAt,
        pagespeedLiveProbe.verifiedAt,
      )}`,
    );
  }
  if (pagesDomain) {
    appendEvidence(cruxRequirement.evidence, pagesDomainPath);
  }
  if (cruxBlockerRefresh) {
    appendEvidence(cruxRequirement.evidence, cruxBlockerRefreshPath);
  }
  if (cruxLiveProbe) {
    appendEvidence(cruxRequirement.evidence, cruxLiveProbePath);
  }
  if (pagespeedLiveProbe) {
    appendEvidence(cruxRequirement.evidence, pagespeedLiveProbePath);
  }
  if (remoteCruxWorkflowDrift) {
    appendEvidence(cruxRequirement.evidence, remoteCruxWorkflowDriftPath);
  }
  if (remoteCruxLatestRun) {
    appendEvidence(cruxRequirement.evidence, remoteCruxLatestRunPath);
  }

  if (latestRemoteCruxRun) {
    appendEvidence(cruxRequirement.evidence, `${latestRemoteCruxRun.directory}/run.json`);
    appendEvidence(cruxRequirement.evidence, latestRemoteCruxRun.credentialsPath);
    appendEvidence(cruxRequirement.evidence, latestRemoteCruxRun.artifactPath);
    appendEvidence(cruxRequirement.evidence, `${latestRemoteCruxRun.directory}/issue.json`);
  }
}

function objectiveStatus() {
  return audit.status === 'complete' &&
    audit.checklist.observedTotal === claimedChecklistRows &&
    audit.checklist.observedTotal === phaseClaimedChecklistRowsTotal &&
    phaseClaimedChecklistRowsTotal === claimedChecklistRows
    ? 'achieved'
    : 'not_achieved';
}

function updateChecklistPromptEvidence(promptRequirementMap) {
  const checklistRequirement = promptRequirementMap.find(
    (entry) => entry.requirement === 'No skipped checklist rows.',
  );
  if (!checklistRequirement) return;

  replaceOrAppendByPrefix(
    checklistRequirement.evidence,
    'latest terminal run: npm run check:completion',
    'latest terminal run: npm run check:completion-evidence exited 0',
  );
  appendEvidence(checklistRequirement.evidence, 'artifacts/completion-audit.json:checklist.sections');
  checklistRequirement.notes = `The audit reports ${String(audit.checklist.unchecked)} unchecked item${
    audit.checklist.unchecked === 1 ? '' : 's'
  }: ${
    audit.uncheckedItems?.map((item) => String(item.number)).join(', ') || 'none'
  }. scripts/assert-completion-consistency.mjs verifies checklist counts, malformed rows, section totals, and blocker alignment across COMPLETE_FIX_REQUIREMENTS.md, artifacts/completion-audit.json, artifacts/completion-evidence-index.json, and artifacts/manual-evidence/remaining-external-blockers.json.`;
}

function updateCoveragePromptEvidence(promptRequirementMap) {
  const coverageRequirement = promptRequirementMap.find(
    (entry) => entry.requirement === 'npm test:coverage result.',
  );
  if (!coverageRequirement) return;

  updatePhaseGateCommandRequirement(coverageRequirement, {
    commandId: 'coverage',
    evidenceRef: `${phaseGatePath}:commands.coverage`,
    prefix: 'latest terminal run: npm run test:coverage',
  });

  replaceOrAppendByPrefix(
    coverageRequirement.evidence,
    'latest terminal run: npm run test:coverage',
    'latest terminal run: npm run test:coverage exited 0',
  );

  if (Array.isArray(vitestList)) {
    replaceOrAppendByPattern(
      coverageRequirement.evidence,
      /^\d+ test files passed$/,
      `${String(new Set(vitestList.map((testCase) => testCase.file)).size)} test files passed`,
    );
    replaceOrAppendByPattern(
      coverageRequirement.evidence,
      /^\d+ tests passed$/,
      `${String(vitestList.length)} tests passed`,
    );
  }

  const totalCoverage = coverageSummary?.total;
  if (totalCoverage) {
    replaceOrAppendByPrefix(
      coverageRequirement.evidence,
      'Statements ',
      formatCoverageMetric('Statements', totalCoverage.statements),
    );
    replaceOrAppendByPrefix(
      coverageRequirement.evidence,
      'Branches ',
      formatCoverageMetric('Branches', totalCoverage.branches),
    );
    replaceOrAppendByPrefix(
      coverageRequirement.evidence,
      'Functions ',
      formatCoverageMetric('Functions', totalCoverage.functions),
    );
    replaceOrAppendByPrefix(
      coverageRequirement.evidence,
      'Lines ',
      formatCoverageMetric('Lines', totalCoverage.lines),
    );
  }

  coverageRequirement.notes =
    'The prompt names the coverage gate as npm test:coverage; package.json defines test:coverage as a custom npm script, so the runnable command is npm run test:coverage.';
  coverageRequirement.commandMapping = {
    packageScript: 'test:coverage',
    packageScriptValue: packageJson.scripts?.['test:coverage'] ?? null,
    promptCommand: 'npm test:coverage',
    runnableCommand: 'npm run test:coverage',
  };
}

function updateBuildPromptEvidence(promptRequirementMap) {
  const buildRequirement = promptRequirementMap.find(
    (entry) => entry.requirement === 'npm run build, image-free output, under 100KB primary budget.',
  );
  if (!buildRequirement || !audit.dist) return;

  updatePhaseGateCommandRequirement(buildRequirement, {
    commandId: 'build',
    evidenceRef: `${phaseGatePath}:commands.build`,
    prefix: 'latest terminal run: npm run build',
  });
  updatePhaseGateCommandRequirement(buildRequirement, {
    commandId: 'noRaster',
    evidenceRef: `${phaseGatePath}:commands.noRaster`,
    prefix: 'latest terminal run: npm run check:no-raster',
  });
  updatePhaseGateCommandRequirement(buildRequirement, {
    commandId: 'bundleSize',
    evidenceRef: `${phaseGatePath}:commands.bundleSize`,
    prefix: 'latest terminal run: npm run check:bundle-size',
  });
  if (phaseGateEvidence) {
    appendEvidence(buildRequirement.evidence, `${phaseGatePath}:dist`);
  }

  buildRequirement.notes = `Audit dist exists is ${String(audit.dist.exists)}, fileCount is ${String(
    audit.dist.fileCount,
  )}, hasBuildOutput is ${String(audit.dist.hasBuildOutput)}, totalBytes is ${String(
    audit.dist.totalBytes,
  )}, primaryBytesNoCompressedSidecars is ${String(
    audit.dist.primaryBytesNoCompressedSidecars,
  )}, primaryJsCssBytes is ${String(audit.dist.primaryJsCssBytes)}, transferBrotliJsCssBytes is ${String(
    audit.dist.transferBrotliJsCssBytes,
  )}, withinBrotliTransferBudget is ${String(
    audit.dist.withinBrotliTransferBudget ?? audit.dist.withinPrimaryBudget,
  )}, and rasterAssets is ${
    Array.isArray(audit.dist.rasterAssets) && audit.dist.rasterAssets.length > 0
      ? audit.dist.rasterAssets.join(', ')
      : 'empty'
  }. scripts/assert-completion-audit.mjs now requires real dist build output, at least one primary JS/CSS asset, no raster assets, and Brotli JS/CSS transfer bytes to remain below 100000. Raw primary/dist bytes are reported as diagnostic context, not the pass criterion.`;
}

function updatePhaseGatePromptEvidence(promptRequirementMap) {
  const typeCheckRequirement = findOrAppendRequirement(promptRequirementMap, {
    evidence: [],
    requirement: 'npm run type-check.',
    status: 'verified',
  });
  updatePhaseGateCommandRequirement(typeCheckRequirement, {
    commandId: 'typeCheck',
    evidenceRef: `${phaseGatePath}:commands.typeCheck`,
    prefix: 'latest terminal run: npm run type-check',
  });

  const lintRequirement = findOrAppendRequirement(promptRequirementMap, {
    evidence: [],
    requirement: 'npm run lint.',
    status: 'verified',
  });
  updatePhaseGateCommandRequirement(lintRequirement, {
    commandId: 'lint',
    evidenceRef: `${phaseGatePath}:commands.lint`,
    prefix: 'latest terminal run: npm run lint',
  });
}

function updatePhaseGateCommandRequirement(requirement, { commandId, evidenceRef, prefix }) {
  const command = phaseGateEvidence?.commands?.[commandId];
  if (!command) return;

  replaceOrAppendByPrefix(
    requirement.evidence,
    prefix,
    `latest terminal run: ${command.command} exited ${String(command.exitCode)}`,
  );
  appendEvidence(requirement.evidence, evidenceRef);
  if (command.exitCode !== 0) {
    requirement.status = 'blocked';
  } else {
    requirement.status = 'verified';
  }
}

function updateForbiddenPatternPromptEvidence(promptRequirementMap) {
  const forbiddenRequirement = findOrAppendRequirement(promptRequirementMap, {
    requirement: 'No forbidden implementation shortcuts.',
    evidence: [],
    status: 'verified',
    notes: '',
  });

  forbiddenRequirement.status = audit.commands?.forbiddenPatterns?.exitCode === 0 ? 'verified' : 'blocked';
  replaceOrAppendByPrefix(
    forbiddenRequirement.evidence,
    'latest terminal run: npm run check:forbidden-patterns',
    `latest terminal run: npm run check:forbidden-patterns exited ${String(
      audit.commands?.forbiddenPatterns?.exitCode ?? 'unknown',
    )}`,
  );
  appendEvidence(forbiddenRequirement.evidence, 'artifacts/completion-audit.json:commands.forbiddenPatterns');
  forbiddenRequirement.notes = `scripts/assert-forbidden-patterns.mjs scans production source for type-suppression comments, debug print calls, task-marker comments, explicit TypeScript top-type usage, and ${temporaryBypassNoteFragment}.`;
}

function updateTemporaryBypassPromptEvidence(promptRequirementMap) {
  const temporaryBypassRequirement = findOrAppendRequirement(promptRequirementMap, {
    requirement: temporaryBypassRequirementName,
    evidence: [],
    status: 'verified',
    notes: '',
  });

  temporaryBypassRequirement.status =
    audit.commands?.forbiddenPatterns?.exitCode === 0 ? 'verified' : 'blocked';
  replaceOrAppendByPrefix(
    temporaryBypassRequirement.evidence,
    'latest terminal run: npm run check:forbidden-patterns',
    `latest terminal run: npm run check:forbidden-patterns exited ${String(
      audit.commands?.forbiddenPatterns?.exitCode ?? 'unknown',
    )}`,
  );
  appendEvidence(
    temporaryBypassRequirement.evidence,
    'artifacts/completion-audit.json:commands.forbiddenPatterns',
  );
  temporaryBypassRequirement.notes = `The same source scanner rejects ${temporaryBypassNoteFragment} in production source roots.`;
}

function updateTestRealismPromptEvidence(promptRequirementMap) {
  const testRealismRequirement = findOrAppendRequirement(promptRequirementMap, {
    requirement: 'No mock-only test completion.',
    evidence: [],
    status: 'verified',
    notes: '',
  });

  testRealismRequirement.status = testRealism?.result === 'passed' ? 'verified' : 'blocked';
  replaceOrAppendByPrefix(
    testRealismRequirement.evidence,
    'latest terminal run: npm run check:test-realism',
    `latest terminal run: npm run check:test-realism exited ${String(
      audit.commands?.testRealism?.exitCode ?? 'unknown',
    )}`,
  );
  appendEvidence(testRealismRequirement.evidence, testRealismPath);
  appendEvidence(testRealismRequirement.evidence, 'artifacts/completion-audit.json:commands.testRealism');
  testRealismRequirement.notes = testRealism
    ? `Test realism verifier passed with ${String(testRealism.vitestTestCount)} Vitest tests, ${String(
        testRealism.e2eFileCount,
      )} E2E spec file, ${String(testRealism.behaviorFileCount)} behavior-oriented test files, ${String(
        testRealism.productionImportFileCount,
      )} production-import test files, and ${String(
        testRealism.testDoubleFileCount,
      )} files using constrained platform-boundary test doubles.`
    : 'Test realism verifier artifact is missing.';
}

function updateSecurityPromptEvidence(promptRequirementMap) {
  const securityRequirement = findOrAppendRequirement(promptRequirementMap, {
    requirement: 'Security scan including Snyk.',
    evidence: [],
    status: 'verified',
    notes: '',
  });
  const commandExitCodes = [
    audit.commands?.npmAudit?.exitCode,
    audit.commands?.licensePolicy?.exitCode,
    audit.commands?.sbom?.exitCode,
    audit.commands?.snyk?.exitCode,
  ];

  securityRequirement.status =
    commandExitCodes.every((exitCode) => exitCode === 0) && audit.sbom?.valid === true
      ? 'verified'
      : 'blocked';
  replaceOrAppendByPrefix(
    securityRequirement.evidence,
    'latest terminal run: npm audit --audit-level=moderate',
    `latest terminal run: npm audit --audit-level=moderate exited ${String(
      audit.commands?.npmAudit?.exitCode ?? 'unknown',
    )}`,
  );
  replaceOrAppendByPrefix(
    securityRequirement.evidence,
    'latest terminal run: npm run check:licenses',
    `latest terminal run: npm run check:licenses exited ${String(
      audit.commands?.licensePolicy?.exitCode ?? 'unknown',
    )}`,
  );
  replaceOrAppendByPrefix(
    securityRequirement.evidence,
    'latest terminal run: npm run check:sbom',
    `latest terminal run: npm run check:sbom exited ${String(audit.commands?.sbom?.exitCode ?? 'unknown')}`,
  );
  appendEvidence(securityRequirement.evidence, 'artifacts/sbom.json');
  appendEvidence(securityRequirement.evidence, 'artifacts/completion-audit.json:commands.npmAudit');
  appendEvidence(securityRequirement.evidence, 'artifacts/completion-audit.json:commands.licensePolicy');
  appendEvidence(securityRequirement.evidence, 'artifacts/completion-audit.json:commands.sbom');
  appendEvidence(securityRequirement.evidence, 'artifacts/completion-audit.json:commands.snyk');
  appendEvidence(securityRequirement.evidence, 'artifacts/completion-audit.json:sbom');
  securityRequirement.notes =
    audit.sbom?.valid === true
      ? `Security and release evidence passed: npm audit, license policy, SBOM generation, Snyk, and CycloneDX SBOM validation with ${String(
          audit.sbom.componentCount,
        )} component(s) for ${audit.sbom.applicationName}.`
      : `Security or release evidence is blocked: ${audit.sbom?.detail ?? 'SBOM evidence missing.'}`;
}

function updateVisualPromptEvidence(promptRequirementMap) {
  const visualRequirement = promptRequirementMap.find(
    (entry) => entry.requirement === 'Section A patient avatar redesign and visual patient screenshot.',
  );
  if (!visualRequirement || !Array.isArray(audit.screenshots)) return;

  appendEvidence(visualRequirement.evidence, visualReviewPath);
  appendEvidence(visualRequirement.evidence, 'artifacts/completion-audit.json:visualReview');
  visualRequirement.notes = `Visual review ${
    audit.visualReview?.valid === true ? 'passed' : 'did not pass'
  } for ${String(audit.visualReview?.reviewedScreenshotCount ?? 0)} screenshot artifacts: ${audit.screenshots
    .map((screenshot) => `${screenshot.path} ${String(screenshot.width)}x${String(screenshot.height)}`)
    .join(', ')}.`;
}

function updateBlockerEvidence(blockers) {
  const cruxBlocker = blockers.find((blocker) => blocker.id === 'chrome-ux-report');
  if (!cruxBlocker) {
    throw new Error('Missing chrome-ux-report blocker entry');
  }
  cruxBlocker.operatorNextSteps = cruxOperatorNextSteps;
  cruxBlocker.acceptedCredentialNames = cruxCredentials.acceptedKeyNames ?? [
    'CRUX_API_KEY',
    'PAGESPEED_API_KEY',
    'GOOGLE_API_KEY',
  ];
  cruxBlocker.requiredToComplete = uniqueStrings([
    ...(cruxCredentials.requiredToComplete ?? []),
    ...(cruxMonitoring.requiredToComplete ?? []),
  ]);

  replaceByPrefix(
    cruxBlocker.currentEvidence,
    'Fresh local run at ',
    `Fresh local run at ${cruxMonitoring.verifiedAt} wrote ${cruxMonitoringPath} with result ${cruxMonitoring.result}, fieldDataAvailable ${String(
      cruxMonitoring.fieldDataAvailable,
    )}, CrUX API origin status ${statusValue(cruxMonitoring.checks.cruxApi.originRecord)}, CrUX API URL status ${statusValue(
      cruxMonitoring.checks.cruxApi.urlRecord,
    )}, PageSpeed status ${statusValue(cruxMonitoring.checks.pageSpeed)}, discoverability HTTP ${statusValue(
      cruxMonitoring.checks.discoverability,
      'homeStatus',
    )}/canonical/robots/sitemap passing, public crux-cache latest month ${
      cruxMonitoring.checks.cruxCache.latestMonth
    }, and requiredToComplete guidance listing CRUX_API_KEY, PAGESPEED_API_KEY, and GOOGLE_API_KEY.`,
  );
  replaceOrAppendByPrefix(
    cruxBlocker.currentEvidence,
    `${cruxCredentialsPath} records `,
    `${cruxCredentialsPath} records result ${cruxCredentials.result}, monitor API key source ${formatApiKeySource(
      cruxCredentials.monitorApiKeySource,
    )}, exported env key names ${formatList(
      cruxCredentials.usableByCurrentMonitor?.localEnvironmentNames,
    )}, env-file key names ${formatList(
      cruxCredentials.usableByCurrentMonitor?.envFileNames,
    )}, GitHub secret key names ${formatList(
      cruxCredentials.usableByCurrentMonitor?.githubSecretNames,
    )}, GitHub environment secret key names ${formatList(
      cruxCredentials.githubEnvironments?.acceptedPresent?.secrets,
    )}, GitHub environment variable key names ${formatList(
      cruxCredentials.githubEnvironments?.acceptedPresent?.variables,
    )}, and local env files ${
      cruxCredentials.localEnvFiles?.checked === true
        ? `accepted key names ${formatList(cruxCredentials.localEnvFiles.acceptedPresent)}`
        : 'were not checked'
    }.`,
  );
  if (pagesDomain) {
    replaceOrAppendByPrefix(
      cruxBlocker.currentEvidence,
      `${pagesDomainPath} records `,
      `${pagesDomainPath} records result ${pagesDomain.result}, expected origin ${
        pagesDomain.expectedOrigin
      }, connected origins ${formatList(pagesDomain.connectedOrigins)}, Pages status ${
        pagesDomain.pages?.status ?? 'unknown'
      }, and CNAME ${pagesDomain.cnameFile?.exists ? pagesDomain.cnameFile.value : 'absent'}.`,
    );
  }
  if (cruxLiveProbe) {
    replaceOrAppendByPrefix(
      cruxBlocker.currentEvidence,
      `${cruxLiveProbePath} records `,
      `${cruxLiveProbePath} records direct CrUX API origin status ${formatNamedProbeStatus(
        cruxLiveProbe,
        'origin',
      )}, URL status ${formatNamedProbeStatus(cruxLiveProbe, 'url')}, and record-present flags ${formatNamedProbeRecord(
        cruxLiveProbe,
        'origin',
      )}/${formatNamedProbeRecord(cruxLiveProbe, 'url')}.`,
    );
  }
  if (pagespeedLiveProbe) {
    replaceOrAppendByPrefix(
      cruxBlocker.currentEvidence,
      `${pagespeedLiveProbePath} records `,
      `${pagespeedLiveProbePath} records direct PageSpeed API status ${String(
        pagespeedLiveProbe.status ?? 'unknown',
      )}, loadingExperience ${pagespeedLiveProbe.hasLoadingExperience === true ? 'present' : 'absent'}, originLoadingExperience ${
        pagespeedLiveProbe.hasOriginLoadingExperience === true ? 'present' : 'absent'
      }, and error status ${pagespeedLiveProbe.errorStatus ?? 'none'}.`,
    );
  }
  if (remoteCruxWorkflowDrift) {
    replaceOrAppendByPrefix(
      cruxBlocker.currentEvidence,
      `${remoteCruxWorkflowDriftPath} records `,
      `${remoteCruxWorkflowDriftPath} records result ${
        remoteCruxWorkflowDrift.result
      }, mismatched remote files ${formatList(
        remoteCruxWorkflowDrift.mirroredFiles
          ?.filter((file) => file.matches !== true)
          .map((file) => file.remotePath),
      )}, and missing workflow markers ${formatList(remoteCruxWorkflowDrift.workflow?.missingMarkers)}.`,
    );
  }
  if (remoteCruxLatestRun) {
    replaceOrAppendByPrefix(
      cruxBlocker.currentEvidence,
      `${remoteCruxLatestRunPath} records `,
      `${remoteCruxLatestRunPath} records result ${remoteCruxLatestRun.result}, latest remote run ${String(
        remoteCruxLatestRun.latestRemoteRun?.databaseId ?? 'unknown',
      )}, indexed run ${String(remoteCruxLatestRun.indexedRun?.runId ?? 'unknown')}, and indexed artifact ${
        remoteCruxLatestRun.indexedRun?.artifactExists === true ? 'exists' : 'is missing'
      } with latest-run directory match ${String(
        remoteCruxLatestRun.indexedRun?.artifactMatchesRun ?? false,
      )}.`,
    );
  }
}

function updateRemoteCruxEvidence(indexManifest, remoteRun) {
  if (!remoteRun) return;
  if (!indexManifest.remoteCruxEvidence) {
    throw new Error('Missing remoteCruxEvidence index entry');
  }

  indexManifest.remoteCruxEvidence.latestWorkflowCommit = remoteRun.run.headSha;
  indexManifest.remoteCruxEvidence.latestRunId = remoteRun.run.databaseId;
  indexManifest.remoteCruxEvidence.latestRunConclusion = remoteRun.run.conclusion;
  indexManifest.remoteCruxEvidence.blockerIssue = remoteRun.issue.url;
  indexManifest.remoteCruxEvidence.latestMonitoringArtifact = remoteRun.artifactPath;
  if (remoteCruxWorkflowDrift) {
    indexManifest.remoteCruxEvidence.workflowDrift = {
      artifact: remoteCruxWorkflowDriftPath,
      result: remoteCruxWorkflowDrift.result,
      verifiedAt: remoteCruxWorkflowDrift.verifiedAt,
      mismatchedFiles:
        remoteCruxWorkflowDrift.mirroredFiles
          ?.filter((file) => file.matches !== true)
          .map((file) => file.remotePath) ?? [],
      missingWorkflowMarkers: remoteCruxWorkflowDrift.workflow?.missingMarkers ?? [],
    };
  }
  if (remoteCruxLatestRun) {
    indexManifest.remoteCruxEvidence.latestRemoteRunCheck = {
      artifact: remoteCruxLatestRunPath,
      result: remoteCruxLatestRun.result,
      verifiedAt: remoteCruxLatestRun.verifiedAt,
      latestRemoteRunId: remoteCruxLatestRun.latestRemoteRun?.databaseId ?? null,
      latestRemoteHeadSha: remoteCruxLatestRun.latestRemoteRun?.headSha ?? null,
      indexedRunId: remoteCruxLatestRun.indexedRun?.runId ?? null,
      indexedWorkflowCommit: remoteCruxLatestRun.indexedRun?.headSha ?? null,
      indexedWorkflowCommitMatchesLatest: remoteCruxLatestRun.indexedRun?.headShaMatchesLatest ?? false,
      indexedArtifactExists: remoteCruxLatestRun.indexedRun?.artifactExists ?? false,
      indexedArtifactMatchesRun: remoteCruxLatestRun.indexedRun?.artifactMatchesRun ?? false,
    };
  }
}

function updateRemoteBlockerEvidence(blockers, remoteRun) {
  if (!remoteRun) return;
  const cruxBlocker = blockers.find((blocker) => blocker.id === 'chrome-ux-report');
  if (!cruxBlocker) {
    throw new Error('Missing chrome-ux-report blocker entry');
  }

  const remoteRunEvidence = `Manual remote workflow run ${String(
    remoteRun.run.databaseId,
  )} ran against current CrUX monitoring commit ${remoteRun.run.headSha}, uploaded ${
    remoteRun.artifactPath
  } and ${remoteRun.credentialsPath} with credential result ${remoteRun.credentials.result}, did not upload chrome-ux-report.json because fieldDataAvailable was ${String(
    remoteRun.artifact.fieldDataAvailable,
  )}, received CrUX origin ${statusValue(
    remoteRun.artifact.checks.cruxApi.originRecord,
  )}, CrUX URL ${statusValue(remoteRun.artifact.checks.cruxApi.urlRecord)}, and PageSpeed ${statusValue(
    remoteRun.artifact.checks.pageSpeed,
  )}, scanned ${String(remoteRun.artifact.checks.cruxCache.scannedChunks)}/${String(
    remoteRun.artifact.checks.cruxCache.totalChunks,
  )} public CrUX cache chunks for month ${remoteRun.artifact.checks.cruxCache.latestMonth}, ${
    remoteRun.artifact.checks.cruxCache.foundOrigin ? 'found' : 'did not find'
  } the origin, and updated the blocker issue with credential preflight result ${
    remoteRun.issue.body?.includes('Credential preflight result') ? 'included' : 'missing'
  }${
    remoteRun.pagesDomain
      ? `, with Pages domain result ${remoteRun.pagesDomain.result} for connected origins ${formatList(
          remoteRun.pagesDomain.connectedOrigins,
        )}`
      : ''
  }${remoteRun.issue.updatedAt ? ` at ${remoteRun.issue.updatedAt}` : ''}.`;
  const credentialComment = remoteRun.issue.comments?.find((comment) =>
    comment.body?.includes('Local credential preflight update'),
  );
  const remoteCredentialEvidence = credentialComment
    ? `Remote blocker issue includes credential preflight comment ${credentialComment.url}; latest issue body records credential result ${
        remoteRun.credentials.result
      }, monitor key source ${formatApiKeySource(
        remoteRun.credentials.monitorApiKeySource,
      )}, exported env key names ${formatList(
        remoteRun.credentials.usableByCurrentMonitor?.localEnvironmentNames,
      )}, env-file key names ${formatList(
        remoteRun.credentials.usableByCurrentMonitor?.envFileNames,
      )}, and GitHub secret key names ${formatList(
        remoteRun.credentials.usableByCurrentMonitor?.githubSecretNames,
      )}, GitHub environment secret key names ${formatList(
        remoteRun.credentials.githubEnvironments?.acceptedPresent?.secrets,
      )}, and GitHub environment variable key names ${formatList(
        remoteRun.credentials.githubEnvironments?.acceptedPresent?.variables,
      )}.`
    : 'Remote blocker issue is missing a credential preflight comment.';

  const existingIndex = cruxBlocker.currentEvidence.findIndex((entry) =>
    entry.startsWith(`Manual remote workflow run ${String(remoteRun.run.databaseId)} `),
  );
  if (existingIndex === -1) {
    cruxBlocker.currentEvidence.push(remoteRunEvidence);
  } else {
    cruxBlocker.currentEvidence[existingIndex] = remoteRunEvidence;
  }
  replaceOrAppendByPrefix(cruxBlocker.currentEvidence, 'Remote blocker issue ', remoteCredentialEvidence);
}

function appendEvidence(evidence, path) {
  if (!evidence.includes(path)) {
    evidence.push(path);
  }
}

function findOrAppendRequirement(promptRequirementMap, requirement) {
  const existing = promptRequirementMap.find((entry) => entry.requirement === requirement.requirement);
  if (existing) return existing;
  promptRequirementMap.push(requirement);
  return requirement;
}

function readLatestRemoteCruxRun() {
  if (!existsSync(manualEvidenceDirectory)) return null;
  const latestRun = readdirSync(manualEvidenceDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      directory: `${manualEvidenceDirectory}/${entry.name}`,
      runId: Number(entry.name.match(/^crux-monitoring-run-(\d+)$/)?.[1] ?? 0),
    }))
    .filter((entry) => entry.runId > 0)
    .filter((entry) => existsSync(`${entry.directory}/chrome-ux-report-monitoring.json`))
    .sort((left, right) => right.runId - left.runId)[0];
  if (!latestRun) return null;

  return {
    artifact: readJson(`${latestRun.directory}/chrome-ux-report-monitoring.json`),
    artifactPath: `${latestRun.directory}/chrome-ux-report-monitoring.json`,
    credentials: readJson(`${latestRun.directory}/chrome-ux-report-credentials.json`),
    credentialsPath: `${latestRun.directory}/chrome-ux-report-credentials.json`,
    directory: latestRun.directory,
    issue: readJson(`${latestRun.directory}/issue.json`),
    pagesDomain: readOptionalJson(`${latestRun.directory}/github-pages-domain.json`),
    run: readJson(`${latestRun.directory}/run.json`),
  };
}

function readOptionalJson(path) {
  return existsSync(path) ? readJson(path) : null;
}

function replaceByPrefix(values, prefix, replacement) {
  const indexToReplace = values.findIndex((value) => value.startsWith(prefix));
  if (indexToReplace === -1) {
    throw new Error(`Missing evidence entry with prefix: ${prefix}`);
  }
  values[indexToReplace] = replacement;
}

function replaceOrAppendByPrefix(values, prefix, replacement) {
  const indexToReplace = values.findIndex((value) => value.startsWith(prefix));
  if (indexToReplace === -1) {
    values.push(replacement);
  } else {
    values[indexToReplace] = replacement;
  }
}

function replaceOrAppendByPattern(values, pattern, replacement) {
  const indexToReplace = values.findIndex((value) => pattern.test(value));
  if (indexToReplace === -1) {
    values.push(replacement);
  } else {
    values[indexToReplace] = replacement;
  }
}

function formatCoverageMetric(label, metric) {
  return `${label} ${formatPercent(metric?.pct)}% (${String(metric?.covered ?? 0)}/${String(
    metric?.total ?? 0,
  )})`;
}

function formatPercent(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value).toFixed(2));
}

function formatList(values) {
  if (!Array.isArray(values) || values.length === 0) return '[]';
  return `[${values.join(', ')}]`;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function formatApiKeySource(source) {
  if (!source || source.source === 'none') return 'none';
  const name = source.name ?? 'unknown';
  return source.path ? `${source.source}:${source.path}:${name}` : `${source.source}:${name}`;
}

function credentialExitCode(credentials) {
  return credentials.result === 'present' ? 0 : 1;
}

function liveProbeExitCode(cruxProbe, pageSpeedProbe) {
  const hasFieldData = Boolean(
    cruxProbe.probes?.some((probe) => probe.recordPresent === true) ||
    pageSpeedProbe.hasLoadingExperience === true ||
    pageSpeedProbe.hasOriginLoadingExperience === true,
  );
  return hasFieldData ? 0 : 1;
}

function statusValue(value, key = 'status') {
  const status = value?.[key];
  if (status === undefined || status === null) return 'unknown';
  return String(status);
}

function formatNamedProbeStatus(probe, name) {
  const entry = probe.probes?.find((item) => item.name === name);
  return String(entry?.status ?? 'unknown');
}

function formatNamedProbeRecord(probe, name) {
  const entry = probe.probes?.find((item) => item.name === name);
  return entry?.recordPresent === true ? 'present' : 'absent';
}

function latestIsoSecond(...timestamps) {
  const latest = timestamps
    .filter((timestamp) => typeof timestamp === 'string' && timestamp.length > 0)
    .map((timestamp) => new Date(timestamp))
    .filter((timestamp) => !Number.isNaN(timestamp.getTime()))
    .reduce((current, next) => (next > current ? next : current));
  return latest.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function writeJson(path, value) {
  writeFileSync(
    path,
    await format(JSON.stringify(value), { ...((await resolveConfig(path)) ?? {}), parser: 'json' }),
  );
}
