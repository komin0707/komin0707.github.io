import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const auditPath = 'artifacts/completion-audit.json';
const deepAuditPath = 'artifacts/manual-evidence/deep-audit-completion-audit.json';
const indexPath = 'artifacts/completion-evidence-index.json';
const blockersPath = 'artifacts/manual-evidence/remaining-external-blockers.json';
const summaryPath = 'artifacts/manual-evidence/final-blocker-summary.json';
const cruxBlockerRefreshPath = 'artifacts/manual-evidence/crux-blocker-refresh.json';
const cruxCredentialsPath = 'artifacts/manual-evidence/chrome-ux-report-credentials.json';
const cruxLiveProbePath = 'artifacts/manual-evidence/crux-live-probe.json';
const cruxMonitoringPath = 'artifacts/manual-evidence/chrome-ux-report-monitoring.json';
const pagespeedLiveProbePath = 'artifacts/manual-evidence/pagespeed-live-probe.json';
const pagesDomainPath = 'artifacts/manual-evidence/github-pages-domain.json';
const deepAuditExternalEvidenceRunbookPath =
  'artifacts/manual-evidence/deep-audit-external-evidence-runbook.md';
const deepAuditExternalEvidenceChecklistPath =
  'artifacts/manual-evidence/deep-audit-external-evidence-checklist.json';
const cruxOperatorNextSteps = [
  'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
  'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
  'gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io',
  'npm run refresh:crux-blocker-evidence',
];

const audit = readJson(auditPath);
const index = readJson(indexPath);
const blockersManifest = readJson(blockersPath);
const blocker = blockersManifest.blockers[0];
const deepAuditCompletion = buildDeepAuditCompletion();
const remainingDeepAuditBlockers = deepAuditCompletion.blockers ?? [];
const consolidatedRemainingBlockers = buildConsolidatedRemainingBlockers(remainingDeepAuditBlockers);

const summary = {
  generatedAt: blockersManifest.verifiedAt,
  status: audit.status,
  objectiveStatus: index.objective?.status ?? 'unknown',
  objective: index.objective,
  checklist: {
    actualChecklistRowsObserved: audit.checklist.observedTotal,
    checked: audit.checklist.checked,
    duplicateItemNumbers: audit.checklist.duplicateItemNumbers,
    malformedChecklistRows: audit.checklist.malformedChecklistRows ?? [],
    missingItemNumbers: audit.checklist.missingItemNumbers,
    sections: audit.checklist.sections ?? [],
    unchecked: audit.checklist.unchecked,
    note: blockersManifest.checklistState.note,
  },
  successCriteria: [
    'The claimed 1,167-item objective reconciles with the actual numbered checklist rows in COMPLETE_FIX_REQUIREMENTS.md.',
    'Every actual checklist row in COMPLETE_FIX_REQUIREMENTS.md is checked.',
    'Every explicit command and gate has current passing evidence.',
    'Every required manual or external evidence artifact exists and passes semantic validation.',
    'Chrome UX Report evidence is not accepted unless it contains real CrUX/PageSpeed field-data indicators for the production origin.',
  ],
  completionAudit: buildCompletionAudit(),
  deepAuditCompletion,
  blockerCounts: {
    completeFix: audit.blockers.length,
    consolidated: consolidatedRemainingBlockers.length,
    deepAudit: remainingDeepAuditBlockers.length,
  },
  externalEvidenceHandoff: {
    checklist: deepAuditExternalEvidenceChecklistPath,
    runbook: deepAuditExternalEvidenceRunbookPath,
  },
  remainingDeepAuditBlockers,
  consolidatedRemainingBlockers,
  promptToArtifactChecklist: index.promptRequirementMap,
  phaseReports: buildPhaseReports(),
  objectivePhaseReports: buildObjectivePhaseReports(),
  remainingBlocker: {
    item: blocker.item,
    id: blocker.id,
    requirement: blocker.requirement,
    expectedCanonicalArtifact: 'artifacts/manual-evidence/chrome-ux-report.json',
    currentMonitoringArtifact: 'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
    latestLocalMonitoring: readLocalMonitoringSummary(),
    latestLocalBatchRefresh: readCruxBlockerRefreshSummary(),
    latestLocalCredentials: readLocalCredentialsSummary(),
    latestPagesDomain: readPagesDomainSummary(),
    latestRemoteRun: readRemoteCruxSummary(index.remoteCruxEvidence),
    latestRemoteRunCheck: index.remoteCruxEvidence.latestRemoteRunCheck ?? null,
    currentEvidence: blocker.currentEvidence,
    latestRemoteMonitoringArtifact: index.remoteCruxEvidence.latestMonitoringArtifact,
    blockerIssue: index.remoteCruxEvidence.blockerIssue,
    requiredToComplete: blocker.requiredToComplete,
    acceptedCredentialNames: blocker.acceptedCredentialNames ?? [],
    operatorNextSteps: blocker.operatorNextSteps ?? cruxOperatorNextSteps,
    mustNotMarkCompleteBecause: blocker.mustNotMarkCompleteBecause,
  },
  doNotCompleteYet: index.doNotCompleteYet,
};

