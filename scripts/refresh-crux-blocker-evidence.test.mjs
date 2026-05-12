import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/refresh-crux-blocker-evidence.mjs');

describe('CrUX blocker evidence refresher', () => {
  it('runs the full CrUX evidence sequence and exits zero when consistency passes', async () => {
    const workspace = await createWorkspace();

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        CRUX_BLOCKER_REFRESH_ARTIFACT: 'artifacts/manual-evidence/crux-blocker-refresh.json',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('"result": "blocked"');
    expect(readFileSync(join(workspace, 'npm-calls.txt'), 'utf8').trim().split('\n')).toEqual([
      'run check:crux-credentials',
      'run check:crux-live-probes',
      'run check:pages-domain',
      'run check:crux-monitoring',
      'run update:crux-blocker-issue',
      'run sync:remote-crux-evidence',
      'run test:list',
      'run refresh:completion-evidence',
      'run check:completion-evidence',
    ]);

    const artifact = readJson(join(workspace, 'artifacts/manual-evidence/crux-blocker-refresh.json'));
    expect(artifact).toMatchObject({
      result: 'blocked',
    });
    expect(artifact.commands).toHaveLength(7);
    expect(artifact.commands[0]).toMatchObject({
      allowedExitCodes: [0, 1],
      command: 'npm run check:crux-credentials',
      exitCode: 1,
    });
    expect(artifact.commands.at(-1)).toMatchObject({
      command: 'npm run test:list',
      exitCode: 0,
    });
  });

  it('does not mask an unexpected command failure', async () => {
    const workspace = await createWorkspace({ failPagesDomain: true });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        CRUX_BLOCKER_REFRESH_ARTIFACT: 'artifacts/manual-evidence/crux-blocker-refresh.json',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.status).toBe(7);
    expect(result.stderr).toContain('pages domain failed');
    const artifact = readJson(join(workspace, 'artifacts/manual-evidence/crux-blocker-refresh.json'));
    expect(artifact.result).toBe('failed');
    expect(artifact.commands.at(-1)).toMatchObject({
      command: 'npm run check:pages-domain',
      exitCode: 7,
    });
  });

  it('marks the artifact failed when post-artifact consistency validation fails', async () => {
    const workspace = await createWorkspace({ failCompletionCheck: true });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        CRUX_BLOCKER_REFRESH_ARTIFACT: 'artifacts/manual-evidence/crux-blocker-refresh.json',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.status).toBe(6);
    expect(result.stderr).toContain('completion evidence failed');
    const artifact = readJson(join(workspace, 'artifacts/manual-evidence/crux-blocker-refresh.json'));
    expect(artifact.result).toBe('failed');
    expect(artifact.commands).toHaveLength(7);
  });
});

async function createWorkspace({ failCompletionCheck = false, failPagesDomain = false } = {}) {
  const workspace = await mkdtemp(join(tmpdir(), 'crux-blocker-refresh-'));
  mkdirSync(join(workspace, 'bin'), { recursive: true });
  mkdirSync(join(workspace, 'artifacts/manual-evidence'), { recursive: true });
  const fakeNpmPath = join(workspace, 'bin/npm');
  writeFileSync(
    fakeNpmPath,
    `#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
appendFileSync('npm-calls.txt', args.join(' ') + '\\n');
const command = args.join(' ');

if (command === 'run check:crux-credentials') {
  process.stdout.write(JSON.stringify({ result: 'missing' }, null, 2) + '\\n');
  process.exit(1);
}
if (command === 'run check:crux-live-probes') {
  process.stdout.write(JSON.stringify({ result: 'blocked', hasFieldData: false }, null, 2) + '\\n');
  process.exit(1);
}
if (command === 'run check:pages-domain') {
  ${failPagesDomain ? "process.stderr.write('pages domain failed\\n'); process.exit(7);" : "process.stdout.write(JSON.stringify({ result: 'passed' }, null, 2) + '\\n'); process.exit(0);"}
}
if (command === 'run check:crux-monitoring') {
  process.stdout.write(JSON.stringify({ result: 'blocked', hasFieldData: false }, null, 2) + '\\n');
  process.exit(1);
}
if (command === 'run update:crux-blocker-issue') {
  process.stdout.write(JSON.stringify({ result: 'already-updated' }, null, 2) + '\\n');
  process.exit(0);
}
if (command === 'run sync:remote-crux-evidence') {
  process.stdout.write(JSON.stringify({ result: 'synced' }, null, 2) + '\\n');
  process.exit(0);
}
if (command === 'run test:list') {
  process.stdout.write(JSON.stringify({ result: 'listed' }, null, 2) + '\\n');
  process.exit(0);
}
if (command === 'run refresh:completion-evidence') {
  const calls = readFileSync('npm-calls.txt', 'utf8').trim().split('\\n');
  const refreshCount = calls.filter((entry) => entry === 'run refresh:completion-evidence').length;
  if (refreshCount === 1 && !existsSync('artifacts/manual-evidence/crux-blocker-refresh.json')) {
    process.stderr.write('post-artifact refresh ran before blocker artifact existed\\n');
    process.exit(8);
  }
  process.stdout.write(JSON.stringify({ result: 'incomplete' }, null, 2) + '\\n');
  process.exit(1);
}
if (command === 'run check:completion-evidence') {
  ${failCompletionCheck ? "process.stderr.write('completion evidence failed\\n'); process.exit(6);" : ''}
  process.stdout.write(JSON.stringify({ result: 'consistent' }, null, 2) + '\\n');
  process.exit(0);
}
process.stderr.write('unexpected npm command: ' + command + '\\n');
process.exit(2);
`,
  );
  chmodSync(fakeNpmPath, 0o755);
  return workspace;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
