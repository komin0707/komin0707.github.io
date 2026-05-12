import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/check-remote-crux-workflow.mjs');

describe('remote CrUX workflow drift verifier', () => {
  it('passes when remote monitoring files match local expected files and workflow markers exist', async () => {
    const workspace = await createFixtureWorkspace({ drift: false });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      artifactPath: 'artifacts/manual-evidence/remote-crux-workflow-drift.json',
      mismatchedFiles: [],
      missingWorkflowMarkers: [],
      repo: 'example/pages',
      result: 'passed',
    });
  });

  it('fails when a mirrored remote script differs from the local expected file', async () => {
    const workspace = await createFixtureWorkspace({ drift: true });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      mismatchedFiles: ['.github/scripts/check-crux-monitoring.mjs'],
      result: 'failed',
    });

    const artifact = JSON.parse(
      readFileSync(join(workspace, 'artifacts/manual-evidence/remote-crux-workflow-drift.json'), 'utf8'),
    );
    expect(
      artifact.mirroredFiles.find((file) => file.remotePath.endsWith('check-crux-monitoring.mjs')),
    ).toMatchObject({
      matches: false,
    });
  });

  it('fails when the remote workflow omits a supported credential secret', async () => {
    const workspace = await createFixtureWorkspace({ omittedCredential: 'GOOGLE_API_KEY' });

    const result = runScript(workspace);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      missingWorkflowMarkers: ['GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}'],
      result: 'failed',
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

async function createFixtureWorkspace({ drift = false, omittedCredential = null } = {}) {
  const workspace = await mkdtemp(join(tmpdir(), 'remote-crux-workflow-'));
  mkdirSync(join(workspace, 'bin'), { recursive: true });
  mkdirSync(join(workspace, 'scripts'), { recursive: true });

  const files = {
    'scripts/check-pages-domain.mjs': 'export const pages = true;\n',
    'scripts/crux-env.mjs': 'export const env = true;\n',
    'scripts/check-crux-credentials.mjs': 'export const credentials = true;\n',
    'scripts/check-crux-monitoring.mjs': 'export const monitoring = true;\n',
    'scripts/check-crux-live-probes.mjs': 'export const liveProbes = true;\n',
  };

  for (const [path, content] of Object.entries(files)) {
    writeFileSync(join(workspace, path), content);
  }

  const remoteFiles = {
    '.github/scripts/check-pages-domain.mjs': files['scripts/check-pages-domain.mjs'],
    '.github/scripts/crux-env.mjs': files['scripts/crux-env.mjs'],
    '.github/scripts/check-crux-credentials.mjs': files['scripts/check-crux-credentials.mjs'],
    '.github/scripts/check-crux-monitoring.mjs': drift
      ? 'export const monitoring = false;\n'
      : files['scripts/check-crux-monitoring.mjs'],
    '.github/scripts/check-crux-live-probes.mjs': files['scripts/check-crux-live-probes.mjs'],
    '.github/workflows/crux-monitoring.yml': workflowContent(omittedCredential),
  };

  writeFakeGh(join(workspace, 'bin/gh'), remoteFiles);
  return workspace;
}

function writeFakeGh(path, remoteFiles) {
  writeFileSync(
    path,
    `#!/usr/bin/env node
const remoteFiles = ${JSON.stringify(remoteFiles)};
const args = process.argv.slice(2);
const requestPath = args.find((arg) => arg.startsWith('repos/example/pages/contents/'));
if (!requestPath) {
  process.stderr.write('unexpected gh args: ' + args.join(' ') + '\\n');
  process.exit(2);
}
const pathWithRef = requestPath.replace('repos/example/pages/contents/', '');
const path = pathWithRef.split('?')[0];
if (!Object.prototype.hasOwnProperty.call(remoteFiles, path)) {
  process.stderr.write('missing remote file: ' + path + '\\n');
  process.exit(1);
}
process.stdout.write(JSON.stringify({
  content: Buffer.from(remoteFiles[path], 'utf8').toString('base64'),
  sha: 'sha-' + path.replace(/[^a-z0-9]/gi, '-')
}));
`,
  );
  chmodSync(path, 0o755);
}

function workflowContent(omittedCredential) {
  const lines = [
    'node .github/scripts/check-pages-domain.mjs',
    'node .github/scripts/check-crux-credentials.mjs',
    'node .github/scripts/check-crux-monitoring.mjs',
    'node .github/scripts/check-crux-live-probes.mjs',
    'environment: github-pages',
    'GH_TOKEN: ${{ github.token }}\n          CRUX_API_KEY: ${{ secrets.CRUX_API_KEY }}',
    'PAGESPEED_API_KEY: ${{ secrets.PAGESPEED_API_KEY }}',
    'GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}',
    'artifacts/manual-evidence/github-pages-domain.json',
    'artifacts/manual-evidence/chrome-ux-report-credentials.json',
    'artifacts/manual-evidence/chrome-ux-report-monitoring.json',
    'artifacts/manual-evidence/crux-live-probe.json',
    'artifacts/manual-evidence/pagespeed-live-probe.json',
    'Direct CrUX live probe origin status:',
    'Direct PageSpeed loadingExperience:',
    'Credential preflight monitor key source:',
    'Credential preflight usable exported env names:',
    'Credential preflight usable env-file names:',
    'Credential preflight usable GitHub secret names:',
    'Credential preflight usable GitHub environment secret names:',
    'Credential preflight usable GitHub environment variable names:',
    'Credential preflight non-accepted local credential names:',
    'gh secret set PAGESPEED_API_KEY --repo komin0707/komin0707.github.io --env github-pages',
    'npm run refresh:crux-blocker-evidence',
    'Fail when field data is unavailable',
  ];
  return lines.filter((line) => !omittedCredential || !line.includes(omittedCredential)).join('\n');
}
