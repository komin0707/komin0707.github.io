import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const auditPath = 'artifacts/completion-audit.json';
const blockersPath = 'artifacts/manual-evidence/remaining-external-blockers.json';
const finalBlockerSummaryPath = 'artifacts/manual-evidence/final-blocker-summary.json';
const indexPath = 'artifacts/completion-evidence-index.json';
const cruxBlockerRefreshPath = 'artifacts/manual-evidence/crux-blocker-refresh.json';
const cruxCredentialsPath = 'artifacts/manual-evidence/chrome-ux-report-credentials.json';
const cruxLiveProbePath = 'artifacts/manual-evidence/crux-live-probe.json';
const cruxMonitoringPath = 'artifacts/manual-evidence/chrome-ux-report-monitoring.json';
const pagespeedLiveProbePath = 'artifacts/manual-evidence/pagespeed-live-probe.json';
const pagesDomainPath = 'artifacts/manual-evidence/github-pages-domain.json';
const cruxOperatorNextSteps = [
  'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
  'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
  'gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io',
  'npm run refresh:crux-blocker-evidence',
];

const audit = readJson(auditPath);
const blockerEvidence = readJson(blockersPath);
const finalBlockerSummary = existsSync(finalBlockerSummaryPath) ? readJson(finalBlockerSummaryPath) : null;
const index = existsSync(indexPath) ? readJson(indexPath) : {};
const evidenceByItem = new Map(blockerEvidence.blockers.map((blocker) => [blocker.item, blocker]));

const lines = [
  `Completion status: ${audit.status}`,
  `Objective status: ${index.objective?.status ?? 'unknown'}`,
  `Checklist: ${audit.checklist.checked}/${audit.checklist.observedTotal} checked; ${audit.checklist.unchecked} unchecked`,
  `Blockers: ${audit.blockers.length}`,
];

if (blockerEvidence.checklistState?.note) {
  lines.push(`Checklist note: ${blockerEvidence.checklistState.note}`);
}

if (index.objective?.claimedChecklistRows && index.objective?.phaseClaimedChecklistRowsTotal) {
  lines.push(
    `Objective row claims: total claim ${String(index.objective.claimedChecklistRows)}; phase claims ${String(
      index.objective.phaseClaimedChecklistRowsTotal,
    )}; actual ${String(index.objective.actualChecklistRowsObserved)}; actual-total delta ${String(
      index.objective.checklistRowDeltaFromClaim,
    )}; actual-phase delta ${String(index.objective.checklistRowDeltaFromPhaseClaims)}; phase-total delta ${String(
      index.objective.phaseClaimsDeltaFromClaimedTotal,
    )}`,
  );
}

if (audit.objectiveRowClaim?.enabled) {
  lines.push(
    `Audit objective row claim: ${audit.objectiveRowClaim.status}; claimed ${String(
      audit.objectiveRowClaim.claimedChecklistRows,
    )}; actual ${String(audit.objectiveRowClaim.actualChecklistRowsObserved)}; delta ${String(
      audit.objectiveRowClaim.checklistRowDeltaFromClaim,
    )}; satisfied ${String(audit.objectiveRowClaim.satisfied)}`,
  );
}

if (audit.objectivePhaseClaim?.enabled) {
  lines.push(
    `Audit objective phase claim: ${audit.objectivePhaseClaim.status}; phase claims ${String(
      audit.objectivePhaseClaim.phaseClaimedChecklistRowsTotal,
    )}; actual ${String(audit.objectivePhaseClaim.actualChecklistRowsObserved)}; actual-phase delta ${String(
      audit.objectivePhaseClaim.checklistRowDeltaFromPhaseClaims,
    )}; phase-total delta ${String(
      audit.objectivePhaseClaim.phaseClaimsDeltaFromClaimedTotal,
    )}; satisfied ${String(audit.objectivePhaseClaim.satisfied)}`,
  );
}

if (blockerEvidence.verifiedAt) {
  lines.push(`Evidence verified at: ${blockerEvidence.verifiedAt}`);
}