await writeJson(summaryPath, summary);
process.stdout.write(
  `${JSON.stringify(
    {
      path: summaryPath,
      status: summary.status,
      objectiveStatus: summary.objectiveStatus,
      blockerCount: audit.blockers.length,
      consolidatedBlockerCount: consolidatedRemainingBlockers.length,
      deepAuditBlockerCount: remainingDeepAuditBlockers.length,
    },
    null,
    2,
  )}\n`,
);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function buildCompletionAudit() {
  const objective = index.objective ?? {};
  const phaseGateRequirements = [
    'npm run type-check.',
    'npm run lint.',
    'npm test:coverage result.',
    'npm run build, image-free output, under 100KB primary budget.',
  ].map(promptEvidence);
  const phaseGateStatus = phaseGateRequirements.every((requirement) => requirement.status === 'verified')
    ? 'verified'
    : 'blocked';
  const visualEvidence = visualScreenshotEvidence();
  const cruxEvidence = promptEvidence('Chrome UX Report monitoring.');

  return {
    objectiveRestatement:
      'Complete COMPLETE_FIX_REQUIREMENTS.md to 100%, reconcile the claimed 1,167-item target with the actual numbered checklist rows, pass every named command gate, provide visual patient screenshot evidence, and accept Chrome UX Report monitoring only with real production field-data evidence.',
    verdict: objective.status ?? 'unknown',
    inspectedRequirements: [
      {
        requirement: 'Claimed 1,167 / 1,167 checklist objective.',
        status: objective.checklistRowDeltaFromClaim === 0 ? 'verified' : 'blocked',
        evidence: ['artifacts/completion-evidence-index.json:objective'],
        finding: `claimed ${String(objective.claimedChecklistRows ?? 'unknown')}; actual ${String(
          objective.actualChecklistRowsObserved ?? 'unknown',
        )}; delta ${String(objective.checklistRowDeltaFromClaim ?? 'unknown')}`,
      },
      {
        requirement: 'Seven objective phase checklist claims reconcile with the actual checklist.',
        status:
          objective.checklistRowDeltaFromPhaseClaims === 0 && objective.phaseClaimsDeltaFromClaimedTotal === 0
            ? 'verified'
            : 'blocked',
        evidence: [
          'artifacts/completion-evidence-index.json:objective',
          'artifacts/manual-evidence/final-blocker-summary.json:objectivePhaseReports',
        ],
        finding: `phase claims ${String(objective.phaseClaimedChecklistRowsTotal ?? 'unknown')}; actual ${String(
          objective.actualChecklistRowsObserved ?? 'unknown',
        )}; actual-phase delta ${String(
          objective.checklistRowDeltaFromPhaseClaims ?? 'unknown',
        )}; phase-total delta ${String(objective.phaseClaimsDeltaFromClaimedTotal ?? 'unknown')}`,
      },
      {
        requirement: 'Every actual checklist row in COMPLETE_FIX_REQUIREMENTS.md is checked.',
        status: audit.checklist.unchecked === 0 ? 'verified' : 'blocked',
        evidence: [
          'COMPLETE_FIX_REQUIREMENTS.md',
          'artifacts/completion-audit.json:checklist',
          'artifacts/manual-evidence/remaining-external-blockers.json:checklistState',
        ],
        finding: `${String(audit.checklist.checked)}/${String(audit.checklist.observedTotal)} checked; ${String(
          audit.checklist.unchecked,
        )} unchecked`,
      },
      {
        requirement: 'Named phase report commands pass with current evidence.',
        status: phaseGateStatus,
        evidence: phaseGateRequirements.flatMap((requirement) => requirement.evidence),
        finding: `type-check ${promptEvidence('npm run type-check.').status}; lint ${
          promptEvidence('npm run lint.').status
        }; coverage ${promptEvidence('npm test:coverage result.').status}; build ${
          promptEvidence('npm run build, image-free output, under 100KB primary budget.').status
        }`,
      },
      {
        requirement: 'Visual patient screenshot evidence exists and passed review.',
        status: visualEvidence.status ?? 'unknown',
        evidence: visualEvidence.evidence,
        finding: visualEvidence.notes ?? 'No visual screenshot notes recorded.',
      },
      {
        requirement: 'Chrome UX Report monitoring has real production field-data evidence.',
        status: cruxEvidence.status ?? 'unknown',
        evidence: completionAuditCruxEvidence(cruxEvidence),
        finding: cruxEvidence.notes ?? 'No Chrome UX Report evidence notes recorded.',
      },
    ],
  };
}

