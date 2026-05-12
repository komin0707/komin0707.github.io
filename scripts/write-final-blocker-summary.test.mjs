import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/write-final-blocker-summary.mjs');
const screenshotMetadata = [
  {
    exists: true,
    height: 781,
    path: 'artifacts/patient-avatar-current.png',
    sha256: 'patient-sha',
    sizeBytes: 1147423,
    width: 1386,
  },
  {
    exists: true,
    height: 900,
    path: 'artifacts/simulator-current.png',
    sha256: 'simulator-sha',
    sizeBytes: 1202196,
    width: 1440,
  },
];
const visualReviewMetadata = {
  detail: 'Visual screenshot review matches the current screenshot hashes and dimensions.',
  exists: true,
  path: 'artifacts/manual-evidence/visual-screenshot-review.json',
  reviewedScreenshotCount: 2,
  valid: true,
  verifiedAt: '2026-05-11T03:40:00.000Z',
};

describe('final blocker summary writer', () => {
  it('writes the canonical incomplete summary for the remaining CrUX blocker', async () => {
    const workspace = await createFixtureWorkspace();

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      path: 'artifacts/manual-evidence/final-blocker-summary.json',
      status: 'incomplete',
      objectiveStatus: 'not_achieved',
      blockerCount: 1,
      consolidatedBlockerCount: 2,
      deepAuditBlockerCount: 1,
    });

    const summary = readJson(join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json'));
    expect(summary).toEqual({
      generatedAt: '2026-05-11T03:45:00.000Z',
      status: 'incomplete',
      objectiveStatus: 'not_achieved',
      objective: {
        claimedChecklistRows: 1167,
        actualChecklistRowsObserved: 1150,
        expectedHighestItemNumber: 1150,
        checklistRowDeltaFromClaim: -17,
        phaseClaimedChecklistRowsTotal: 1200,
        checklistRowDeltaFromPhaseClaims: -50,
        phaseClaimsDeltaFromClaimedTotal: 33,
        completionCriterion: 'Every checklist row is checked with real evidence.',
        source: 'User requested COMPLETE_FIX_REQUIREMENTS.md completion.',
        status: 'not_achieved',
      },
      checklist: {
        actualChecklistRowsObserved: 1150,
        checked: 1149,
        duplicateItemNumbers: [],
        malformedChecklistRows: [],
        missingItemNumbers: [],
        unchecked: 1,
        sections: [],
        note: 'The prompt requested 1,167 items, but the checklist contains 1,150 numbered rows.',
      },
      successCriteria: [
        'The claimed 1,167-item objective reconciles with the actual numbered checklist rows in COMPLETE_FIX_REQUIREMENTS.md.',
        'Every actual checklist row in COMPLETE_FIX_REQUIREMENTS.md is checked.',
        'Every explicit command and gate has current passing evidence.',
        'Every required manual or external evidence artifact exists and passes semantic validation.',
        'Chrome UX Report evidence is not accepted unless it contains real CrUX/PageSpeed field-data indicators for the production origin.',
      ],
      completionAudit: {
        objectiveRestatement:
          'Complete COMPLETE_FIX_REQUIREMENTS.md to 100%, reconcile the claimed 1,167-item target with the actual numbered checklist rows, pass every named command gate, provide visual patient screenshot evidence, and accept Chrome UX Report monitoring only with real production field-data evidence.',
        verdict: 'not_achieved',
        inspectedRequirements: [
          {
            requirement: 'Claimed 1,167 / 1,167 checklist objective.',
            status: 'blocked',
            evidence: ['artifacts/completion-evidence-index.json:objective'],
            finding: 'claimed 1167; actual 1150; delta -17',
          },
          {
            requirement: 'Seven objective phase checklist claims reconcile with the actual checklist.',
            status: 'blocked',
            evidence: [
              'artifacts/completion-evidence-index.json:objective',
              'artifacts/manual-evidence/final-blocker-summary.json:objectivePhaseReports',
            ],
            finding: 'phase claims 1200; actual 1150; actual-phase delta -50; phase-total delta 33',
          },
          {
            requirement: 'Every actual checklist row in COMPLETE_FIX_REQUIREMENTS.md is checked.',
            status: 'blocked',
            evidence: [
              'COMPLETE_FIX_REQUIREMENTS.md',
              'artifacts/completion-audit.json:checklist',
              'artifacts/manual-evidence/remaining-external-blockers.json:checklistState',
            ],
            finding: '1149/1150 checked; 1 unchecked',
          },
          {
            requirement: 'Named phase report commands pass with current evidence.',
            status: 'blocked',
            evidence: [],
            finding: 'type-check null; lint null; coverage null; build null',
          },
          {
            requirement: 'Visual patient screenshot evidence exists and passed review.',
            status: 'unknown',
            evidence: [],
            finding: 'No visual screenshot notes recorded.',
          },
          {
            requirement: 'Chrome UX Report monitoring has real production field-data evidence.',
            status: 'blocked',
            evidence: [
              'artifacts/manual-evidence/chrome-ux-report.json',
              'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
              'artifacts/manual-evidence/chrome-ux-report-credentials.json',
              'artifacts/manual-evidence/crux-blocker-refresh.json',
              'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
              'artifacts/manual-evidence/remote-crux-latest-run.json',
            ],
            finding: 'Canonical evidence is missing until field data exists.',
          },
        ],
      },
      deepAuditCompletion: {
        artifact: 'artifacts/manual-evidence/deep-audit-completion-audit.json',
        status: 'missing',
        objectiveRestatement:
          'Complete all 1,180 DEEP_AUDIT_REQUIREMENTS_V2.md checklist rows and satisfy the true completion definition.',
        blockers: [
          {
            id: 'deep-audit-artifact-missing',
            status: 'blocked',
            finding:
              'artifacts/manual-evidence/deep-audit-completion-audit.json is missing. Run npm run check:deep-audit-completion.',
          },
        ],
      },
      blockerCounts: {
        completeFix: 1,
        consolidated: 2,
        deepAudit: 1,
      },
      externalEvidenceHandoff: {
        checklist: 'artifacts/manual-evidence/deep-audit-external-evidence-checklist.json',
        runbook: 'artifacts/manual-evidence/deep-audit-external-evidence-runbook.md',
      },
      remainingDeepAuditBlockers: [
        {
          id: 'deep-audit-artifact-missing',
          status: 'blocked',
          finding:
            'artifacts/manual-evidence/deep-audit-completion-audit.json is missing. Run npm run check:deep-audit-completion.',
        },
      ],
      consolidatedRemainingBlockers: [
        {
          evidence: [
            'Fresh local run found no CrUX field data.',
            'Remote blocker issue includes credential preflight comment https://github.com/example/repo/issues/1#issuecomment-1; latest issue body records credential result missing, monitor key source none, exported env key names [], env-file key names [], and GitHub secret key names [], GitHub environment secret key names [], and GitHub environment variable key names [].',
          ],
          finding: 'The available evidence is monitoring-only and has no field data.',
          id: 'chrome-ux-report',
          requirement: 'Chrome UX Report monitoring',
          source: 'COMPLETE_FIX_REQUIREMENTS.md',
          status: 'blocked',
        },
        {
          evidence: [],
          finding:
            'artifacts/manual-evidence/deep-audit-completion-audit.json is missing. Run npm run check:deep-audit-completion.',
          id: 'deep-audit-artifact-missing',
          requirement: 'deep-audit-artifact-missing',
          source: 'DEEP_AUDIT_REQUIREMENTS_V2.md',
          status: 'blocked',
        },
      ],
      promptToArtifactChecklist: [
        {
          requirement: 'Chrome UX Report monitoring.',
          evidence: ['artifacts/manual-evidence/chrome-ux-report-monitoring.json'],
          notes: 'Canonical evidence is missing until field data exists.',
          status: 'blocked',
        },
      ],
      phaseReports: [],
      objectivePhaseReports: [],
      remainingBlocker: {
        item: 874,
        id: 'chrome-ux-report',
        requirement: 'Chrome UX Report monitoring',
        expectedCanonicalArtifact: 'artifacts/manual-evidence/chrome-ux-report.json',
        currentMonitoringArtifact: 'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
        latestLocalMonitoring: {
          apiKeySource: null,
          artifact: 'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
          cruxCache: {
            dataset: 'global',
            foundOrigin: false,
            latestMonth: '202603',
            origins: 18257384,
            scanEnabled: true,
            scannedChunks: 21,
            totalChunks: 21,
          },
          fieldDataAvailable: false,
          result: 'blocked',
          verifiedAt: '2026-05-11T03:40:00.000Z',
        },
        latestLocalBatchRefresh: {
          artifact: 'artifacts/manual-evidence/crux-blocker-refresh.json',
          commandCount: 7,
          result: 'blocked',
          unexpectedFailureCount: 0,
          verifiedAt: '2026-05-11T03:44:00.000Z',
        },
        latestLocalCredentials: {
          artifact: 'artifacts/manual-evidence/chrome-ux-report-credentials.json',
          monitorApiKeySource: null,
          result: 'missing',
          usableEnvFileNames: [],
          usableGitHubEnvironmentSecretNames: [],
          usableGitHubEnvironmentSecretsChecked: null,
          usableGitHubEnvironmentVariableNames: [],
          usableGitHubEnvironmentVariablesChecked: null,
          usableGitHubSecretNames: [],
          usableGitHubSecretsChecked: null,
          usableLocalEnvironmentNames: [],
          nonAcceptedCredentialNames: {
            checked: true,
            envFileNames: [],
            localEnvironmentNames: [],
          },
          verifiedAt: '2026-05-11T03:39:00.000Z',
        },
        latestPagesDomain: null,
        latestRemoteRun: {
          artifact: 'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
          apiKeySource: null,
          credentialArtifact:
            'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-credentials.json',
          credentialMonitorApiKeySource: null,
          credentialResult: 'missing',
          credentialUsableEnvFileNames: [],
          credentialUsableGitHubEnvironmentSecretNames: [],
          credentialUsableGitHubEnvironmentSecretsChecked: null,
          credentialUsableGitHubEnvironmentVariableNames: [],
          credentialUsableGitHubEnvironmentVariablesChecked: null,
          credentialUsableGitHubSecretNames: [],
          credentialUsableGitHubSecretsChecked: null,
          credentialUsableLocalEnvironmentNames: [],
          credentialNonAcceptedCredentialNames: {
            checked: true,
            envFileNames: [],
            localEnvironmentNames: [],
          },
          cruxLiveProbe: null,
          cruxCache: {
            dataset: 'global',
            foundOrigin: false,
            latestMonth: '202603',
            origins: 18257384,
            scanEnabled: true,
            scannedChunks: 21,
            totalChunks: 21,
          },
          fieldDataAvailable: false,
          issue: 'https://github.com/example/repo/issues/1',
          issueCommentCount: 1,
          issueState: 'OPEN',
          issueUpdatedAt: '2026-05-11T03:42:00Z',
          pagesDomain: null,
          pagespeedLiveProbe: null,
          runConclusion: 'failure',
          runHeadSha: 'abc123',
          runId: 1,
          runUrl: 'https://github.com/example/repo/actions/runs/1',
          verifiedAt: '2026-05-11T03:41:00.000Z',
        },
        latestRemoteRunCheck: {
          artifact: 'artifacts/manual-evidence/remote-crux-latest-run.json',
          result: 'passed',
          verifiedAt: '2026-05-11T03:43:00.000Z',
          latestRemoteRunId: 1,
          indexedRunId: 1,
          indexedArtifactExists: true,
        },
        currentEvidence: [
          'Fresh local run found no CrUX field data.',
          'Remote blocker issue includes credential preflight comment https://github.com/example/repo/issues/1#issuecomment-1; latest issue body records credential result missing, monitor key source none, exported env key names [], env-file key names [], and GitHub secret key names [], GitHub environment secret key names [], and GitHub environment variable key names [].',
        ],
        latestRemoteMonitoringArtifact:
          'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
        blockerIssue: 'https://github.com/example/repo/issues/1',
        requiredToComplete: ['Real CrUX field data must be available.'],
        acceptedCredentialNames: ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'],
        operatorNextSteps: [
          'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
          'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
          'gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io',
          'npm run refresh:crux-blocker-evidence',
        ],
        mustNotMarkCompleteBecause: 'The available evidence is monitoring-only and has no field data.',
      },
      doNotCompleteYet: [
        'Do not check item 874.',
        'Do not create chrome-ux-report.json without real field data.',
      ],
    });
  });

  it('adds phase reports with command and screenshot evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const auditPath = join(workspace, 'artifacts/completion-audit.json');
    const audit = readJson(auditPath);
    audit.checklist.sections = [
      {
        checked: 79,
        firstItem: 821,
        lastItem: 900,
        title: '🚨 SECTION E: 성능 (100+ 항목)',
        total: 80,
        unchecked: 1,
      },
    ];
    audit.blockers = [
      {
        detail:
          '874. Requires Chrome UX Report field data for a connected production domain. Expected artifacts/manual-evidence/chrome-ux-report.json.',
        id: 'chrome-ux-report',
        source: '874. [ ] Chrome UX Report 모니터링',
      },
    ];
    writeJson(auditPath, audit);

    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = readJson(indexPath);
    index.promptRequirementMap.push(
      {
        requirement: 'npm run type-check.',
        evidence: ['latest terminal run: npm run type-check exited 0'],
        status: 'verified',
      },
      {
        requirement: 'npm run lint.',
        evidence: ['latest terminal run: npm run lint -- --quiet exited 0'],
        status: 'verified',
      },
      {
        requirement: 'npm test:coverage result.',
        evidence: ['latest terminal run: npm run test:coverage exited 0', '100% coverage'],
        status: 'verified',
      },
      {
        requirement: 'npm run build, image-free output, under 100KB primary budget.',
        evidence: ['latest terminal run: npm run build exited 0'],
        status: 'verified',
      },
      {
        requirement: 'Section A patient avatar redesign and visual patient screenshot.',
        evidence: ['artifacts/patient-avatar-current.png', 'artifacts/simulator-current.png'],
        status: 'verified',
      },
    );
    writeJson(indexPath, index);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const summary = readJson(join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json'));
    expect(summary.phaseReports).toEqual([
      {
        phase: 1,
        section: '🚨 SECTION E: 성능 (100+ 항목)',
        checklist: {
          checked: 79,
          firstItem: 821,
          lastItem: 900,
          total: 80,
          unchecked: 1,
        },
        status: 'incomplete',
        commandEvidence: {
          build: {
            evidence: ['latest terminal run: npm run build exited 0'],
            notes: null,
            status: 'verified',
          },
          coverage: {
            evidence: ['latest terminal run: npm run test:coverage exited 0', '100% coverage'],
            notes: null,
            status: 'verified',
          },
          lint: {
            evidence: ['latest terminal run: npm run lint -- --quiet exited 0'],
            notes: null,
            status: 'verified',
          },
          typeCheck: {
            evidence: ['latest terminal run: npm run type-check exited 0'],
            notes: null,
            status: 'verified',
          },
        },
        visualScreenshotEvidence: {
          evidence: ['artifacts/patient-avatar-current.png', 'artifacts/simulator-current.png'],
          notes: null,
          screenshots: screenshotMetadata,
          status: 'verified',
          visualReview: visualReviewMetadata,
        },
        remainingBlockers: [
          {
            detail:
              '874. Requires Chrome UX Report field data for a connected production domain. Expected artifacts/manual-evidence/chrome-ux-report.json.',
            id: 'chrome-ux-report',
            source: '874. [ ] Chrome UX Report 모니터링',
          },
        ],
      },
    ]);
    expect(summary.objectivePhaseReports).toEqual([
      {
        phase: 5,
        label: '5주차: Section E — 성능',
        sections: ['🚨 SECTION E: 성능 (100+ 항목)'],
        claimedChecklistRows: 100,
        checklistRowDeltaFromClaim: -20,
        checklist: {
          checked: 79,
          firstItem: 821,
          lastItem: 900,
          total: 80,
          unchecked: 1,
        },
        status: 'incomplete',
        commandEvidence: {
          build: {
            evidence: ['latest terminal run: npm run build exited 0'],
            notes: null,
            status: 'verified',
          },
          coverage: {
            evidence: ['latest terminal run: npm run test:coverage exited 0', '100% coverage'],
            notes: null,
            status: 'verified',
          },
          lint: {
            evidence: ['latest terminal run: npm run lint -- --quiet exited 0'],
            notes: null,
            status: 'verified',
          },
          typeCheck: {
            evidence: ['latest terminal run: npm run type-check exited 0'],
            notes: null,
            status: 'verified',
          },
        },
        visualScreenshotEvidence: {
          evidence: ['artifacts/patient-avatar-current.png', 'artifacts/simulator-current.png'],
          notes: null,
          screenshots: screenshotMetadata,
          status: 'verified',
          visualReview: visualReviewMetadata,
        },
        remainingBlockers: [
          {
            detail:
              '874. Requires Chrome UX Report field data for a connected production domain. Expected artifacts/manual-evidence/chrome-ux-report.json.',
            id: 'chrome-ux-report',
            source: '874. [ ] Chrome UX Report 모니터링',
          },
        ],
      },
    ]);
  });

  it('marks objective phases incomplete when checked rows do not reconcile with phase claims', async () => {
    const workspace = await createFixtureWorkspace();
    const auditPath = join(workspace, 'artifacts/completion-audit.json');
    const audit = readJson(auditPath);
    audit.checklist.sections = [
      {
        checked: 170,
        firstItem: 251,
        lastItem: 420,
        title: '🚨 SECTION B: 미구현/불완전 기능 (200+ 항목)',
        total: 170,
        unchecked: 0,
      },
    ];
    writeJson(auditPath, audit);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const summary = readJson(join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json'));
    expect(summary.phaseReports[0].status).toBe('complete');
    expect(summary.objectivePhaseReports[0]).toMatchObject({
      phase: 2,
      claimedChecklistRows: 200,
      checklistRowDeltaFromClaim: -30,
      status: 'incomplete',
      checklist: {
        checked: 170,
        total: 170,
        unchecked: 0,
      },
    });
  });
});

