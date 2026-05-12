import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/check-latest-remote-crux-run.mjs');

describe('latest remote CrUX run verifier', () => {
  it('passes when the completion index points at the latest remote run artifact and commit', async () => {
    const workspace = await createFixtureWorkspace({
      indexedRunId: 123,
      indexedWorkflowCommit: 'sha-123',
      latestRunId: 123,
    });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      indexedArtifactExists: true,
      indexedArtifactMatchesRun: true,
      indexedRunId: 123,
      indexedWorkflowCommit: 'sha-123',
      latestRemoteHeadSha: 'sha-123',
      latestRemoteRunId: 123,
      result: 'passed',
    });
  });

  it('fails when a newer remote run has not been synced into the completion index', async () => {
    const workspace = await createFixtureWorkspace({
      indexedRunId: 122,
      indexedWorkflowCommit: 'sha-122',
      latestRunId: 123,
    });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      indexedRunId: 122,
      latestRemoteRunId: 123,
      result: 'failed',
    });

    const artifact = JSON.parse(
      readFileSync(join(workspace, 'artifacts/manual-evidence/remote-crux-latest-run.json'), 'utf8'),
    );
    expect(artifact.requiredToComplete).toContain(
      'Run npm run refresh:crux-blocker-evidence to download the latest CrUX Monitoring run artifacts and refresh completion evidence.',
    );
  });

  it('fails when the latest run id is indexed but the workflow commit is stale', async () => {
    const workspace = await createFixtureWorkspace({
      indexedRunId: 123,
      indexedWorkflowCommit: 'sha-122',
      latestRunId: 123,
    });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      indexedRunId: 123,
      indexedWorkflowCommit: 'sha-122',
      latestRemoteHeadSha: 'sha-123',
      latestRemoteRunId: 123,
      result: 'failed',
    });

    const artifact = JSON.parse(
      readFileSync(join(workspace, 'artifacts/manual-evidence/remote-crux-latest-run.json'), 'utf8'),
    );
    expect(artifact.indexedRun).toMatchObject({
      artifactMatchesRun: true,
      headSha: 'sha-122',
      headShaMatchesLatest: false,
      runId: 123,
    });
  });

  it('fails when the indexed artifact path does not belong to the latest run directory', async () => {
    const workspace = await createFixtureWorkspace({
      artifactRunId: 122,
      indexedRunId: 123,
      indexedWorkflowCommit: 'sha-123',
      latestRunId: 123,
    });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      indexedArtifactExists: true,
      indexedArtifactMatchesRun: false,
      indexedRunId: 123,
      latestRemoteRunId: 123,
      result: 'failed',
    });

    const artifact = JSON.parse(
      readFileSync(join(workspace, 'artifacts/manual-evidence/remote-crux-latest-run.json'), 'utf8'),
    );
    expect(artifact.indexedRun).toMatchObject({
      artifact: 'artifacts/manual-evidence/crux-monitoring-run-122/chrome-ux-report-monitoring.json',
      artifactExists: true,
      artifactMatchesRun: false,
      runId: 123,
    });
  });
});

function runScript(workspace) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: workspace,
    encoding: 'utf8',
    env: {
      ...process.env,
      CRUX_PAGES_REPO: 'example/pages',
      PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
    },
  });
}

async function createFixtureWorkspace({ artifactRunId, indexedRunId, indexedWorkflowCommit, latestRunId }) {
  const effectiveArtifactRunId = artifactRunId ?? indexedRunId;
  const workspace = await mkdtemp(join(tmpdir(), 'latest-remote-crux-run-'));
  mkdirSync(join(workspace, 'bin'), { recursive: true });
  mkdirSync(
    join(workspace, `artifacts/manual-evidence/crux-monitoring-run-${String(effectiveArtifactRunId)}`),
    {
      recursive: true,
    },
  );

  const indexedArtifact = `artifacts/manual-evidence/crux-monitoring-run-${String(
    effectiveArtifactRunId,
  )}/chrome-ux-report-monitoring.json`;
  writeJson(join(workspace, 'artifacts/completion-evidence-index.json'), {
    remoteCruxEvidence: {
      latestMonitoringArtifact: indexedArtifact,
      latestRunConclusion: 'failure',
      latestRunId: indexedRunId,
      latestWorkflowCommit: indexedWorkflowCommit,
    },
  });
  writeJson(join(workspace, indexedArtifact), {
    result: 'blocked',
  });
  writeFakeGh(join(workspace, 'bin/gh'), latestRunId);
  return workspace;
}

function writeFakeGh(path, latestRunId) {
  writeFileSync(
    path,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.join(' ') !== 'run list --repo example/pages --workflow CrUX Monitoring --limit 1 --json databaseId,status,conclusion,headSha,createdAt,url') {
  process.stderr.write('unexpected gh args: ' + args.join(' ') + '\\n');
  process.exit(2);
}
process.stdout.write(JSON.stringify([{
  databaseId: ${String(latestRunId)},
  status: 'completed',
  conclusion: 'failure',
  headSha: 'sha-${String(latestRunId)}',
  createdAt: '2026-05-11T08:18:40Z',
  url: 'https://github.com/example/pages/actions/runs/${String(latestRunId)}'
}]));
`,
  );
  chmodSync(path, 0o755);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