function buildDeepAuditCompletion() {
  const deepAudit = readOptionalJson(deepAuditPath);
  if (!deepAudit) {
    return {
      artifact: deepAuditPath,
      status: 'missing',
      objectiveRestatement:
        'Complete all 1,180 DEEP_AUDIT_REQUIREMENTS_V2.md checklist rows and satisfy the true completion definition.',
      blockers: [
        {
          id: 'deep-audit-artifact-missing',
          status: 'blocked',
          finding: `${deepAuditPath} is missing. Run npm run check:deep-audit-completion.`,
        },
      ],
    };
  }

  const blockedCriteria = (deepAudit.explicitCriteria ?? []).filter(
    (criterion) => criterion.status !== 'verified',
  );

  return {
    artifact: deepAuditPath,
    checkedAt: deepAudit.checkedAt ?? null,
    status: deepAudit.status ?? 'unknown',
    objectiveRestatement:
      deepAudit.promptToArtifactChecklist?.objectiveRestatement ?? deepAudit.objective ?? 'unknown',
    checklist: deepAudit.checklist ?? null,
    commandEvidence: {
      commandCount: Array.isArray(deepAudit.commandManifest) ? deepAudit.commandManifest.length : 0,
      blockedCommands: (deepAudit.commandManifest ?? [])
        .filter((entry) => entry.durableEvidence?.status !== 'verified')
        .map((entry) => ({
          command: entry.command,
          evidence: entry.durableEvidence?.artifact ?? null,
          status: entry.durableEvidence?.status ?? 'blocked',
        })),
    },
    promptToArtifactChecklist: deepAudit.promptToArtifactChecklist ?? null,
    blockers: blockedCriteria.map((criterion) => ({
      evidence: criterion.evidence ?? [],
      finding: criterion.finding ?? null,
      id: criterion.id,
      requirement: criterion.requirement,
      status: criterion.status,
    })),
  };
}

function buildConsolidatedRemainingBlockers(deepBlockers) {
  return [
    {
      evidence: blocker.currentEvidence ?? [],
      finding: blocker.mustNotMarkCompleteBecause ?? null,
      id: blocker.id,
      requirement: blocker.requirement,
      source: 'COMPLETE_FIX_REQUIREMENTS.md',
      status: 'blocked',
    },
    ...deepBlockers.map((deepBlocker) => ({
      evidence: deepBlocker.evidence ?? [],
      finding: deepBlocker.finding ?? null,
      id: deepBlocker.id,
      requirement: deepBlocker.requirement ?? deepBlocker.id,
      source: 'DEEP_AUDIT_REQUIREMENTS_V2.md',
      status: deepBlocker.status ?? 'blocked',
    })),
  ];
}

