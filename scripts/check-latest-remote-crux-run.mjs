import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const repo = process.env.CRUX_PAGES_REPO ?? 'komin0707/komin0707.github.io';
const workflow = process.env.CRUX_WORKFLOW_NAME ?? 'CrUX Monitoring';
const indexPath = process.env.CRUX_COMPLETION_INDEX ?? 'artifacts/completion-evidence-index.json';
const artifactPath =
  process.env.CRUX_LATEST_REMOTE_RUN_ARTIFACT ?? 'artifacts/manual-evidence/remote-crux-latest-run.json';

const index = readJson(indexPath);
const latestRemoteRun = readJsonCommand('gh', [
  'run',
  'list',
  '--repo',
  repo,
  '--workflow',
  workflow,
  '--limit',
  '1',
  '--json',
  'databaseId,status,conclusion,headSha,createdAt,url',
])[0];

if (!latestRemoteRun?.databaseId) {
  throw new Error(`No ${workflow} run found in ${repo}`);
}

const indexedRunId = index.remoteCruxEvidence?.latestRunId ?? null;
const indexedWorkflowCommit = index.remoteCruxEvidence?.latestWorkflowCommit ?? null;
const indexedArtifact = index.remoteCruxEvidence?.latestMonitoringArtifact ?? null;
const indexedArtifactExists = typeof indexedArtifact === 'string' && existsSync(indexedArtifact);
const indexedArtifactMatchesRun =
  typeof indexedArtifact === 'string' &&
  indexedArtifact.includes(`/crux-monitoring-run-${String(latestRemoteRun.databaseId)}/`);
const workflowCommitMatches = indexedWorkflowCommit === latestRemoteRun.headSha;
const result =
  indexedRunId === latestRemoteRun.databaseId &&
  indexedArtifactExists &&
  indexedArtifactMatchesRun &&
  workflowCommitMatches
    ? 'passed'
    : 'failed';

const artifact = {
  verifiedAt: new Date().toISOString(),
  verifier: 'Codex latest remote CrUX run verifier',
  result,
  repository: repo,
  workflow,
  latestRemoteRun,
  indexedRun: {
    artifact: indexedArtifact,
    artifactExists: indexedArtifactExists,
    artifactMatchesRun: indexedArtifactMatchesRun,
    conclusion: index.remoteCruxEvidence?.latestRunConclusion ?? null,
    headSha: indexedWorkflowCommit,
    headShaMatchesLatest: workflowCommitMatches,
    runId: indexedRunId,
    url: latestRemoteRun.databaseId === indexedRunId ? latestRemoteRun.url : null,
  },
  requiredToComplete:
    result === 'passed'
      ? []
      : [
          'Run npm run refresh:crux-blocker-evidence to download the latest CrUX Monitoring run artifacts and refresh completion evidence.',
        ],
};

await writeJson(artifactPath, artifact);

process.stdout.write(
  `${JSON.stringify(
    {
      artifactPath,
      indexedArtifactExists,
      indexedArtifactMatchesRun,
      indexedWorkflowCommit,
      indexedRunId,
      latestRemoteHeadSha: latestRemoteRun.headSha,
      latestRemoteRunId: latestRemoteRun.databaseId,
      repo,
      result,
    },
    null,
    2,
  )}\n`,
);

if (result !== 'passed') {
  process.exitCode = 1;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readJsonCommand(command, args) {
  return JSON.parse(runCommand(command, args).stdout);
}

function runCommand(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(' ')} exited ${String(result.status ?? 1)}`);
  }
  return result;
}

async function writeJson(path, value) {
  writeFileSync(
    path,
    await format(JSON.stringify(value), { ...((await resolveConfig(path)) ?? {}), parser: 'json' }),
  );
}
