import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/update-completion-evidence-manifests.mjs');

describe('update completion evidence manifests', () => {
  it('derives CrUX evidence strings from the current monitoring artifacts', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'completion-evidence-'));
    mkdirSync(join(workspace, 'artifacts/manual-evidence'), { recursive: true });
    writeJson(join(workspace, 'package.json'), {
      scripts: {
        'test:coverage': 'npm run test:list && vitest run --coverage',
      },
    });

    writeJson(join(workspace, 'artifacts/completion-audit.json'), {
      status: 'incomplete',
      checkedAt: '2026-05-11T03:28:00.000Z',
      checklist: {
        checked: 1149,
        unchecked: 1,
        observedTotal: 1150,
        duplicateItemNumbers: [],
        missingItemNumbers: [],
      },
      blockers: [{ id: 'chrome-ux-report' }],
      uncheckedItems: [{ number: 874 }],
      commands: {
        forbiddenPatterns: {
          exitCode: 0,
        },
        licensePolicy: {
          exitCode: 0,
        },
        npmAudit: {
          exitCode: 0,
        },
        sbom: {
          exitCode: 0,
        },
        snyk: {
          exitCode: 0,
        },
        testRealism: {
          exitCode: 0,
        },
      },
      dist: {
        exists: true,
        fileCount: 19,
        hasBuildOutput: true,
        primaryBytesNoCompressedSidecars: 10591,
        primaryJsCssBytes: 5365,
        primaryJsCssFiles: ['dist/assets/index.js', 'dist/assets/index.css'],
        rasterAssets: [],
        totalBytes: 71812,
        transferBrotliJsCssBytes: 4800,
        withinBrotliTransferBudget: true,
        withinPrimaryBudget: true,
        withinRawBudget: true,
      },
      screenshots: [
        { path: 'artifacts/patient-avatar-current.png', width: 1386, height: 781 },
        { path: 'artifacts/simulator-current.png', width: 1440, height: 900 },
      ],
      sbom: {
        applicationName: 'vent 2d',
        componentCount: 1,
        path: 'artifacts/sbom.json',
        valid: true,
      },
      visualReview: {
        reviewedScreenshotCount: 2,
        valid: true,
      },
    });
    writeJson(join(workspace, 'artifacts/completion-evidence-index.json'), {
      generatedAt: '2026-05-11T00:00:00Z',
      currentAudit: {},
      objective: {
        source: 'test objective',
        status: 'achieved',
      },
      promptRequirementMap: [
        {
          requirement: 'npm test:coverage result.',
          evidence: [
            'latest terminal run: npm run test:coverage stale',
            '1 test files passed',
            '1 tests passed',
            'Statements 0% (0/1)',
            'Branches 0% (0/1)',
            'Functions 0% (0/1)',
            'Lines 0% (0/1)',
          ],
        },
        {
          requirement: 'Chrome UX Report monitoring.',
          evidence: [
            'latest terminal run: npm run check:crux-credentials stale',
            'latest terminal run: npm run check:crux-monitoring stale',
          ],
        },
        {
          requirement: 'No skipped checklist rows.',
          evidence: [
            'artifacts/completion-audit.json:checklist',
            'latest terminal run: npm run check:completion-consistency exited 0',
          ],
          notes: 'stale checklist notes',
        },
        {
          requirement: 'npm run build, image-free output, under 100KB primary budget.',
          evidence: [],
          notes: 'stale build notes',
        },
        {
          requirement: 'Section A patient avatar redesign and visual patient screenshot.',
          evidence: ['artifacts/patient-avatar-current.png', 'artifacts/simulator-current.png'],
        },
      ],
    });
    writeJson(join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json'), {
      verifiedAt: '2026-05-11T00:00:00Z',
      checklistState: {},
      blockers: [
        {
          id: 'chrome-ux-report',
          currentEvidence: ['Fresh local run at stale'],
        },
      ],
    });
    writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'), {
      acceptedKeyNames: ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'],
      requiredToComplete: [
        'Configure one of CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY with Chrome UX Report/PageSpeed quota.',
        'Rerun npm run check:crux-monitoring after the production origin has available field data.',
      ],
      result: 'missing',
      verifiedAt: '2026-05-11T03:27:06.679Z',
      localEnvFiles: {
        checked: true,
        acceptedPresent: [],
      },
    });
    writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-monitoring.json'), {
      result: 'blocked',
      verifiedAt: '2026-05-11T03:27:06.903Z',
      fieldDataAvailable: false,
      requiredToComplete: [
        'Set CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY to a Google API key with Chrome UX Report/PageSpeed quota and rerun this verifier.',
        'Use a production origin that is publicly discoverable and sufficiently popular for CrUX inclusion.',
        'Optionally run CRUX_CACHE_SCAN=1 npm run check:crux-monitoring to stream-search the latest public CrUX cache origin list.',
      ],
      checks: {
        cruxApi: {
          originRecord: { status: 403 },
          urlRecord: { status: 403 },
        },
        pageSpeed: { status: 429 },
        discoverability: { homeStatus: 200 },
        cruxCache: { latestMonth: '202603' },
      },
    });
    writeJson(join(workspace, 'artifacts/manual-evidence/crux-live-probe.json'), {
      verifiedAt: '2026-05-11T03:28:30.000Z',
      probes: [
        { name: 'origin', recordPresent: false, status: 403 },
        { name: 'url', recordPresent: false, status: 403 },
      ],
    });
    writeJson(join(workspace, 'artifacts/manual-evidence/pagespeed-live-probe.json'), {
      errorStatus: 'RESOURCE_EXHAUSTED',
      hasLoadingExperience: false,
      hasOriginLoadingExperience: false,
      status: 429,
      verifiedAt: '2026-05-11T03:29:00.000Z',
    });
    writeJson(join(workspace, 'artifacts/manual-evidence/phase-gate-command-results.json'), {
      commands: {
        build: { command: 'npm run build', exitCode: 0 },
        bundleSize: { command: 'npm run check:bundle-size', exitCode: 0 },
        coverage: { command: 'npm run test:coverage', exitCode: 0 },
        lint: { command: 'npm run lint -- --quiet', exitCode: 0 },
        noRaster: { command: 'npm run check:no-raster', exitCode: 0 },
        typeCheck: { command: 'npm run type-check', exitCode: 0 },
      },
      dist: {
        exists: true,
        fileCount: 19,
        primaryBytesNoCompressedSidecars: 10591,
        primaryJsCssBytes: 5365,
        primaryJsCssFiles: ['dist/assets/index.js', 'dist/assets/index.css'],
        rasterAssets: [],
        totalBytes: 71812,
        transferBrotliJsCssBytes: 4800,
      },
      result: 'passed',
      verifiedAt: '2026-05-11T03:30:00.000Z',
    });
    writeJson(join(workspace, 'artifacts/manual-evidence/test-realism.json'), {
      behaviorFileCount: 12,
      e2eFileCount: 1,
      failures: [],
      productionImportFileCount: 20,
      result: 'passed',
      testDoubleFileCount: 8,
      verifiedAt: '2026-05-11T03:27:07.000Z',
      vitestCandidateFileCount: 2,
      vitestFileCount: 2,
      vitestMissingFiles: [],
      vitestTestCount: 3,
    });
    mkdirSync(join(workspace, 'coverage'), { recursive: true });
    writeJson(join(workspace, 'artifacts/vitest-list.json'), [
      { file: '/repo/src/a.test.ts', name: 'a > passes' },
      { file: '/repo/src/a.test.ts', name: 'a > passes again' },
      { file: '/repo/src/b.test.ts', name: 'b > passes' },
    ]);
    writeJson(join(workspace, 'coverage/coverage-summary.json'), {
      total: {
        statements: { total: 3, covered: 3, pct: 100 },
        branches: { total: 4, covered: 4, pct: 100 },
        functions: { total: 5, covered: 5, pct: 100 },
        lines: { total: 6, covered: 6, pct: 100 },
      },
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      latestVerifiedAt: '2026-05-11T03:30:00Z',
      result: 'incomplete',
    });

    const index = readJson(join(workspace, 'artifacts/completion-evidence-index.json'));
    const blockers = readJson(join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json'));

    expect(index.generatedAt).toBe('2026-05-11T03:30:00Z');
    expect(index.currentAudit).toMatchObject({
      blockerCount: 1,
      checked: 1149,
      observedTotal: 1150,
      status: 'incomplete',
      unchecked: 1,
    });
    expect(index.objective).toMatchObject({
      actualChecklistRowsObserved: 1150,
      claimedChecklistRows: 1167,
      checklistRowDeltaFromClaim: -17,
      source: 'test objective',
      status: 'not_achieved',
    });
    expect(index.promptRequirementMap[0].evidence).toContain(
      'latest terminal run: npm run test:coverage exited 0',
    );
    expect(index.promptRequirementMap[0].evidence).toEqual([
      'latest terminal run: npm run test:coverage exited 0',
      '2 test files passed',
      '3 tests passed',
      'Statements 100% (3/3)',
      'Branches 100% (4/4)',
      'Functions 100% (5/5)',
      'Lines 100% (6/6)',
      'artifacts/manual-evidence/phase-gate-command-results.json:commands.coverage',
    ]);
    expect(index.promptRequirementMap[0].notes).toBe(
      'The prompt names the coverage gate as npm test:coverage; package.json defines test:coverage as a custom npm script, so the runnable command is npm run test:coverage.',
    );
    expect(index.promptRequirementMap[0].commandMapping).toEqual({
      packageScript: 'test:coverage',
      packageScriptValue: 'npm run test:list && vitest run --coverage',
      promptCommand: 'npm test:coverage',
      runnableCommand: 'npm run test:coverage',
    });
    expect(index.promptRequirementMap[1].evidence).toContain(
      'latest terminal run: npm run check:crux-credentials exited 1 with result missing at 2026-05-11T03:27:06.679Z',
    );
    expect(index.promptRequirementMap[1].evidence).toContain(
      'latest terminal run: npm run check:crux-monitoring exited 1 with result blocked and fieldDataAvailable false at 2026-05-11T03:27:06.903Z',
    );
    expect(index.promptRequirementMap[1].evidence).toContain(
      'latest terminal run: npm run check:crux-live-probes exited 1 with CrUX records absent/absent and PageSpeed loadingExperience absent/absent at 2026-05-11T03:29:00Z',
    );
    expect(index.promptRequirementMap[1].evidence).toContain(
      'artifacts/manual-evidence/crux-live-probe.json',
    );
    expect(index.promptRequirementMap[1].evidence).toContain(
      'artifacts/manual-evidence/pagespeed-live-probe.json',
    );
    expect(index.promptRequirementMap[2].evidence).toContain(
      'latest terminal run: npm run check:completion-evidence exited 0',
    );
    expect(index.promptRequirementMap[2].evidence).toContain(
      'artifacts/completion-audit.json:checklist.sections',
    );
    expect(index.promptRequirementMap[2].notes).toContain('The audit reports 1 unchecked item: 874.');
    expect(index.promptRequirementMap[3].notes).toContain('Audit dist exists is true');
    expect(index.promptRequirementMap[3].notes).toContain('fileCount is 19');
    expect(index.promptRequirementMap[3].notes).toContain('hasBuildOutput is true');
    expect(index.promptRequirementMap[3].notes).toContain('totalBytes is 71812');
    expect(index.promptRequirementMap[3].notes).toContain('primaryBytesNoCompressedSidecars is 10591');
    expect(index.promptRequirementMap[3].notes).toContain('primaryJsCssBytes is 5365');
    expect(index.promptRequirementMap[3].notes).toContain('transferBrotliJsCssBytes is 4800');
    expect(index.promptRequirementMap[3].notes).toContain('withinBrotliTransferBudget is true');
    expect(index.promptRequirementMap[3].notes).toContain('rasterAssets is empty');
    expect(index.promptRequirementMap[3].evidence).toEqual([
      'latest terminal run: npm run build exited 0',
      'artifacts/manual-evidence/phase-gate-command-results.json:commands.build',
      'latest terminal run: npm run check:no-raster exited 0',
      'artifacts/manual-evidence/phase-gate-command-results.json:commands.noRaster',
      'latest terminal run: npm run check:bundle-size exited 0',
      'artifacts/manual-evidence/phase-gate-command-results.json:commands.bundleSize',
      'artifacts/manual-evidence/phase-gate-command-results.json:dist',
    ]);
    expect(index.promptRequirementMap[4].evidence).toEqual([
      'artifacts/patient-avatar-current.png',
      'artifacts/simulator-current.png',
      'artifacts/manual-evidence/visual-screenshot-review.json',
      'artifacts/completion-audit.json:visualReview',
    ]);
    expect(index.promptRequirementMap[4].notes).toBe(
      'Visual review passed for 2 screenshot artifacts: artifacts/patient-avatar-current.png 1386x781, artifacts/simulator-current.png 1440x900.',
    );
    const forbiddenRequirement = index.promptRequirementMap.find(
      (entry) => entry.requirement === 'No forbidden implementation shortcuts.',
    );
    expect(forbiddenRequirement).toMatchObject({
      status: 'verified',
      notes:
        'scripts/assert-forbidden-patterns.mjs scans production source for type-suppression comments, debug print calls, task-marker comments, explicit TypeScript top-type usage, and temporary or workaround implementation bypass markers.',
    });
    expect(forbiddenRequirement.evidence).toEqual([
      'latest terminal run: npm run check:forbidden-patterns exited 0',
      'artifacts/completion-audit.json:commands.forbiddenPatterns',
    ]);
    const temporaryRequirement = index.promptRequirementMap.find(
      (entry) => entry.requirement === 'No temporary implementation bypasses.',
    );
    expect(temporaryRequirement).toMatchObject({
      status: 'verified',
      notes:
        'The same source scanner rejects temporary or workaround implementation bypass markers in production source roots.',
    });
    expect(temporaryRequirement.evidence).toEqual([
      'latest terminal run: npm run check:forbidden-patterns exited 0',
      'artifacts/completion-audit.json:commands.forbiddenPatterns',
    ]);
    const testRealismRequirement = index.promptRequirementMap.find(
      (entry) => entry.requirement === 'No mock-only test completion.',
    );
    expect(testRealismRequirement).toMatchObject({
      status: 'verified',
      notes:
        'Test realism verifier passed with 3 Vitest tests, 1 E2E spec file, 12 behavior-oriented test files, 20 production-import test files, and 8 files using constrained platform-boundary test doubles.',
    });
    expect(testRealismRequirement.evidence).toEqual([
      'latest terminal run: npm run check:test-realism exited 0',
      'artifacts/manual-evidence/test-realism.json',
      'artifacts/completion-audit.json:commands.testRealism',
    ]);
    const typeCheckRequirement = index.promptRequirementMap.find(
      (entry) => entry.requirement === 'npm run type-check.',
    );
    expect(typeCheckRequirement).toMatchObject({ status: 'verified' });
    expect(typeCheckRequirement.evidence).toEqual([
      'latest terminal run: npm run type-check exited 0',
      'artifacts/manual-evidence/phase-gate-command-results.json:commands.typeCheck',
    ]);
    const lintRequirement = index.promptRequirementMap.find((entry) => entry.requirement === 'npm run lint.');
    expect(lintRequirement).toMatchObject({ status: 'verified' });
    expect(lintRequirement.evidence).toEqual([
      'latest terminal run: npm run lint -- --quiet exited 0',
      'artifacts/manual-evidence/phase-gate-command-results.json:commands.lint',
    ]);
    const securityRequirement = index.promptRequirementMap.find(
      (entry) => entry.requirement === 'Security scan including Snyk.',
    );
    expect(securityRequirement).toMatchObject({
      status: 'verified',
      notes:
        'Security and release evidence passed: npm audit, license policy, SBOM generation, Snyk, and CycloneDX SBOM validation with 1 component(s) for vent 2d.',
    });
    expect(securityRequirement.evidence).toEqual([
      'latest terminal run: npm audit --audit-level=moderate exited 0',
      'latest terminal run: npm run check:licenses exited 0',
      'latest terminal run: npm run check:sbom exited 0',
      'artifacts/sbom.json',
      'artifacts/completion-audit.json:commands.npmAudit',
      'artifacts/completion-audit.json:commands.licensePolicy',
      'artifacts/completion-audit.json:commands.sbom',
      'artifacts/completion-audit.json:commands.snyk',
      'artifacts/completion-audit.json:sbom',
    ]);
    expect(blockers.verifiedAt).toBe('2026-05-11T03:30:00Z');
    expect(blockers.blockers[0].currentEvidence[0]).toBe(
      'Fresh local run at 2026-05-11T03:27:06.903Z wrote artifacts/manual-evidence/chrome-ux-report-monitoring.json with result blocked, fieldDataAvailable false, CrUX API origin status 403, CrUX API URL status 403, PageSpeed status 429, discoverability HTTP 200/canonical/robots/sitemap passing, public crux-cache latest month 202603, and requiredToComplete guidance listing CRUX_API_KEY, PAGESPEED_API_KEY, and GOOGLE_API_KEY.',
    );
    expect(blockers.blockers[0].currentEvidence[1]).toBe(
      'artifacts/manual-evidence/chrome-ux-report-credentials.json records result missing, monitor API key source none, exported env key names [], env-file key names [], GitHub secret key names [], GitHub environment secret key names [], GitHub environment variable key names [], and local env files accepted key names [].',
    );
    expect(blockers.blockers[0].currentEvidence).toContain(
      'artifacts/manual-evidence/crux-live-probe.json records direct CrUX API origin status 403, URL status 403, and record-present flags absent/absent.',
    );
    expect(blockers.blockers[0].currentEvidence).toContain(
      'artifacts/manual-evidence/pagespeed-live-probe.json records direct PageSpeed API status 429, loadingExperience absent, originLoadingExperience absent, and error status RESOURCE_EXHAUSTED.',
    );
    expect(blockers.blockers[0].operatorNextSteps).toEqual([
      'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
      'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
      'gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io',
      'npm run refresh:crux-blocker-evidence',
    ]);
    expect(blockers.blockers[0].acceptedCredentialNames).toEqual([
      'CRUX_API_KEY',
      'PAGESPEED_API_KEY',
      'GOOGLE_API_KEY',
    ]);
    expect(blockers.blockers[0].requiredToComplete).toEqual([
      'Configure one of CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY with Chrome UX Report/PageSpeed quota.',
      'Rerun npm run check:crux-monitoring after the production origin has available field data.',
      'Set CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY to a Google API key with Chrome UX Report/PageSpeed quota and rerun this verifier.',
      'Use a production origin that is publicly discoverable and sufficiently popular for CrUX inclusion.',
      'Optionally run CRUX_CACHE_SCAN=1 npm run check:crux-monitoring to stream-search the latest public CrUX cache origin list.',
    ]);
  });

  it('does not write manifests in dry-run mode', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'completion-evidence-dry-run-'));
    mkdirSync(join(workspace, 'artifacts/manual-evidence'), { recursive: true });

    writeMinimalFixture(workspace);
    const before = readFileSync(join(workspace, 'artifacts/completion-evidence-index.json'), 'utf8');
    const result = spawnSync(process.execPath, [scriptPath, '--dry-run'], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ dryRun: true });
    expect(readFileSync(join(workspace, 'artifacts/completion-evidence-index.json'), 'utf8')).toBe(before);
  });

  it('keeps the objective unachieved when complete checklist rows conflict with phase claims', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'completion-evidence-phase-claim-'));
    mkdirSync(join(workspace, 'artifacts/manual-evidence'), { recursive: true });
    writeMinimalFixture(workspace);
    const auditPath = join(workspace, 'artifacts/completion-audit.json');
    const audit = readJson(auditPath);
    audit.status = 'complete';
    audit.checklist.checked = 1167;
    audit.checklist.unchecked = 0;
    audit.checklist.observedTotal = 1167;
    audit.blockers = [];
    writeJson(auditPath, audit);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const index = readJson(join(workspace, 'artifacts/completion-evidence-index.json'));
    expect(index.objective).toMatchObject({
      actualChecklistRowsObserved: 1167,
      claimedChecklistRows: 1167,
      checklistRowDeltaFromClaim: 0,
      phaseClaimedChecklistRowsTotal: 1200,
      checklistRowDeltaFromPhaseClaims: -33,
      phaseClaimsDeltaFromClaimedTotal: 33,
      status: 'not_achieved',
    });
  });

  it('updates remote CrUX evidence to the newest downloaded run', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'completion-evidence-remote-'));
    mkdirSync(join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1'), { recursive: true });
    mkdirSync(join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-2'), { recursive: true });

    writeMinimalFixture(workspace);
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = readJson(indexPath);
    index.remoteCruxEvidence = {
      latestMonitoringArtifact:
        'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
      latestRunId: 1,
      latestWorkflowCommit: 'old-sha',
      latestRunConclusion: 'failure',
      blockerIssue: 'https://github.com/example/repo/issues/1',
    };
    writeJson(indexPath, index);
    writeRemoteWorkflowDrift(workspace);
    writeRemoteLatestRun(workspace, 2, 'new-sha');
    writeRemoteRun(workspace, 1, 'old-sha');
    writeRemoteRun(workspace, 2, 'new-sha');

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);

    const updatedIndex = readJson(indexPath);
    const blockers = readJson(join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json'));

    expect(updatedIndex.remoteCruxEvidence).toMatchObject({
      latestMonitoringArtifact:
        'artifacts/manual-evidence/crux-monitoring-run-2/chrome-ux-report-monitoring.json',
      latestRunId: 2,
      latestWorkflowCommit: 'new-sha',
      latestRunConclusion: 'failure',
      blockerIssue: 'https://github.com/example/repo/issues/2',
      latestRemoteRunCheck: {
        artifact: 'artifacts/manual-evidence/remote-crux-latest-run.json',
        result: 'passed',
        verifiedAt: '2026-05-11T03:50:00.000Z',
        latestRemoteRunId: 2,
        latestRemoteHeadSha: 'new-sha',
        indexedRunId: 2,
        indexedWorkflowCommit: 'new-sha',
        indexedWorkflowCommitMatchesLatest: true,
        indexedArtifactExists: true,
        indexedArtifactMatchesRun: true,
      },
      workflowDrift: {
        artifact: 'artifacts/manual-evidence/remote-crux-workflow-drift.json',
        result: 'passed',
        verifiedAt: '2026-05-11T03:50:00.000Z',
        mismatchedFiles: [],
        missingWorkflowMarkers: [],
      },
    });
    expect(updatedIndex.generatedAt).toBe('2026-05-11T03:50:00Z');
    expect(blockers.verifiedAt).toBe('2026-05-11T03:50:00Z');
    expect(updatedIndex.promptRequirementMap[0].evidence).toEqual(
      expect.arrayContaining([
        'artifacts/manual-evidence/remote-crux-workflow-drift.json',
        'artifacts/manual-evidence/crux-monitoring-run-2/run.json',
        'artifacts/manual-evidence/crux-monitoring-run-2/chrome-ux-report-credentials.json',
        'artifacts/manual-evidence/crux-monitoring-run-2/chrome-ux-report-monitoring.json',
        'artifacts/manual-evidence/crux-monitoring-run-2/issue.json',
      ]),
    );
    expect(blockers.blockers[0].currentEvidence).toContain(
      'Manual remote workflow run 2 ran against current CrUX monitoring commit new-sha, uploaded artifacts/manual-evidence/crux-monitoring-run-2/chrome-ux-report-monitoring.json and artifacts/manual-evidence/crux-monitoring-run-2/chrome-ux-report-credentials.json with credential result missing, did not upload chrome-ux-report.json because fieldDataAvailable was false, received CrUX origin 403, CrUX URL 403, and PageSpeed 429, scanned 21/21 public CrUX cache chunks for month 202603, did not find the origin, and updated the blocker issue with credential preflight result included at 2026-05-11T03:49:25Z.',
    );
    expect(blockers.blockers[0].currentEvidence).toContain(
      'Remote blocker issue includes credential preflight comment https://github.com/example/repo/issues/2#issuecomment-2; latest issue body records credential result missing, monitor key source none, exported env key names [], env-file key names [], and GitHub secret key names [], GitHub environment secret key names [], and GitHub environment variable key names [].',
    );
    expect(blockers.blockers[0].currentEvidence).toContain(
      'artifacts/manual-evidence/remote-crux-workflow-drift.json records result passed, mismatched remote files [], and missing workflow markers [].',
    );
  });
});