if (Array.isArray(finalBlockerSummary?.completionAudit?.inspectedRequirements)) {
  lines.push(`Completion audit verdict: ${finalBlockerSummary.completionAudit.verdict ?? 'unknown'}`);
  for (const requirement of finalBlockerSummary.completionAudit.inspectedRequirements) {
    lines.push(
      `  ${requirement.requirement}: ${requirement.status ?? 'unknown'}; ${requirement.finding ?? 'no finding'}`,
    );
  }
}

if (Array.isArray(finalBlockerSummary?.doNotCompleteYet) && finalBlockerSummary.doNotCompleteYet.length > 0) {
  lines.push('Do not complete yet:');
  for (const warning of finalBlockerSummary.doNotCompleteYet) {
    lines.push(`  - ${warning}`);
  }
}

const objectivePhases = buildObjectivePhases(audit.checklist.sections ?? []);
if (objectivePhases.length > 0) {
  lines.push('Objective phases:');
  for (const phase of objectivePhases) {
    lines.push(
      `  ${String(phase.phase)}. ${phase.label}: ${String(phase.checked)}/${String(
        phase.total,
      )} checked; ${String(phase.unchecked)} unchecked; claimed ${String(
        phase.claimedChecklistRows,
      )}; delta ${String(phase.checklistRowDeltaFromClaim)} (items ${String(
        phase.firstItem,
      )}-${String(phase.lastItem)}); status ${phase.status}; blockers ${String(phase.blockers)}`,
    );
  }
}

if (Array.isArray(audit.checklist.sections) && audit.checklist.sections.length > 0) {
  lines.push('Sections:');
  for (const section of audit.checklist.sections) {
    lines.push(
      `  ${section.title}: ${String(section.checked)}/${String(section.total)} checked; ${String(
        section.unchecked,
      )} unchecked (items ${String(section.firstItem)}-${String(section.lastItem)})`,
    );
  }
}

lines.push('');

for (const blocker of audit.blockers) {
  const itemNumber = blockerItemNumber(blocker);
  const evidence = evidenceByItem.get(itemNumber);
  lines.push(`${blocker.source ?? blocker.id}`);
  lines.push(`  id: ${blocker.id}`);
  lines.push(`  detail: ${blocker.detail}`);
  const cruxStatus = blocker.id === 'chrome-ux-report' ? readCruxStatus(index) : null;
  if (cruxStatus) {
    lines.push(`  latest local monitoring: ${cruxStatus.localMonitoring}`);
    lines.push(`  latest local batch refresh: ${cruxStatus.localBatchRefresh}`);
    lines.push(`  latest local public CrUX cache: ${cruxStatus.localCruxCache}`);
    lines.push(`  latest direct CrUX API probe: ${cruxStatus.localCruxLiveProbe}`);
    lines.push(`  latest direct PageSpeed API probe: ${cruxStatus.localPagespeedLiveProbe}`);
    lines.push(`  latest local credentials: ${cruxStatus.localCredentials}`);
    lines.push(`  latest Pages domain: ${cruxStatus.pagesDomain}`);
    lines.push(`  latest remote run: ${cruxStatus.runUrl}`);
    lines.push(`  latest remote run commit: ${cruxStatus.runHeadSha}`);
    lines.push(`  latest remote conclusion: ${cruxStatus.runConclusion}`);
    lines.push(`  latest remote artifact: ${cruxStatus.artifactPath}`);
    lines.push(`  latest remote run check: ${cruxStatus.latestRemoteRunCheck}`);
    lines.push(`  latest remote Pages domain: ${cruxStatus.remotePagesDomain}`);
    lines.push(`  latest remote field data available: ${String(cruxStatus.fieldDataAvailable)}`);
    lines.push(`  latest remote credential result: ${cruxStatus.credentialResult}`);
    lines.push(`  latest remote monitoring: ${cruxStatus.remoteMonitoring}`);
    lines.push(`  latest remote public CrUX cache: ${cruxStatus.remoteCruxCache}`);
    lines.push(`  latest remote direct CrUX API probe: ${cruxStatus.remoteCruxLiveProbe}`);
    lines.push(`  latest remote direct PageSpeed API probe: ${cruxStatus.remotePagespeedLiveProbe}`);
    lines.push(`  latest remote credentials: ${cruxStatus.remoteCredentials}`);
    lines.push(`  blocker issue: ${cruxStatus.issueUrl}`);
    lines.push(`  blocker issue status: ${cruxStatus.issueStatus}`);
  }
  if (evidence) {
    if (Array.isArray(evidence.acceptedCredentialNames) && evidence.acceptedCredentialNames.length > 0) {
      lines.push(`  accepted credential names: ${evidence.acceptedCredentialNames.join(', ')}`);
    }
    lines.push('  required to complete:');
    for (const requirement of evidence.requiredToComplete) {
      lines.push(`    - ${requirement}`);
    }
  }
  if (blocker.id === 'chrome-ux-report') {
    const operatorNextSteps = Array.isArray(evidence?.operatorNextSteps)
      ? evidence.operatorNextSteps
      : cruxOperatorNextSteps;
    lines.push('  operator next steps:');
    for (const command of operatorNextSteps) {
      lines.push(`    - ${command}`);
    }
  }
  lines.push('');
}