async function createFixtureWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), 'final-blocker-summary-'));
  mkdirSync(join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1'), { recursive: true });

  writeJson(join(workspace, 'artifacts/completion-audit.json'), {
    status: 'incomplete',
    checklist: {
      observedTotal: 1150,
      checked: 1149,
      duplicateItemNumbers: [],
      missingItemNumbers: [],
      unchecked: 1,
    },
    blockers: [{ id: 'chrome-ux-report' }],
    screenshots: screenshotMetadata,
    visualReview: visualReviewMetadata,
  });
  writeJson(join(workspace, 'artifacts/completion-evidence-index.json'), {
    objective: {
      claimedChecklistRows: 1167,
      actualChecklistRowsObserved: 1150,
      expectedHighestItemNumber: 1150,
      checklistRowDeltaFromClaim: -17,
      phaseClaimedChecklistRowsTotal: 1200,
      checklistRowDeltaFromPhaseClaims: -50,
      phaseClaimsDeltaFromClaimedTotal: 33,
      completionCriterion: 'Every checklist row is checked with real evidence.',
      source: 'User requested COMPLETE_FIX_REQUIREMENTS.md completion.',
      status: 'not_achieved',
    },
    promptRequirementMap: [
      {
        requirement: 'Chrome UX Report monitoring.',
        evidence: ['artifacts/manual-evidence/chrome-ux-report-monitoring.json'],
        notes: 'Canonical evidence is missing until field data exists.',
        status: 'blocked',
      },
    ],
    remoteCruxEvidence: {
      latestMonitoringArtifact:
        'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
      latestRunConclusion: 'failure',
      latestRunId: 1,
      blockerIssue: 'https://github.com/example/repo/issues/1',
      latestRemoteRunCheck: {
        artifact: 'artifacts/manual-evidence/remote-crux-latest-run.json',
        result: 'passed',
        verifiedAt: '2026-05-11T03:43:00.000Z',
        latestRemoteRunId: 1,
        indexedRunId: 1,
        indexedArtifactExists: true,
      },
    },
    doNotCompleteYet: [
      'Do not check item 874.',
      'Do not create chrome-ux-report.json without real field data.',
    ],
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json'), {
    verifiedAt: '2026-05-11T03:45:00.000Z',
    checklistState: {
      note: 'The prompt requested 1,167 items, but the checklist contains 1,150 numbered rows.',
    },
    blockers: [
      {
        item: 874,
        id: 'chrome-ux-report',
        requirement: 'Chrome UX Report monitoring',
        currentEvidence: [
          'Fresh local run found no CrUX field data.',
          'Remote blocker issue includes credential preflight comment https://github.com/example/repo/issues/1#issuecomment-1; latest issue body records credential result missing, monitor key source none, exported env key names [], env-file key names [], and GitHub secret key names [], GitHub environment secret key names [], and GitHub environment variable key names [].',
        ],
        requiredToComplete: ['Real CrUX field data must be available.'],
        acceptedCredentialNames: ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'],
        mustNotMarkCompleteBecause: 'The available evidence is monitoring-only and has no field data.',
      },
    ],
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-monitoring.json'), {
    checks: {
      cruxCache: {
        dataset: 'global',
        foundOrigin: false,
        latestMonth: '202603',
        origins: 18257384,
        scanEnabled: true,
        scannedChunks: 21,
        totalChunks: 21,
      },
    },
    fieldDataAvailable: false,
    result: 'blocked',
    verifiedAt: '2026-05-11T03:40:00.000Z',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'), {
    acceptedKeyNames: ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'],
    result: 'missing',
    nonAcceptedCredentialNames: {
      checked: true,
      envFileNames: [],
      localEnvironmentNames: [],
    },
    usableByCurrentMonitor: {
      githubSecretNames: [],
      localEnvironmentNames: [],
    },
    verifiedAt: '2026-05-11T03:39:00.000Z',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/crux-blocker-refresh.json'), {
    commands: [
      { allowedExitCodes: [0, 1], command: 'npm run check:crux-credentials', exitCode: 1 },
      { allowedExitCodes: [0, 1], command: 'npm run check:crux-live-probes', exitCode: 1 },
      { allowedExitCodes: [0], command: 'npm run check:pages-domain', exitCode: 0 },
      {
        allowedExitCodes: [0, 1],
        command: 'CRUX_CACHE_SCAN=1 npm run check:crux-monitoring',
        exitCode: 1,
      },
      { allowedExitCodes: [0], command: 'npm run update:crux-blocker-issue', exitCode: 0 },
      { allowedExitCodes: [0], command: 'npm run sync:remote-crux-evidence', exitCode: 0 },
      { allowedExitCodes: [0], command: 'npm run test:list', exitCode: 0 },
    ],
    result: 'blocked',
    verifiedAt: '2026-05-11T03:44:00.000Z',
  });
  writeJson(
    join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json'),
    {
      checks: {
        cruxCache: {
          dataset: 'global',
          foundOrigin: false,
          latestMonth: '202603',
          origins: 18257384,
          scanEnabled: true,
          scannedChunks: 21,
          totalChunks: 21,
        },
      },
      fieldDataAvailable: false,
      result: 'blocked',
      verifiedAt: '2026-05-11T03:41:00.000Z',
    },
  );
  writeJson(
    join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-credentials.json'),
    {
      nonAcceptedCredentialNames: {
        checked: true,
        envFileNames: [],
        localEnvironmentNames: [],
      },
      result: 'missing',
    },
  );
  writeJson(join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/run.json'), {
    conclusion: 'failure',
    databaseId: 1,
    headSha: 'abc123',
    url: 'https://github.com/example/repo/actions/runs/1',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/issue.json'), {
    comments: [
      {
        body: 'Local credential preflight update.',
      },
    ],
    state: 'OPEN',
    updatedAt: '2026-05-11T03:42:00Z',
    url: 'https://github.com/example/repo/issues/1',
  });

  return workspace;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