function writeMinimalFixture(workspace) {
  writeJson(join(workspace, 'package.json'), {
    scripts: {
      'test:coverage': 'npm run test:list && vitest run --coverage',
    },
  });
  writeJson(join(workspace, 'artifacts/completion-audit.json'), {
    status: 'incomplete',
    checklist: {
      checked: 1149,
      unchecked: 1,
      observedTotal: 1150,
      duplicateItemNumbers: [],
      missingItemNumbers: [],
    },
    blockers: [{ id: 'chrome-ux-report' }],
    dist: {
      exists: true,
      fileCount: 19,
      hasBuildOutput: true,
      primaryBytesNoCompressedSidecars: 10591,
      primaryJsCssBytes: 5365,
      primaryJsCssFiles: ['dist/assets/index.js', 'dist/assets/index.css'],
      rasterAssets: [],
      totalBytes: 71812,
      transferBrotliJsCssBytes: 4800,
      withinBrotliTransferBudget: true,
      withinPrimaryBudget: true,
      withinRawBudget: true,
    },
  });
  writeJson(join(workspace, 'artifacts/completion-evidence-index.json'), {
    generatedAt: 'stale',
    currentAudit: {},
    promptRequirementMap: [
      {
        requirement: 'Chrome UX Report monitoring.',
        evidence: [
          'latest terminal run: npm run check:crux-credentials stale',
          'latest terminal run: npm run check:crux-monitoring stale',
        ],
      },
      {
        requirement: 'npm run build, image-free output, under 100KB primary budget.',
        evidence: [],
        notes: 'stale build notes',
      },
    ],
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json'), {
    verifiedAt: 'stale',
    checklistState: {},
    blockers: [{ id: 'chrome-ux-report', currentEvidence: ['Fresh local run at stale'] }],
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'), {
    result: 'missing',
    verifiedAt: '2026-05-11T03:27:06.679Z',
    localEnvFiles: {
      checked: true,
      acceptedPresent: [],
    },
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-monitoring.json'), {
    result: 'blocked',
    verifiedAt: '2026-05-11T03:27:06.903Z',
    fieldDataAvailable: false,
    checks: {
      cruxApi: {
        originRecord: { status: 403 },
        urlRecord: { status: 403 },
      },
      pageSpeed: { status: 429 },
      discoverability: { homeStatus: 200 },
      cruxCache: { latestMonth: '202603' },
    },
  });
}

