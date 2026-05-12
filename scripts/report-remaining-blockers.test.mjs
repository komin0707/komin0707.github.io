import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/report-remaining-blockers.mjs');

describe('remaining blocker report', () => {
  it('prints compact CrUX remote run context for the Chrome UX Report blocker', async () => {
    const workspace = await createFixtureWorkspace();

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Objective status: not_achieved');
    expect(result.stdout).toContain('Blockers: 3');
    expect(result.stdout).toContain(
      'Checklist note: The requirements file contains 1150 checklist rows, not 1167.',
    );
    expect(result.stdout).toContain(
      'Objective row claims: total claim 1167; phase claims 1200; actual 1150; actual-total delta -17; actual-phase delta -50; phase-total delta 33',
    );
    expect(result.stdout).toContain(
      'Audit objective row claim: mismatch; claimed 1167; actual 1150; delta -17; satisfied false',
    );
    expect(result.stdout).toContain(
      'Audit objective phase claim: mismatch; phase claims 1200; actual 1150; actual-phase delta -50; phase-total delta 33; satisfied false',
    );
    expect(result.stdout).toContain('Evidence verified at: 2026-05-11T00:05:00Z');
    expect(result.stdout).toContain('Completion audit verdict: not_achieved');
    expect(result.stdout).toContain(
      'Claimed 1,167 / 1,167 checklist objective.: blocked; claimed 1167; actual 1150; delta -17',
    );
    expect(result.stdout).toContain(
      'Seven objective phase checklist claims reconcile with the actual checklist.: blocked; phase claims 1200; actual 1150; actual-phase delta -50; phase-total delta 33',
    );
    expect(result.stdout).toContain(
      'Every actual checklist row in COMPLETE_FIX_REQUIREMENTS.md is checked.: blocked; 1149/1150 checked; 1 unchecked',
    );
    expect(result.stdout).toContain(
      'Named phase report commands pass with current evidence.: verified; type-check verified; lint verified; coverage verified; build verified',
    );
    expect(result.stdout).toContain(
      'Chrome UX Report monitoring has real production field-data evidence.: blocked; Monitoring exists locally and remotely, but field-data evidence is unavailable.',
    );
    expect(result.stdout).toContain('Do not complete yet:');
    expect(result.stdout).toContain('Do not call update_goal.');
    expect(result.stdout).toContain('Do not check item 874.');
    expect(result.stdout).toContain(
      'Do not create artifacts/manual-evidence/chrome-ux-report.json without real field data.',
    );
    expect(result.stdout).toContain(
      '2. 2주차: Section B — 미구현 기능 완성: 170/170 checked; 0 unchecked; claimed 200; delta -30 (items 251-420); status incomplete; blockers 0',
    );
    expect(result.stdout).toContain(
      '5. 5주차: Section E — 성능: 79/80 checked; 1 unchecked; claimed 100; delta -20 (items 821-900); status incomplete; blockers 1',
    );
    expect(result.stdout).toContain(
      '7. 7주차: Section G, H, I — 보안/문서/배포: 150/150 checked; 0 unchecked; claimed 150; delta 0 (items 1001-1150); status complete; blockers 0',
    );
    expect(result.stdout).toContain(
      '🚨 SECTION A: 환자 아바타 UI 완전 재설계 (250+ 항목): 250/250 checked; 0 unchecked (items 1-250)',
    );
    expect(result.stdout).toContain(
      '🚨 SECTION E: 성능 (100+ 항목): 79/80 checked; 1 unchecked (items 821-900)',
    );
    expect(result.stdout).toContain('874. [ ] Chrome UX Report 모니터링');
    expect(result.stdout).toContain('objective-row-claim');
    expect(result.stdout).toContain('objective-phase-claim');
    expect(result.stdout).toContain(
      'latest local monitoring: blocked at 2026-05-11T00:01:00.000Z; fieldDataAvailable false',
    );
    expect(result.stdout).toContain(
      'latest local batch refresh: blocked at 2026-05-11T00:04:30.000Z; commands 7; unexpected failures 0',
    );
    expect(result.stdout).toContain(
      'latest local public CrUX cache: scanEnabled true; latest month 202603; scanned chunks 21/21 across 18,257,384 origins; found origin false',
    );
    expect(result.stdout).toContain(
      'latest direct CrUX API probe: verified 2026-05-11T00:01:30.000Z; origin status 403; URL status 403; records absent/absent',
    );
    expect(result.stdout).toContain(
      'latest direct PageSpeed API probe: verified 2026-05-11T00:01:45.000Z; status 429; loadingExperience absent; originLoadingExperience absent; error RESOURCE_EXHAUSTED',
    );
    expect(result.stdout).toContain(
      'latest local credentials: missing at 2026-05-11T00:00:00.000Z; usable exported env none; usable env files none; usable GitHub secrets none; GitHub environment secrets none; GitHub environment variables none; non-accepted local credential names none; monitor key source none',
    );
    expect(result.stdout).toContain(
      'latest Pages domain: passed at 2026-05-11T00:02:00.000Z; expected https://komin0707.github.io; connected https://komin0707.github.io; CNAME absent',
    );
    expect(result.stdout).toContain('latest remote run: https://github.com/example/pages/actions/runs/123');
    expect(result.stdout).toContain('latest remote run commit: abc123');
    expect(result.stdout).toContain('latest remote conclusion: failure');
    expect(result.stdout).toContain(
      'latest remote artifact: artifacts/manual-evidence/crux-monitoring-run-123/chrome-ux-report-monitoring.json',
    );
    expect(result.stdout).toContain(
      'latest remote run check: passed at 2026-05-11T00:04:45.000Z; latest run 123; indexed run 123; artifact exists true; artifact matches latest run true; workflow commit matches latest true',
    );
    expect(result.stdout).toContain(
      'latest remote Pages domain: passed at 2026-05-11T00:03:00.000Z; expected https://komin0707.github.io; connected https://komin0707.github.io; CNAME absent',
    );
    expect(result.stdout).toContain('latest remote field data available: false');
    expect(result.stdout).toContain('latest remote credential result: missing');
    expect(result.stdout).toContain(
      'latest remote monitoring: blocked; fieldDataAvailable false; monitor key source none',
    );
    expect(result.stdout).toContain(
      'latest remote public CrUX cache: scanEnabled true; latest month 202603; scanned chunks 21/21 across 18,257,384 origins; found origin false',
    );
    expect(result.stdout).toContain(
      'latest remote direct CrUX API probe: verified 2026-05-11T00:03:30.000Z; origin status 403; URL status 403; records absent/absent',
    );
    expect(result.stdout).toContain(
      'latest remote direct PageSpeed API probe: verified 2026-05-11T00:03:45.000Z; status 429; loadingExperience absent; originLoadingExperience absent; error RESOURCE_EXHAUSTED',
    );
    expect(result.stdout).toContain(
      'latest remote credentials: missing; usable exported env none; usable env files none; usable GitHub secrets unchecked; GitHub environment secrets unchecked; GitHub environment variables unchecked; non-accepted local credential names none; monitor key source none',
    );
    expect(result.stdout).toContain('blocker issue: https://github.com/example/pages/issues/1');
    expect(result.stdout).toContain('blocker issue status: OPEN; updated 2026-05-11T00:04:00Z; comments 2');
    expect(result.stdout).toContain(
      'accepted credential names: CRUX_API_KEY, PAGESPEED_API_KEY, GOOGLE_API_KEY',
    );
    expect(result.stdout).toContain(
      'Configure one of CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY with Chrome UX Report/PageSpeed quota.',
    );
    expect(result.stdout).toContain(
      'Use a production origin that is publicly discoverable and sufficiently popular for CrUX inclusion.',
    );
    expect(result.stdout).toContain('operator next steps:');
    expect(result.stdout).toContain('gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io');
    expect(result.stdout).toContain(
      'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
    );
    expect(result.stdout).toContain('gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io');
    expect(result.stdout).toContain('npm run refresh:crux-blocker-evidence');
  });

  it('exits non-zero when audit is complete but objective row claims are not achieved', async () => {
    const workspace = await createFixtureWorkspace();
    const auditPath = join(workspace, 'artifacts/completion-audit.json');
    const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
    audit.blockers = [];
    audit.checklist.checked = 1150;
    audit.checklist.unchecked = 0;
    audit.status = 'complete';
    writeJson(auditPath, audit);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Completion status: complete');
    expect(result.stdout).toContain('Objective status: not_achieved');
  });
});

