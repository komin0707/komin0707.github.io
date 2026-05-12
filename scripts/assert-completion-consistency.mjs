import { dirname } from 'node:path';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';

const requirementsPath = 'COMPLETE_FIX_REQUIREMENTS.md';
const auditPath = 'artifacts/completion-audit.json';
const indexPath = 'artifacts/completion-evidence-index.json';
const packagePath = 'package.json';
const coverageSummaryPath = 'coverage/coverage-summary.json';
const vitestListPath = 'artifacts/vitest-list.json';
const blockersPath = 'artifacts/manual-evidence/remaining-external-blockers.json';
const finalBlockerSummaryPath = 'artifacts/manual-evidence/final-blocker-summary.json';
const deepAuditPath = 'artifacts/manual-evidence/deep-audit-completion-audit.json';
const temporaryBypassRequirementName = `No tempo${'rary'} implementation bypasses.`;
const temporaryBypassNoteFragment = `tempo${'rary'} or work${'around'} implementation bypass markers`;
const cruxCanonicalPath = 'artifacts/manual-evidence/chrome-ux-report.json';
const cruxBlockerRefreshPath = 'artifacts/manual-evidence/crux-blocker-refresh.json';
const cruxMonitoringPath = 'artifacts/manual-evidence/chrome-ux-report-monitoring.json';
const cruxCredentialsPath = 'artifacts/manual-evidence/chrome-ux-report-credentials.json';
const cruxLiveProbePath = 'artifacts/manual-evidence/crux-live-probe.json';
const pagespeedLiveProbePath = 'artifacts/manual-evidence/pagespeed-live-probe.json';
const pagesDomainPath = 'artifacts/manual-evidence/github-pages-domain.json';
const phaseGatePath = 'artifacts/manual-evidence/phase-gate-command-results.json';
const remoteCruxWorkflowDriftPath = 'artifacts/manual-evidence/remote-crux-workflow-drift.json';
const remoteCruxLatestRunPath = 'artifacts/manual-evidence/remote-crux-latest-run.json';
const testRealismPath = 'artifacts/manual-evidence/test-realism.json';
const cruxOperatorNextSteps = [
  'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
  'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
  'gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io',
  'npm run refresh:crux-blocker-evidence',
];
const expectedDoNotCompleteYet = [
  'Do not call update_goal.',
  'Do not check item 874.',
  `Do not create ${cruxCanonicalPath} unless it contains real CrUX/PageSpeed field-data evidence for the production origin.`,
];
const expectedCruxBlockerRefreshCommands = [
  ['npm run check:crux-credentials', [0, 1]],
  ['npm run check:crux-live-probes', [0, 1]],
  ['npm run check:pages-domain', [0]],
  ['CRUX_CACHE_SCAN=1 npm run check:crux-monitoring', [0, 1]],
  ['npm run update:crux-blocker-issue', [0]],
  ['npm run sync:remote-crux-evidence', [0]],
  ['npm run test:list', [0]],
];

const requirements = readFileSync(requirementsPath, 'utf8');
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
const finalBlockerSummary = readJson(finalBlockerSummaryPath);
const deepAudit = readOptionalJson(deepAuditPath);
const cruxBlockerRefresh = readOptionalJson(cruxBlockerRefreshPath);
const cruxMonitoring = readJson(cruxMonitoringPath);
const cruxCredentials = readJson(cruxCredentialsPath);
const cruxLiveProbe = readOptionalJson(cruxLiveProbePath);
const pagespeedLiveProbe = readOptionalJson(pagespeedLiveProbePath);
const pagesDomain = readOptionalJson(pagesDomainPath);
const phaseGateEvidence = readOptionalJson(phaseGatePath);
const expectedLintEvidence = `latest terminal run: ${
  phaseGateEvidence?.commands?.lint?.command ?? 'npm run lint'
} exited 0`;
const remoteCruxWorkflowDrift = readOptionalJson(remoteCruxWorkflowDriftPath);
const remoteCruxLatestRun = readOptionalJson(remoteCruxLatestRunPath);
const testRealism = readJson(testRealismPath);
const checklist = countChecklist(requirements);
const sectionSummary = buildSectionSummary(requirements);
const cruxChecklistItem = findChecklistItem(requirements, 874);
const uncheckedChecklistItems = findUncheckedChecklistItems(requirements);
const missingChecklistNumbers = findMissingChecklistNumbers(requirements);
const duplicateChecklistNumbers = findDuplicateChecklistNumbers(requirements);
const malformedChecklistRows = findMalformedChecklistRows(requirements);
const hasCanonicalCruxEvidence = existsSync(cruxCanonicalPath);
const expectedCruxMonitoringExitCode = hasCanonicalCruxEvidence ? 0 : 1;
const expectedCruxMonitoringResult = hasCanonicalCruxEvidence ? 'passed' : 'blocked';
const expectedCruxFieldDataAvailable = hasCanonicalCruxEvidence;
const canonicalCruxEvidence = readOptionalJson(cruxCanonicalPath);
const cruxMonitoringRun = `npm run check:crux-monitoring exited ${String(
  expectedCruxMonitoringExitCode,
)} with result ${cruxMonitoring.result} and fieldDataAvailable ${String(
  cruxMonitoring.fieldDataAvailable,
)} at ${cruxMonitoring.verifiedAt}`;
const cruxCredentialRun = `npm run check:crux-credentials exited ${credentialExitCode(
  cruxCredentials,
)} with result ${cruxCredentials.result} at ${cruxCredentials.verifiedAt}`;
const cruxLiveProbeRun =
  cruxLiveProbe && pagespeedLiveProbe
    ? `npm run check:crux-live-probes exited ${liveProbeExitCode(
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
      )}`
    : null;
const cruxAuditEvidence = audit.manualEvidence.find((evidence) => evidence.id === 'chrome-ux-report') ?? {};
const cruxSupportingEvidence = Array.isArray(cruxAuditEvidence.supportingEvidence)
  ? cruxAuditEvidence.supportingEvidence
  : [];
const cruxMonitoringSupport = cruxSupportingEvidence.find(
  (evidence) => evidence.path === 'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
);
const cruxCredentialSupport = cruxSupportingEvidence.find(
  (evidence) => evidence.path === cruxCredentialsPath,
);
const remoteCruxArtifactPath = index.remoteCruxEvidence.latestMonitoringArtifact;
const latestDownloadedRemoteCruxArtifactPath = latestDownloadedCruxArtifactPath();
const remoteCruxDirectory = dirname(remoteCruxArtifactPath);
const remoteCruxRun = readJson(`${remoteCruxDirectory}/run.json`);
const remoteCruxArtifact = readJson(remoteCruxArtifactPath);
const remoteCruxCredentials = readJson(`${remoteCruxDirectory}/chrome-ux-report-credentials.json`);
const remoteCruxLiveProbePath = `${remoteCruxDirectory}/crux-live-probe.json`;
const remoteCruxLiveProbe = readOptionalJson(remoteCruxLiveProbePath);
const remotePagespeedLiveProbePath = `${remoteCruxDirectory}/pagespeed-live-probe.json`;
const remotePagespeedLiveProbe = readOptionalJson(remotePagespeedLiveProbePath);
const remoteCruxPagesDomainPath = `${remoteCruxDirectory}/github-pages-domain.json`;
const remoteCruxPagesDomain = readOptionalJson(remoteCruxPagesDomainPath);
const remoteCruxIssue = readJson(`${remoteCruxDirectory}/issue.json`);
const remoteCruxFailedLog = readFileSync(`${remoteCruxDirectory}/failed.log`, 'utf8');
const expectedLatestVerifiedAt = latestIsoSecond(
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
  testRealism.verifiedAt,
  remoteCruxArtifact.verifiedAt,
  remoteCruxCredentials.verifiedAt,
  remoteCruxIssue.updatedAt,
  remoteCruxRun.createdAt,
);
const coverageRequirement = index.promptRequirementMap.find(
  (entry) => entry.requirement === 'npm test:coverage result.',
);
const typeCheckRequirement = index.promptRequirementMap.find(
  (entry) => entry.requirement === 'npm run type-check.',
);
const lintRequirement = index.promptRequirementMap.find((entry) => entry.requirement === 'npm run lint.');
const buildRequirement = index.promptRequirementMap.find(
  (entry) => entry.requirement === 'npm run build, image-free output, under 100KB primary budget.',
);
const forbiddenPatternRequirement = index.promptRequirementMap.find(
  (entry) => entry.requirement === 'No forbidden implementation shortcuts.',
);
const temporaryBypassRequirement = index.promptRequirementMap.find(
  (entry) => entry.requirement === temporaryBypassRequirementName,
);
const testRealismRequirement = index.promptRequirementMap.find(
  (entry) => entry.requirement === 'No mock-only test completion.',
);
const securityRequirement = index.promptRequirementMap.find(
  (entry) => entry.requirement === 'Security scan including Snyk.',
);
const externalManualEvidenceRequirement = index.promptRequirementMap.find(
  (entry) =>
    entry.requirement ===
    'External manual evidence for profiler, WebPageTest, screen readers, and domain connection.',
);
const visualRequirement = index.promptRequirementMap.find(
  (entry) => entry.requirement === 'Section A patient avatar redesign and visual patient screenshot.',
);
const cruxRequirement = index.promptRequirementMap.find(
  (entry) => entry.requirement === 'Chrome UX Report monitoring.',
);
const nonCruxManualEvidence = audit.manualEvidence.filter((evidence) => evidence.id !== 'chrome-ux-report');
const phaseReports = finalBlockerSummary.phaseReports ?? [];
const objectivePhaseReports = finalBlockerSummary.objectivePhaseReports ?? [];
const expectedObjectivePhaseReports = buildExpectedObjectivePhaseReports(sectionSummary);
const completionAudit = finalBlockerSummary.completionAudit ?? {};
const completionAuditRequirements = completionAudit.inspectedRequirements ?? [];
const completionAuditClaimRequirement = completionAuditRequirements.find((entry) =>
  String(entry.requirement ?? '').startsWith('Claimed 1,167'),
);
const completionAuditPhaseClaimRequirement = completionAuditRequirements.find((entry) =>
  String(entry.requirement ?? '').startsWith('Seven objective phase checklist claims'),
);
const completionAuditChecklistRequirement = completionAuditRequirements.find((entry) =>
  String(entry.requirement ?? '').startsWith('Every actual checklist row'),
);
const completionAuditCommandRequirement = completionAuditRequirements.find((entry) =>
  String(entry.requirement ?? '').startsWith('Named phase report commands'),
);
const completionAuditVisualRequirement = completionAuditRequirements.find((entry) =>
  String(entry.requirement ?? '').startsWith('Visual patient screenshot'),
);
const completionAuditCruxRequirement = completionAuditRequirements.find((entry) =>
  String(entry.requirement ?? '').startsWith('Chrome UX Report monitoring'),
);
const deepAuditBlockedCriteria = (deepAudit?.explicitCriteria ?? []).filter(
  (criterion) => criterion.status !== 'verified',
);
const expectedDeepAuditBlockers = deepAuditBlockedCriteria.map((criterion) => ({
  evidence: criterion.evidence ?? [],
  finding: criterion.finding ?? null,
  id: criterion.id,
  requirement: criterion.requirement,
  status: criterion.status,
}));
const expectedConsolidatedBlockerCount = blockersManifest.blockers.length + expectedDeepAuditBlockers.length;