process.stdout.write(`${lines.join('\n')}\n`);

if (audit.status === 'complete' && index.objective?.status === 'achieved') {
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function buildObjectivePhases(sections) {
  const definitions = [
    {
      label: '1주차: Section A — 환자 아바타 완전 재설계',
      phase: 1,
      sectionLetters: ['A'],
      claimedChecklistRows: 250,
    },
    {
      label: '2주차: Section B — 미구현 기능 완성',
      phase: 2,
      sectionLetters: ['B'],
      claimedChecklistRows: 200,
    },
    {
      label: '3주차: Section C — 코드 품질',
      phase: 3,
      sectionLetters: ['C'],
      claimedChecklistRows: 200,
    },
    {
      label: '4주차: Section D — 테스트 100%',
      phase: 4,
      sectionLetters: ['D'],
      claimedChecklistRows: 200,
    },
    {
      label: '5주차: Section E — 성능',
      phase: 5,
      sectionLetters: ['E'],
      claimedChecklistRows: 100,
    },
    {
      label: '6주차: Section F — 접근성',
      phase: 6,
      sectionLetters: ['F'],
      claimedChecklistRows: 100,
    },
    {
      label: '7주차: Section G, H, I — 보안/문서/배포',
      phase: 7,
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
      const total = phaseSections.reduce((sum, section) => sum + section.total, 0);
      const unchecked = phaseSections.reduce((sum, section) => sum + section.unchecked, 0);
      const checklistRowDeltaFromClaim = total - definition.claimedChecklistRows;
      return {
        blockers: countBlockersForRange(phaseSections),
        claimedChecklistRows: definition.claimedChecklistRows,
        checked: phaseSections.reduce((sum, section) => sum + section.checked, 0),
        checklistRowDeltaFromClaim,
        firstItem: Math.min(...phaseSections.map((section) => section.firstItem)),
        label: definition.label,
        lastItem: Math.max(...phaseSections.map((section) => section.lastItem)),
        phase: definition.phase,
        status: unchecked === 0 && checklistRowDeltaFromClaim === 0 ? 'complete' : 'incomplete',
        total,
        unchecked,
      };
    })
    .filter(Boolean);
}

function countBlockersForRange(sections) {
  return audit.blockers.filter((blocker) => {
    const itemNumber = blockerItemNumber(blocker);
    return sections.some((section) => itemNumber >= section.firstItem && itemNumber <= section.lastItem);
  }).length;
}

function blockerItemNumber(blocker) {
  if (typeof blocker.item === 'number') return blocker.item;
  const match = String(blocker.source ?? blocker.detail ?? '').match(/^(\d+)\.|\b(\d+)\./);
  return Number(match?.[1] ?? match?.[2] ?? 0);
}

function sectionLetter(title) {
  return title.match(/SECTION\s+([A-I])/)?.[1] ?? '';
}

function readCruxStatus(indexManifest) {
  const remote = indexManifest.remoteCruxEvidence;
  const localBatchRefresh = existsSync(cruxBlockerRefreshPath) ? readJson(cruxBlockerRefreshPath) : null;
  const localMonitoring = existsSync(cruxMonitoringPath) ? readJson(cruxMonitoringPath) : {};
  const localCredentials = existsSync(cruxCredentialsPath) ? readJson(cruxCredentialsPath) : {};
  const localCruxLiveProbe = existsSync(cruxLiveProbePath) ? readJson(cruxLiveProbePath) : null;
  const localPagespeedLiveProbe = existsSync(pagespeedLiveProbePath)
    ? readJson(pagespeedLiveProbePath)
    : null;
  const pagesDomain = existsSync(pagesDomainPath) ? readJson(pagesDomainPath) : {};
  if (!remote?.latestMonitoringArtifact || !existsSync(remote.latestMonitoringArtifact)) return null;

  const runDirectory = remote.latestMonitoringArtifact.replace(/\/chrome-ux-report-monitoring\.json$/, '');
  const monitoring = readJson(remote.latestMonitoringArtifact);
  const credentialsPath = `${runDirectory}/chrome-ux-report-credentials.json`;
  const remoteCruxLiveProbePath = `${runDirectory}/crux-live-probe.json`;
  const remotePagespeedLiveProbePath = `${runDirectory}/pagespeed-live-probe.json`;
  const remotePagesDomainPath = `${runDirectory}/github-pages-domain.json`;
  const runPath = `${runDirectory}/run.json`;
  const issuePath = `${runDirectory}/issue.json`;
  const credentials = existsSync(credentialsPath) ? readJson(credentialsPath) : {};
  const remoteCruxLiveProbe = existsSync(remoteCruxLiveProbePath) ? readJson(remoteCruxLiveProbePath) : null;
  const remotePagespeedLiveProbe = existsSync(remotePagespeedLiveProbePath)
    ? readJson(remotePagespeedLiveProbePath)
    : null;
  const remotePagesDomain = existsSync(remotePagesDomainPath) ? readJson(remotePagesDomainPath) : {};
  const run = existsSync(runPath) ? readJson(runPath) : {};
  const issue = existsSync(issuePath) ? readJson(issuePath) : {};

  return {
    artifactPath: remote.latestMonitoringArtifact,
    credentialResult: credentials.result ?? 'unknown',
    fieldDataAvailable: monitoring.fieldDataAvailable ?? null,
    issueStatus: formatIssueStatus(issue),
    issueUrl: remote.blockerIssue ?? issue.url ?? 'unknown',
    latestRemoteRunCheck: formatLatestRemoteRunCheck(remote.latestRemoteRunCheck),
    localBatchRefresh: formatCruxBlockerRefreshStatus(localBatchRefresh),
    localCruxCache: formatCruxCacheStatus(localMonitoring.checks?.cruxCache),
    localCruxLiveProbe: formatCruxLiveProbeStatus(localCruxLiveProbe),
    localCredentials: formatLocalCredentialStatus(localCredentials),
    localMonitoring: formatLocalMonitoringStatus(localMonitoring),
    localPagespeedLiveProbe: formatPagespeedLiveProbeStatus(localPagespeedLiveProbe),
    pagesDomain: formatPagesDomainStatus(pagesDomain),
    remoteCredentials: formatRemoteCredentialStatus(credentials),
    remoteCruxCache: formatCruxCacheStatus(monitoring.checks?.cruxCache),
    remoteCruxLiveProbe: formatCruxLiveProbeStatus(remoteCruxLiveProbe),
    remoteMonitoring: formatRemoteMonitoringStatus(monitoring),
    remotePagespeedLiveProbe: formatPagespeedLiveProbeStatus(remotePagespeedLiveProbe),
    remotePagesDomain: formatPagesDomainStatus(remotePagesDomain),
    runConclusion: remote.latestRunConclusion ?? run.conclusion ?? 'unknown',
    runHeadSha: run.headSha ?? remote.latestWorkflowCommit ?? 'unknown',
    runUrl: run.url ?? `run ${String(remote.latestRunId ?? 'unknown')}`,
  };
}

function formatLocalMonitoringStatus(value) {
  if (!value.verifiedAt) return 'unknown';
  return `${value.result ?? 'unknown'} at ${value.verifiedAt}; fieldDataAvailable ${String(
    value.fieldDataAvailable ?? 'unknown',
  )}`;
}

function formatRemoteMonitoringStatus(value) {
  return `${value.result ?? 'unknown'}; fieldDataAvailable ${String(
    value.fieldDataAvailable ?? 'unknown',
  )}; monitor key source ${formatApiKeySource(value.apiKeySource)}`;
}

function formatLatestRemoteRunCheck(value) {
  if (!value) return 'missing';
  return `${value.result ?? 'unknown'} at ${value.verifiedAt ?? 'unknown'}; latest run ${String(
    value.latestRemoteRunId ?? 'unknown',
  )}; indexed run ${String(value.indexedRunId ?? 'unknown')}; artifact exists ${String(
    value.indexedArtifactExists ?? 'unknown',
  )}; artifact matches latest run ${String(
    value.indexedArtifactMatchesRun ?? 'unknown',
  )}; workflow commit matches latest ${String(value.indexedWorkflowCommitMatchesLatest ?? 'unknown')}`;
}

function formatCruxCacheStatus(value) {
  if (!value) return 'unknown';
  const scannedChunks =
    value.scannedChunks === undefined || value.totalChunks === undefined
      ? 'unknown'
      : `${String(value.scannedChunks)}/${String(value.totalChunks)}`;
  const origins =
    typeof value.origins === 'number' ? ` across ${value.origins.toLocaleString('en-US')} origins` : '';
  return `scanEnabled ${String(value.scanEnabled ?? 'unknown')}; latest month ${
    value.latestMonth ?? 'unknown'
  }; scanned chunks ${scannedChunks}${origins}; found origin ${String(value.foundOrigin ?? 'unknown')}`;
}

function formatCruxBlockerRefreshStatus(value) {
  if (!value) return 'missing';
  const commands = Array.isArray(value.commands) ? value.commands : [];
  const unexpectedFailures = commands.filter(
    (command) =>
      !Array.isArray(command.allowedExitCodes) || !command.allowedExitCodes.includes(command.exitCode),
  );
  return `${value.result ?? 'unknown'} at ${value.verifiedAt ?? 'unknown'}; commands ${String(
    commands.length,
  )}; unexpected failures ${String(unexpectedFailures.length)}`;
}

function formatCruxLiveProbeStatus(value) {
  if (!value) return 'missing';
  return `verified ${value.verifiedAt ?? 'unknown'}; origin status ${formatNamedProbeStatus(
    value,
    'origin',
  )}; URL status ${formatNamedProbeStatus(value, 'url')}; records ${formatNamedProbeRecord(
    value,
    'origin',
  )}/${formatNamedProbeRecord(value, 'url')}`;
}

function formatPagespeedLiveProbeStatus(value) {
  if (!value) return 'missing';
  return `verified ${value.verifiedAt ?? 'unknown'}; status ${String(
    value.status ?? 'unknown',
  )}; loadingExperience ${value.hasLoadingExperience === true ? 'present' : 'absent'}; originLoadingExperience ${
    value.hasOriginLoadingExperience === true ? 'present' : 'absent'
  }; error ${value.errorStatus ?? 'none'}`;
}

function formatNamedProbeStatus(probe, name) {
  const entry = probe.probes?.find((item) => item.name === name);
  return String(entry?.status ?? 'unknown');
}

function formatNamedProbeRecord(probe, name) {
  const entry = probe.probes?.find((item) => item.name === name);
  return entry?.recordPresent === true ? 'present' : 'absent';
}

function formatIssueStatus(value) {
  const state = value.state ?? 'unknown';
  const updatedAt = value.updatedAt ?? 'unknown';
  const commentCount = Array.isArray(value.comments) ? value.comments.length : 'unknown';
  return `${state}; updated ${updatedAt}; comments ${String(commentCount)}`;
}

function formatLocalCredentialStatus(value) {
  if (!value.verifiedAt) return 'unknown';
  return `${value.result ?? 'unknown'} at ${value.verifiedAt}; usable exported env ${formatList(
    value.usableByCurrentMonitor?.localEnvironmentNames,
  )}; usable env files ${formatList(
    value.usableByCurrentMonitor?.envFileNames,
  )}; usable GitHub secrets ${formatCredentialSurface(
    value.usableByCurrentMonitor?.githubSecretNames,
    value.githubSecrets,
  )}; GitHub environment secrets ${formatEnvironmentCredentialSurface(
    value.githubEnvironments,
    'secrets',
  )}; GitHub environment variables ${formatEnvironmentCredentialSurface(
    value.githubEnvironments,
    'variables',
  )}; non-accepted local credential names ${formatNonAcceptedCredentialNames(
    value.nonAcceptedCredentialNames,
  )}; monitor key source ${formatApiKeySource(value.monitorApiKeySource)}`;
}

function formatRemoteCredentialStatus(value) {
  return `${value.result ?? 'unknown'}; usable exported env ${formatList(
    value.usableByCurrentMonitor?.localEnvironmentNames,
  )}; usable env files ${formatList(value.usableByCurrentMonitor?.envFileNames)}; usable GitHub secrets ${formatCredentialSurface(
    value.usableByCurrentMonitor?.githubSecretNames,
    value.githubSecrets,
  )}; GitHub environment secrets ${formatEnvironmentCredentialSurface(
    value.githubEnvironments,
    'secrets',
  )}; GitHub environment variables ${formatEnvironmentCredentialSurface(
    value.githubEnvironments,
    'variables',
  )}; non-accepted local credential names ${formatNonAcceptedCredentialNames(
    value.nonAcceptedCredentialNames,
  )}; monitor key source ${formatApiKeySource(value.monitorApiKeySource)}`;
}

function formatPagesDomainStatus(value) {
  if (!value.verifiedAt) return 'unknown';
  return `${value.result ?? 'unknown'} at ${value.verifiedAt}; expected ${
    value.expectedOrigin ?? 'unknown'
  }; connected ${formatList(value.connectedOrigins)}; CNAME ${
    value.cnameFile?.exists ? (value.cnameFile.value ?? 'unknown') : 'absent'
  }`;
}

function formatList(values) {
  return Array.isArray(values) && values.length > 0 ? values.join(', ') : 'none';
}

function formatCredentialSurface(values, surface) {
  if (Array.isArray(values) && values.length > 0) return values.join(', ');
  return surface?.checked === false ? 'unchecked' : 'none';
}

function formatEnvironmentCredentialSurface(githubEnvironments, kind) {
  const values = githubEnvironments?.acceptedPresent?.[kind];
  if (Array.isArray(values) && values.length > 0) return values.join(', ');
  const environments = Array.isArray(githubEnvironments?.environments) ? githubEnvironments.environments : [];
  const hasUncheckedEnvironment = environments.some((environment) => environment[kind]?.checked === false);
  return githubEnvironments?.checked === false || hasUncheckedEnvironment ? 'unchecked' : 'none';
}

function formatNonAcceptedCredentialNames(value) {
  if (!value?.checked) return 'unchecked';
  const envFileNames = Array.isArray(value.envFileNames)
    ? value.envFileNames.flatMap((entry) => (Array.isArray(entry.names) ? entry.names : []))
    : [];
  const localEnvironmentNames = Array.isArray(value.localEnvironmentNames) ? value.localEnvironmentNames : [];
  return formatList([...new Set([...envFileNames, ...localEnvironmentNames])]);
}

function formatApiKeySource(source) {
  if (!source || source.source === 'none') return 'none';
  const name = source.name ?? 'unknown';
  return source.path ? `${source.source}:${source.path}:${name}` : `${source.source}:${name}`;
}
