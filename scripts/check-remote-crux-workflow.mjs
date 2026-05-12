import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';

const repo = process.env.CRUX_PAGES_REPO ?? 'komin0707/komin0707.github.io';
const ref = process.env.CRUX_PAGES_REF ?? 'main';
const artifactPath =
  process.env.CRUX_REMOTE_WORKFLOW_ARTIFACT ?? 'artifacts/manual-evidence/remote-crux-workflow-drift.json';

const mirroredFiles = [
  ['scripts/check-pages-domain.mjs', '.github/scripts/check-pages-domain.mjs'],
  ['scripts/crux-env.mjs', '.github/scripts/crux-env.mjs'],
  ['scripts/check-crux-credentials.mjs', '.github/scripts/check-crux-credentials.mjs'],
  ['scripts/check-crux-monitoring.mjs', '.github/scripts/check-crux-monitoring.mjs'],
  ['scripts/check-crux-live-probes.mjs', '.github/scripts/check-crux-live-probes.mjs'],
];

const workflowPath = '.github/workflows/crux-monitoring.yml';
const workflowRequiredMarkers = [
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

const fileResults = mirroredFiles.map(([localPath, remotePath]) =>
  compareMirroredFile(localPath, remotePath),
);
const workflow = fetchRemoteFile(workflowPath);
const missingWorkflowMarkers = workflowRequiredMarkers.filter((marker) => !workflow.content.includes(marker));
const result =
  fileResults.every((file) => file.matches) && missingWorkflowMarkers.length === 0 ? 'passed' : 'failed';

const artifact = {
  verifiedAt: new Date().toISOString(),
  verifier: 'Codex remote CrUX workflow drift verifier',
  result,
  repository: repo,
  ref,
  mirroredFiles: fileResults,
  workflow: {
    path: workflowPath,
    remoteSha: workflow.sha,
    requiredMarkers: workflowRequiredMarkers,
    missingMarkers: missingWorkflowMarkers,
  },
  requiredToComplete:
    result === 'passed'
      ? []
      : [
          'Copy the local CrUX monitoring scripts into the GitHub Pages repository .github/scripts directory.',
          'Update .github/workflows/crux-monitoring.yml in the GitHub Pages repository so it emits the expected evidence fields.',
        ],
};

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
process.stdout.write(
  `${JSON.stringify(
    {
      artifactPath,
      mismatchedFiles: fileResults.filter((file) => !file.matches).map((file) => file.remotePath),
      missingWorkflowMarkers,
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

function compareMirroredFile(localPath, remotePath) {
  const remote = fetchRemoteFile(remotePath);
  const localContent = readFileSync(localPath, 'utf8');
  return {
    localPath,
    matches: localContent === remote.content,
    remotePath,
    remoteSha: remote.sha,
  };
}

function fetchRemoteFile(path) {
  const output = runCommand('gh', ['api', '-X', 'GET', `repos/${repo}/contents/${path}?ref=${ref}`]).stdout;
  const payload = JSON.parse(output);
  return {
    content: Buffer.from(payload.content, 'base64').toString('utf8'),
    sha: payload.sha ?? null,
  };
}

function runCommand(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(' ')} exited ${String(result.status ?? 1)}`);
  }
  return result;
}