async function createFixtureWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), 'remaining-blockers-'));
  const runDirectory = join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-123');
  mkdirSync(runDirectory, { recursive: true });

  writeJson(join(workspace, 'artifacts/completion-audit.json'), {
    blockers: [
      {
        detail: 'Objective checklist row claim mismatch: claimed 1167, actual 1150, delta -17',
        id: 'objective-row-claim',
      },
      {
        detail:
          'Objective phase checklist claim mismatch: phase claims 1200, actual 1150, actual-phase delta -50, phase-total delta 33',
        id: 'objective-phase-claim',
      },
      {
        detail:
          '874. Requires Chrome UX Report field data for a connected production domain. Expected artifacts/manual-evidence/chrome-ux-report.json.',
        id: 'chrome-ux-report',
        source: '874. [ ] Chrome UX Report 모니터링',
      },
    ],
    checklist: {
      checked: 1149,
      observedTotal: 1150,
      sections: [
        {
          checked: 250,
          firstItem: 1,
          lastItem: 250,
          title: '🚨 SECTION A: 환자 아바타 UI 완전 재설계 (250+ 항목)',
          total: 250,
          unchecked: 0,
        },
        {
          checked: 170,
          firstItem: 251,
          lastItem: 420,
          title: '🚨 SECTION B: 미구현/불완전 기능 (200+ 항목)',
          total: 170,
          unchecked: 0,
        },
        {
          checked: 79,
          firstItem: 821,
          lastItem: 900,
          title: '🚨 SECTION E: 성능 (100+ 항목)',
          total: 80,
          unchecked: 1,
        },
        {
          checked: 50,
          firstItem: 1001,
          lastItem: 1050,
          title: '🚨 SECTION G: 보안 & 모범 사례 (50+ 항목)',
          total: 50,
          unchecked: 0,
        },
        {
          checked: 50,
          firstItem: 1051,
          lastItem: 1100,
          title: '🚨 SECTION H: 문서화 (50+ 항목)',
          total: 50,
          unchecked: 0,
        },
        {
          checked: 50,
          firstItem: 1101,
          lastItem: 1150,
          title: '🚨 SECTION I: 배포 & DevOps (50+ 항목)',
          total: 50,
          unchecked: 0,
        },
      ],
      unchecked: 1,
    },
    objectiveRowClaim: {
      actualChecklistRowsObserved: 1150,
      checklistRowDeltaFromClaim: -17,
      claimedChecklistRows: 1167,
      enabled: true,
      satisfied: false,
      status: 'mismatch',
    },
    objectivePhaseClaim: {
      actualChecklistRowsObserved: 1150,
      checklistRowDeltaFromPhaseClaims: -50,
      enabled: true,
      phaseClaimedChecklistRowsTotal: 1200,
      phaseClaimsDeltaFromClaimedTotal: 33,
      satisfied: false,
      status: 'mismatch',
    },
    status: 'incomplete',
  });
  writeJson(join(workspace, 'artifacts/completion-evidence-index.json'), {
    objective: {
      status: 'not_achieved',
      claimedChecklistRows: 1167,
      phaseClaimedChecklistRowsTotal: 1200,
      actualChecklistRowsObserved: 1150,
      checklistRowDeltaFromClaim: -17,
      checklistRowDeltaFromPhaseClaims: -50,
      phaseClaimsDeltaFromClaimedTotal: 33,
    },
    remoteCruxEvidence: {
      blockerIssue: 'https://github.com/example/pages/issues/1',
      latestMonitoringArtifact:
        'artifacts/manual-evidence/crux-monitoring-run-123/chrome-ux-report-monitoring.json',
      latestRemoteRunCheck: {
        artifact: 'artifacts/manual-evidence/remote-crux-latest-run.json',
        result: 'passed',
        verifiedAt: '2026-05-11T00:04:45.000Z',
        latestRemoteRunId: 123,
        latestRemoteHeadSha: 'abc123',
        indexedRunId: 123,
        indexedWorkflowCommit: 'abc123',
        indexedWorkflowCommitMatchesLatest: true,
        indexedArtifactExists: true,
        indexedArtifactMatchesRun: true,
      },
      latestRunConclusion: 'failure',
      latestRunId: 123,
    },
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json'), {
    completionAudit: {
      verdict: 'not_achieved',
      inspectedRequirements: [
        {
          requirement: 'Claimed 1,167 / 1,167 checklist objective.',
          status: 'blocked',
          finding: 'claimed 1167; actual 1150; delta -17',
        },
        {
          requirement: 'Seven objective phase checklist claims reconcile with the actual checklist.',
          status: 'blocked',
          finding: 'phase claims 1200; actual 1150; actual-phase delta -50; phase-total delta 33',
        },
        {
          requirement: 'Every actual checklist row in COMPLETE_FIX_REQUIREMENTS.md is checked.',
          status: 'blocked',
          finding: '1149/1150 checked; 1 unchecked',
        },
        {
          requirement: 'Named phase report commands pass with current evidence.',
          status: 'verified',
          finding: 'type-check verified; lint verified; coverage verified; build verified',
        },
        {
          requirement: 'Visual patient screenshot evidence exists and passed review.',
          status: 'verified',
          finding: 'Visual review passed for 2 screenshot artifacts.',
        },
        {
          requirement: 'Chrome UX Report monitoring has real production field-data evidence.',
          status: 'blocked',
          finding: 'Monitoring exists locally and remotely, but field-data evidence is unavailable.',
        },
      ],
    },
    doNotCompleteYet: [
      'Do not call update_goal.',
      'Do not check item 874.',
      'Do not create artifacts/manual-evidence/chrome-ux-report.json without real field data.',
    ],
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json'), {
    verifiedAt: '2026-05-11T00:05:00Z',
    checklistState: {
      note: 'The requirements file contains 1150 checklist rows, not 1167.',
    },
    blockers: [
      {
        id: 'chrome-ux-report',
        item: 874,
        acceptedCredentialNames: ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'],
        requiredToComplete: [
          'Configure one of CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY with Chrome UX Report/PageSpeed quota.',
          'Rerun npm run check:crux-monitoring after the production origin has available field data.',
          'Set CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY to a Google API key with Chrome UX Report/PageSpeed quota and rerun this verifier.',
          'Use a production origin that is publicly discoverable and sufficiently popular for CrUX inclusion.',
          'Optionally run CRUX_CACHE_SCAN=1 npm run check:crux-monitoring to stream-search the latest public CrUX cache origin list.',
        ],
      },
    ],
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-monitoring.json'), {
    checks: {
      cruxCache: {
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
    verifiedAt: '2026-05-11T00:01:00.000Z',
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
    verifiedAt: '2026-05-11T00:04:30.000Z',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/crux-live-probe.json'), {
    probes: [
      {
        name: 'origin',
        recordPresent: false,
        status: 403,
      },
      {
        name: 'url',
        recordPresent: false,
        status: 403,
      },
    ],
    verifiedAt: '2026-05-11T00:01:30.000Z',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/pagespeed-live-probe.json'), {
    errorStatus: 'RESOURCE_EXHAUSTED',
    hasLoadingExperience: false,
    hasOriginLoadingExperience: false,
    status: 429,
    verifiedAt: '2026-05-11T00:01:45.000Z',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'), {
    githubSecrets: {
      acceptedPresent: [],
      checked: true,
      names: [],
    },
    githubEnvironments: {
      acceptedPresent: {
        secrets: [],
        variables: [],
      },
    },
    monitorApiKeySource: {
      name: null,
      path: null,
      source: 'none',
    },
    nonAcceptedCredentialNames: {
      checked: true,
      envFileNames: [],
      localEnvironmentNames: [],
    },
    result: 'missing',
    usableByCurrentMonitor: {
      envFileNames: [],
      githubSecretNames: [],
      localEnvironmentNames: [],
    },
    verifiedAt: '2026-05-11T00:00:00.000Z',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/github-pages-domain.json'), {
    cnameFile: {
      exists: false,
      value: null,
    },
    connectedOrigins: ['https://komin0707.github.io'],
    expectedOrigin: 'https://komin0707.github.io',
    result: 'passed',
    verifiedAt: '2026-05-11T00:02:00.000Z',
  });
  writeJson(join(runDirectory, 'chrome-ux-report-monitoring.json'), {
    apiKeySource: {
      name: null,
      path: null,
      source: 'none',
    },
    checks: {
      cruxCache: {
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
  });
  writeJson(join(runDirectory, 'chrome-ux-report-credentials.json'), {
    githubSecrets: {
      acceptedPresent: [],
      checked: false,
      names: [],
    },
    githubEnvironments: {
      acceptedPresent: {
        secrets: [],
        variables: [],
      },
      checked: true,
      environments: [
        {
          name: 'github-pages',
          secrets: {
            acceptedPresent: [],
            checked: false,
            names: [],
          },
          variables: {
            acceptedPresent: [],
            checked: false,
            names: [],
          },
        },
      ],
    },
    monitorApiKeySource: {
      name: null,
      path: null,
      source: 'none',
    },
    nonAcceptedCredentialNames: {
      checked: true,
      envFileNames: [],
      localEnvironmentNames: [],
    },
    result: 'missing',
    usableByCurrentMonitor: {
      envFileNames: [],
      githubSecretNames: [],
      localEnvironmentNames: [],
    },
  });
  writeJson(join(runDirectory, 'crux-live-probe.json'), {
    probes: [
      {
        name: 'origin',
        recordPresent: false,
        status: 403,
      },
      {
        name: 'url',
        recordPresent: false,
        status: 403,
      },
    ],
    verifiedAt: '2026-05-11T00:03:30.000Z',
  });
  writeJson(join(runDirectory, 'pagespeed-live-probe.json'), {
    errorStatus: 'RESOURCE_EXHAUSTED',
    hasLoadingExperience: false,
    hasOriginLoadingExperience: false,
    status: 429,
    verifiedAt: '2026-05-11T00:03:45.000Z',
  });
  writeJson(join(runDirectory, 'github-pages-domain.json'), {
    cnameFile: {
      exists: false,
      value: null,
    },
    connectedOrigins: ['https://komin0707.github.io'],
    expectedOrigin: 'https://komin0707.github.io',
    result: 'passed',
    verifiedAt: '2026-05-11T00:03:00.000Z',
  });
  writeJson(join(runDirectory, 'run.json'), {
    conclusion: 'failure',
    databaseId: 123,
    headSha: 'abc123',
    url: 'https://github.com/example/pages/actions/runs/123',
  });
  writeJson(join(runDirectory, 'issue.json'), {
    comments: [{ body: 'first' }, { body: 'second' }],
    state: 'OPEN',
    updatedAt: '2026-05-11T00:04:00Z',
    url: 'https://github.com/example/pages/issues/1',
  });

  expect(readFileSync(join(runDirectory, 'run.json'), 'utf8')).toContain('123');
  return workspace;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