function completionAuditCruxEvidence(cruxEvidence) {
  return uniquePresentStrings([
    'artifacts/manual-evidence/chrome-ux-report.json',
    cruxMonitoringPath,
    cruxCredentialsPath,
    existsSync(cruxLiveProbePath) ? cruxLiveProbePath : null,
    existsSync(pagespeedLiveProbePath) ? pagespeedLiveProbePath : null,
    existsSync(cruxBlockerRefreshPath) ? cruxBlockerRefreshPath : null,
    existsSync(pagesDomainPath) ? pagesDomainPath : null,
    index.remoteCruxEvidence?.latestMonitoringArtifact,
    index.remoteCruxEvidence?.latestRemoteRunCheck?.artifact,
    ...cruxEvidence.evidence.filter((entry) => entry.startsWith('latest terminal run:')),
  ]);
}

function uniquePresentStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function buildPhaseReports() {
  const sections = audit.checklist.sections ?? [];
  return sections.map((section, index) => ({
    phase: index + 1,
    section: section.title,
    checklist: {
      checked: section.checked,
      firstItem: section.firstItem,
      lastItem: section.lastItem,
      total: section.total,
      unchecked: section.unchecked,
    },
    status: section.unchecked === 0 ? 'complete' : 'incomplete',
    commandEvidence: {
      build: promptEvidence('npm run build, image-free output, under 100KB primary budget.'),
      coverage: promptEvidence('npm test:coverage result.'),
      lint: promptEvidence('npm run lint.'),
      typeCheck: promptEvidence('npm run type-check.'),
    },
    visualScreenshotEvidence: visualScreenshotEvidence(),
    remainingBlockers: blockersForSection(section),
  }));
}

function buildObjectivePhaseReports() {
  const sections = audit.checklist.sections ?? [];
  const definitions = [
    {
      phase: 1,
      label: '1주차: Section A — 환자 아바타 완전 재설계',
      sectionLetters: ['A'],
      claimedChecklistRows: 250,
    },
    {
      phase: 2,
      label: '2주차: Section B — 미구현 기능 완성',
      sectionLetters: ['B'],
      claimedChecklistRows: 200,
    },
    {
      phase: 3,
      label: '3주차: Section C — 코드 품질',
      sectionLetters: ['C'],
      claimedChecklistRows: 200,
    },
    {
      phase: 4,
      label: '4주차: Section D — 테스트 100%',
      sectionLetters: ['D'],
      claimedChecklistRows: 200,
    },
    {
      phase: 5,
      label: '5주차: Section E — 성능',
      sectionLetters: ['E'],
      claimedChecklistRows: 100,
    },
    {
      phase: 6,
      label: '6주차: Section F — 접근성',
      sectionLetters: ['F'],
      claimedChecklistRows: 100,
    },
    {
      phase: 7,
      label: '7주차: Section G, H, I — 보안/문서/배포',
      sectionLetters: ['G', 'H', 'I'],
      claimedChecklistRows: 150,
    },
  ];

  return definitions
    .map((definition) => {
      const phaseSections = sections.filter((section) =>
        definition.sectionLetters.includes(sectionLetter(section.title)),
      );
      if (phaseSections.length === 0) return null;
      const checklist = combineSectionChecklist(phaseSections);
      const checklistRowDeltaFromClaim = checklist.total - definition.claimedChecklistRows;
      return {
        phase: definition.phase,
        label: definition.label,
        sections: phaseSections.map((section) => section.title),
        claimedChecklistRows: definition.claimedChecklistRows,
        checklistRowDeltaFromClaim,
        checklist,
        status: checklist.unchecked === 0 && checklistRowDeltaFromClaim === 0 ? 'complete' : 'incomplete',
        commandEvidence: {
          build: promptEvidence('npm run build, image-free output, under 100KB primary budget.'),
          coverage: promptEvidence('npm test:coverage result.'),
          lint: promptEvidence('npm run lint.'),
          typeCheck: promptEvidence('npm run type-check.'),
        },
        visualScreenshotEvidence: visualScreenshotEvidence(),
        remainingBlockers: phaseSections.flatMap(blockersForSection),
      };
    })
    .filter(Boolean);
}

