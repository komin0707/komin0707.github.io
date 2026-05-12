import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/refresh-completion-evidence.mjs');

describe('refresh completion evidence wrapper', () => {
  it('runs the manifest refresh but preserves an incomplete audit exit code', async () => {
    const workspace = await createFixtureWorkspace({
      auditSummary: {
        artifactPath: 'artifacts/completion-audit.json',
        blockerCount: 1,
        status: 'incomplete',
      },
      auditExitCode: 1,
      consistencyExitCode: 0,
      latestRemoteCruxExitCode: 0,
      objectiveStatus: 'not_achieved',
      updateExitCode: 0,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('"status": "incomplete"');
    expect(result.stdout).toContain('"result": "refreshed"');
    expect(result.stdout).toContain('"latestRemoteCrux": "ok"');
    expect(result.stdout).toContain('"summary": "written"');
    expect(result.stdout).toContain('"consistency": "ok"');
    expect(result.stdout).toContain('"objectiveStatus": "not_achieved"');
    expect(readFileSync(join(workspace, 'artifacts/refreshed.txt'), 'utf8')).toBe('yes\nyes\n');
  });

  it('exits zero only when the audit summary is complete and the objective is achieved', async () => {
    const workspace = await createFixtureWorkspace({
      auditSummary: {
        artifactPath: 'artifacts/completion-audit.json',
        blockerCount: 0,
        status: 'complete',
      },
      auditExitCode: 0,
      consistencyExitCode: 0,
      latestRemoteCruxExitCode: 0,
      objectiveStatus: 'achieved',
      updateExitCode: 0,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('"status": "complete"');
    expect(result.stdout).toContain('"objectiveStatus": "achieved"');
    expect(readFileSync(join(workspace, 'artifacts/refreshed.txt'), 'utf8')).toBe('yes\nyes\n');
  });

  it('preserves a failed objective exit code when the audit is complete but claimed rows are not achieved', async () => {
    const workspace = await createFixtureWorkspace({
      auditSummary: {
        artifactPath: 'artifacts/completion-audit.json',
        blockerCount: 0,
        status: 'complete',
      },
      auditExitCode: 0,
      consistencyExitCode: 0,
      latestRemoteCruxExitCode: 0,
      objectiveStatus: 'not_achieved',
      updateExitCode: 0,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('"status": "complete"');
    expect(result.stdout).toContain('"objectiveStatus": "not_achieved"');
  });

  it('does not mask a manifest refresh failure', async () => {
    const workspace = await createFixtureWorkspace({
      auditSummary: {
        artifactPath: 'artifacts/completion-audit.json',
        blockerCount: 1,
        status: 'incomplete',
      },
      auditExitCode: 1,
      consistencyExitCode: 0,
      latestRemoteCruxExitCode: 0,
      objectiveStatus: 'not_achieved',
      updateExitCode: 7,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(7);
    expect(result.stderr).toContain('refresh failed');
  });

  it('does not mask a latest remote CrUX run verifier failure', async () => {
    const workspace = await createFixtureWorkspace({
      auditSummary: {
        artifactPath: 'artifacts/completion-audit.json',
        blockerCount: 1,
        status: 'incomplete',
      },
      auditExitCode: 1,
      consistencyExitCode: 0,
      latestRemoteCruxExitCode: 8,
      objectiveStatus: 'not_achieved',
      updateExitCode: 0,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(8);
    expect(result.stderr).toContain('latest remote CrUX failed');
  });

  it('does not mask a post-refresh consistency failure', async () => {
    const workspace = await createFixtureWorkspace({
      auditSummary: {
        artifactPath: 'artifacts/completion-audit.json',
        blockerCount: 1,
        status: 'incomplete',
      },
      auditExitCode: 1,
      consistencyExitCode: 9,
      latestRemoteCruxExitCode: 0,
      objectiveStatus: 'not_achieved',
      updateExitCode: 0,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
    });

    expect(result.status).toBe(9);
    expect(result.stderr).toContain('consistency failed');
  });
});

async function createFixtureWorkspace({
  auditExitCode,
  auditSummary,
  consistencyExitCode,
  latestRemoteCruxExitCode,
  objectiveStatus,
  updateExitCode,
}) {
  const workspace = await mkdtemp(join(tmpdir(), 'refresh-completion-evidence-'));
  mkdirSync(join(workspace, 'artifacts'), { recursive: true });
  mkdirSync(join(workspace, 'scripts'), { recursive: true });

  writeFileSync(
    join(workspace, 'scripts/assert-completion-audit.mjs'),
    `import process from 'node:process';
process.stdout.write(${JSON.stringify(`${JSON.stringify(auditSummary, null, 2)}\n`)});
process.exit(${String(auditExitCode)});
`,
  );
  writeFileSync(
    join(workspace, 'scripts/update-completion-evidence-manifests.mjs'),
    `import { appendFileSync } from 'node:fs';
import process from 'node:process';
appendFileSync('artifacts/refreshed.txt', 'yes\\n');
if (${JSON.stringify(updateExitCode === 0)}) {
  await import('node:fs').then(({ writeFileSync }) => writeFileSync('artifacts/completion-evidence-index.json', ${JSON.stringify(
    `${JSON.stringify({ objective: { status: objectiveStatus } }, null, 2)}\n`,
  )}));
}
process.stdout.write(${JSON.stringify(`${JSON.stringify({ result: 'refreshed' }, null, 2)}\n`)});
${updateExitCode === 0 ? '' : "process.stderr.write('refresh failed\\n');"}
process.exit(${String(updateExitCode)});
`,
  );
  writeFileSync(
    join(workspace, 'scripts/check-latest-remote-crux-run.mjs'),
    `import process from 'node:process';
process.stdout.write(${JSON.stringify(`${JSON.stringify({ latestRemoteCrux: 'ok' }, null, 2)}\n`)});
${latestRemoteCruxExitCode === 0 ? '' : "process.stderr.write('latest remote CrUX failed\\n');"}
process.exit(${String(latestRemoteCruxExitCode)});
`,
  );
  writeFileSync(
    join(workspace, 'scripts/write-final-blocker-summary.mjs'),
    `import process from 'node:process';
process.stdout.write(${JSON.stringify(`${JSON.stringify({ summary: 'written' }, null, 2)}\n`)});
process.exit(0);
`,
  );
  writeFileSync(
    join(workspace, 'scripts/assert-completion-consistency.mjs'),
    `import process from 'node:process';
process.stdout.write(${JSON.stringify(`${JSON.stringify({ consistency: 'ok' }, null, 2)}\n`)});
${consistencyExitCode === 0 ? '' : "process.stderr.write('consistency failed\\n');"}
process.exit(${String(consistencyExitCode)});
`,
  );

  return workspace;
}
