import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/check-crux-credentials.mjs');

describe('CrUX credential preflight', () => {
  it('treats accepted local env-file names as monitor-usable without leaking values', async () => {
    const workspace = await createFixtureWorkspace();
    writeFileSync(
      join(workspace, '.env'),
      [
        'VITE_APP_ENV=test',
        'CRUX_API_KEY=secret-value-that-must-not-leak',
        'LEGACY_GOOGLE_API_KEY=legacy-secret-that-must-not-leak',
        '',
      ].join('\n'),
    );

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: fixtureEnv(workspace),
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('secret-value-that-must-not-leak');
    expect(
      readFileSync(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'), 'utf8'),
    ).not.toContain('secret-value-that-must-not-leak');
    expect(
      readFileSync(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'), 'utf8'),
    ).not.toContain('legacy-secret-that-must-not-leak');

    const artifact = readJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'));
    expect(artifact).toMatchObject({
      monitorApiKeySource: {
        name: 'CRUX_API_KEY',
        path: '.env',
        source: 'env-file',
      },
      result: 'present',
      localEnvFiles: {
        acceptedPresent: ['CRUX_API_KEY'],
        checked: true,
      },
      usableByCurrentMonitor: {
        envFileNames: ['CRUX_API_KEY'],
        githubSecretNames: [],
        localEnvironmentNames: [],
      },
    });
    expect(artifact.localEnvFiles.files.find((file) => file.path === '.env')).toMatchObject({
      acceptedPresent: ['CRUX_API_KEY'],
      checked: true,
      exists: true,
      path: '.env',
    });
    expect(artifact.nonAcceptedCredentialNames.envFileNames.find((file) => file.path === '.env')).toEqual({
      exists: true,
      names: ['LEGACY_GOOGLE_API_KEY'],
      path: '.env',
    });
  });

  it('treats exported accepted environment names as monitor-usable', async () => {
    const workspace = await createFixtureWorkspace();

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...fixtureEnv(workspace),
        PAGESPEED_API_KEY: 'secret-value-that-must-not-leak',
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('secret-value-that-must-not-leak');

    const artifact = readJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'));
    expect(JSON.stringify(artifact)).not.toContain('secret-value-that-must-not-leak');
    expect(artifact).toMatchObject({
      result: 'present',
      usableByCurrentMonitor: {
        localEnvironmentNames: ['PAGESPEED_API_KEY'],
      },
    });
  });

  it('treats GitHub environment secrets as remote workflow-usable without leaking values', async () => {
    const workspace = await createFixtureWorkspace({
      ghScript: `#!/bin/sh
case "$*" in
  "api repos/example/pages/environments")
    printf '{"environments":[{"name":"github-pages"}]}\\n'
    ;;
  "secret list --repo example/pages --env github-pages --json name,updatedAt")
    printf '[{"name":"CRUX_API_KEY","updatedAt":"2026-05-11T00:00:00Z"}]\\n'
    ;;
  "variable list --repo example/pages --env github-pages --json name,updatedAt")
    printf '[{"name":"PAGESPEED_API_KEY","updatedAt":"2026-05-11T00:00:00Z"}]\\n'
    ;;
  *)
    printf '[]\\n'
    ;;
esac
`,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: fixtureEnv(workspace),
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);

    const artifact = readJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-credentials.json'));
    expect(artifact).toMatchObject({
      result: 'present',
      githubEnvironments: {
        acceptedPresent: {
          secrets: ['CRUX_API_KEY'],
          variables: ['PAGESPEED_API_KEY'],
        },
        checked: true,
        count: 1,
        names: ['github-pages'],
      },
      usableByCurrentMonitor: {
        envFileNames: [],
        githubEnvironmentSecretNames: ['CRUX_API_KEY'],
        githubSecretNames: [],
        localEnvironmentNames: [],
      },
    });
    expect(artifact.githubEnvironments.environments[0]).toMatchObject({
      name: 'github-pages',
      secrets: {
        acceptedPresent: ['CRUX_API_KEY'],
        checked: true,
        count: 1,
        names: ['CRUX_API_KEY'],
      },
      variables: {
        acceptedPresent: ['PAGESPEED_API_KEY'],
        checked: true,
        count: 1,
        names: ['PAGESPEED_API_KEY'],
      },
    });
  });
});

async function createFixtureWorkspace(options = {}) {
  const workspace = await mkdtemp(join(tmpdir(), 'crux-credentials-'));
  mkdirSync(join(workspace, 'bin'), { recursive: true });
  writeFileSync(join(workspace, 'bin/gh'), options.ghScript ?? '#!/bin/sh\nprintf "[]\\n"\n');
  chmodSync(join(workspace, 'bin/gh'), 0o755);
  return workspace;
}

function fixtureEnv(workspace) {
  return {
    CRUX_GITHUB_REPO: 'example/pages',
    HOME: workspace,
    PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