function sectionLetter(title) {
  return title.match(/SECTION\s+([A-I])/)?.[1] ?? '';
}

function combineSectionChecklist(sections) {
  return {
    checked: sections.reduce((sum, section) => sum + section.checked, 0),
    firstItem: Math.min(...sections.map((section) => section.firstItem)),
    lastItem: Math.max(...sections.map((section) => section.lastItem)),
    total: sections.reduce((sum, section) => sum + section.total, 0),
    unchecked: sections.reduce((sum, section) => sum + section.unchecked, 0),
  };
}

function promptEvidence(requirement) {
  const entry = index.promptRequirementMap.find((candidate) => candidate.requirement === requirement);
  return {
    evidence: entry?.evidence ?? [],
    notes: entry?.notes ?? null,
    status: entry?.status ?? null,
  };
}

function visualScreenshotEvidence() {
  return {
    ...promptEvidence('Section A patient avatar redesign and visual patient screenshot.'),
    screenshots: audit.screenshots ?? [],
    visualReview: audit.visualReview ?? null,
  };
}

function blockersForSection(section) {
  if (section.firstItem === null || section.firstItem === undefined) return [];
  if (section.lastItem === null || section.lastItem === undefined) return [];
  return audit.blockers.filter((candidate) => {
    const itemNumber = blockerItemNumber(candidate);
    return itemNumber >= section.firstItem && itemNumber <= section.lastItem;
  });
}

function blockerItemNumber(blocker) {
  if (typeof blocker.item === 'number') return blocker.item;
  const match = String(blocker.source ?? blocker.detail ?? '').match(/^(\d+)\.|\b(\d+)\./);
  return Number(match?.[1] ?? match?.[2] ?? 0);
}

function readOptionalJson(path) {
  return existsSync(path) ? readJson(path) : null;
}

function readLocalMonitoringSummary() {
  const monitoring = readOptionalJson(cruxMonitoringPath);
  if (!monitoring) return null;
  return {
    apiKeySource: monitoring.apiKeySource ?? null,
    artifact: cruxMonitoringPath,
    cruxCache: summarizeCruxCache(monitoring.checks?.cruxCache),
    fieldDataAvailable: monitoring.fieldDataAvailable ?? null,
    result: monitoring.result ?? null,
    verifiedAt: monitoring.verifiedAt ?? null,
  };
}

function readCruxBlockerRefreshSummary() {
  const refresh = readOptionalJson(cruxBlockerRefreshPath);
  if (!refresh) return null;
  const commands = Array.isArray(refresh.commands) ? refresh.commands : [];
  const unexpectedFailures = commands.filter(
    (command) =>
      !Array.isArray(command.allowedExitCodes) || !command.allowedExitCodes.includes(command.exitCode),
  );
  return {
    artifact: cruxBlockerRefreshPath,
    commandCount: commands.length,
    result: refresh.result ?? null,
    unexpectedFailureCount: unexpectedFailures.length,
    verifiedAt: refresh.verifiedAt ?? null,
  };
}

