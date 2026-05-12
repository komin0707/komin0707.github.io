import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/sync-remote-crux-evidence.mjs');

describe('sync remote CrUX evidence', () => {
  it('downloads the latest run metadata, failed log, artifact, and issue snapshot', async () => {
    const workspace = await createWorkspaceWithFakeGh();
    const evidenceDirectory = 'artifacts/manual-evidence';
    const runDirectory = join(workspace, evidenceDirectory, 'crux-monitoring-run-123');
    mkdirSync(runDirectory, { recursive: true });
    writeFileSync(join(runDirectory, 'chrome-ux-report-monitoring.json'), '{"stale":true}\n');
    writeFileSync(join(runDirectory, 'chrome-ux-report-credentials.json'), '{"stale":true}\n');
    writeFileSync(join(runDirectory, 'github-pages-domain.json'), '{"stale":true}\n');

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        CRUX_REMOTE_EVIDENCE_DIR: evidenceDirectory,
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      artifactName: 'chrome-ux-report-monitoring',
      hasPagesDomainArtifact: true,
      issueCommentCount: 1,
      issueUpdatedAt: '2026-05-11T03:49:25Z',
      pagesDomainArtifact: 'artifacts/manual-evidence/crux-monitoring-run-123/github-pages-domain.json',
      runDirectory: 'artifacts/manual-evidence/crux-monitoring-run-123',
      runConclusion: 'failure',
      runId: 123,
      runStatus: 'completed',
    });

    expect(readJson(join(runDirectory, 'run.json'))).toMatchObject({
      conclusion: 'failure',
      databaseId: 123,
      headSha: 'abc123',
    });
    expect(readFileSync(join(runDirectory, 'failed.log'), 'utf8')).toContain(
      'Chrome UX Report field data is not available yet.',
    );
    expect(readJson(join(runDirectory, 'chrome-ux-report-monitoring.json'))).toMatchObject({
      fieldDataAvailable: false,
      result: 'blocked',
    });
    expect(readJson(join(runDirectory, 'chrome-ux-report-credentials.json'))).toMatchObject({
      result: 'missing',
    });
    expect(readJson(join(runDirectory, 'github-pages-domain.json'))).toMatchObject({
      result: 'passed',
      connectedOrigins: ['https://komin0707.github.io'],
    });
    expect(readJson(join(runDirectory, 'issue.json'))).toMatchObject({
      comments: [
        {
          body: 'Local credential preflight update.',
          url: 'https://github.com/example/pages/issues/1#issuecomment-1',
        },
      ],
      state: 'OPEN',
      url: 'https://github.com/example/pages/issues/1',
    });
  });
});

async function createWorkspaceWithFakeGh() {
  const workspace = await mkdtemp(join(tmpdir(), 'remote-crux-sync-'));
  const binDirectory = join(workspace, 'bin');
  mkdirSync(binDirectory, { recursive: true });

  const fakeGhPath = join(binDirectory, 'gh');
  writeFileSync(
    fakeGhPath,
    `#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);

if (args.join(' ') === 'run list --repo komin0707/komin0707.github.io --workflow CrUX Monitoring --limit 1 --json databaseId,status,conclusion,headSha,createdAt,url') {
  process.stdout.write(JSON.stringify([{
    databaseId: 123,
    status: 'completed',
    conclusion: 'failure',
    headSha: 'abc123',
    createdAt: '2026-05-11T03:48:55Z',
    url: 'https://github.com/example/pages/actions/runs/123'
  }]));
  process.exit(0);
}

if (args[0] === 'run' && args[1] === 'view' && args[2] === '123' && args.includes('--log-failed')) {
  process.stdout.write('Chrome UX Report field data is not available yet.\\n');
  process.exit(0);
}

if (args[0] === 'run' && args[1] === 'view' && args[2] === '123') {
  process.stdout.write(JSON.stringify({
    databaseId: 123,
    status: 'completed',
    conclusion: 'failure',
    headSha: 'abc123',
    createdAt: '2026-05-11T03:48:55Z',
    url: 'https://github.com/example/pages/actions/runs/123',
    jobs: []
  }));
  process.exit(0);
}

if (args[0] === 'run' && args[1] === 'download' && args[2] === '123') {
  const dir = args[args.indexOf('--dir') + 1];
  mkdirSync(dir, { recursive: true });
  for (const file of ['chrome-ux-report-monitoring.json', 'chrome-ux-report-credentials.json', 'github-pages-domain.json']) {
    if (existsSync(join(dir, file))) {
      process.stderr.write('refusing to overwrite ' + file + '\\n');
      process.exit(1);
    }
  }
  writeFileSync(join(dir, 'chrome-ux-report-monitoring.json'), JSON.stringify({
    result: 'blocked',
    fieldDataAvailable: false
  }, null, 2) + '\\n');
  writeFileSync(join(dir, 'chrome-ux-report-credentials.json'), JSON.stringify({
    result: 'missing'
  }, null, 2) + '\\n');
  writeFileSync(join(dir, 'github-pages-domain.json'), JSON.stringify({
    result: 'passed',
    connectedOrigins: ['https://komin0707.github.io']
  }, null, 2) + '\\n');
  process.exit(0);
}

if (args[0] === 'issue' && args[1] === 'view' && args[2] === '1') {
  process.stdout.write(JSON.stringify({
    url: 'https://github.com/example/pages/issues/1',
    state: 'OPEN',
    title: '[blocked] Chrome UX Report field data unavailable',
    body: 'No field data yet.',
    comments: [{
      body: 'Local credential preflight update.',
      url: 'https://github.com/example/pages/issues/1#issuecomment-1'
    }],
    updatedAt: '2026-05-11T03:49:25Z'
  }));
  process.exit(0);
}

process.stderr.write('unexpected gh args: ' + args.join(' ') + '\\n');
process.exit(2);
`,
  );
  chmodSync(fakeGhPath, 0o755);

  return workspace;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
