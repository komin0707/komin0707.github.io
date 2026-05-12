import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/update-crux-blocker-issue.mjs');

describe('CrUX blocker issue updater', () => {
  it('posts the latest local monitoring timestamp when the issue is stale', async () => {
    const workspace = await createWorkspace({ existingCommentHasTimestamp: false });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      commentPosted: true,
      latestLocalMonitoringVerifiedAt: '2026-05-11T14:26:14.986Z',
      result: 'posted',
    });

    const postedBody = readFileSync(join(workspace, 'posted-comment.txt'), 'utf8');
    expect(postedBody).toContain('Fresh local monitoring verifiedAt: `2026-05-11T14:26:14.986Z`');
    expect(postedBody).toContain('Credential preflight result: `missing`');
    expect(postedBody).toContain('Credential preflight non-accepted local credential names: `none`');
    expect(postedBody).toContain('Pages domain result: `passed`');
    expect(postedBody).toContain('Next evidence refresh command: `npm run refresh:crux-blocker-evidence`.');
    expect(postedBody).toContain('Do not create `artifacts/manual-evidence/chrome-ux-report.json`');
  });

  it('does not post a duplicate comment when the timestamp already exists', async () => {
    const workspace = await createWorkspace({
      existingCommentHasNewCredentialMarker: true,
      existingCommentHasTimestamp: true,
    });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      commentPosted: false,
      result: 'already-updated',
    });
    expect(readFileSync(join(workspace, 'gh-calls.txt'), 'utf8')).not.toContain('issue comment');
  });

  it('posts a comment when the timestamp exists but the credential-name evidence is stale', async () => {
    const workspace = await createWorkspace({
      existingCommentHasNewCredentialMarker: false,
      existingCommentHasTimestamp: true,
    });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      commentPosted: true,
      result: 'posted',
    });
    expect(readFileSync(join(workspace, 'posted-comment.txt'), 'utf8')).toContain(
      'Credential preflight non-accepted local credential names: `none`',
    );
  });
});

function runScript(workspace) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: workspace,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
    },
  });
}

async function createWorkspace({
  existingCommentHasNewCredentialMarker = false,
  existingCommentHasTimestamp,
}) {
  const workspace = await mkdtemp(join(tmpdir(), 'crux-blocker-issue-'));
  mkdirSync(join(workspace, 'artifacts/manual-evidence'), { recursive: true });
  mkdirSync(join(workspace, 'bin'), { recursive: true });

  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-monitoring.json'), {
    fieldDataAvailable: false,
    origin: 'https://komin0707.github.io',
    result: 'blocked',
    verifiedAt: '2026-05-11T14:26:14.986Z',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'), {
    monitorApiKeySource: { source: 'none' },
    nonAcceptedCredentialNames: {
      checked: true,
      envFileNames: [],
      localEnvironmentNames: [],
    },
    result: 'missing',
    verifiedAt: '2026-05-11T14:25:53.904Z',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/crux-live-probe.json'), {
    probes: [
      { name: 'origin', recordPresent: false },
      { name: 'url', recordPresent: false },
    ],
    result: 'blocked',
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/pagespeed-live-probe.json'), {
    hasLoadingExperience: false,
    hasOriginLoadingExperience: false,
  });
  writeJson(join(workspace, 'artifacts/manual-evidence/github-pages-domain.json'), {
    result: 'passed',
  });
  writeFakeGh(workspace, { existingCommentHasNewCredentialMarker, existingCommentHasTimestamp });
  return workspace;
}

function writeFakeGh(workspace, { existingCommentHasNewCredentialMarker, existingCommentHasTimestamp }) {
  const timestamp = existingCommentHasTimestamp ? '2026-05-11T14:26:14.986Z' : '2026-05-11T14:05:00Z';
  const credentialMarker = existingCommentHasNewCredentialMarker
    ? ' Credential preflight non-accepted local credential names: `none`'
    : '';
  const fakeGhPath = join(workspace, 'bin/gh');
  writeFileSync(
    fakeGhPath,
    `#!/usr/bin/env node
import { appendFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
appendFileSync('gh-calls.txt', args.join(' ') + '\\n');

if (args[0] === 'issue' && args[1] === 'view' && args[2] === '1') {
  process.stdout.write(JSON.stringify({
    url: 'https://github.com/example/pages/issues/1',
    state: 'OPEN',
    title: '[blocked] Chrome UX Report field data unavailable',
    body: 'No field data yet.',
    comments: [{
      body: 'Local credential preflight update. ${timestamp}${credentialMarker}',
      url: 'https://github.com/example/pages/issues/1#issuecomment-1'
    }],
    updatedAt: '2026-05-11T14:06:00Z'
  }));
  process.exit(0);
}

if (args[0] === 'issue' && args[1] === 'comment' && args[2] === '1') {
  writeFileSync('posted-comment.txt', args[args.indexOf('--body') + 1]);
  process.stdout.write('https://github.com/example/pages/issues/1#issuecomment-2\\n');
  process.exit(0);
}

process.stderr.write('unexpected gh args: ' + args.join(' ') + '\\n');
process.exit(2);
`,
  );
  chmodSync(fakeGhPath, 0o755);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