function readLocalCredentialsSummary() {
  const credentials = readOptionalJson(cruxCredentialsPath);
  if (!credentials) return null;
  return {
    artifact: cruxCredentialsPath,
    monitorApiKeySource: credentials.monitorApiKeySource ?? null,
    result: credentials.result ?? null,
    usableEnvFileNames: credentials.usableByCurrentMonitor?.envFileNames ?? [],
    usableGitHubSecretNames: credentials.usableByCurrentMonitor?.githubSecretNames ?? [],
    usableGitHubSecretsChecked: credentials.githubSecrets?.checked ?? null,
    usableGitHubEnvironmentSecretNames: credentials.githubEnvironments?.acceptedPresent?.secrets ?? [],
    usableGitHubEnvironmentSecretsChecked: githubEnvironmentSurfaceChecked(
      credentials.githubEnvironments,
      'secrets',
    ),
    usableGitHubEnvironmentVariableNames: credentials.githubEnvironments?.acceptedPresent?.variables ?? [],
    usableGitHubEnvironmentVariablesChecked: githubEnvironmentSurfaceChecked(
      credentials.githubEnvironments,
      'variables',
    ),
    usableLocalEnvironmentNames: credentials.usableByCurrentMonitor?.localEnvironmentNames ?? [],
    nonAcceptedCredentialNames: credentials.nonAcceptedCredentialNames ?? null,
    verifiedAt: credentials.verifiedAt ?? null,
  };
}

function readPagesDomainSummary() {
  const pagesDomain = readOptionalJson(pagesDomainPath);
  if (!pagesDomain) return null;
  return {
    artifact: pagesDomainPath,
    connectedOrigins: pagesDomain.connectedOrigins ?? [],
    expectedOrigin: pagesDomain.expectedOrigin ?? null,
    expectedOriginConnected: pagesDomain.expectedOriginConnected ?? null,
    pagesStatus: pagesDomain.pages?.status ?? null,
    result: pagesDomain.result ?? null,
    verifiedAt: pagesDomain.verifiedAt ?? null,
  };
}

function readRemoteCruxSummary(remoteCruxEvidence) {
  const artifactPath = remoteCruxEvidence?.latestMonitoringArtifact;
  if (!artifactPath || !existsSync(artifactPath)) return null;

  const runDirectory = artifactPath.replace(/\/chrome-ux-report-monitoring\.json$/, '');
  const monitoring = readJson(artifactPath);
  const credentials = readOptionalJson(`${runDirectory}/chrome-ux-report-credentials.json`);
  const cruxLiveProbe = readOptionalJson(`${runDirectory}/crux-live-probe.json`);
  const pagespeedLiveProbe = readOptionalJson(`${runDirectory}/pagespeed-live-probe.json`);
  const pagesDomain = readOptionalJson(`${runDirectory}/github-pages-domain.json`);
  const run = readOptionalJson(`${runDirectory}/run.json`);
  const issue = readOptionalJson(`${runDirectory}/issue.json`);

  return {
    artifact: artifactPath,
    apiKeySource: monitoring.apiKeySource ?? null,
    credentialArtifact: `${runDirectory}/chrome-ux-report-credentials.json`,
    credentialMonitorApiKeySource: credentials?.monitorApiKeySource ?? null,
    credentialResult: credentials?.result ?? null,
    credentialUsableEnvFileNames: credentials?.usableByCurrentMonitor?.envFileNames ?? [],
    credentialUsableGitHubSecretNames: credentials?.usableByCurrentMonitor?.githubSecretNames ?? [],
    credentialUsableGitHubSecretsChecked: credentials?.githubSecrets?.checked ?? null,
    credentialUsableGitHubEnvironmentSecretNames:
      credentials?.githubEnvironments?.acceptedPresent?.secrets ?? [],
    credentialUsableGitHubEnvironmentSecretsChecked: githubEnvironmentSurfaceChecked(
      credentials?.githubEnvironments,
      'secrets',
    ),
    credentialUsableGitHubEnvironmentVariableNames:
      credentials?.githubEnvironments?.acceptedPresent?.variables ?? [],
    credentialUsableGitHubEnvironmentVariablesChecked: githubEnvironmentSurfaceChecked(
      credentials?.githubEnvironments,
      'variables',
    ),
    credentialUsableLocalEnvironmentNames: credentials?.usableByCurrentMonitor?.localEnvironmentNames ?? [],
    credentialNonAcceptedCredentialNames: credentials?.nonAcceptedCredentialNames ?? null,
    cruxLiveProbe: summarizeCruxLiveProbe(cruxLiveProbe, `${runDirectory}/crux-live-probe.json`),
    cruxCache: summarizeCruxCache(monitoring.checks?.cruxCache),
    fieldDataAvailable: monitoring.fieldDataAvailable ?? null,
    issue: remoteCruxEvidence?.blockerIssue ?? issue?.url ?? null,
    issueCommentCount: Array.isArray(issue?.comments) ? issue.comments.length : null,
    issueState: issue?.state ?? null,
    issueUpdatedAt: issue?.updatedAt ?? null,
    pagesDomain: pagesDomain
      ? {
          artifact: `${runDirectory}/github-pages-domain.json`,
          connectedOrigins: pagesDomain.connectedOrigins ?? [],
          expectedOrigin: pagesDomain.expectedOrigin ?? null,
          expectedOriginConnected: pagesDomain.expectedOriginConnected ?? null,
          pagesStatus: pagesDomain.pages?.status ?? null,
          result: pagesDomain.result ?? null,
          verifiedAt: pagesDomain.verifiedAt ?? null,
        }
      : null,
    pagespeedLiveProbe: summarizePagespeedLiveProbe(
      pagespeedLiveProbe,
      `${runDirectory}/pagespeed-live-probe.json`,
    ),
    runConclusion: remoteCruxEvidence?.latestRunConclusion ?? run?.conclusion ?? null,
    runHeadSha: run?.headSha ?? remoteCruxEvidence?.latestWorkflowCommit ?? null,
    runId: remoteCruxEvidence?.latestRunId ?? run?.databaseId ?? null,
    runUrl: run?.url ?? null,
    verifiedAt: monitoring.verifiedAt ?? null,
  };
}

