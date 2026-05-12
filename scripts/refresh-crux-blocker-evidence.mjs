import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const artifactPath =
  process.env.CRUX_BLOCKER_REFRESH_ARTIFACT ?? 'artifacts/manual-evidence/crux-blocker-refresh.json';
const commands = [
  command('npm run check:crux-credentials', ['npm', ['run', 'check:crux-credentials']], [0, 1]),
  command('npm run check:crux-live-probes', ['npm', ['run', 'check:crux-live-probes']], [0, 1]),
  command('npm run check:pages-domain', ['npm', ['run', 'check:pages-domain']], [0]),
  command(
    'CRUX_CACHE_SCAN=1 npm run check:crux-monitoring',
    ['npm', ['run', 'check:crux-monitoring']],
    [0, 1],
    {
      CRUX_CACHE_SCAN: '1',
    },
  ),
  command('npm run update:crux-blocker-issue', ['npm', ['run', 'update:crux-blocker-issue']], [0]),
  command('npm run sync:remote-crux-evidence', ['npm', ['run', 'sync:remote-crux-evidence']], [0]),
  command('npm run test:list', ['npm', ['run', 'test:list']], [0]),
];
const results = [];

for (const entry of commands) {
  const result = runCommand(entry);
  results.push(result);
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (!entry.allowedExitCodes.includes(result.exitCode)) {
    await writeArtifact('failed');
    process.exit(result.exitCode || 1);
  }
}

const monitoring = parseLastJson(
  results.find((result) => result.command === 'CRUX_CACHE_SCAN=1 npm run check:crux-monitoring')?.stdout ??
    '',
);
const result = monitoring?.hasFieldData === true ? 'field-data-found' : 'blocked';
await writeArtifact(result);

const postArtifactCompletionRefresh = runCommand(
  command('npm run refresh:completion-evidence', ['npm', ['run', 'refresh:completion-evidence']], [0, 1]),
);
process.stdout.write(postArtifactCompletionRefresh.stdout);
process.stderr.write(postArtifactCompletionRefresh.stderr);
if (!postArtifactCompletionRefresh.allowedExitCodes.includes(postArtifactCompletionRefresh.exitCode)) {
  await writeArtifact('failed');
  process.exit(postArtifactCompletionRefresh.exitCode || 1);
}

const postArtifactCompletionCheck = runCommand(
  command('npm run check:completion-evidence', ['npm', ['run', 'check:completion-evidence']], [0]),
);
process.stdout.write(postArtifactCompletionCheck.stdout);
process.stderr.write(postArtifactCompletionCheck.stderr);
if (!postArtifactCompletionCheck.allowedExitCodes.includes(postArtifactCompletionCheck.exitCode)) {
  await writeArtifact('failed');
  process.exit(postArtifactCompletionCheck.exitCode || 1);
}

process.exit(postArtifactCompletionCheck.exitCode === 0 ? 0 : 1);

function command(id, invocation, allowedExitCodes, extraEnv = {}) {
  const [executable, args] = invocation;
  return {
    allowedExitCodes,
    args,
    executable,
    extraEnv,
    id,
  };
}

function runCommand(entry) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(entry.executable, entry.args, {
    encoding: 'utf8',
    env: { ...process.env, ...entry.extraEnv },
  });
  return {
    allowedExitCodes: entry.allowedExitCodes,
    command: entry.id,
    exitCode: result.status ?? 1,
    finishedAt: new Date().toISOString(),
    signal: result.signal,
    startedAt,
    stderr: truncate(result.stderr),
    stdout: truncate(result.stdout),
  };
}

async function writeArtifact(result) {
  const artifact = {
    commands: results,
    result,
    verifiedAt: new Date().toISOString(),
  };
  mkdirSync(dirname(artifactPath), { recursive: true });
  writeFileSync(
    artifactPath,
    await format(JSON.stringify(artifact), {
      ...((await resolveConfig(artifactPath)) ?? {}),
      parser: 'json',
    }),
  );
  process.stdout.write(
    `${JSON.stringify(
      {
        artifactPath,
        result,
        verifiedAt: artifact.verifiedAt,
      },
      null,
      2,
    )}\n`,
  );
}

function parseLastJson(value) {
  const matches = [...value.matchAll(/\{[\s\S]*?\n\}/g)];
  for (const match of matches.reverse()) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // Continue looking for the last parseable JSON object in mixed command output.
    }
  }
  return null;
}

function truncate(value) {
  return value.length > 4000 ? `${value.slice(0, 4000)}...` : value;
}
