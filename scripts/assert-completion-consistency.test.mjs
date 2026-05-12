import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/assert-completion-consistency.mjs');

describe('completion consistency assertions', () => {
  it('rejects canonical CrUX evidence while monitoring still reports blocked field data', async () => {
    const workspace = await createFixtureWorkspace();
    writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report.json'), {
      evidence: 'placeholder field data',
      result: 'passed',
      verifiedAt: '2026-05-11T03:38:14.737Z',
      verifier: 'test',
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'canonical CrUX evidence exists while field data is blocked: expected false, got true',
    );
  });

  it('accepts a blocked CrUX fixture when no canonical field-data artifact exists', async () => {
    const workspace = await createFixtureWorkspace();

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      checked: 1149,
      objectiveStatus: 'not_achieved',
      note: 'Completion evidence is internally consistent, but the objective is not achieved.',
      status: 'incomplete',
      total: 1150,
      unchecked: 1,
    });
  });

  it('rejects a stale final blocker summary for DEEP audit blockers', async () => {
    const workspace = await createFixtureWorkspace();
    addDeepAuditCompletionFixture(workspace);

    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.remainingDeepAuditBlockers = [];
    summary.blockerCounts.deepAudit = 0;
    summary.blockerCounts.consolidated = 1;
    summary.consolidatedRemainingBlockers = summary.consolidatedRemainingBlockers.slice(0, 1);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('finalBlockerSummary.remainingDeepAuditBlockers');
    expect(result.stderr).toContain('human-like-patient-visual-review');
  });

  it('rejects an incomplete CrUX blocker refresh command sequence', async () => {
    const workspace = await createFixtureWorkspace();
    const refreshPath = join(workspace, 'artifacts/manual-evidence/crux-blocker-refresh.json');
    const refresh = JSON.parse(readFileSync(refreshPath, 'utf8'));
    refresh.commands = refresh.commands.filter((entry) => entry.command !== 'npm run test:list');
    writeJson(refreshPath, refresh);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('CrUX blocker refresh command sequence');
    expect(result.stderr).toContain('npm run test:list');
  });

  it('rejects an unexpected CrUX blocker refresh command failure', async () => {
    const workspace = await createFixtureWorkspace();
    const refreshPath = join(workspace, 'artifacts/manual-evidence/crux-blocker-refresh.json');
    const refresh = JSON.parse(readFileSync(refreshPath, 'utf8'));
    refresh.commands.find((entry) => entry.command === 'npm run check:pages-domain').exitCode = 7;
    writeJson(refreshPath, refresh);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('CrUX blocker refresh unexpected command failures');
    expect(result.stderr).toContain('npm run check:pages-domain');
  });

  it('rejects a stale final blocker summary for the CrUX blocker refresh', async () => {
    const workspace = await createFixtureWorkspace();
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.remainingBlocker.latestLocalBatchRefresh.verifiedAt = '2026-05-11T03:45:00.000Z';
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('finalBlockerSummary.remainingBlocker.latestLocalBatchRefresh');
    expect(result.stderr).toContain('2026-05-11T03:50:00.000Z');
    expect(result.stderr).toContain('2026-05-11T03:45:00.000Z');
  });

  it('rejects a stale completion audit objective claim finding', async () => {
    const workspace = await createFixtureWorkspace();
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.completionAudit.inspectedRequirements[0].finding = 'claimed 1167; actual 1167; delta 0';
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('finalBlockerSummary.completionAudit.claim.finding');
    expect(result.stderr).toContain('claimed 1167; actual 1150; delta -17');
    expect(result.stderr).toContain('claimed 1167; actual 1167; delta 0');
  });

  it('rejects objective phase claims that disagree with the audit artifact', async () => {
    const workspace = await createFixtureWorkspace();
    const auditPath = join(workspace, 'artifacts/completion-audit.json');
    const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
    audit.objectivePhaseClaim.phaseClaimedChecklistRowsTotal = 1150;
    writeJson(auditPath, audit);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('index.objective.phaseClaimedChecklistRowsTotal');
    expect(result.stderr).toContain('expected 1150, got 1200');
  });

  it('rejects a final blocker summary missing do-not-complete warnings', async () => {
    const workspace = await createFixtureWorkspace();
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.doNotCompleteYet = summary.doNotCompleteYet.slice(0, 2);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('finalBlockerSummary.doNotCompleteYet');
    expect(result.stderr).toContain(
      'Do not create artifacts/manual-evidence/chrome-ux-report.json unless it contains real CrUX/PageSpeed field-data evidence for the production origin.',
    );
  });

  it('accepts blocked CrUX evidence when credentials are present but field data is absent', async () => {
    const workspace = await createFixtureWorkspace();
    markCredentialsPresent(workspace);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('rejects checking item 874 while the canonical CrUX artifact is absent', async () => {
    const workspace = await createFixtureWorkspace();
    const requirementsPath = join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md');
    const requirements = readFileSync(requirementsPath, 'utf8').replace(
      '874. [ ] Chrome UX Report 모니터링',
      '874. [x] Chrome UX Report 모니터링',
    );
    writeFileSync(requirementsPath, requirements);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'checklist item 874 remains unchecked while canonical CrUX evidence is absent: expected false, got true',
    );
  });

  it('rejects an additional unchecked checklist item even when aggregate counts match', async () => {
    const workspace = await createFixtureWorkspace();
    const requirementsPath = join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md');
    const requirements = readFileSync(requirementsPath, 'utf8').replace(
      '901. [x] item 901',
      '901. [ ] item 901',
    );
    writeFileSync(requirementsPath, requirements);
    updateChecklistCounts(workspace, { checked: 1148, unchecked: 2 });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('checklist only unchecked item numbers: expected [874], got [874,901]');
  });

  it('rejects a stale remote CrUX index when a newer downloaded run exists', async () => {
    const workspace = await createFixtureWorkspace();
    mkdirSync(join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-2'), { recursive: true });
    writeJson(
      join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-2/chrome-ux-report-monitoring.json'),
      {
        result: 'blocked',
        fieldDataAvailable: false,
        checks: remoteCruxChecks(),
        requiredToComplete: [
          'Set CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY to a Google API key with Chrome UX Report/PageSpeed quota and rerun this verifier.',
        ],
      },
    );

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'remoteCruxEvidence.latestMonitoringArtifact is newest downloaded run: expected artifacts/manual-evidence/crux-monitoring-run-2/chrome-ux-report-monitoring.json, got artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
    );
  });

  it('rejects a blocker manifest that omits the indexed remote CrUX run', async () => {
    const workspace = await createFixtureWorkspace();
    const blockersPath = join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json');
    const blockers = JSON.parse(readFileSync(blockersPath, 'utf8'));
    blockers.blockers[0].currentEvidence = blockers.blockers[0].currentEvidence.filter(
      (entry) => !entry.startsWith('Manual remote workflow run 1'),
    );
    writeJson(blockersPath, blockers);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'blocker latest remote CrUX run: expected to include Manual remote workflow run 1',
    );
  });

  it('rejects a stale blocker manifest timestamp', async () => {
    const workspace = await createFixtureWorkspace();
    const blockersPath = join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json');
    const blockers = JSON.parse(readFileSync(blockersPath, 'utf8'));
    blockers.verifiedAt = '2026-05-11T00:00:00Z';
    writeJson(blockersPath, blockers);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'blockersManifest.verifiedAt: expected 2026-05-11T03:50:00Z, got 2026-05-11T00:00:00Z',
    );
    expect(result.stderr).toContain(
      'finalBlockerSummary.generatedAt: expected 2026-05-11T00:00:00Z, got 2026-05-11T03:50:00Z',
    );
  });

  it('rejects stale generatedAt when source evidence is newer than the index', async () => {
    const workspace = await createFixtureWorkspace();
    const monitoringPath = join(workspace, 'artifacts/manual-evidence/chrome-ux-report-monitoring.json');
    const monitoring = JSON.parse(readFileSync(monitoringPath, 'utf8'));
    monitoring.verifiedAt = '2026-05-11T04:00:00.000Z';
    writeJson(monitoringPath, monitoring);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'index.generatedAt: expected 2026-05-11T04:00:00Z, got 2026-05-11T03:50:00Z',
    );
    expect(result.stderr).toContain(
      'audit CrUX monitoring support verifiedAt: expected 2026-05-11T04:00:00.000Z, got 2026-05-11T03:38:14.737Z',
    );
  });

  it('rejects phase reports with non-verified command or visual evidence status', async () => {
    const workspace = await createFixtureWorkspace();
    addSingleSectionPhaseReports(workspace);

    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.phaseReports[0].commandEvidence.coverage.status = 'blocked';
    summary.objectivePhaseReports[0].visualScreenshotEvidence.status = 'blocked';
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('phase 1 coverage status: expected verified, got blocked');
    expect(result.stderr).toContain(
      'objective phase 5 visual screenshot status: expected verified, got blocked',
    );
  });

  it('rejects a synced CrUX blocker issue that is older than the latest local monitoring evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const issuePath = join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/issue.json');
    const issue = JSON.parse(readFileSync(issuePath, 'utf8'));
    issue.updatedAt = '2026-05-11T03:30:00Z';
    issue.comments = [{ body: 'Local credential preflight update.' }];
    writeJson(issuePath, issue);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'remote CrUX issue updatedAt covers latest local monitoring: expected 2026-05-11T03:30:00Z to be at or after 2026-05-11T03:38:14.737Z',
    );
    expect(result.stderr).toContain(
      'remote CrUX issue comment latest local monitoring timestamp: expected to include 2026-05-11T03:38:14.737Z',
    );
  });

  it('rejects a synced CrUX blocker issue comment missing credential-name evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const issuePath = join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/issue.json');
    const issue = JSON.parse(readFileSync(issuePath, 'utf8'));
    issue.comments = [
      {
        body: [
          'Local credential preflight update.',
          'Local CrUX monitoring at 2026-05-11T03:38:14.737Z remains blocked.',
          'Next evidence refresh command: `npm run refresh:crux-blocker-evidence`.',
        ].join('\n'),
      },
    ];
    writeJson(issuePath, issue);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'remote CrUX issue local comment non-accepted credential names: expected to include Credential preflight non-accepted local credential names:',
    );
  });

  it('rejects a latest remote CrUX run check with a stale workflow commit', async () => {
    const workspace = await createFixtureWorkspace();
    const latestRunPath = join(workspace, 'artifacts/manual-evidence/remote-crux-latest-run.json');
    const latestRun = JSON.parse(readFileSync(latestRunPath, 'utf8'));
    latestRun.indexedRun.headSha = 'stale-sha';
    latestRun.indexedRun.headShaMatchesLatest = false;
    writeJson(latestRunPath, latestRun);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'remote CrUX latest run indexed workflow commit matches latest: expected true, got false',
    );
  });

  it('rejects a stale objective checklist row count', async () => {
    const workspace = await createFixtureWorkspace();
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    index.objective.actualChecklistRowsObserved = 1167;
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.objective = index.objective;
    writeJson(indexPath, index);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('index.objective.actualChecklistRowsObserved: expected 1150, got 1167');
    expect(result.stderr).toContain(
      'finalBlockerSummary.objective.actualChecklistRowsObserved: expected 1150, got 1167',
    );
  });

  it('rejects a prompt map that omits the visual screenshot review artifact', async () => {
    const workspace = await createFixtureWorkspace();
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const visualRequirement = index.promptRequirementMap.find((entry) =>
      entry.requirement.includes('visual patient screenshot'),
    );
    visualRequirement.evidence = visualRequirement.evidence.filter(
      (entry) => entry !== 'artifacts/manual-evidence/visual-screenshot-review.json',
    );
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.promptToArtifactChecklist = index.promptRequirementMap;
    writeJson(indexPath, index);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'index visual screenshot review artifact: expected to include artifacts/manual-evidence/visual-screenshot-review.json',
    );
  });

  it('rejects a prompt map that omits required command-gate evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const lintRequirement = index.promptRequirementMap.find((entry) => entry.requirement === 'npm run lint.');
    lintRequirement.evidence = [];
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.promptToArtifactChecklist = index.promptRequirementMap;
    writeJson(indexPath, index);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'index lint command evidence: expected to include latest terminal run: npm run lint -- --quiet exited 0',
    );
  });

  it('rejects a prompt map that omits phase-gate command artifact evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const lintRequirement = index.promptRequirementMap.find((entry) => entry.requirement === 'npm run lint.');
    lintRequirement.evidence = lintRequirement.evidence.filter(
      (entry) => entry !== 'artifacts/manual-evidence/phase-gate-command-results.json:commands.lint',
    );
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.promptToArtifactChecklist = index.promptRequirementMap;
    writeJson(indexPath, index);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'index lint phase-gate artifact evidence: expected to include artifacts/manual-evidence/phase-gate-command-results.json:commands.lint',
    );
  });

  it('rejects a failed phase-gate command artifact', async () => {
    const workspace = await createFixtureWorkspace();
    const phaseGatePath = join(workspace, 'artifacts/manual-evidence/phase-gate-command-results.json');
    const phaseGate = JSON.parse(readFileSync(phaseGatePath, 'utf8'));
    phaseGate.commands.coverage.exitCode = 1;
    phaseGate.result = 'failed';
    writeJson(phaseGatePath, phaseGate);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('phase-gate coverage exit code: expected 0, got 1');
  });

  it('rejects a prompt map that omits forbidden-pattern gate evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const forbiddenRequirement = index.promptRequirementMap.find(
      (entry) => entry.requirement === 'No forbidden implementation shortcuts.',
    );
    forbiddenRequirement.evidence = [];
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.promptToArtifactChecklist = index.promptRequirementMap;
    writeJson(indexPath, index);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'index forbidden-pattern command evidence: expected to include latest terminal run: npm run check:forbidden-patterns exited 0',
    );
    expect(result.stderr).toContain(
      'index forbidden-pattern audit artifact: expected to include artifacts/completion-audit.json:commands.forbiddenPatterns',
    );
  });

  it('rejects a prompt map that omits temporary-bypass gate evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const temporaryRequirement = index.promptRequirementMap.find(
      (entry) => entry.requirement === 'No temporary implementation bypasses.',
    );
    temporaryRequirement.evidence = [];
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.promptToArtifactChecklist = index.promptRequirementMap;
    writeJson(indexPath, index);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'index bypass-marker command evidence: expected to include latest terminal run: npm run check:forbidden-patterns exited 0',
    );
    expect(result.stderr).toContain(
      'index bypass-marker audit artifact: expected to include artifacts/completion-audit.json:commands.forbiddenPatterns',
    );
  });

  it('rejects a prompt map that omits test-realism gate evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const testRealismRequirement = index.promptRequirementMap.find(
      (entry) => entry.requirement === 'No mock-only test completion.',
    );
    testRealismRequirement.evidence = [];
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.promptToArtifactChecklist = index.promptRequirementMap;
    writeJson(indexPath, index);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'index test-realism command evidence: expected to include latest terminal run: npm run check:test-realism exited 0',
    );
    expect(result.stderr).toContain(
      'index test-realism artifact evidence: expected to include artifacts/manual-evidence/test-realism.json',
    );
  });

  it('rejects a prompt map that omits required build command evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const buildRequirement = index.promptRequirementMap.find((entry) =>
      entry.requirement.includes('npm run build'),
    );
    buildRequirement.evidence = buildRequirement.evidence.filter(
      (entry) => entry !== 'latest terminal run: npm run check:bundle-size exited 0',
    );
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.promptToArtifactChecklist = index.promptRequirementMap;
    writeJson(indexPath, index);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'index bundle-size command evidence: expected to include latest terminal run: npm run check:bundle-size exited 0',
    );
  });

  it('rejects a prompt map that omits required external manual evidence', async () => {
    const workspace = await createFixtureWorkspace();
    const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const externalRequirement = index.promptRequirementMap.find((entry) =>
      entry.requirement.includes('External manual evidence'),
    );
    externalRequirement.evidence = externalRequirement.evidence.filter(
      (entry) => entry !== 'artifacts/manual-evidence/webpagetest.json',
    );
    const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    summary.promptToArtifactChecklist = index.promptRequirementMap;
    writeJson(indexPath, index);
    writeJson(summaryPath, summary);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'index external manual evidence webpagetest: expected to include artifacts/manual-evidence/webpagetest.json',
    );
  });

  it('rejects remote CrUX evidence without the intentional unavailable-field-data failure log', async () => {
    const workspace = await createFixtureWorkspace();
    writeFileSync(
      join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/failed.log'),
      'unrelated workflow failure\n',
    );

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'remote CrUX failed log: expected to include Chrome UX Report field data is not available yet.',
    );
  });

  it('rejects remote CrUX workflow drift evidence with mismatched files', async () => {
    const workspace = await createFixtureWorkspace();
    writeJson(join(workspace, 'artifacts/manual-evidence/remote-crux-workflow-drift.json'), {
      result: 'failed',
      verifiedAt: '2026-05-11T03:50:00.000Z',
      mirroredFiles: [
        {
          matches: false,
          remotePath: '.github/scripts/check-crux-monitoring.mjs',
        },
      ],
      workflow: {
        missingMarkers: [],
      },
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('remote CrUX workflow drift result: expected passed, got failed');
    expect(result.stderr).toContain(
      'remote CrUX workflow drift mismatched files: expected [], got [".github/scripts/check-crux-monitoring.mjs"]',
    );
  });

  it('rejects checklist numbering gaps', async () => {
    const workspace = await createFixtureWorkspace();
    writeFileSync(join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md'), '1. [x] item 1\n3. [ ] item 3\n');

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('checklist.numberGaps.length: expected 0, got 1');
  });

  it('rejects duplicate checklist item numbers', async () => {
    const workspace = await createFixtureWorkspace();
    writeFileSync(
      join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md'),
      '1. [x] item 1\n1. [ ] duplicate item 1\n',
    );

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('checklist.numberDuplicates.length: expected 0, got 1');
  });
});

async function createFixtureWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), 'completion-consistency-'));
  mkdirSync(join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1'), { recursive: true });

  writeFileSync(join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md'), buildRequirements());
  writeJson(join(workspace, 'package.json'), {
    scripts: {
      'test:coverage': 'npm run test:list && vitest run --coverage',
    },
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-monitoring.json'), {
    apiKeySource: {
      name: null,
      path: null,
      source: 'none',
    },
    result: 'blocked',
    verifiedAt: '2026-05-11T03:38:14.737Z',
    fieldDataAvailable: false,
    requiredToComplete: [
      'Set CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY to a Google API key with Chrome UX Report/PageSpeed quota and rerun this verifier.',
      'Use a production origin that is publicly discoverable and sufficiently popular for CrUX inclusion.',
      'Optionally run CRUX_CACHE_SCAN=1 npm run check:crux-monitoring to stream-search the latest public CrUX cache origin list.',
    ],
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'), {
    acceptedKeyNames: ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'],
    requiredToComplete: [
      'Configure one of CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY with Chrome UX Report/PageSpeed quota.',
      'Rerun npm run check:crux-monitoring after the production origin has available field data.',
    ],
    monitorApiKeySource: {
      name: null,
      path: null,
      source: 'none',
    },
    result: 'missing',
    nonAcceptedCredentialNames: {
      checked: true,
      envFileNames: [],
      localEnvironmentNames: [],
    },
    verifiedAt: '2026-05-11T03:27:06.679Z',
    localEnvFiles: {
      checked: true,
      acceptedPresent: [],
      files: [],
    },
    usableByCurrentMonitor: {
      envFileNames: [],
      githubSecretNames: [],
      localEnvironmentNames: [],
    },
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/run.json'), {
    databaseId: 1,
    headSha: 'abc123',
    conclusion: 'failure',
    url: 'https://github.com/example/repo/actions/runs/1',
  });
  writeJson(
    join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json'),
    {
      apiKeySource: {
        name: null,
        path: null,
        source: 'none',
      },
      result: 'blocked',
      fieldDataAvailable: false,
      verifiedAt: '2026-05-11T03:49:25.000Z',
      checks: remoteCruxChecks(),
      requiredToComplete: [
        'Set CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY to a Google API key with Chrome UX Report/PageSpeed quota and rerun this verifier.',
      ],
    },
  );
  writeJson(
    join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-credentials.json'),
    {
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
    },
  );
  writeJson(join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/issue.json'), {
    body: [
      'Credential preflight result: missing',
      'Credential preflight monitor key source: none',
      'Credential preflight usable exported env names: none',
      'Credential preflight usable env-file names: none',
      'Credential preflight usable GitHub secret names: none',
      'Credential preflight non-accepted local credential names: none',
      'Operator next steps:',
      'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
      'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
      'npm run refresh:crux-blocker-evidence',
    ].join('\n'),
    comments: [
      {
        body: [
          'Local credential preflight update.',
          'Local CrUX monitoring at 2026-05-11T03:38:14.737Z remains blocked.',
          'Credential preflight non-accepted local credential names: `none`',
          'Next evidence refresh command: `npm run refresh:crux-blocker-evidence`.',
        ].join('\n'),
      },
    ],
    updatedAt: '2026-05-11T03:50:00Z',
    url: 'https://github.com/example/repo/issues/1',
    state: 'OPEN',
  });
  writeFileSync(
    join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/failed.log'),
    'Chrome UX Report field data is not available yet.\n',
  );
  writeJson(join(workspace, 'artifacts/manual-evidence/remote-crux-workflow-drift.json'), {
    result: 'passed',
    verifiedAt: '2026-05-11T03:50:00.000Z',
    mirroredFiles: [
      {
        matches: true,
        remotePath: '.github/scripts/check-crux-monitoring.mjs',
      },
    ],
    workflow: {
      missingMarkers: [],
    },
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/remote-crux-latest-run.json'), {
    result: 'passed',
    verifiedAt: '2026-05-11T03:50:00.000Z',
    latestRemoteRun: {
      databaseId: 1,
      headSha: 'abc123',
    },
    indexedRun: {
      artifactExists: true,
      artifactMatchesRun: true,
      headSha: 'abc123',
      headShaMatchesLatest: true,
      runId: 1,
    },
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
    verifiedAt: '2026-05-11T03:50:00.000Z',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/test-realism.json'), {
    behaviorFileCount: 12,
    e2eFileCount: 1,
    failures: [],
    productionImportFileCount: 20,
    result: 'passed',
    testDoubleFileCount: 8,
    verifiedAt: '2026-05-11T03:50:00.000Z',
    verifier: 'test',
    vitestCandidateFileCount: 53,
    vitestFileCount: 53,
    vitestMissingFiles: [],
    vitestTestCount: 202,
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
      transferBrotliJsCssBytes: 4800,
      totalBytes: 71812,
    },
    result: 'passed',
    verifiedAt: '2026-05-11T03:50:00.000Z',
  });
  writeJson(join(workspace, 'artifacts/completion-audit.json'), buildAudit());
  writeJson(join(workspace, 'artifacts/completion-evidence-index.json'), buildIndex());
  writeJson(join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json'), buildBlockers());
  writeJson(join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json'), buildSummary());

  return workspace;
}

function buildRequirements() {
  return Array.from({ length: 1150 }, (_, index) => {
    const itemNumber = index + 1;
    const checked = itemNumber === 874 ? ' ' : 'x';
    const label = itemNumber === 874 ? 'Chrome UX Report 모니터링' : `item ${itemNumber}`;
    return `${itemNumber}. [${checked}] ${label}`;
  }).join('\n');
}

function buildAudit() {
  return {
    checklist: {
      checked: 1149,
      duplicateItemNumbers: [],
      expectedHighestItemNumber: 1150,
      missingItemNumbers: [],
      unchecked: 1,
      observedTotal: 1150,
    },
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
      { id: 'chrome-ux-report' },
    ],
    status: 'incomplete',
    manualEvidence: [
      ...externalManualEvidenceFixture(),
      {
        id: 'chrome-ux-report',
        path: 'artifacts/manual-evidence/chrome-ux-report.json',
        exists: false,
        valid: false,
        supportingEvidence: [
          {
            exists: true,
            path: 'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
            fieldDataAvailable: false,
            result: 'blocked',
            verifiedAt: '2026-05-11T03:38:14.737Z',
          },
          {
            exists: true,
            path: 'artifacts/manual-evidence/chrome-ux-report-credentials.json',
            result: 'missing',
            verifiedAt: '2026-05-11T03:27:06.679Z',
          },
        ],
      },
    ],
    dist: {
      exists: true,
      fileCount: 19,
      hasBuildOutput: true,
      primaryBytesNoCompressedSidecars: 10591,
      primaryJsCssBytes: 5365,
      primaryJsCssFiles: ['dist/assets/index.js', 'dist/assets/index.css'],
      rasterAssets: [],
      transferBrotliJsCssBytes: 4800,
      totalBytes: 71812,
    },
    objectiveRowClaim: {
      actualChecklistRowsObserved: 1150,
      claimedChecklistRows: 1167,
      checklistRowDeltaFromClaim: -17,
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
    commands: {
      forbiddenPatterns: {
        exitCode: 0,
        stdout: JSON.stringify({
          result: 'passed',
          roots: ['src', 'scripts', 'vite.config.ts'],
          ruleIds: ['ts-ignore', 'console-log', 'todo-comment', 'bypass-marker', 'explicit-any'],
          scannedFileCount: 1,
        }),
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
      testRealism: {
        exitCode: 0,
      },
      snyk: {
        exitCode: 0,
      },
    },
    sbom: {
      applicationName: 'vent 2d',
      componentCount: 1,
      path: 'artifacts/sbom.json',
      valid: true,
    },
    screenshots: [
      { path: 'artifacts/patient-avatar-current.png', width: 1386, height: 781 },
      { path: 'artifacts/simulator-current.png', width: 1440, height: 900 },
    ],
    visualReview: {
      reviewedScreenshotCount: 2,
      valid: true,
    },
  };
}

function buildIndex() {
  return {
    generatedAt: '2026-05-11T03:50:00Z',
    objective: {
      claimedChecklistRows: 1167,
      actualChecklistRowsObserved: 1150,
      expectedHighestItemNumber: 1150,
      checklistRowDeltaFromClaim: -17,
      phaseClaimedChecklistRowsTotal: 1200,
      checklistRowDeltaFromPhaseClaims: -50,
      phaseClaimsDeltaFromClaimedTotal: 33,
      completionCriterion: 'Every checklist row is checked and verified.',
      source: 'test objective',
      status: 'not_achieved',
    },
    currentAudit: {
      checked: 1149,
      duplicateItemNumbers: [],
      missingItemNumbers: [],
      expectedHighestItemNumber: 1150,
      unchecked: 1,
      observedTotal: 1150,
    },
    remainingBlocker: {
      item: 874,
    },
    promptRequirementMap: [
      {
        requirement: 'npm run type-check.',
        evidence: [
          'latest terminal run: npm run type-check exited 0',
          'artifacts/manual-evidence/phase-gate-command-results.json:commands.typeCheck',
        ],
        status: 'verified',
      },
      {
        requirement: 'npm run lint.',
        evidence: [
          'latest terminal run: npm run lint -- --quiet exited 0',
          'artifacts/manual-evidence/phase-gate-command-results.json:commands.lint',
        ],
        status: 'verified',
      },
      {
        requirement: 'npm test:coverage result.',
        evidence: [
          'latest terminal run: npm run test:coverage exited 0',
          'artifacts/manual-evidence/phase-gate-command-results.json:commands.coverage',
          '49 test files passed',
          '202 tests passed',
          'Statements 100% (1770/1770)',
          'Branches 100% (1163/1163)',
          'Functions 100% (518/518)',
          'Lines 100% (1416/1416)',
        ],
        status: 'verified',
        notes:
          'The prompt names the coverage gate as npm test:coverage; package.json defines test:coverage as a custom npm script, so the runnable command is npm run test:coverage.',
        commandMapping: {
          packageScript: 'test:coverage',
          packageScriptValue: 'npm run test:list && vitest run --coverage',
          promptCommand: 'npm test:coverage',
          runnableCommand: 'npm run test:coverage',
        },
      },
      {
        requirement: 'npm run build, image-free output, under 100KB primary budget.',
        evidence: [
          'latest terminal run: npm run build exited 0',
          'artifacts/manual-evidence/phase-gate-command-results.json:commands.build',
          'latest terminal run: npm run check:no-raster exited 0',
          'artifacts/manual-evidence/phase-gate-command-results.json:commands.noRaster',
          'latest terminal run: npm run check:bundle-size exited 0',
          'artifacts/manual-evidence/phase-gate-command-results.json:commands.bundleSize',
          'artifacts/completion-audit.json:dist',
          'artifacts/manual-evidence/phase-gate-command-results.json:dist',
        ],
        status: 'verified',
        notes:
          'Audit dist exists is true, fileCount is 19, hasBuildOutput is true, totalBytes is 71812, primaryBytesNoCompressedSidecars is 10591, primaryJsCssBytes is 5365, transferBrotliJsCssBytes is 4800, withinBrotliTransferBudget is true, and rasterAssets is empty.',
      },
      {
        requirement: 'Security scan including Snyk.',
        evidence: [
          'latest terminal run: npm audit --audit-level=moderate exited 0',
          'latest terminal run: npm run check:licenses exited 0',
          'latest terminal run: npm run check:sbom exited 0',
          'artifacts/sbom.json',
          'artifacts/completion-audit.json:commands.npmAudit',
          'artifacts/completion-audit.json:commands.licensePolicy',
          'artifacts/completion-audit.json:commands.sbom',
          'artifacts/completion-audit.json:commands.snyk',
          'artifacts/completion-audit.json:sbom',
        ],
        status: 'verified',
        notes:
          'Security and release evidence passed: npm audit, license policy, SBOM generation, Snyk, and CycloneDX SBOM validation with 1 component(s) for vent 2d.',
      },
      {
        requirement: 'No forbidden implementation shortcuts.',
        evidence: [
          'latest terminal run: npm run check:forbidden-patterns exited 0',
          'artifacts/completion-audit.json:commands.forbiddenPatterns',
        ],
        status: 'verified',
        notes:
          'scripts/assert-forbidden-patterns.mjs scans production source for type-suppression comments, debug print calls, task-marker comments, explicit TypeScript top-type usage, and temporary or workaround implementation bypass markers.',
      },
      {
        requirement: 'No temporary implementation bypasses.',
        evidence: [
          'latest terminal run: npm run check:forbidden-patterns exited 0',
          'artifacts/completion-audit.json:commands.forbiddenPatterns',
        ],
        status: 'verified',
        notes:
          'The same source scanner rejects temporary or workaround implementation bypass markers in production source roots.',
      },
      {
        requirement: 'No mock-only test completion.',
        evidence: [
          'latest terminal run: npm run check:test-realism exited 0',
          'artifacts/manual-evidence/test-realism.json',
          'artifacts/completion-audit.json:commands.testRealism',
        ],
        status: 'verified',
        notes:
          'Test realism verifier passed with 202 Vitest tests, 1 E2E spec file, 12 behavior-oriented test files, 20 production-import test files, and 8 files using constrained platform-boundary test doubles.',
      },
      {
        requirement:
          'External manual evidence for profiler, WebPageTest, screen readers, and domain connection.',
        evidence: [
          ...externalManualEvidenceFixture().map((evidence) => evidence.path),
          'artifacts/completion-audit.json:manualEvidence',
        ],
        status: 'verified_except_crux',
        notes: 'Chrome UX Report manual evidence is the only missing manual evidence artifact.',
      },
      {
        requirement: 'Chrome UX Report monitoring.',
        evidence: [
          'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
          'artifacts/manual-evidence/crux-blocker-refresh.json',
          'latest terminal run: npm run check:crux-monitoring exited 1 with result blocked and fieldDataAvailable false at 2026-05-11T03:38:14.737Z',
          'artifacts/manual-evidence/chrome-ux-report-credentials.json',
          'latest terminal run: npm run check:crux-credentials exited 1 with result missing at 2026-05-11T03:27:06.679Z',
        ],
      },
      {
        requirement: 'Section A patient avatar redesign and visual patient screenshot.',
        evidence: [
          'artifacts/patient-avatar-current.png',
          'artifacts/simulator-current.png',
          'artifacts/completion-audit.json:screenshots',
          'artifacts/manual-evidence/visual-screenshot-review.json',
          'artifacts/completion-audit.json:visualReview',
        ],
        notes:
          'Visual review passed for 2 screenshot artifacts: artifacts/patient-avatar-current.png 1386x781, artifacts/simulator-current.png 1440x900.',
      },
    ],
    remoteCruxEvidence: {
      latestMonitoringArtifact:
        'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
      latestRunId: 1,
      latestWorkflowCommit: 'abc123',
      latestRunConclusion: 'failure',
      blockerIssue: 'https://github.com/example/repo/issues/1',
      workflowDrift: {
        artifact: 'artifacts/manual-evidence/remote-crux-workflow-drift.json',
        result: 'passed',
        verifiedAt: '2026-05-11T03:50:00.000Z',
        mismatchedFiles: [],
        missingWorkflowMarkers: [],
      },
      latestRemoteRunCheck: {
        artifact: 'artifacts/manual-evidence/remote-crux-latest-run.json',
        result: 'passed',
        verifiedAt: '2026-05-11T03:50:00.000Z',
        latestRemoteRunId: 1,
        latestRemoteHeadSha: 'abc123',
        indexedRunId: 1,
        indexedWorkflowCommit: 'abc123',
        indexedWorkflowCommitMatchesLatest: true,
        indexedArtifactExists: true,
        indexedArtifactMatchesRun: true,
      },
    },
    doNotCompleteYet: [
      'Do not call update_goal.',
      'Do not check item 874.',
      'Do not create artifacts/manual-evidence/chrome-ux-report.json unless it contains real CrUX/PageSpeed field-data evidence for the production origin.',
    ],
  };
}

function buildBlockers() {
  return {
    verifiedAt: '2026-05-11T03:50:00Z',
    checklistState: {
      observedTotal: 1150,
      checked: 1149,
      unchecked: 1,
      note: 'The requirements file contains 1150 checklist rows, not 1167.',
    },
    blockers: [
      {
        item: 874,
        id: 'chrome-ux-report',
        currentEvidence: [
          'Fresh local run at 2026-05-11T03:38:14.737Z wrote artifacts/manual-evidence/chrome-ux-report-monitoring.json with result blocked, fieldDataAvailable false.',
          'artifacts/manual-evidence/chrome-ux-report-credentials.json records result missing, monitor API key source none, exported env key names [], env-file key names [], GitHub secret key names [], GitHub environment secret key names [], GitHub environment variable key names [], and local env files accepted key names [].',
          'artifacts/manual-evidence/remote-crux-workflow-drift.json records result passed, mismatched remote files [], and missing workflow markers [].',
          'artifacts/manual-evidence/remote-crux-latest-run.json records result passed, latest remote run 1, indexed run 1, and indexed artifact exists with latest-run directory match true.',
          'Manual remote workflow run 1 ran against current CrUX monitoring commit abc123, uploaded artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json, did not upload chrome-ux-report.json because fieldDataAvailable was false, and updated the blocker issue.',
        ],
        requiredToComplete: [
          'Configure one of CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY with Chrome UX Report/PageSpeed quota.',
          'Rerun npm run check:crux-monitoring after the production origin has available field data.',
          'Set CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY to a Google API key with Chrome UX Report/PageSpeed quota and rerun this verifier.',
          'Use a production origin that is publicly discoverable and sufficiently popular for CrUX inclusion.',
          'Optionally run CRUX_CACHE_SCAN=1 npm run check:crux-monitoring to stream-search the latest public CrUX cache origin list.',
        ],
        operatorNextSteps: [
          'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
          'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
          'gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io',
          'npm run refresh:crux-blocker-evidence',
        ],
        acceptedCredentialNames: ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'],
      },
    ],
  };
}

function buildSummary() {
  const index = buildIndex();
  const blockers = buildBlockers();
  return {
    generatedAt: '2026-05-11T03:50:00Z',
    status: 'incomplete',
    objectiveStatus: index.objective.status,
    objective: index.objective,
    checklist: {
      actualChecklistRowsObserved: 1150,
      checked: 1149,
      duplicateItemNumbers: [],
      missingItemNumbers: [],
      note: 'The requirements file contains 1150 checklist rows, not 1167.',
      unchecked: 1,
    },
    completionAudit: {
      objectiveRestatement:
        'Complete COMPLETE_FIX_REQUIREMENTS.md to 100%, reconcile the claimed 1,167-item target with the actual numbered checklist rows, pass every named command gate, provide visual patient screenshot evidence, and accept Chrome UX Report monitoring only with real production field-data evidence.',
      verdict: index.objective.status,
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
          status: 'verified',
          evidence: [
            'latest terminal run: npm run type-check exited 0',
            'artifacts/manual-evidence/phase-gate-command-results.json:commands.typeCheck',
            'latest terminal run: npm run lint -- --quiet exited 0',
            'artifacts/manual-evidence/phase-gate-command-results.json:commands.lint',
            'latest terminal run: npm run test:coverage exited 0',
            'artifacts/manual-evidence/phase-gate-command-results.json:commands.coverage',
            'latest terminal run: npm run build exited 0',
            'artifacts/manual-evidence/phase-gate-command-results.json:commands.build',
          ],
          finding: 'type-check verified; lint verified; coverage verified; build verified',
        },
        {
          requirement: 'Visual patient screenshot evidence exists and passed review.',
          status: 'unknown',
          evidence: [
            'artifacts/patient-avatar-current.png',
            'artifacts/simulator-current.png',
            'artifacts/completion-audit.json:screenshots',
            'artifacts/manual-evidence/visual-screenshot-review.json',
            'artifacts/completion-audit.json:visualReview',
          ],
          finding:
            'Visual review passed for 2 screenshot artifacts: artifacts/patient-avatar-current.png 1386x781, artifacts/simulator-current.png 1440x900.',
        },
        {
          requirement: 'Chrome UX Report monitoring has real production field-data evidence.',
          status: 'unknown',
          evidence: [
            'artifacts/manual-evidence/chrome-ux-report.json',
            'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
            'artifacts/manual-evidence/chrome-ux-report-credentials.json',
            'artifacts/manual-evidence/crux-blocker-refresh.json',
            'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
            'artifacts/manual-evidence/remote-crux-latest-run.json',
          ],
          finding: 'No Chrome UX Report evidence notes recorded.',
        },
      ],
    },
    doNotCompleteYet: index.doNotCompleteYet,
    promptToArtifactChecklist: index.promptRequirementMap,
    remainingBlocker: {
      item: 874,
      currentEvidence: blockers.blockers[0].currentEvidence,
      latestLocalMonitoring: {
        apiKeySource: {
          name: null,
          path: null,
          source: 'none',
        },
        artifact: 'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
        cruxCache: null,
        fieldDataAvailable: false,
        result: 'blocked',
        verifiedAt: '2026-05-11T03:38:14.737Z',
      },
      latestLocalBatchRefresh: {
        artifact: 'artifacts/manual-evidence/crux-blocker-refresh.json',
        commandCount: 7,
        result: 'blocked',
        unexpectedFailureCount: 0,
        verifiedAt: '2026-05-11T03:50:00.000Z',
      },
      latestLocalCredentials: {
        artifact: 'artifacts/manual-evidence/chrome-ux-report-credentials.json',
        monitorApiKeySource: {
          name: null,
          path: null,
          source: 'none',
        },
        result: 'missing',
        usableEnvFileNames: [],
        usableGitHubSecretNames: [],
        usableGitHubSecretsChecked: null,
        usableGitHubEnvironmentSecretNames: [],
        usableGitHubEnvironmentSecretsChecked: null,
        usableGitHubEnvironmentVariableNames: [],
        usableGitHubEnvironmentVariablesChecked: null,
        usableLocalEnvironmentNames: [],
        nonAcceptedCredentialNames: {
          checked: true,
          envFileNames: [],
          localEnvironmentNames: [],
        },
        verifiedAt: '2026-05-11T03:27:06.679Z',
      },
      latestRemoteRun: {
        artifact: 'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
        apiKeySource: {
          name: null,
          path: null,
          source: 'none',
        },
        credentialArtifact:
          'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-credentials.json',
        credentialMonitorApiKeySource: {
          name: null,
          path: null,
          source: 'none',
        },
        credentialResult: 'missing',
        credentialUsableEnvFileNames: [],
        credentialUsableGitHubSecretNames: [],
        credentialUsableGitHubSecretsChecked: null,
        credentialUsableGitHubEnvironmentSecretNames: [],
        credentialUsableGitHubEnvironmentSecretsChecked: null,
        credentialUsableGitHubEnvironmentVariableNames: [],
        credentialUsableGitHubEnvironmentVariablesChecked: null,
        credentialUsableLocalEnvironmentNames: [],
        credentialNonAcceptedCredentialNames: {
          checked: true,
          envFileNames: [],
          localEnvironmentNames: [],
        },
        cruxLiveProbe: null,
        cruxCache: {
          dataset: null,
          foundOrigin: false,
          latestMonth: null,
          origins: null,
          scanEnabled: true,
          scannedChunks: 21,
          totalChunks: 21,
        },
        fieldDataAvailable: false,
        issue: 'https://github.com/example/repo/issues/1',
        issueCommentCount: 1,
        issueState: 'OPEN',
        issueUpdatedAt: '2026-05-11T03:50:00Z',
        pagesDomain: null,
        pagespeedLiveProbe: null,
        runConclusion: 'failure',
        runHeadSha: 'abc123',
        runId: 1,
        runUrl: 'https://github.com/example/repo/actions/runs/1',
        verifiedAt: '2026-05-11T03:49:25.000Z',
      },
      latestRemoteRunCheck: {
        artifact: 'artifacts/manual-evidence/remote-crux-latest-run.json',
        result: 'passed',
        verifiedAt: '2026-05-11T03:50:00.000Z',
        latestRemoteRunId: 1,
        latestRemoteHeadSha: 'abc123',
        indexedRunId: 1,
        indexedWorkflowCommit: 'abc123',
        indexedWorkflowCommitMatchesLatest: true,
        indexedArtifactExists: true,
        indexedArtifactMatchesRun: true,
      },
      latestRemoteMonitoringArtifact:
        'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
      requiredToComplete: [
        'Configure one of CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY with Chrome UX Report/PageSpeed quota.',
        'Rerun npm run check:crux-monitoring after the production origin has available field data.',
        'Set CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY to a Google API key with Chrome UX Report/PageSpeed quota and rerun this verifier.',
        'Use a production origin that is publicly discoverable and sufficiently popular for CrUX inclusion.',
        'Optionally run CRUX_CACHE_SCAN=1 npm run check:crux-monitoring to stream-search the latest public CrUX cache origin list.',
      ],
      operatorNextSteps: [
        'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
        'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
        'gh workflow run "CrUX Monitoring" --repo komin0707/komin0707.github.io',
        'npm run refresh:crux-blocker-evidence',
      ],
      acceptedCredentialNames: ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'],
    },
  };
}