function summarizeCruxLiveProbe(probe, artifact) {
  if (!probe) return null;
  return {
    artifact,
    result: probe.result ?? null,
    verifiedAt: probe.verifiedAt ?? null,
    originRecordPresent: namedProbeRecordPresent(probe, 'origin'),
    originStatus: namedProbeStatus(probe, 'origin'),
    urlRecordPresent: namedProbeRecordPresent(probe, 'url'),
    urlStatus: namedProbeStatus(probe, 'url'),
  };
}

function summarizePagespeedLiveProbe(probe, artifact) {
  if (!probe) return null;
  return {
    artifact,
    errorStatus: probe.errorStatus ?? null,
    hasLoadingExperience: probe.hasLoadingExperience ?? null,
    hasOriginLoadingExperience: probe.hasOriginLoadingExperience ?? null,
    result: probe.result ?? null,
    status: probe.status ?? null,
    verifiedAt: probe.verifiedAt ?? null,
  };
}

function namedProbeStatus(probe, name) {
  return probe.probes?.find((entry) => entry.name === name)?.status ?? null;
}

function namedProbeRecordPresent(probe, name) {
  return probe.probes?.find((entry) => entry.name === name)?.recordPresent ?? null;
}

function summarizeCruxCache(cache) {
  if (!cache) return null;
  return {
    dataset: cache.dataset ?? null,
    foundOrigin: cache.foundOrigin ?? null,
    latestMonth: cache.latestMonth ?? null,
    origins: cache.origins ?? null,
    scanEnabled: cache.scanEnabled ?? null,
    scannedChunks: cache.scannedChunks ?? null,
    totalChunks: cache.totalChunks ?? null,
  };
}

function githubEnvironmentSurfaceChecked(githubEnvironments, kind) {
  if (!githubEnvironments) return null;
  if (githubEnvironments.checked === false) return false;
  const environments = Array.isArray(githubEnvironments.environments) ? githubEnvironments.environments : [];
  return !environments.some((environment) => environment[kind]?.checked === false);
}

async function writeJson(path, value) {
  writeFileSync(
    path,
    await format(JSON.stringify(value), { ...((await resolveConfig(path)) ?? {}), parser: 'json' }),
  );
}
