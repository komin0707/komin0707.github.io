import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const repo = process.env.CRUX_PAGES_REPO ?? 'komin0707/komin0707.github.io';
const workflow = process.env.CRUX_WORKFLOW_NAME ?? 'CrUX Monitoring';
const artifactName = process.env.CRUX_ARTIFACT_NAME ?? 'chrome-ux-report-monitoring';
const issueNumber = process.env.CRUX_BLOCKER_ISSUE ?? '1';
const evidenceDirectory = process.env.CRUX_REMOTE_EVIDENCE_DIR ?? 'artifacts/manual-evidence';

const latestRun = readJsonCommand('gh', [
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

if (!latestRun?.databaseId) {
  throw new Error(`No ${workflow} run found in ${repo}`);
}

const runDirectory = `${evidenceDirectory}/crux-monitoring-run-${String(latestRun.databaseId)}`;
mkdirSync(runDirectory, { recursive: true });

const run = readJsonCommand('gh', [
  'run',
  'view',
  String(latestRun.databaseId),
  '--repo',
  repo,
  '--json',
  'databaseId,status,conclusion,headSha,createdAt,url,jobs',
]);
await writeJson(`${runDirectory}/run.json`, run);

const failedLog = runCommand('gh', [
  'run',
  'view',
  String(latestRun.databaseId),
  '--repo',
  repo,
  '--log-failed',
]);
writeFileSync(`${runDirectory}/failed.log`, failedLog.stdout);

removeExistingArtifactFiles(runDirectory, artifactName);

runCommand('gh', [
  'run',
  'download',
  String(latestRun.databaseId),
  '--repo',
  repo,
  '--name',
  artifactName,
  '--dir',
  runDirectory,
]);

const issue = readJsonCommand('gh', [
  'issue',
  'view',
  issueNumber,
  '--repo',
  repo,
  '--json',
  'url,state,title,body,comments,updatedAt',
]);
await writeJson(`${runDirectory}/issue.json`, issue);

const pagesDomainArtifactPath = `${runDirectory}/github-pages-domain.json`;

process.stdout.write(
  `${JSON.stringify(
    {
      artifactName,
      hasPagesDomainArtifact: existsSync(pagesDomainArtifactPath),
      issueCommentCount: Array.isArray(issue.comments) ? issue.comments.length : 0,
      issueUpdatedAt: issue.updatedAt ?? null,
      pagesDomainArtifact: pagesDomainArtifactPath,
      runDirectory,
      runId: latestRun.databaseId,
      runConclusion: latestRun.conclusion,
      runStatus: latestRun.status,
    },
    null,
    2,
  )}\n`,
);

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

function removeExistingArtifactFiles(directory, artifact) {
  const artifactFiles = [
    `${directory}/${artifact}.json`,
    `${directory}/github-pages-domain.json`,
    `${directory}/chrome-ux-report-monitoring.json`,
    `${directory}/chrome-ux-report-credentials.json`,
    `${directory}/crux-live-probe.json`,
    `${directory}/pagespeed-live-probe.json`,
    `${directory}/chrome-ux-report.json`,
  ];

  for (const path of new Set(artifactFiles)) {
    if (existsSync(path)) {
      unlinkSync(path);
    }
  }
}

async function writeJson(path, value) {
  writeFileSync(
    path,
    await format(JSON.stringify(value), { ...((await resolveConfig(path)) ?? {}), parser: 'json' }),
  );
}