function externalManualEvidenceFixture() {
  return [
    ['react-devtools-profiler', 'artifacts/manual-evidence/react-devtools-profiler.json'],
    ['webpagetest', 'artifacts/manual-evidence/webpagetest.json'],
    ['nvda', 'artifacts/manual-evidence/nvda.json'],
    ['jaws', 'artifacts/manual-evidence/jaws.json'],
    ['voiceover-mac', 'artifacts/manual-evidence/voiceover-mac.json'],
    ['voiceover-ios', 'artifacts/manual-evidence/voiceover-ios.json'],
    ['talkback-android', 'artifacts/manual-evidence/talkback-android.json'],
    ['domain-connection', 'artifacts/manual-evidence/domain-connection.json'],
  ].map(([id, path]) => ({
    exists: true,
    id,
    path,
    valid: true,
  }));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function addDeepAuditCompletionFixture(workspace) {
  const deepAudit = {
    artifactPath: 'artifacts/manual-evidence/deep-audit-completion-audit.json',
    checkedAt: '2026-05-12T00:00:00.000Z',
    checklist: {
      checked: 1180,
      duplicateNumbers: [],
      highestNumber: 1180,
      missingNumbers: [],
      total: 1180,
      unchecked: 0,
    },
    commandManifest: [
      {
        command: 'npm run build',
        durableEvidence: {
          artifact: 'artifacts/manual-evidence/phase-gate-command-results.json',
          exitCode: 0,
          status: 'verified',
        },
      },
    ],
    explicitCriteria: [
      {
        evidence: ['DEEP_AUDIT_REQUIREMENTS_V2.md: checked rows'],
        finding: '1180/1180 checked; unchecked=0; missing=none; duplicates=none.',
        id: 'deep-checklist-all-checked',
        requirement: 'All 1,180 DEEP checklist rows are checked.',
        status: 'verified',
      },
      {
        evidence: [
          'artifacts/manual-evidence/visual-screenshot-review.json',
          'artifacts/manual-evidence/patient-visual-review-results.json',
        ],
        finding: 'Visual screenshot review artifact exists, but human reviewer sign-off is still missing.',
        id: 'human-like-patient-visual-review',
        requirement: 'Patient looks like a real patient, not a schematic.',
        status: 'blocked',
      },
    ],
    promptToArtifactChecklist: {
      objectiveRestatement:
        'Deliver all 1,180 DEEP_AUDIT_REQUIREMENTS_V2.md checklist items and satisfy true completion evidence.',
    },
    status: 'incomplete',
  };
  const deepBlockers = deepAudit.explicitCriteria
    .filter((criterion) => criterion.status !== 'verified')
    .map((criterion) => ({
      evidence: criterion.evidence,
      finding: criterion.finding,
      id: criterion.id,
      requirement: criterion.requirement,
      status: criterion.status,
    }));

  writeJson(join(workspace, 'artifacts/manual-evidence/deep-audit-completion-audit.json'), deepAudit);

  const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  summary.deepAuditCompletion = {
    artifact: 'artifacts/manual-evidence/deep-audit-completion-audit.json',
    checkedAt: deepAudit.checkedAt,
    status: deepAudit.status,
    objectiveRestatement: deepAudit.promptToArtifactChecklist.objectiveRestatement,
    checklist: deepAudit.checklist,
    commandEvidence: {
      blockedCommands: [],
      commandCount: 1,
    },
    promptToArtifactChecklist: deepAudit.promptToArtifactChecklist,
    blockers: deepBlockers,
  };
  summary.blockerCounts = {
    completeFix: 1,
    consolidated: 1 + deepBlockers.length,
    deepAudit: deepBlockers.length,
  };
  summary.remainingDeepAuditBlockers = deepBlockers;
  summary.consolidatedRemainingBlockers = [
    {
      evidence: summary.remainingBlocker.currentEvidence,
      finding: null,
      id: 'chrome-ux-report',
      requirement: 'Chrome UX Report monitoring.',
      source: 'COMPLETE_FIX_REQUIREMENTS.md',
      status: 'blocked',
    },
    ...deepBlockers.map((blocker) => ({
      ...blocker,
      source: 'DEEP_AUDIT_REQUIREMENTS_V2.md',
    })),
  ];
  writeJson(summaryPath, summary);
}

function addSingleSectionPhaseReports(workspace) {
  const requirementsPath = join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md');
  writeFileSync(requirementsPath, `## 🚨 SECTION E: 성능\n${readFileSync(requirementsPath, 'utf8')}`);

  const section = {
    checked: 1149,
    firstItem: 1,
    lastItem: 1150,
    title: '🚨 SECTION E: 성능',
    total: 1150,
    unchecked: 1,
  };
  const checklist = {
    checked: section.checked,
    firstItem: section.firstItem,
    lastItem: section.lastItem,
    total: section.total,
    unchecked: section.unchecked,
  };

  const auditPath = join(workspace, 'artifacts/completion-audit.json');
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  audit.checklist.sections = [section];
  writeJson(auditPath, audit);

  const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  index.currentAudit.sections = [section];
  writeJson(indexPath, index);

  const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  summary.checklist.sections = [section];
  summary.phaseReports = [
    {
      checklist,
      commandEvidence: phaseCommandEvidence(index),
      phase: 1,
      remainingBlockers: [{ id: 'chrome-ux-report' }],
      section: section.title,
      status: 'incomplete',
      visualScreenshotEvidence: phasePromptEvidence(
        index,
        'Section A patient avatar redesign and visual patient screenshot.',
      ),
    },
  ];
  summary.objectivePhaseReports = [
    {
      checklist,
      commandEvidence: phaseCommandEvidence(index),
      label: '5주차: Section E — 성능',
      phase: 5,
      claimedChecklistRows: 100,
      checklistRowDeltaFromClaim: -20,
      remainingBlockers: [{ id: 'chrome-ux-report' }],
      sections: [section.title],
      status: 'incomplete',
      visualScreenshotEvidence: phasePromptEvidence(
        index,
        'Section A patient avatar redesign and visual patient screenshot.',
      ),
    },
  ];
  writeJson(summaryPath, summary);
}

function phaseCommandEvidence(index) {
  return {
    build: phasePromptEvidence(index, 'npm run build, image-free output, under 100KB primary budget.'),
    coverage: phasePromptEvidence(index, 'npm test:coverage result.'),
    lint: phasePromptEvidence(index, 'npm run lint.'),
    typeCheck: phasePromptEvidence(index, 'npm run type-check.'),
  };
}

function phasePromptEvidence(index, requirement) {
  const entry = index.promptRequirementMap.find((candidate) => candidate.requirement === requirement);
  const evidence = {
    evidence: entry?.evidence ?? [],
    notes: entry?.notes ?? null,
    status: 'verified',
  };
  if (requirement === 'Section A patient avatar redesign and visual patient screenshot.') {
    evidence.screenshots = [
      { path: 'artifacts/patient-avatar-current.png', width: 1386, height: 781 },
      { path: 'artifacts/simulator-current.png', width: 1440, height: 900 },
    ];
    evidence.visualReview = {
      reviewedScreenshotCount: 2,
      valid: true,
    };
  }
  return evidence;
}

function markCredentialsPresent(workspace) {
  const localCredentialsPath = join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json');
  const localCredentials = JSON.parse(readFileSync(localCredentialsPath, 'utf8'));
  localCredentials.result = 'present';
  localCredentials.monitorApiKeySource = {
    name: 'CRUX_API_KEY',
    path: '.env',
    source: 'env-file',
  };
  localCredentials.localEnvFiles.acceptedPresent = ['CRUX_API_KEY'];
  localCredentials.usableByCurrentMonitor.envFileNames = ['CRUX_API_KEY'];
  writeJson(localCredentialsPath, localCredentials);

  const remoteCredentialsPath = join(
    workspace,
    'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-credentials.json',
  );
  const remoteCredentials = JSON.parse(readFileSync(remoteCredentialsPath, 'utf8'));
  remoteCredentials.result = 'present';
  remoteCredentials.monitorApiKeySource = {
    name: 'CRUX_API_KEY',
    source: 'process',
  };
  remoteCredentials.usableByCurrentMonitor.localEnvironmentNames = ['CRUX_API_KEY'];
  writeJson(remoteCredentialsPath, remoteCredentials);

  const remoteMonitoringPath = join(
    workspace,
    'artifacts/manual-evidence/crux-monitoring-run-1/chrome-ux-report-monitoring.json',
  );
  const remoteMonitoring = JSON.parse(readFileSync(remoteMonitoringPath, 'utf8'));
  remoteMonitoring.checks.cruxApi.originRecord.status = 200;
  remoteMonitoring.checks.cruxApi.urlRecord.status = 200;
  remoteMonitoring.checks.pageSpeed.status = 200;
  writeJson(remoteMonitoringPath, remoteMonitoring);

  const auditPath = join(workspace, 'artifacts/completion-audit.json');
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  audit.manualEvidence
    .find((evidence) => evidence.id === 'chrome-ux-report')
    .supportingEvidence.find(
      (evidence) => evidence.path === 'artifacts/manual-evidence/chrome-ux-report-credentials.json',
    ).result = 'present';
  writeJson(auditPath, audit);

  const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  index.promptRequirementMap[2].evidence[3] =
    'latest terminal run: npm run check:crux-credentials exited 0 with result present at 2026-05-11T03:27:06.679Z';
  writeJson(indexPath, index);

  const blockersPath = join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json');
  const blockers = JSON.parse(readFileSync(blockersPath, 'utf8'));
  blockers.blockers[0].currentEvidence[1] =
    'artifacts/manual-evidence/chrome-ux-report-credentials.json records result present, monitor API key source env-file:.env:CRUX_API_KEY, exported env key names [], env-file key names [CRUX_API_KEY], GitHub secret key names [], GitHub environment secret key names [], GitHub environment variable key names [], and local env files accepted key names [CRUX_API_KEY].';
  writeJson(blockersPath, blockers);

  const issuePath = join(workspace, 'artifacts/manual-evidence/crux-monitoring-run-1/issue.json');
  const issue = JSON.parse(readFileSync(issuePath, 'utf8'));
  issue.body = [
    'Credential preflight result: present',
    'Credential preflight monitor key source: process',
    'Credential preflight usable exported env names: CRUX_API_KEY',
    'Credential preflight usable env-file names: none',
    'Credential preflight usable GitHub secret names: CRUX_API_KEY',
    'Credential preflight non-accepted local credential names: none',
    'Operator next steps:',
    'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io',
    'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
    'npm run refresh:crux-blocker-evidence',
  ].join('\n');
  writeJson(issuePath, issue);

  const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  summary.promptToArtifactChecklist = index.promptRequirementMap;
  summary.remainingBlocker.currentEvidence = blockers.blockers[0].currentEvidence;
  summary.remainingBlocker.latestLocalCredentials = {
    artifact: 'artifacts/manual-evidence/chrome-ux-report-credentials.json',
    monitorApiKeySource: {
      name: 'CRUX_API_KEY',
      path: '.env',
      source: 'env-file',
    },
    result: 'present',
    usableEnvFileNames: ['CRUX_API_KEY'],
    usableGitHubSecretNames: [],
    usableGitHubSecretsChecked: null,
    usableGitHubEnvironmentSecretNames: [],
    usableGitHubEnvironmentSecretsChecked: null,
    usableGitHubEnvironmentVariableNames: [],
    usableGitHubEnvironmentVariablesChecked: null,
    usableLocalEnvironmentNames: [],
    nonAcceptedCredentialNames: {
      checked: true,
      envFileNames: [],
      localEnvironmentNames: [],
    },
    verifiedAt: '2026-05-11T03:27:06.679Z',
  };
  summary.remainingBlocker.latestRemoteRun.credentialMonitorApiKeySource = {
    name: 'CRUX_API_KEY',
    source: 'process',
  };
  summary.remainingBlocker.latestRemoteRun.credentialResult = 'present';
  summary.remainingBlocker.latestRemoteRun.credentialUsableEnvFileNames = [];
  summary.remainingBlocker.latestRemoteRun.credentialUsableGitHubSecretNames = [];
  summary.remainingBlocker.latestRemoteRun.credentialUsableGitHubSecretsChecked = null;
  summary.remainingBlocker.latestRemoteRun.credentialUsableGitHubEnvironmentSecretNames = [];
  summary.remainingBlocker.latestRemoteRun.credentialUsableGitHubEnvironmentSecretsChecked = null;
  summary.remainingBlocker.latestRemoteRun.credentialUsableGitHubEnvironmentVariableNames = [];
  summary.remainingBlocker.latestRemoteRun.credentialUsableGitHubEnvironmentVariablesChecked = null;
  summary.remainingBlocker.latestRemoteRun.credentialUsableLocalEnvironmentNames = ['CRUX_API_KEY'];
  summary.remainingBlocker.latestRemoteRun.credentialNonAcceptedCredentialNames = {
    checked: true,
    envFileNames: [],
    localEnvironmentNames: [],
  };
  writeJson(summaryPath, summary);
}

function updateChecklistCounts(workspace, counts) {
  const auditPath = join(workspace, 'artifacts/completion-audit.json');
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  audit.checklist.checked = counts.checked;
  audit.checklist.unchecked = counts.unchecked;
  writeJson(auditPath, audit);

  const indexPath = join(workspace, 'artifacts/completion-evidence-index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  index.currentAudit.checked = counts.checked;
  index.currentAudit.unchecked = counts.unchecked;
  writeJson(indexPath, index);

  const blockersPath = join(workspace, 'artifacts/manual-evidence/remaining-external-blockers.json');
  const blockers = JSON.parse(readFileSync(blockersPath, 'utf8'));
  blockers.checklistState.checked = counts.checked;
  blockers.checklistState.unchecked = counts.unchecked;
  writeJson(blockersPath, blockers);

  const summaryPath = join(workspace, 'artifacts/manual-evidence/final-blocker-summary.json');
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  summary.checklist.checked = counts.checked;
  summary.checklist.unchecked = counts.unchecked;
  writeJson(summaryPath, summary);
}

function remoteCruxChecks() {
  return {
    cruxApi: {
      originRecord: { status: 403 },
      urlRecord: { status: 403 },
    },
    pageSpeed: { status: 429 },
    cruxCache: {
      scanEnabled: true,
      scannedChunks: 21,
      totalChunks: 21,
      foundOrigin: false,
    },
  };
}