function writeRemoteRun(workspace, runId, headSha) {
  const directory = join(workspace, `artifacts/manual-evidence/crux-monitoring-run-${String(runId)}`);
  writeJson(join(directory, 'run.json'), {
    databaseId: runId,
    headSha,
    conclusion: 'failure',
    createdAt: '2026-05-11T03:48:55Z',
  });
  writeJson(join(directory, 'issue.json'), {
    body: 'Credential preflight result: missing',
    comments: [
      {
        body: 'Local credential preflight update.',
        url: `https://github.com/example/repo/issues/${String(runId)}#issuecomment-${String(runId)}`,
      },
    ],
    url: `https://github.com/example/repo/issues/${String(runId)}`,
    updatedAt: '2026-05-11T03:49:25Z',
  });
  writeJson(join(directory, 'chrome-ux-report-monitoring.json'), {
    result: 'blocked',
    fieldDataAvailable: false,
    checks: {
      cruxApi: {
        originRecord: { status: 403 },
        urlRecord: { status: 403 },
      },
      pageSpeed: { status: 429 },
      cruxCache: {
        scannedChunks: 21,
        totalChunks: 21,
        latestMonth: '202603',
        foundOrigin: false,
      },
    },
  });
  writeJson(join(directory, 'chrome-ux-report-credentials.json'), {
    result: 'missing',
    usableByCurrentMonitor: {
      localEnvironmentNames: [],
      githubSecretNames: [],
    },
  });
}

function writeRemoteLatestRun(workspace, runId, headSha) {
  writeJson(join(workspace, 'artifacts/manual-evidence/remote-crux-latest-run.json'), {
    result: 'passed',
    verifiedAt: '2026-05-11T03:50:00.000Z',
    latestRemoteRun: {
      databaseId: runId,
      headSha,
    },
    indexedRun: {
      artifactExists: true,
      artifactMatchesRun: true,
      headSha,
      headShaMatchesLatest: true,
      runId,
    },
  });
}

function writeRemoteWorkflowDrift(workspace) {
  writeJson(join(workspace, 'artifacts/manual-evidence/remote-crux-workflow-drift.json'), {
    verifiedAt: '2026-05-11T03:50:00.000Z',
    result: 'passed',
    mirroredFiles: [
      {
        remotePath: '.github/scripts/check-crux-monitoring.mjs',
        matches: true,
      },
    ],
    workflow: {
      missingMarkers: [],
    },
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