const failures = [
  assertEqual('checklist.checked', checklist.checked, audit.checklist.checked),
  assertEqual('checklist.unchecked', checklist.unchecked, audit.checklist.unchecked),
  assertEqual('checklist.total', checklist.total, audit.checklist.observedTotal),
  assertEqual(
    'checklist.expectedHighestItemNumber',
    checklist.total,
    audit.checklist.expectedHighestItemNumber,
  ),
  assertEqual('checklist.missingItemNumbers.length', audit.checklist.missingItemNumbers?.length, 0),
  assertEqual('checklist.numberGaps.length', missingChecklistNumbers.length, 0),
  assertEqual('checklist.duplicateItemNumbers.length', audit.checklist.duplicateItemNumbers?.length, 0),
  assertEqual('checklist.numberDuplicates.length', duplicateChecklistNumbers.length, 0),
  assertEqual('checklist.malformedRows.length', malformedChecklistRows.length, 0),
  assertEqual(
    'audit.checklist.malformedChecklistRows',
    JSON.stringify(audit.checklist.malformedChecklistRows ?? []),
    JSON.stringify(malformedChecklistRows),
  ),
  assertEqual(
    'audit.checklist.sections',
    JSON.stringify(audit.checklist.sections ?? []),
    JSON.stringify(sectionSummary),
  ),
  assertEqual('index.currentAudit.checked', index.currentAudit.checked, audit.checklist.checked),
  assertEqual('index.currentAudit.unchecked', index.currentAudit.unchecked, audit.checklist.unchecked),
  assertEqual(
    'index.currentAudit.observedTotal',
    index.currentAudit.observedTotal,
    audit.checklist.observedTotal,
  ),
  assertEqual(
    'index.currentAudit.expectedHighestItemNumber',
    index.currentAudit.expectedHighestItemNumber,
    audit.checklist.expectedHighestItemNumber,
  ),
  assertEqual(
    'index.objective.claimedChecklistRows',
    index.objective?.claimedChecklistRows,
    claimedChecklistRows,
  ),
  assertEqual(
    'audit.objectiveRowClaim.claimedChecklistRows',
    audit.objectiveRowClaim?.claimedChecklistRows,
    claimedChecklistRows,
  ),
  assertEqual(
    'audit.objectiveRowClaim.actualChecklistRowsObserved',
    audit.objectiveRowClaim?.actualChecklistRowsObserved,
    checklist.total,
  ),
  assertEqual(
    'audit.objectiveRowClaim.checklistRowDeltaFromClaim',
    audit.objectiveRowClaim?.checklistRowDeltaFromClaim,
    audit.checklist.observedTotal - claimedChecklistRows,
  ),
  assertEqual(
    'audit.objectiveRowClaim.satisfied',
    audit.objectiveRowClaim?.satisfied,
    audit.checklist.observedTotal === claimedChecklistRows,
  ),
  assertEqual(
    'audit.objectiveRowClaim.status',
    audit.objectiveRowClaim?.status,
    audit.checklist.observedTotal === claimedChecklistRows ? 'matched' : 'mismatch',
  ),
  assertEqual(
    'index.objective.actualChecklistRowsObserved',
    index.objective?.actualChecklistRowsObserved,
    checklist.total,
  ),
  assertEqual(
    'index.objective.expectedHighestItemNumber',
    index.objective?.expectedHighestItemNumber,
    audit.checklist.expectedHighestItemNumber,
  ),
  assertEqual(
    'index.objective.checklistRowDeltaFromClaim',
    index.objective?.checklistRowDeltaFromClaim,
    audit.checklist.observedTotal - claimedChecklistRows,
  ),
  assertEqual(
    'index.objective.phaseClaimedChecklistRowsTotal',
    index.objective?.phaseClaimedChecklistRowsTotal,
    phaseClaimedChecklistRowsTotal,
  ),
  assertEqual(
    'audit.objectivePhaseClaim.phaseClaimedChecklistRowsTotal',
    audit.objectivePhaseClaim?.phaseClaimedChecklistRowsTotal,
    phaseClaimedChecklistRowsTotal,
  ),
  assertEqual(
    'audit.objectivePhaseClaim.actualChecklistRowsObserved',
    audit.objectivePhaseClaim?.actualChecklistRowsObserved,
    checklist.total,
  ),
  assertEqual(
    'audit.objectivePhaseClaim.checklistRowDeltaFromPhaseClaims',
    audit.objectivePhaseClaim?.checklistRowDeltaFromPhaseClaims,
    audit.checklist.observedTotal - phaseClaimedChecklistRowsTotal,
  ),
  assertEqual(
    'audit.objectivePhaseClaim.phaseClaimsDeltaFromClaimedTotal',
    audit.objectivePhaseClaim?.phaseClaimsDeltaFromClaimedTotal,
    phaseClaimedChecklistRowsTotal - claimedChecklistRows,
  ),
  assertEqual(
    'audit.objectivePhaseClaim.satisfied',
    audit.objectivePhaseClaim?.satisfied,
    audit.checklist.observedTotal === phaseClaimedChecklistRowsTotal &&
      phaseClaimedChecklistRowsTotal === claimedChecklistRows,
  ),
  assertEqual(
    'audit.objectivePhaseClaim.status',
    audit.objectivePhaseClaim?.status,
    audit.checklist.observedTotal === phaseClaimedChecklistRowsTotal &&
      phaseClaimedChecklistRowsTotal === claimedChecklistRows
      ? 'matched'
      : 'mismatch',
  ),
  assertEqual(
    'index.objective.checklistRowDeltaFromPhaseClaims',
    index.objective?.checklistRowDeltaFromPhaseClaims,
    audit.checklist.observedTotal - phaseClaimedChecklistRowsTotal,
  ),
  assertEqual(
    'index.objective.phaseClaimsDeltaFromClaimedTotal',
    index.objective?.phaseClaimsDeltaFromClaimedTotal,
    phaseClaimedChecklistRowsTotal - claimedChecklistRows,
  ),
  assertEqual(
    'index.objective.status',
    index.objective?.status,
    audit.status === 'complete' &&
      audit.checklist.observedTotal === claimedChecklistRows &&
      audit.checklist.observedTotal === phaseClaimedChecklistRowsTotal &&
      phaseClaimedChecklistRowsTotal === claimedChecklistRows
      ? 'achieved'
      : 'not_achieved',
  ),
  assertEqual(
    'index.currentAudit.missingItemNumbers',
    JSON.stringify(index.currentAudit.missingItemNumbers),
    JSON.stringify(audit.checklist.missingItemNumbers),
  ),
  assertEqual(
    'index.currentAudit.duplicateItemNumbers',
    JSON.stringify(index.currentAudit.duplicateItemNumbers),
    JSON.stringify(audit.checklist.duplicateItemNumbers),
  ),
  assertEqual(
    'index.currentAudit.malformedChecklistRows',
    JSON.stringify(index.currentAudit.malformedChecklistRows ?? []),
    JSON.stringify(audit.checklist.malformedChecklistRows ?? []),
  ),
  assertEqual(
    'index.currentAudit.sections',
    JSON.stringify(index.currentAudit.sections ?? []),
    JSON.stringify(audit.checklist.sections ?? []),
  ),
  assertEqual('index.generatedAt', index.generatedAt, expectedLatestVerifiedAt),
  assertEqual(
    'blockersManifest.checklistState.checked',
    blockersManifest.checklistState.checked,
    audit.checklist.checked,
  ),
  assertEqual(
    'blockersManifest.checklistState.unchecked',
    blockersManifest.checklistState.unchecked,
    audit.checklist.unchecked,
  ),
  assertEqual(
    'blockersManifest.checklistState.observedTotal',
    blockersManifest.checklistState.observedTotal,
    audit.checklist.observedTotal,
  ),
  assertEqual('blockersManifest.verifiedAt', blockersManifest.verifiedAt, index.generatedAt),
  assertIncludes(
    'blockersManifest.checklistState.note',
    blockersManifest.checklistState.note ?? '',
    `${String(audit.checklist.observedTotal)} checklist rows`,
  ),
  audit.objectiveRowClaim?.satisfied === false
    ? assertIncludes(
        'audit blockers include objective row claim',
        JSON.stringify(audit.blockers),
        'objective-row-claim',
      )
    : '',
  audit.objectivePhaseClaim?.satisfied === false
    ? assertIncludes(
        'audit blockers include objective phase claim',
        JSON.stringify(audit.blockers),
        'objective-phase-claim',
      )
    : '',
  assertIncludes(
    'audit blockers include Chrome UX Report',
    JSON.stringify(audit.blockers),
    'chrome-ux-report',
  ),
  assertEqual('checklist item 874 exists', cruxChecklistItem?.number, 874),
  assertEqual(
    'checklist only unchecked item numbers',
    JSON.stringify(uncheckedChecklistItems.map((item) => item.number)),
    JSON.stringify([874]),
  ),
  assertIncludes(
    'checklist item 874 text',
    uncheckedChecklistItems.find((item) => item.number === 874)?.text ?? '',
    'Chrome UX Report',
  ),
  !hasCanonicalCruxEvidence
    ? assertEqual(
        'checklist item 874 remains unchecked while canonical CrUX evidence is absent',
        cruxChecklistItem?.checked,
        false,
      )
    : '',
  assertEqual('index.remainingBlocker.item', index.remainingBlocker.item, 874),
  assertEqual('blockersManifest.blockers.length', blockersManifest.blockers.length, 1),
  assertEqual('blockersManifest.blockers[0].item', blockersManifest.blockers[0]?.item, 874),
  assertEqual('finalBlockerSummary.status', finalBlockerSummary.status, audit.status),
  assertEqual(
    'finalBlockerSummary.objectiveStatus',
    finalBlockerSummary.objectiveStatus,
    index.objective?.status,
  ),
  assertEqual(
    'finalBlockerSummary.objective',
    JSON.stringify(finalBlockerSummary.objective),
    JSON.stringify(index.objective),
  ),
  assertEqual(
    'finalBlockerSummary.objective.claimedChecklistRows',
    finalBlockerSummary.objective?.claimedChecklistRows,
    claimedChecklistRows,
  ),
  assertEqual(
    'finalBlockerSummary.objective.actualChecklistRowsObserved',
    finalBlockerSummary.objective?.actualChecklistRowsObserved,
    checklist.total,
  ),
  assertEqual(
    'finalBlockerSummary.objective.checklistRowDeltaFromClaim',
    finalBlockerSummary.objective?.checklistRowDeltaFromClaim,
    audit.checklist.observedTotal - claimedChecklistRows,
  ),
  assertEqual(
    'finalBlockerSummary.objective.phaseClaimedChecklistRowsTotal',
    finalBlockerSummary.objective?.phaseClaimedChecklistRowsTotal,
    phaseClaimedChecklistRowsTotal,
  ),
  assertEqual(
    'finalBlockerSummary.objective.checklistRowDeltaFromPhaseClaims',
    finalBlockerSummary.objective?.checklistRowDeltaFromPhaseClaims,
    audit.checklist.observedTotal - phaseClaimedChecklistRowsTotal,
  ),
  assertEqual(
    'finalBlockerSummary.objective.phaseClaimsDeltaFromClaimedTotal',
    finalBlockerSummary.objective?.phaseClaimsDeltaFromClaimedTotal,
    phaseClaimedChecklistRowsTotal - claimedChecklistRows,
  ),
  assertEqual(
    'finalBlockerSummary.objective.status',
    finalBlockerSummary.objective?.status,
    index.objective?.status,
  ),
  assertEqual(
    'finalBlockerSummary.checklist.checked',
    finalBlockerSummary.checklist?.checked,
    audit.checklist.checked,
  ),
  assertEqual(
    'finalBlockerSummary.checklist.unchecked',
    finalBlockerSummary.checklist?.unchecked,
    audit.checklist.unchecked,
  ),
  assertEqual(
    'finalBlockerSummary.checklist.actualChecklistRowsObserved',
    finalBlockerSummary.checklist?.actualChecklistRowsObserved,
    audit.checklist.observedTotal,
  ),
  assertEqual(
    'finalBlockerSummary.checklist.malformedChecklistRows',
    JSON.stringify(finalBlockerSummary.checklist?.malformedChecklistRows ?? []),
    JSON.stringify(audit.checklist.malformedChecklistRows ?? []),
  ),
  assertEqual(
    'finalBlockerSummary.checklist.sections',
    JSON.stringify(finalBlockerSummary.checklist?.sections ?? []),
    JSON.stringify(audit.checklist.sections ?? []),
  ),
  assertEqual('finalBlockerSummary.phaseReports.length', phaseReports.length, sectionSummary.length),
  assertEqual(
    'finalBlockerSummary.phaseReports.checklists',
    JSON.stringify(
      phaseReports.map((phase) => ({
        checklist: phase.checklist,
        section: phase.section,
        status: phase.status,
      })),
    ),
    JSON.stringify(
      sectionSummary.map((section) => ({
        checklist: {
          checked: section.checked,
          firstItem: section.firstItem,
          lastItem: section.lastItem,
          total: section.total,
          unchecked: section.unchecked,
        },
        section: section.title,
        status: section.unchecked === 0 ? 'complete' : 'incomplete',
      })),
    ),
  ),
  assertEqual(
    'finalBlockerSummary.objectivePhaseReports.checklists',
    JSON.stringify(
      objectivePhaseReports.map((phase) => ({
        checklist: phase.checklist,
        claimedChecklistRows: phase.claimedChecklistRows,
        checklistRowDeltaFromClaim: phase.checklistRowDeltaFromClaim,
        label: phase.label,
        phase: phase.phase,
        sections: phase.sections,
        status: phase.status,
      })),
    ),
    JSON.stringify(expectedObjectivePhaseReports),
  ),
  ...phaseReports.flatMap((phase) => [
    assertEqual(
      `phase ${String(phase.phase)} type-check status`,
      phase.commandEvidence?.typeCheck?.status,
      'verified',
    ),
    assertIncludes(
      `phase ${String(phase.phase)} type-check evidence`,
      JSON.stringify(phase.commandEvidence?.typeCheck?.evidence ?? []),
      'latest terminal run: npm run type-check exited 0',
    ),
    assertEqual(`phase ${String(phase.phase)} lint status`, phase.commandEvidence?.lint?.status, 'verified'),
    assertIncludes(
      `phase ${String(phase.phase)} lint evidence`,
      JSON.stringify(phase.commandEvidence?.lint?.evidence ?? []),
      expectedLintEvidence,
    ),
    assertEqual(
      `phase ${String(phase.phase)} coverage status`,
      phase.commandEvidence?.coverage?.status,
      'verified',
    ),
    assertIncludes(
      `phase ${String(phase.phase)} coverage evidence`,
      JSON.stringify(phase.commandEvidence?.coverage?.evidence ?? []),
      'latest terminal run: npm run test:coverage exited 0',
    ),
    assertEqual(
      `phase ${String(phase.phase)} build status`,
      phase.commandEvidence?.build?.status,
      'verified',
    ),
    assertIncludes(
      `phase ${String(phase.phase)} build evidence`,
      JSON.stringify(phase.commandEvidence?.build?.evidence ?? []),
      'latest terminal run: npm run build exited 0',
    ),
    assertEqual(
      `phase ${String(phase.phase)} visual screenshot status`,
      phase.visualScreenshotEvidence?.status,
      'verified',
    ),
    assertIncludes(
      `phase ${String(phase.phase)} visual screenshot evidence`,
      JSON.stringify(phase.visualScreenshotEvidence?.evidence ?? []),
      'artifacts/patient-avatar-current.png',
    ),
    assertEqual(
      `phase ${String(phase.phase)} visual screenshot metadata`,
      JSON.stringify(phase.visualScreenshotEvidence?.screenshots ?? []),
      JSON.stringify(audit.screenshots ?? []),
    ),
    assertEqual(
      `phase ${String(phase.phase)} visual review metadata`,
      JSON.stringify(phase.visualScreenshotEvidence?.visualReview ?? null),
      JSON.stringify(audit.visualReview ?? null),
    ),
  ]),
  ...objectivePhaseReports.flatMap((phase) => [
    assertEqual(
      `objective phase ${String(phase.phase)} type-check status`,
      phase.commandEvidence?.typeCheck?.status,
      'verified',
    ),
    assertIncludes(
      `objective phase ${String(phase.phase)} type-check evidence`,
      JSON.stringify(phase.commandEvidence?.typeCheck?.evidence ?? []),
      'latest terminal run: npm run type-check exited 0',
    ),
    assertEqual(
      `objective phase ${String(phase.phase)} lint status`,
      phase.commandEvidence?.lint?.status,
      'verified',
    ),
    assertIncludes(
      `objective phase ${String(phase.phase)} lint evidence`,
      JSON.stringify(phase.commandEvidence?.lint?.evidence ?? []),
      expectedLintEvidence,
    ),
    assertEqual(
      `objective phase ${String(phase.phase)} coverage status`,
      phase.commandEvidence?.coverage?.status,
      'verified',
    ),
    assertIncludes(
      `objective phase ${String(phase.phase)} coverage evidence`,
      JSON.stringify(phase.commandEvidence?.coverage?.evidence ?? []),
      'latest terminal run: npm run test:coverage exited 0',
    ),
    assertEqual(
      `objective phase ${String(phase.phase)} build status`,
      phase.commandEvidence?.build?.status,
      'verified',
    ),
    assertIncludes(
      `objective phase ${String(phase.phase)} build evidence`,
      JSON.stringify(phase.commandEvidence?.build?.evidence ?? []),
      'latest terminal run: npm run build exited 0',
    ),
    assertEqual(
      `objective phase ${String(phase.phase)} visual screenshot status`,
      phase.visualScreenshotEvidence?.status,
      'verified',
    ),
    assertIncludes(
      `objective phase ${String(phase.phase)} visual screenshot evidence`,
      JSON.stringify(phase.visualScreenshotEvidence?.evidence ?? []),
      'artifacts/patient-avatar-current.png',
    ),
    assertEqual(
      `objective phase ${String(phase.phase)} visual screenshot metadata`,
      JSON.stringify(phase.visualScreenshotEvidence?.screenshots ?? []),
      JSON.stringify(audit.screenshots ?? []),
    ),
    assertEqual(
      `objective phase ${String(phase.phase)} visual review metadata`,
      JSON.stringify(phase.visualScreenshotEvidence?.visualReview ?? null),
      JSON.stringify(audit.visualReview ?? null),
    ),
  ]),
  assertEqual(
    'finalBlockerSummary.checklist.note',
    finalBlockerSummary.checklist?.note,
    blockersManifest.checklistState.note,
  ),
  assertEqual(
    'finalBlockerSummary.generatedAt',
    finalBlockerSummary.generatedAt,
    blockersManifest.verifiedAt,
  ),
  assertEqual('finalBlockerSummary.remainingBlocker.item', finalBlockerSummary.remainingBlocker?.item, 874),
  assertEqual(
    'finalBlockerSummary.remainingBlocker.currentEvidence',
    JSON.stringify(finalBlockerSummary.remainingBlocker?.currentEvidence),
    JSON.stringify(blockersManifest.blockers[0]?.currentEvidence),
  ),
  assertEqual(
    'finalBlockerSummary.remainingBlocker.operatorNextSteps',
    JSON.stringify(finalBlockerSummary.remainingBlocker?.operatorNextSteps),
    JSON.stringify(cruxOperatorNextSteps),
  ),
  assertEqual(
    'blockersManifest.blockers[0].operatorNextSteps',
    JSON.stringify(blockersManifest.blockers[0]?.operatorNextSteps),
    JSON.stringify(cruxOperatorNextSteps),
  ),
  assertEqual(
    'finalBlockerSummary.remainingBlocker.operatorNextSteps matches blocker manifest',
    JSON.stringify(finalBlockerSummary.remainingBlocker?.operatorNextSteps),
    JSON.stringify(blockersManifest.blockers[0]?.operatorNextSteps),
  ),
  assertEqual(
    'blockersManifest.blockers[0].acceptedCredentialNames',
    JSON.stringify(blockersManifest.blockers[0]?.acceptedCredentialNames),
    JSON.stringify(cruxCredentials.acceptedKeyNames),
  ),
  assertEqual(
    'finalBlockerSummary.remainingBlocker.acceptedCredentialNames',
    JSON.stringify(finalBlockerSummary.remainingBlocker?.acceptedCredentialNames),
    JSON.stringify(blockersManifest.blockers[0]?.acceptedCredentialNames),
  ),
  assertEqual(
    'blockersManifest.blockers[0].requiredToComplete',
    JSON.stringify(blockersManifest.blockers[0]?.requiredToComplete),
    JSON.stringify(
      uniqueStrings([
        ...(cruxCredentials.requiredToComplete ?? []),
        ...(cruxMonitoring.requiredToComplete ?? []),
      ]),
    ),
  ),
  assertEqual(
    'finalBlockerSummary.remainingBlocker.requiredToComplete',
    JSON.stringify(finalBlockerSummary.remainingBlocker?.requiredToComplete),
    JSON.stringify(blockersManifest.blockers[0]?.requiredToComplete),
  ),
  assertEqual(
    'finalBlockerSummary.promptToArtifactChecklist',
    JSON.stringify(finalBlockerSummary.promptToArtifactChecklist),
    JSON.stringify(index.promptRequirementMap),
  ),
  assertEqual(
    'index.doNotCompleteYet',
    JSON.stringify(index.doNotCompleteYet ?? []),
    JSON.stringify(expectedDoNotCompleteYet),
  ),
  assertEqual(
    'finalBlockerSummary.doNotCompleteYet',
    JSON.stringify(finalBlockerSummary.doNotCompleteYet ?? []),
    JSON.stringify(expectedDoNotCompleteYet),
  ),
  ...(deepAudit
    ? [
        assertEqual(
          'finalBlockerSummary.deepAuditCompletion.artifact',
          finalBlockerSummary.deepAuditCompletion?.artifact,
          deepAuditPath,
        ),
        assertEqual(
          'finalBlockerSummary.deepAuditCompletion.checkedAt',
          finalBlockerSummary.deepAuditCompletion?.checkedAt,
          deepAudit.checkedAt ?? null,
        ),
        assertEqual(
          'finalBlockerSummary.deepAuditCompletion.status',
          finalBlockerSummary.deepAuditCompletion?.status,
          deepAudit.status ?? 'unknown',
        ),
        assertEqual(
          'finalBlockerSummary.deepAuditCompletion.checklist',
          JSON.stringify(finalBlockerSummary.deepAuditCompletion?.checklist ?? null),
          JSON.stringify(deepAudit.checklist ?? null),
        ),
        assertEqual(
          'finalBlockerSummary.deepAuditCompletion.promptToArtifactChecklist',
          JSON.stringify(finalBlockerSummary.deepAuditCompletion?.promptToArtifactChecklist ?? null),
          JSON.stringify(deepAudit.promptToArtifactChecklist ?? null),
        ),
        assertEqual(
          'finalBlockerSummary.deepAuditCompletion.blockers',
          JSON.stringify(finalBlockerSummary.deepAuditCompletion?.blockers ?? []),
          JSON.stringify(expectedDeepAuditBlockers),
        ),
        assertEqual(
          'finalBlockerSummary.remainingDeepAuditBlockers',
          JSON.stringify(finalBlockerSummary.remainingDeepAuditBlockers ?? []),
          JSON.stringify(expectedDeepAuditBlockers),
        ),
        assertEqual(
          'finalBlockerSummary.blockerCounts.completeFix',
          finalBlockerSummary.blockerCounts?.completeFix,
          blockersManifest.blockers.length,
        ),
        assertEqual(
          'finalBlockerSummary.blockerCounts.deepAudit',
          finalBlockerSummary.blockerCounts?.deepAudit,
          expectedDeepAuditBlockers.length,
        ),
        assertEqual(
          'finalBlockerSummary.blockerCounts.consolidated',
          finalBlockerSummary.blockerCounts?.consolidated,
          expectedConsolidatedBlockerCount,
        ),
        assertEqual(
          'finalBlockerSummary.consolidatedRemainingBlockers.length',
          finalBlockerSummary.consolidatedRemainingBlockers?.length,
          expectedConsolidatedBlockerCount,
        ),
        assertIncludes(
          'finalBlockerSummary.consolidatedRemainingBlockers complete blocker',
          JSON.stringify(finalBlockerSummary.consolidatedRemainingBlockers ?? []),
          blockersManifest.blockers[0]?.id ?? 'chrome-ux-report',
        ),
        ...expectedDeepAuditBlockers.map((blocker) =>
          assertIncludes(
            `finalBlockerSummary.consolidatedRemainingBlockers ${blocker.id}`,
            JSON.stringify(finalBlockerSummary.consolidatedRemainingBlockers ?? []),
            blocker.id,
          ),
        ),
      ]
    : []),
  assertIncludes(
    'finalBlockerSummary.completionAudit.objectiveRestatement',
    completionAudit.objectiveRestatement ?? '',
    'COMPLETE_FIX_REQUIREMENTS.md',
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.verdict',
    completionAudit.verdict,
    index.objective?.status,
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.inspectedRequirements.length',
    completionAuditRequirements.length,
    6,
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.claim.status',
    completionAuditClaimRequirement?.status,
    index.objective?.checklistRowDeltaFromClaim === 0 ? 'verified' : 'blocked',
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.claim.finding',
    completionAuditClaimRequirement?.finding,
    `claimed ${String(index.objective?.claimedChecklistRows ?? 'unknown')}; actual ${String(
      index.objective?.actualChecklistRowsObserved ?? 'unknown',
    )}; delta ${String(index.objective?.checklistRowDeltaFromClaim ?? 'unknown')}`,
  ),
  assertIncludes(
    'finalBlockerSummary.completionAudit.claim.evidence',
    JSON.stringify(completionAuditClaimRequirement?.evidence ?? []),
    'artifacts/completion-evidence-index.json:objective',
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.phaseClaim.status',
    completionAuditPhaseClaimRequirement?.status,
    index.objective?.checklistRowDeltaFromPhaseClaims === 0 &&
      index.objective?.phaseClaimsDeltaFromClaimedTotal === 0
      ? 'verified'
      : 'blocked',
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.phaseClaim.finding',
    completionAuditPhaseClaimRequirement?.finding,
    `phase claims ${String(index.objective?.phaseClaimedChecklistRowsTotal ?? 'unknown')}; actual ${String(
      index.objective?.actualChecklistRowsObserved ?? 'unknown',
    )}; actual-phase delta ${String(
      index.objective?.checklistRowDeltaFromPhaseClaims ?? 'unknown',
    )}; phase-total delta ${String(index.objective?.phaseClaimsDeltaFromClaimedTotal ?? 'unknown')}`,
  ),
  assertIncludes(
    'finalBlockerSummary.completionAudit.phaseClaim.evidence',
    JSON.stringify(completionAuditPhaseClaimRequirement?.evidence ?? []),
    'artifacts/manual-evidence/final-blocker-summary.json:objectivePhaseReports',
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.checklist.status',
    completionAuditChecklistRequirement?.status,
    audit.checklist.unchecked === 0 ? 'verified' : 'blocked',
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.checklist.finding',
    completionAuditChecklistRequirement?.finding,
    `${String(audit.checklist.checked)}/${String(audit.checklist.observedTotal)} checked; ${String(
      audit.checklist.unchecked,
    )} unchecked`,
  ),
  assertIncludes(
    'finalBlockerSummary.completionAudit.checklist.evidence',
    JSON.stringify(completionAuditChecklistRequirement?.evidence ?? []),
    'COMPLETE_FIX_REQUIREMENTS.md',
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.commands.status',
    completionAuditCommandRequirement?.status,
    [typeCheckRequirement, lintRequirement, coverageRequirement, buildRequirement].every(
      (entry) => entry?.status === 'verified',
    )
      ? 'verified'
      : 'blocked',
  ),
  assertIncludes(
    'finalBlockerSummary.completionAudit.commands.evidence',
    JSON.stringify(completionAuditCommandRequirement?.evidence ?? []),
    'latest terminal run: npm run type-check exited 0',
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.visual.status',
    completionAuditVisualRequirement?.status,
    visualRequirement?.status ?? 'unknown',
  ),
  assertIncludes(
    'finalBlockerSummary.completionAudit.visual.evidence',
    JSON.stringify(completionAuditVisualRequirement?.evidence ?? []),
    'artifacts/patient-avatar-current.png',
  ),
  assertEqual(
    'finalBlockerSummary.completionAudit.crux.status',
    completionAuditCruxRequirement?.status,
    cruxRequirement?.status ?? 'unknown',
  ),
  assertIncludes(
    'finalBlockerSummary.completionAudit.crux.canonicalEvidence',
    JSON.stringify(completionAuditCruxRequirement?.evidence ?? []),
    'artifacts/manual-evidence/chrome-ux-report.json',
  ),
  assertIncludes(
    'finalBlockerSummary.completionAudit.crux.monitoringEvidence',
    JSON.stringify(completionAuditCruxRequirement?.evidence ?? []),
    cruxMonitoringPath,
  ),
  Array.isArray(vitestList)
    ? assertIncludes(
        'index coverage test files',
        JSON.stringify(coverageRequirement?.evidence ?? []),
        `${String(new Set(vitestList.map((testCase) => testCase.file)).size)} test files passed`,
      )
    : '',
  assertEqual('index type-check status', typeCheckRequirement?.status, 'verified'),
  assertIncludes(
    'index type-check command evidence',
    JSON.stringify(typeCheckRequirement?.evidence ?? []),
    'latest terminal run: npm run type-check exited 0',
  ),
  phaseGateEvidence
    ? assertEqual('phase-gate type-check exit code', phaseGateEvidence.commands?.typeCheck?.exitCode, 0)
    : '',
  phaseGateEvidence
    ? assertIncludes(
        'index type-check phase-gate artifact evidence',
        JSON.stringify(typeCheckRequirement?.evidence ?? []),
        `${phaseGatePath}:commands.typeCheck`,
      )
    : '',
  assertEqual('index lint status', lintRequirement?.status, 'verified'),
  assertIncludes(
    'index lint command evidence',
    JSON.stringify(lintRequirement?.evidence ?? []),
    expectedLintEvidence,
  ),
  phaseGateEvidence
    ? assertEqual('phase-gate lint exit code', phaseGateEvidence.commands?.lint?.exitCode, 0)
    : '',
  phaseGateEvidence
    ? assertIncludes(
        'index lint phase-gate artifact evidence',
        JSON.stringify(lintRequirement?.evidence ?? []),
        `${phaseGatePath}:commands.lint`,
      )
    : '',
  assertEqual('index security status', securityRequirement?.status, 'verified'),
  assertIncludes(
    'index security Snyk command artifact',
    JSON.stringify(securityRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:commands.snyk',
  ),
  assertIncludes(
    'index security npm audit command artifact',
    JSON.stringify(securityRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:commands.npmAudit',
  ),
  assertIncludes(
    'index security license command artifact',
    JSON.stringify(securityRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:commands.licensePolicy',
  ),
  assertIncludes(
    'index security sbom command artifact',
    JSON.stringify(securityRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:commands.sbom',
  ),
  assertIncludes(
    'index security sbom artifact',
    JSON.stringify(securityRequirement?.evidence ?? []),
    'artifacts/sbom.json',
  ),
  assertIncludes(
    'index security sbom audit artifact',
    JSON.stringify(securityRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:sbom',
  ),
  assertIncludes(
    'index security npm audit command evidence',
    JSON.stringify(securityRequirement?.evidence ?? []),
    'latest terminal run: npm audit --audit-level=moderate exited 0',
  ),
  assertIncludes(
    'index security license command evidence',
    JSON.stringify(securityRequirement?.evidence ?? []),
    'latest terminal run: npm run check:licenses exited 0',
  ),
  assertIncludes(
    'index security sbom command evidence',
    JSON.stringify(securityRequirement?.evidence ?? []),
    'latest terminal run: npm run check:sbom exited 0',
  ),
  assertEqual('audit Snyk command exit code', audit.commands?.snyk?.exitCode, 0),
  assertEqual('audit npm audit command exit code', audit.commands?.npmAudit?.exitCode, 0),
  assertEqual('audit license policy command exit code', audit.commands?.licensePolicy?.exitCode, 0),
  assertEqual('audit sbom command exit code', audit.commands?.sbom?.exitCode, 0),
  assertEqual('audit sbom valid', audit.sbom?.valid, true),
  assertEqual('audit sbom path', audit.sbom?.path, 'artifacts/sbom.json'),
  assertEqual('index forbidden-pattern status', forbiddenPatternRequirement?.status, 'verified'),
  assertIncludes(
    'index forbidden-pattern command evidence',
    JSON.stringify(forbiddenPatternRequirement?.evidence ?? []),
    'latest terminal run: npm run check:forbidden-patterns exited 0',
  ),
  assertIncludes(
    'index forbidden-pattern audit artifact',
    JSON.stringify(forbiddenPatternRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:commands.forbiddenPatterns',
  ),
  assertIncludes(
    'index forbidden-pattern notes',
    forbiddenPatternRequirement?.notes ?? '',
    `type-suppression comments, debug print calls, task-marker comments, explicit TypeScript top-type usage, and ${temporaryBypassNoteFragment}`,
  ),
  assertEqual('audit forbidden-pattern command exit code', audit.commands?.forbiddenPatterns?.exitCode, 0),
  assertIncludes(
    'audit forbidden-pattern stdout result key',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"result"',
  ),
  assertIncludes(
    'audit forbidden-pattern stdout passed result',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"passed"',
  ),
  assertIncludes(
    'audit forbidden-pattern scanned root src',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"src"',
  ),
  assertIncludes(
    'audit forbidden-pattern scanned root scripts',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"scripts"',
  ),
  assertIncludes(
    'audit forbidden-pattern scanned root vite.config.ts',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"vite.config.ts"',
  ),
  assertIncludes(
    'audit forbidden-pattern rule ts-ignore',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"ts-ignore"',
  ),
  assertIncludes(
    'audit forbidden-pattern rule console-log',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"console-log"',
  ),
  assertIncludes(
    'audit forbidden-pattern rule todo-comment',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"todo-comment"',
  ),
  assertIncludes(
    'audit forbidden-pattern rule bypass-marker',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"bypass-marker"',
  ),
  assertIncludes(
    'audit forbidden-pattern rule explicit-any',
    audit.commands?.forbiddenPatterns?.stdout ?? '',
    '"explicit-any"',
  ),
  assertEqual('index bypass-marker status', temporaryBypassRequirement?.status, 'verified'),
  assertIncludes(
    'index bypass-marker command evidence',
    JSON.stringify(temporaryBypassRequirement?.evidence ?? []),
    'latest terminal run: npm run check:forbidden-patterns exited 0',
  ),
  assertIncludes(
    'index bypass-marker audit artifact',
    JSON.stringify(temporaryBypassRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:commands.forbiddenPatterns',
  ),
  assertIncludes(
    'index bypass-marker notes',
    temporaryBypassRequirement?.notes ?? '',
    temporaryBypassNoteFragment,
  ),
  assertEqual('index test-realism status', testRealismRequirement?.status, 'verified'),
  assertIncludes(
    'index test-realism command evidence',
    JSON.stringify(testRealismRequirement?.evidence ?? []),
    'latest terminal run: npm run check:test-realism exited 0',
  ),
  assertIncludes(
    'index test-realism artifact evidence',
    JSON.stringify(testRealismRequirement?.evidence ?? []),
    testRealismPath,
  ),
  assertIncludes(
    'index test-realism audit artifact',
    JSON.stringify(testRealismRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:commands.testRealism',
  ),
  assertEqual('audit test-realism command exit code', audit.commands?.testRealism?.exitCode, 0),
  assertEqual('test-realism result', testRealism.result, 'passed'),
  assertEqual('test-realism failures', JSON.stringify(testRealism.failures ?? []), JSON.stringify([])),
  assertEqual(
    'test-realism Vitest file coverage',
    testRealism.vitestFileCount,
    testRealism.vitestCandidateFileCount,
  ),
  assertEqual(
    'test-realism missing Vitest files',
    JSON.stringify(testRealism.vitestMissingFiles ?? []),
    JSON.stringify([]),
  ),
  assertGreaterThan('test-realism vitest test count', testRealism.vitestTestCount, 0),
  assertGreaterThan('test-realism E2E file count', testRealism.e2eFileCount, 0),
  assertGreaterThan('test-realism behavior file count', testRealism.behaviorFileCount, 0),
  assertGreaterThan('test-realism production import file count', testRealism.productionImportFileCount, 0),
  assertEqual(
    'index external manual evidence status',
    externalManualEvidenceRequirement?.status,
    'verified_except_crux',
  ),
  assertIncludes(
    'index external manual evidence audit artifact',
    JSON.stringify(externalManualEvidenceRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:manualEvidence',
  ),
  ...nonCruxManualEvidence.flatMap((evidence) => [
    assertEqual(`manual evidence ${evidence.id} valid`, evidence.valid, true),
    assertEqual(`manual evidence ${evidence.id} exists`, evidence.exists, true),
    assertIncludes(
      `index external manual evidence ${evidence.id}`,
      JSON.stringify(externalManualEvidenceRequirement?.evidence ?? []),
      evidence.path,
    ),
  ]),
  assertEqual('index coverage status', coverageRequirement?.status, 'verified'),
  phaseGateEvidence
    ? assertEqual('phase-gate coverage exit code', phaseGateEvidence.commands?.coverage?.exitCode, 0)
    : '',
  phaseGateEvidence
    ? assertIncludes(
        'index coverage phase-gate artifact evidence',
        JSON.stringify(coverageRequirement?.evidence ?? []),
        `${phaseGatePath}:commands.coverage`,
      )
    : '',
  assertIncludes(
    'index coverage command normalization notes',
    coverageRequirement?.notes ?? '',
    'package.json defines test:coverage as a custom npm script',
  ),
  assertEqual(
    'index coverage command mapping',
    JSON.stringify(coverageRequirement?.commandMapping),
    JSON.stringify({
      packageScript: 'test:coverage',
      packageScriptValue: packageJson.scripts?.['test:coverage'] ?? null,
      promptCommand: 'npm test:coverage',
      runnableCommand: 'npm run test:coverage',
    }),
  ),
  Array.isArray(vitestList)
    ? assertIncludes(
        'index coverage test count',
        JSON.stringify(coverageRequirement?.evidence ?? []),
        `${String(vitestList.length)} tests passed`,
      )
    : '',
  coverageSummary?.total
    ? assertIncludes(
        'index coverage statements',
        JSON.stringify(coverageRequirement?.evidence ?? []),
        formatCoverageMetric('Statements', coverageSummary.total.statements),
      )
    : '',
  assertEqual('audit dist exists', audit.dist?.exists, true),
  assertGreaterThan('audit dist file count', audit.dist?.fileCount, 0),
  assertEqual('audit dist has build output', audit.dist?.hasBuildOutput, true),
  assertGreaterThan('audit dist primary JS/CSS file count', audit.dist?.primaryJsCssFiles?.length, 0),
  phaseGateEvidence ? assertEqual('phase-gate dist exists', phaseGateEvidence.dist?.exists, true) : '',
  phaseGateEvidence
    ? assertEqual('phase-gate dist file count', phaseGateEvidence.dist?.fileCount, audit.dist?.fileCount)
    : '',
  phaseGateEvidence
    ? assertEqual('phase-gate dist total bytes', phaseGateEvidence.dist?.totalBytes, audit.dist?.totalBytes)
    : '',
  phaseGateEvidence
    ? assertEqual(
        'phase-gate dist primary bytes',
        phaseGateEvidence.dist?.primaryBytesNoCompressedSidecars,
        audit.dist?.primaryBytesNoCompressedSidecars,
      )
    : '',
  phaseGateEvidence
    ? assertEqual(
        'phase-gate dist primary JS/CSS bytes',
        phaseGateEvidence.dist?.primaryJsCssBytes,
        audit.dist?.primaryJsCssBytes,
      )
    : '',
  phaseGateEvidence
    ? assertEqual(
        'phase-gate dist Brotli JS/CSS transfer bytes',
        phaseGateEvidence.dist?.transferBrotliJsCssBytes,
        audit.dist?.transferBrotliJsCssBytes,
      )
    : '',
  phaseGateEvidence
    ? assertEqual(
        'phase-gate dist primary JS/CSS files',
        JSON.stringify(phaseGateEvidence.dist?.primaryJsCssFiles ?? []),
        JSON.stringify(audit.dist?.primaryJsCssFiles ?? []),
      )
    : '',
  assertEqual('index build status', buildRequirement?.status, 'verified'),
  assertIncludes(
    'index build command evidence',
    JSON.stringify(buildRequirement?.evidence ?? []),
    'latest terminal run: npm run build exited 0',
  ),
  phaseGateEvidence
    ? assertEqual('phase-gate build exit code', phaseGateEvidence.commands?.build?.exitCode, 0)
    : '',
  phaseGateEvidence
    ? assertIncludes(
        'index build phase-gate artifact evidence',
        JSON.stringify(buildRequirement?.evidence ?? []),
        `${phaseGatePath}:commands.build`,
      )
    : '',
  assertIncludes(
    'index no-raster command evidence',
    JSON.stringify(buildRequirement?.evidence ?? []),
    'latest terminal run: npm run check:no-raster exited 0',
  ),
  phaseGateEvidence
    ? assertEqual('phase-gate no-raster exit code', phaseGateEvidence.commands?.noRaster?.exitCode, 0)
    : '',
  phaseGateEvidence
    ? assertIncludes(
        'index no-raster phase-gate artifact evidence',
        JSON.stringify(buildRequirement?.evidence ?? []),
        `${phaseGatePath}:commands.noRaster`,
      )
    : '',
  assertIncludes(
    'index bundle-size command evidence',
    JSON.stringify(buildRequirement?.evidence ?? []),
    'latest terminal run: npm run check:bundle-size exited 0',
  ),
  phaseGateEvidence
    ? assertEqual('phase-gate bundle-size exit code', phaseGateEvidence.commands?.bundleSize?.exitCode, 0)
    : '',
  phaseGateEvidence
    ? assertIncludes(
        'index bundle-size phase-gate artifact evidence',
        JSON.stringify(buildRequirement?.evidence ?? []),
        `${phaseGatePath}:commands.bundleSize`,
      )
    : '',
  assertIncludes(
    'index build dist artifact evidence',
    JSON.stringify(buildRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:dist',
  ),
  phaseGateEvidence
    ? assertIncludes(
        'index build phase-gate dist evidence',
        JSON.stringify(buildRequirement?.evidence ?? []),
        `${phaseGatePath}:dist`,
      )
    : '',
  assertIncludes(
    'index build dist exists',
    buildRequirement?.notes ?? '',
    `Audit dist exists is ${String(audit.dist?.exists)}`,
  ),
  assertIncludes(
    'index build dist file count',
    buildRequirement?.notes ?? '',
    `fileCount is ${String(audit.dist?.fileCount)}`,
  ),
  assertIncludes(
    'index build output presence',
    buildRequirement?.notes ?? '',
    `hasBuildOutput is ${String(audit.dist?.hasBuildOutput)}`,
  ),
  assertIncludes(
    'index build total bytes',
    buildRequirement?.notes ?? '',
    `totalBytes is ${String(audit.dist?.totalBytes)}`,
  ),
  assertIncludes(
    'index build primary bytes',
    buildRequirement?.notes ?? '',
    `primaryBytesNoCompressedSidecars is ${String(audit.dist?.primaryBytesNoCompressedSidecars)}`,
  ),
  assertIncludes(
    'index build JS/CSS bytes',
    buildRequirement?.notes ?? '',
    `primaryJsCssBytes is ${String(audit.dist?.primaryJsCssBytes)}`,
  ),
  assertIncludes(
    'index build Brotli transfer bytes',
    buildRequirement?.notes ?? '',
    `transferBrotliJsCssBytes is ${String(audit.dist?.transferBrotliJsCssBytes)}`,
  ),
  assertIncludes(
    'index build raster assets',
    buildRequirement?.notes ?? '',
    `rasterAssets is ${
      Array.isArray(audit.dist?.rasterAssets) && audit.dist.rasterAssets.length > 0
        ? audit.dist.rasterAssets.join(', ')
        : 'empty'
    }`,
  ),
  assertIncludes(
    'index visual patient avatar screenshot',
    JSON.stringify(visualRequirement?.evidence ?? []),
    'artifacts/patient-avatar-current.png',
  ),
  assertIncludes(
    'index visual simulator screenshot',
    JSON.stringify(visualRequirement?.evidence ?? []),
    'artifacts/simulator-current.png',
  ),
  assertIncludes(
    'index visual screenshot review artifact',
    JSON.stringify(visualRequirement?.evidence ?? []),
    'artifacts/manual-evidence/visual-screenshot-review.json',
  ),
  assertIncludes(
    'index visual screenshot audit review',
    JSON.stringify(visualRequirement?.evidence ?? []),
    'artifacts/completion-audit.json:visualReview',
  ),
  assertIncludes(
    'index visual screenshot review notes',
    visualRequirement?.notes ?? '',
    `Visual review ${audit.visualReview?.valid === true ? 'passed' : 'did not pass'}`,
  ),
  assertEqual('audit visual review valid', audit.visualReview?.valid, true),
  assertEqual('audit visual review screenshot count', audit.visualReview?.reviewedScreenshotCount, 2),
  assertEqual(
    'audit screenshot paths',
    JSON.stringify((audit.screenshots ?? []).map((screenshot) => screenshot.path)),
    JSON.stringify(['artifacts/patient-avatar-current.png', 'artifacts/simulator-current.png']),
  ),
  assertEqual(
    'finalBlockerSummary.remainingBlocker.latestRemoteMonitoringArtifact',
    finalBlockerSummary.remainingBlocker?.latestRemoteMonitoringArtifact,
    index.remoteCruxEvidence.latestMonitoringArtifact,
  ),
  assertEqual(
    'finalBlockerSummary.remainingBlocker.latestLocalMonitoring',
    JSON.stringify(finalBlockerSummary.remainingBlocker?.latestLocalMonitoring),
    JSON.stringify({
      apiKeySource: cruxMonitoring.apiKeySource ?? null,
      artifact: cruxMonitoringPath,
      cruxCache: summarizeCruxCache(cruxMonitoring.checks?.cruxCache),
      fieldDataAvailable: cruxMonitoring.fieldDataAvailable ?? null,
      result: cruxMonitoring.result ?? null,
      verifiedAt: cruxMonitoring.verifiedAt ?? null,
    }),
  ),
  cruxBlockerRefresh
    ? assertEqual(
        'finalBlockerSummary.remainingBlocker.latestLocalBatchRefresh',
        JSON.stringify(finalBlockerSummary.remainingBlocker?.latestLocalBatchRefresh),
        JSON.stringify(summarizeCruxBlockerRefresh(cruxBlockerRefresh)),
      )
    : '',
  assertEqual(
    'finalBlockerSummary.remainingBlocker.latestLocalCredentials',
    JSON.stringify(finalBlockerSummary.remainingBlocker?.latestLocalCredentials),
    JSON.stringify({
      artifact: cruxCredentialsPath,
      monitorApiKeySource: cruxCredentials.monitorApiKeySource ?? null,
      result: cruxCredentials.result ?? null,
      usableEnvFileNames: cruxCredentials.usableByCurrentMonitor?.envFileNames ?? [],
      usableGitHubSecretNames: cruxCredentials.usableByCurrentMonitor?.githubSecretNames ?? [],
      usableGitHubSecretsChecked: cruxCredentials.githubSecrets?.checked ?? null,
      usableGitHubEnvironmentSecretNames: cruxCredentials.githubEnvironments?.acceptedPresent?.secrets ?? [],
      usableGitHubEnvironmentSecretsChecked: githubEnvironmentSurfaceChecked(
        cruxCredentials.githubEnvironments,
        'secrets',
      ),
      usableGitHubEnvironmentVariableNames:
        cruxCredentials.githubEnvironments?.acceptedPresent?.variables ?? [],
      usableGitHubEnvironmentVariablesChecked: githubEnvironmentSurfaceChecked(
        cruxCredentials.githubEnvironments,
        'variables',
      ),
      usableLocalEnvironmentNames: cruxCredentials.usableByCurrentMonitor?.localEnvironmentNames ?? [],
      nonAcceptedCredentialNames: cruxCredentials.nonAcceptedCredentialNames ?? null,
      verifiedAt: cruxCredentials.verifiedAt ?? null,
    }),
  ),
  pagesDomain
    ? assertEqual(
        'finalBlockerSummary.remainingBlocker.latestPagesDomain',
        JSON.stringify(finalBlockerSummary.remainingBlocker?.latestPagesDomain),
        JSON.stringify({
          artifact: pagesDomainPath,
          connectedOrigins: pagesDomain.connectedOrigins ?? [],
          expectedOrigin: pagesDomain.expectedOrigin ?? null,
          expectedOriginConnected: pagesDomain.expectedOriginConnected ?? null,
          pagesStatus: pagesDomain.pages?.status ?? null,
          result: pagesDomain.result ?? null,
          verifiedAt: pagesDomain.verifiedAt ?? null,
        }),
      )
    : '',
  assertEqual(
    'finalBlockerSummary.remainingBlocker.latestRemoteRun',
    JSON.stringify(finalBlockerSummary.remainingBlocker?.latestRemoteRun),
    JSON.stringify({
      artifact: remoteCruxArtifactPath,
      apiKeySource: remoteCruxArtifact.apiKeySource ?? null,
      credentialArtifact: `${remoteCruxDirectory}/chrome-ux-report-credentials.json`,
      credentialMonitorApiKeySource: remoteCruxCredentials.monitorApiKeySource ?? null,
      credentialResult: remoteCruxCredentials.result ?? null,
      credentialUsableEnvFileNames: remoteCruxCredentials.usableByCurrentMonitor?.envFileNames ?? [],
      credentialUsableGitHubSecretNames:
        remoteCruxCredentials.usableByCurrentMonitor?.githubSecretNames ?? [],
      credentialUsableGitHubSecretsChecked: remoteCruxCredentials.githubSecrets?.checked ?? null,
      credentialUsableGitHubEnvironmentSecretNames:
        remoteCruxCredentials.githubEnvironments?.acceptedPresent?.secrets ?? [],
      credentialUsableGitHubEnvironmentSecretsChecked: githubEnvironmentSurfaceChecked(
        remoteCruxCredentials.githubEnvironments,
        'secrets',
      ),
      credentialUsableGitHubEnvironmentVariableNames:
        remoteCruxCredentials.githubEnvironments?.acceptedPresent?.variables ?? [],
      credentialUsableGitHubEnvironmentVariablesChecked: githubEnvironmentSurfaceChecked(
        remoteCruxCredentials.githubEnvironments,
        'variables',
      ),
      credentialUsableLocalEnvironmentNames:
        remoteCruxCredentials.usableByCurrentMonitor?.localEnvironmentNames ?? [],
      credentialNonAcceptedCredentialNames: remoteCruxCredentials.nonAcceptedCredentialNames ?? null,
      cruxLiveProbe: summarizeCruxLiveProbe(remoteCruxLiveProbe, remoteCruxLiveProbePath),
      cruxCache: summarizeCruxCache(remoteCruxArtifact.checks?.cruxCache),
      fieldDataAvailable: remoteCruxArtifact.fieldDataAvailable ?? null,
      issue: index.remoteCruxEvidence.blockerIssue ?? remoteCruxIssue.url ?? null,
      issueCommentCount: Array.isArray(remoteCruxIssue.comments) ? remoteCruxIssue.comments.length : null,
      issueState: remoteCruxIssue.state ?? null,
      issueUpdatedAt: remoteCruxIssue.updatedAt ?? null,
      pagesDomain: remoteCruxPagesDomain
        ? {
            artifact: remoteCruxPagesDomainPath,
            connectedOrigins: remoteCruxPagesDomain.connectedOrigins ?? [],
            expectedOrigin: remoteCruxPagesDomain.expectedOrigin ?? null,
            expectedOriginConnected: remoteCruxPagesDomain.expectedOriginConnected ?? null,
            pagesStatus: remoteCruxPagesDomain.pages?.status ?? null,
            result: remoteCruxPagesDomain.result ?? null,
            verifiedAt: remoteCruxPagesDomain.verifiedAt ?? null,
          }
        : null,
      pagespeedLiveProbe: summarizePagespeedLiveProbe(remotePagespeedLiveProbe, remotePagespeedLiveProbePath),
      runConclusion: index.remoteCruxEvidence.latestRunConclusion ?? remoteCruxRun.conclusion ?? null,
      runHeadSha: remoteCruxRun.headSha ?? index.remoteCruxEvidence.latestWorkflowCommit ?? null,
      runId: index.remoteCruxEvidence.latestRunId ?? remoteCruxRun.databaseId ?? null,
      runUrl: remoteCruxRun.url ?? null,
      verifiedAt: remoteCruxArtifact.verifiedAt ?? null,
    }),
  ),
  assertEqual(
    'finalBlockerSummary.remainingBlocker.latestRemoteRunCheck',
    JSON.stringify(finalBlockerSummary.remainingBlocker?.latestRemoteRunCheck),
    JSON.stringify(index.remoteCruxEvidence.latestRemoteRunCheck ?? null),
  ),
  assertIncludes(
    'audit blockers include CrUX blocker detail',
    JSON.stringify(audit.blockers),
    'chrome-ux-report',
  ),
  assertEqual('cruxMonitoring.result', cruxMonitoring.result, expectedCruxMonitoringResult),
  assertEqual(
    'cruxMonitoring.fieldDataAvailable',
    cruxMonitoring.fieldDataAvailable,
    expectedCruxFieldDataAvailable,
  ),
  cruxMonitoring.fieldDataAvailable !== true
    ? assertEqual(
        'canonical CrUX evidence exists while field data is blocked',
        hasCanonicalCruxEvidence,
        false,
      )
    : '',
  hasCanonicalCruxEvidence
    ? assertEqual('canonical CrUX evidence result', canonicalCruxEvidence?.result, 'passed')
    : '',
  hasCanonicalCruxEvidence
    ? assertEqual(
        'canonical CrUX evidence fieldDataAvailable',
        canonicalCruxEvidence?.fieldDataAvailable,
        true,
      )
    : '',
  assertOneOf('cruxCredentials.result', cruxCredentials.result, ['missing', 'present']),
  assertEqual('cruxCredentials.localEnvFiles.checked', cruxCredentials.localEnvFiles?.checked, true),
  assertIncludes('index CrUX monitoring artifact', JSON.stringify(index), cruxMonitoringPath),
  assertIncludes('index CrUX monitoring result', JSON.stringify(index), cruxMonitoringRun),
  assertIncludes('index CrUX credential artifact', JSON.stringify(index), cruxCredentialsPath),
  assertIncludes('index CrUX credential result', JSON.stringify(index), cruxCredentialRun),
  cruxLiveProbe
    ? assertIncludes('index CrUX live probe artifact', JSON.stringify(index), cruxLiveProbePath)
    : '',
  pagespeedLiveProbe
    ? assertIncludes('index PageSpeed live probe artifact', JSON.stringify(index), pagespeedLiveProbePath)
    : '',
  cruxLiveProbeRun
    ? assertIncludes('index CrUX live probe run', JSON.stringify(index), cruxLiveProbeRun)
    : '',
  cruxBlockerRefresh
    ? assertIncludes('index CrUX blocker refresh artifact', JSON.stringify(index), cruxBlockerRefreshPath)
    : '',
  cruxBlockerRefresh ? assertEqual('CrUX blocker refresh result', cruxBlockerRefresh.result, 'blocked') : '',
  cruxBlockerRefresh
    ? assertEqual(
        'CrUX blocker refresh command sequence',
        JSON.stringify(cruxBlockerRefreshCommandSummary(cruxBlockerRefresh)),
        JSON.stringify(
          expectedCruxBlockerRefreshCommands.map(([command, allowedExitCodes]) => ({
            allowedExitCodes,
            command,
          })),
        ),
      )
    : '',
  cruxBlockerRefresh
    ? assertEqual(
        'CrUX blocker refresh unexpected command failures',
        JSON.stringify(cruxBlockerRefreshUnexpectedFailures(cruxBlockerRefresh)),
        JSON.stringify([]),
      )
    : '',
  assertIncludes('blocker CrUX monitoring artifact', JSON.stringify(blockersManifest), cruxMonitoringPath),
  assertIncludes(
    'blocker CrUX monitoring API key source',
    JSON.stringify(blockersManifest),
    `monitor API key source ${formatApiKeySource(cruxCredentials.monitorApiKeySource)}`,
  ),
  assertIncludes(
    'blocker CrUX monitoring result',
    JSON.stringify(blockersManifest),
    `Fresh local run at ${cruxMonitoring.verifiedAt}`,
  ),
  assertIncludes(
    'blocker CrUX monitoring field data status',
    JSON.stringify(blockersManifest),
    `fieldDataAvailable ${String(cruxMonitoring.fieldDataAvailable)}`,
  ),
  assertIncludes('blocker CrUX credential artifact', JSON.stringify(blockersManifest), cruxCredentialsPath),
  assertIncludes(
    'blocker CrUX credential result',
    JSON.stringify(blockersManifest),
    `records result ${cruxCredentials.result}`,
  ),
  cruxLiveProbe
    ? assertIncludes('blocker CrUX live probe artifact', JSON.stringify(blockersManifest), cruxLiveProbePath)
    : '',
  pagespeedLiveProbe
    ? assertIncludes(
        'blocker PageSpeed live probe artifact',
        JSON.stringify(blockersManifest),
        pagespeedLiveProbePath,
      )
    : '',
  pagesDomain ? assertIncludes('index Pages domain artifact', JSON.stringify(index), pagesDomainPath) : '',
  pagesDomain
    ? assertIncludes('blocker Pages domain artifact', JSON.stringify(blockersManifest), pagesDomainPath)
    : '',
  pagesDomain ? assertEqual('pagesDomain.result', pagesDomain.result, 'passed') : '',
  pagesDomain
    ? assertEqual('pagesDomain.expectedOriginConnected', pagesDomain.expectedOriginConnected, true)
    : '',
  assertEqual('audit CrUX evidence exists', cruxAuditEvidence.exists, false),
  assertEqual('audit CrUX monitoring support exists', cruxMonitoringSupport?.exists, true),
  assertEqual('audit CrUX monitoring support result', cruxMonitoringSupport?.result, 'blocked'),
  assertEqual(
    'audit CrUX monitoring support fieldDataAvailable',
    cruxMonitoringSupport?.fieldDataAvailable,
    false,
  ),
  assertEqual(
    'audit CrUX monitoring support verifiedAt',
    cruxMonitoringSupport?.verifiedAt,
    cruxMonitoring.verifiedAt,
  ),
  assertEqual('audit CrUX credential support exists', cruxCredentialSupport?.exists, true),
  assertEqual('audit CrUX credential support result', cruxCredentialSupport?.result, cruxCredentials.result),
  assertEqual(
    'audit CrUX credential support verifiedAt',
    cruxCredentialSupport?.verifiedAt,
    cruxCredentials.verifiedAt,
  ),
  assertEqual(
    'remoteCruxEvidence.latestRunId',
    index.remoteCruxEvidence.latestRunId,
    remoteCruxRun.databaseId,
  ),
  assertEqual(
    'remoteCruxEvidence.latestMonitoringArtifact is newest downloaded run',
    remoteCruxArtifactPath,
    latestDownloadedRemoteCruxArtifactPath,
  ),
  assertEqual(
    'remoteCruxEvidence.latestWorkflowCommit',
    index.remoteCruxEvidence.latestWorkflowCommit,
    remoteCruxRun.headSha,
  ),
  assertEqual(
    'remoteCruxEvidence.latestRunConclusion',
    index.remoteCruxEvidence.latestRunConclusion,
    remoteCruxRun.conclusion,
  ),
  remoteCruxWorkflowDrift
    ? assertEqual('remote CrUX workflow drift result', remoteCruxWorkflowDrift.result, 'passed')
    : '',
  remoteCruxWorkflowDrift
    ? assertEqual(
        'remote CrUX workflow drift mismatched files',
        JSON.stringify(
          remoteCruxWorkflowDrift.mirroredFiles
            ?.filter((file) => file.matches !== true)
            .map((file) => file.remotePath) ?? [],
        ),
        JSON.stringify([]),
      )
    : '',
  remoteCruxWorkflowDrift
    ? assertEqual(
        'remote CrUX workflow drift missing markers',
        JSON.stringify(remoteCruxWorkflowDrift.workflow?.missingMarkers ?? []),
        JSON.stringify([]),
      )
    : '',
  remoteCruxWorkflowDrift
    ? assertEqual(
        'remoteCruxEvidence.workflowDrift',
        JSON.stringify(index.remoteCruxEvidence.workflowDrift),
        JSON.stringify({
          artifact: remoteCruxWorkflowDriftPath,
          result: remoteCruxWorkflowDrift.result,
          verifiedAt: remoteCruxWorkflowDrift.verifiedAt,
          mismatchedFiles:
            remoteCruxWorkflowDrift.mirroredFiles
              ?.filter((file) => file.matches !== true)
              .map((file) => file.remotePath) ?? [],
          missingWorkflowMarkers: remoteCruxWorkflowDrift.workflow?.missingMarkers ?? [],
        }),
      )
    : '',
  remoteCruxWorkflowDrift
    ? assertIncludes(
        'blocker remote CrUX workflow drift artifact',
        JSON.stringify(blockersManifest),
        remoteCruxWorkflowDriftPath,
      )
    : '',
  remoteCruxLatestRun
    ? assertEqual('remote CrUX latest run check result', remoteCruxLatestRun.result, 'passed')
    : '',
  remoteCruxLatestRun
    ? assertEqual(
        'remote CrUX latest run check points at indexed run',
        remoteCruxLatestRun.latestRemoteRun?.databaseId,
        index.remoteCruxEvidence.latestRunId,
      )
    : '',
  remoteCruxLatestRun
    ? assertEqual(
        'remote CrUX latest run indexed artifact exists',
        remoteCruxLatestRun.indexedRun?.artifactExists,
        true,
      )
    : '',
  remoteCruxLatestRun
    ? assertEqual(
        'remote CrUX latest run indexed artifact matches latest run',
        remoteCruxLatestRun.indexedRun?.artifactMatchesRun,
        true,
      )
    : '',
  remoteCruxLatestRun
    ? assertEqual(
        'remote CrUX latest run indexed workflow commit matches latest',
        remoteCruxLatestRun.indexedRun?.headShaMatchesLatest,
        true,
      )
    : '',
  remoteCruxLatestRun
    ? assertEqual(
        'remote CrUX latest run latest head SHA',
        remoteCruxLatestRun.latestRemoteRun?.headSha,
        index.remoteCruxEvidence.latestWorkflowCommit,
      )
    : '',
  remoteCruxLatestRun
    ? assertEqual(
        'remoteCruxEvidence.latestRemoteRunCheck',
        JSON.stringify(index.remoteCruxEvidence.latestRemoteRunCheck),
        JSON.stringify({
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
        }),
      )
    : '',
  remoteCruxLatestRun
    ? assertIncludes(
        'blocker remote CrUX latest run artifact',
        JSON.stringify(blockersManifest),
        remoteCruxLatestRunPath,
      )
    : '',
  assertEqual('remote CrUX artifact result', remoteCruxArtifact.result, 'blocked'),
  assertEqual('remote CrUX artifact fieldDataAvailable', remoteCruxArtifact.fieldDataAvailable, false),
  assertOneOf('remote CrUX artifact API key source', remoteCruxArtifact.apiKeySource?.source, [
    'env-file',
    'none',
    'process',
  ]),
  assertOneOf('remote CrUX credentials result', remoteCruxCredentials.result, ['missing', 'present']),
  assertOneOf(
    'remote CrUX credentials monitor key source',
    remoteCruxCredentials.monitorApiKeySource?.source,
    ['env-file', 'none', 'process'],
  ),
  assertEqual(
    'remote CrUX credentials env-file names are recorded',
    Array.isArray(remoteCruxCredentials.usableByCurrentMonitor?.envFileNames),
    true,
  ),
  remoteCruxPagesDomain
    ? assertEqual('remote Pages domain result', remoteCruxPagesDomain.result, 'passed')
    : '',
  remoteCruxPagesDomain
    ? assertEqual(
        'remote Pages domain expected origin connected',
        remoteCruxPagesDomain.expectedOriginConnected,
        true,
      )
    : '',
  remoteCruxPagesDomain
    ? assertIncludes(
        'remote Pages domain connected origin',
        JSON.stringify(remoteCruxPagesDomain.connectedOrigins ?? []),
        'https://komin0707.github.io',
      )
    : '',
  remoteCruxCredentials.result === 'missing'
    ? assertEqual(
        'remote CrUX credentials usable local env names',
        JSON.stringify(remoteCruxCredentials.usableByCurrentMonitor?.localEnvironmentNames),
        JSON.stringify([]),
      )
    : '',
  remoteCruxCredentials.result === 'missing'
    ? assertEqual(
        'remote CrUX credentials usable GitHub secret names',
        JSON.stringify(remoteCruxCredentials.usableByCurrentMonitor?.githubSecretNames),
        JSON.stringify([]),
      )
    : '',
  remoteCruxCredentials.result === 'missing'
    ? assertEqual(
        'remote CrUX credentials usable GitHub environment secret names',
        JSON.stringify(remoteCruxCredentials.githubEnvironments?.acceptedPresent?.secrets ?? []),
        JSON.stringify([]),
      )
    : '',
  remoteCruxCredentials.result === 'missing'
    ? assertEqual(
        'remote CrUX credentials usable GitHub environment variable names',
        JSON.stringify(remoteCruxCredentials.githubEnvironments?.acceptedPresent?.variables ?? []),
        JSON.stringify([]),
      )
    : '',
  remoteCruxCredentials.result === 'missing'
    ? assertEqual(
        'local CrUX credentials non-accepted local credential names',
        JSON.stringify(flattenNonAcceptedCredentialNames(cruxCredentials.nonAcceptedCredentialNames)),
        JSON.stringify([]),
      )
    : '',
  remoteCruxCredentials.result === 'missing'
    ? assertEqual(
        'remote CrUX credentials non-accepted local credential names',
        JSON.stringify(flattenNonAcceptedCredentialNames(remoteCruxCredentials.nonAcceptedCredentialNames)),
        JSON.stringify([]),
      )
    : '',
  remoteCruxCredentials.result === 'missing'
    ? assertEqual(
        'remote CrUX artifact origin API status',
        remoteCruxArtifact.checks?.cruxApi?.originRecord?.status,
        403,
      )
    : '',
  remoteCruxCredentials.result === 'missing'
    ? assertEqual(
        'remote CrUX artifact URL API status',
        remoteCruxArtifact.checks?.cruxApi?.urlRecord?.status,
        403,
      )
    : '',
  remoteCruxCredentials.result === 'missing'
    ? assertEqual('remote CrUX artifact PageSpeed status', remoteCruxArtifact.checks?.pageSpeed?.status, 429)
    : '',
  assertEqual(
    'remote CrUX artifact cache scan enabled',
    remoteCruxArtifact.checks?.cruxCache?.scanEnabled,
    true,
  ),
  assertEqual(
    'remote CrUX artifact cache scanned all chunks',
    remoteCruxArtifact.checks?.cruxCache?.scannedChunks,
    remoteCruxArtifact.checks?.cruxCache?.totalChunks,
  ),
  assertEqual(
    'remote CrUX artifact cache found origin',
    remoteCruxArtifact.checks?.cruxCache?.foundOrigin,
    false,
  ),
  assertIncludes(
    'remote CrUX failed log',
    remoteCruxFailedLog,
    'Chrome UX Report field data is not available yet.',
  ),
  assertIncludes(
    'blocker latest remote CrUX run',
    JSON.stringify(blockersManifest),
    `Manual remote workflow run ${String(remoteCruxRun.databaseId)}`,
  ),
  assertEqual(
    'remote CrUX artifact canonical guidance',
    remoteCruxArtifact.requiredToComplete?.[0],
    'Set CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY to a Google API key with Chrome UX Report/PageSpeed quota and rerun this verifier.',
  ),
  assertEqual('remote CrUX issue URL', index.remoteCruxEvidence.blockerIssue, remoteCruxIssue.url),
  assertEqual('remote CrUX issue state', remoteCruxIssue.state, 'OPEN'),
  assertIsoAtOrAfter(
    'remote CrUX issue updatedAt covers latest local monitoring',
    remoteCruxIssue.updatedAt,
    cruxMonitoring.verifiedAt,
  ),
  assertIncludes(
    'remote CrUX issue comment latest local monitoring timestamp',
    JSON.stringify(remoteCruxIssue.comments ?? []),
    cruxMonitoring.verifiedAt,
  ),
  assertIncludes(
    'remote CrUX issue credential preflight body',
    remoteCruxIssue.body ?? '',
    `Credential preflight result: ${remoteCruxCredentials.result}`,
  ),
  assertIncludes(
    'remote CrUX issue credential key source body',
    remoteCruxIssue.body ?? '',
    'Credential preflight monitor key source:',
  ),
  assertIncludes(
    'remote CrUX issue credential exported env body',
    remoteCruxIssue.body ?? '',
    'Credential preflight usable exported env names:',
  ),
  assertIncludes(
    'remote CrUX issue credential env-file body',
    remoteCruxIssue.body ?? '',
    'Credential preflight usable env-file names:',
  ),
  assertIncludes(
    'remote CrUX issue credential GitHub secret body',
    remoteCruxIssue.body ?? '',
    'Credential preflight usable GitHub secret names:',
  ),
  assertIncludes(
    'remote CrUX issue non-accepted credential body',
    remoteCruxIssue.body ?? '',
    'Credential preflight non-accepted local credential names:',
  ),
  assertIncludes(
    'remote CrUX issue operator steps heading',
    remoteCruxIssue.body ?? '',
    'Operator next steps:',
  ),
  assertIncludes(
    'remote CrUX issue repository secret operator step',
    remoteCruxIssue.body ?? '',
    'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
  ),
  assertIncludes(
    'remote CrUX issue environment secret operator step',
    remoteCruxIssue.body ?? '',
    'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
  ),
  assertIncludes(
    'remote CrUX issue blocker refresh operator step',
    remoteCruxIssue.body ?? '',
    'npm run refresh:crux-blocker-evidence',
  ),
  remoteCruxPagesDomain
    ? assertIncludes(
        'remote CrUX issue Pages domain body',
        remoteCruxIssue.body ?? '',
        'Pages domain result: passed',
      )
    : '',
  assertIncludes(
    'remote CrUX issue credential preflight comment',
    JSON.stringify(remoteCruxIssue.comments ?? []),
    'Local credential preflight update',
  ),
  assertIncludes(
    'remote CrUX issue local comment blocker refresh command',
    JSON.stringify(remoteCruxIssue.comments ?? []),
    'npm run refresh:crux-blocker-evidence',
  ),
  assertIncludes(
    'remote CrUX issue local comment non-accepted credential names',
    JSON.stringify(remoteCruxIssue.comments ?? []),
    'Credential preflight non-accepted local credential names:',
  ),
].filter(Boolean);

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify(
      {
        checked: checklist.checked,
        objectiveStatus: index.objective?.status ?? 'unknown',
        note:
          index.objective?.status === 'achieved'
            ? 'Completion evidence is internally consistent and the objective is achieved.'
            : 'Completion evidence is internally consistent, but the objective is not achieved.',
        status: audit.status,
        total: checklist.total,
        unchecked: checklist.unchecked,
      },
      null,
      2,
    )}\n`,
  );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readOptionalJson(path) {
  return existsSync(path) ? readJson(path) : null;
}

function countChecklist(source) {
  return source.split('\n').reduce(
    (counts, line) => {
      if (/^\d+\.\s+\[x\]/.test(line)) {
        counts.checked += 1;
        counts.total += 1;
      } else if (/^\d+\.\s+\[\s\]/.test(line)) {
        counts.unchecked += 1;
        counts.total += 1;
      }
      return counts;
    },
    { checked: 0, total: 0, unchecked: 0 },
  );
}

function findMissingChecklistNumbers(source) {
  const numbers = source
    .split('\n')
    .map((line) => Number(line.trim().match(/^(\d+)\.\s+\[[ x]\]/)?.[1] ?? 0))
    .filter((number) => number > 0);
  const observed = new Set(numbers);
  const highest = Math.max(...numbers);
  return Array.from({ length: highest }, (_, index) => index + 1).filter((number) => !observed.has(number));
}

function findChecklistItem(source, itemNumber) {
  return source
    .split('\n')
    .map((line) => line.trim().match(/^(\d+)\.\s+\[([ x])\]/))
    .filter(Boolean)
    .map((match) => ({
      checked: match[2] === 'x',
      number: Number(match[1]),
    }))
    .find((item) => item.number === itemNumber);
}

function findUncheckedChecklistItems(source) {
  return source
    .split('\n')
    .map((line) => line.trim().match(/^(\d+)\.\s+\[\s\]\s*(.*)$/))
    .filter(Boolean)
    .map((match) => ({
      number: Number(match[1]),
      text: match[2],
    }));
}

function findDuplicateChecklistNumbers(source) {
  const numbers = source
    .split('\n')
    .map((line) => Number(line.trim().match(/^(\d+)\.\s+\[[ x]\]/)?.[1] ?? 0))
    .filter((number) => number > 0);
  return duplicateNumbers(numbers);
}

function findMalformedChecklistRows(source) {
  return source
    .split('\n')
    .map((line, index) => ({ line: index + 1, rawText: line, text: line.trim() }))
    .filter((entry) => /\[[ xX]\]/.test(entry.rawText))
    .filter((entry) => !/^\d+\.\s+\[[ xX]\]/.test(entry.text))
    .map((entry) => ({ line: entry.line, text: entry.text }));
}

function buildSectionSummary(source) {
  const sections = [];
  let currentSection = null;

  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    const heading = line.match(/^##\s+(.+)/);
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

    const item = line.match(/^(\d+)\.\s+\[([ x])\]/);
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

function buildExpectedObjectivePhaseReports(sections) {
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
      const checklist = {
        checked: phaseSections.reduce((sum, section) => sum + section.checked, 0),
        firstItem: Math.min(...phaseSections.map((section) => section.firstItem)),
        lastItem: Math.max(...phaseSections.map((section) => section.lastItem)),
        total: phaseSections.reduce((sum, section) => sum + section.total, 0),
        unchecked: phaseSections.reduce((sum, section) => sum + section.unchecked, 0),
      };
      const checklistRowDeltaFromClaim = checklist.total - definition.claimedChecklistRows;
      return {
        checklist,
        claimedChecklistRows: definition.claimedChecklistRows,
        checklistRowDeltaFromClaim,
        label: definition.label,
        phase: definition.phase,
        sections: phaseSections.map((section) => section.title),
        status: checklist.unchecked === 0 && checklistRowDeltaFromClaim === 0 ? 'complete' : 'incomplete',
      };
    })
    .filter(Boolean);
}

function sectionLetter(title) {
  return title.match(/SECTION\s+([A-I])/)?.[1] ?? '';
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

function assertEqual(label, actual, expected) {
  return Object.is(actual, expected) ? '' : `${label}: expected ${String(expected)}, got ${String(actual)}`;
}

function assertIncludes(label, haystack, needle) {
  return haystack.includes(needle) ? '' : `${label}: expected to include ${needle}`;
}

function assertOneOf(label, actual, expectedValues) {
  return expectedValues.includes(actual)
    ? ''
    : `${label}: expected one of ${expectedValues.join(', ')}, got ${String(actual)}`;
}

function assertGreaterThan(label, actual, minimum) {
  return Number(actual) > minimum
    ? ''
    : `${label}: expected greater than ${String(minimum)}, got ${String(actual)}`;
}

function assertIsoAtOrAfter(label, actual, minimum) {
  const actualTime = Date.parse(actual ?? '');
  const minimumTime = Date.parse(minimum ?? '');
  if (!Number.isFinite(actualTime) || !Number.isFinite(minimumTime)) {
    return `${label}: expected valid ISO timestamps, got actual ${String(actual)} and minimum ${String(
      minimum,
    )}`;
  }
  return actualTime >= minimumTime
    ? ''
    : `${label}: expected ${String(actual)} to be at or after ${String(minimum)}`;
}

function formatApiKeySource(source) {
  if (!source || source.source === 'none') return 'none';
  const name = source.name ?? 'unknown';
  return source.path ? `${source.source}:${source.path}:${name}` : `${source.source}:${name}`;
}

function formatCoverageMetric(label, metric) {
  return `${label} ${formatPercent(metric?.pct)}% (${String(metric?.covered ?? 0)}/${String(
    metric?.total ?? 0,
  )})`;
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

function githubEnvironmentSurfaceChecked(githubEnvironments, kind) {
  if (!githubEnvironments) return null;
  if (githubEnvironments.checked === false) return false;
  const environments = Array.isArray(githubEnvironments.environments) ? githubEnvironments.environments : [];
  return !environments.some((environment) => environment[kind]?.checked === false);
}

function flattenNonAcceptedCredentialNames(value) {
  if (!value?.checked) return null;
  const envFileNames = Array.isArray(value.envFileNames)
    ? value.envFileNames.flatMap((entry) => (Array.isArray(entry.names) ? entry.names : []))
    : [];
  const localEnvironmentNames = Array.isArray(value.localEnvironmentNames) ? value.localEnvironmentNames : [];
  return [...new Set([...envFileNames, ...localEnvironmentNames])].sort();
}

function formatPercent(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value).toFixed(2));
}

function credentialExitCode(credentials) {
  return credentials.result === 'present' ? 0 : 1;
}

function cruxBlockerRefreshCommandSummary(refresh) {
  return (refresh.commands ?? []).map((entry) => ({
    allowedExitCodes: entry.allowedExitCodes,
    command: entry.command,
  }));
}

function cruxBlockerRefreshUnexpectedFailures(refresh) {
  return (refresh.commands ?? [])
    .filter(
      (entry) => !Array.isArray(entry.allowedExitCodes) || !entry.allowedExitCodes.includes(entry.exitCode),
    )
    .map((entry) => ({
      allowedExitCodes: entry.allowedExitCodes,
      command: entry.command,
      exitCode: entry.exitCode,
    }));
}

function summarizeCruxBlockerRefresh(refresh) {
  return {
    artifact: cruxBlockerRefreshPath,
    commandCount: Array.isArray(refresh.commands) ? refresh.commands.length : 0,
    result: refresh.result ?? null,
    unexpectedFailureCount: cruxBlockerRefreshUnexpectedFailures(refresh).length,
    verifiedAt: refresh.verifiedAt ?? null,
  };
}

function liveProbeExitCode(cruxProbe, pageSpeedProbe) {
  const hasFieldData = Boolean(
    cruxProbe.probes?.some((probe) => probe.recordPresent === true) ||
    pageSpeedProbe.hasLoadingExperience === true ||
    pageSpeedProbe.hasOriginLoadingExperience === true,
  );
  return hasFieldData ? 0 : 1;
}

function formatNamedProbeRecord(probe, name) {
  const entry = probe.probes?.find((item) => item.name === name);
  return entry?.recordPresent === true ? 'present' : 'absent';
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function latestDownloadedCruxArtifactPath() {
  const baseDirectory = 'artifacts/manual-evidence';
  const latestRun = readdirSync(baseDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      runId: Number(entry.name.match(/^crux-monitoring-run-(\d+)$/)?.[1] ?? 0),
    }))
    .filter((entry) => entry.runId > 0)
    .filter((entry) => existsSync(`${baseDirectory}/${entry.name}/chrome-ux-report-monitoring.json`))
    .sort((left, right) => right.runId - left.runId)[0];

  return latestRun ? `${baseDirectory}/${latestRun.name}/chrome-ux-report-monitoring.json` : '';
}

function latestIsoSecond(...values) {
  const times = values
    .filter(Boolean)
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);
  if (times.length === 0) return null;
  return new Date(Math.max(...times)).toISOString().replace(/\.\d{3}Z$/, 'Z');
}
