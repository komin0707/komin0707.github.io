import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const repo = process.env.CRUX_PAGES_REPO ?? 'komin0707/komin0707.github.io';
const issueNumber = process.env.CRUX_BLOCKER_ISSUE ?? '1';
const monitoringPath =
  process.env.CRUX_MONITORING_ARTIFACT ?? 'artifacts/manual-evidence/chrome-ux-report-monitoring.json';
const credentialsPath =
  process.env.CRUX_CREDENTIALS_ARTIFACT ?? 'artifacts/manual-evidence/chrome-ux-report-credentials.json';
const cruxLiveProbePath =
  process.env.CRUX_LIVE_PROBE_ARTIFACT ?? 'artifacts/manual-evidence/crux-live-probe.json';
const pagespeedLiveProbePath =
  process.env.PAGESPEED_LIVE_PROBE_ARTIFACT ?? 'artifacts/manual-evidence/pagespeed-live-probe.json';
const pagesDomainPath =
  process.env.PAGES_DOMAIN_ARTIFACT ?? 'artifacts/manual-evidence/github-pages-domain.json';
const canonicalCruxPath =
  process.env.CRUX_CANONICAL_EVIDENCE_ARTIFACT ?? 'artifacts/manual-evidence/chrome-ux-report.json';

const monitoring = readRequiredJson(monitoringPath);
const credentials = readRequiredJson(credentialsPath);
const cruxLiveProbe = readOptionalJson(cruxLiveProbePath);
const pagespeedLiveProbe = readOptionalJson(pagespeedLiveProbePath);
const pagesDomain = readOptionalJson(pagesDomainPath);
const issue = readJsonCommand('gh', [
  'issue',
  'view',
  issueNumber,
  '--repo',
  repo,
  '--json',
  'url,state,title,body,comments,updatedAt',
]);
const existingComments = Array.isArray(issue.comments) ? issue.comments : [];
const body = buildCommentBody();
const requiredCommentMarkers = [
  String(monitoring.verifiedAt ?? ''),
  'Credential preflight non-accepted local credential names:',
];
const alreadyPosted = existingComments.some((comment) => {
  const commentBody = String(comment.body ?? '');
  return requiredCommentMarkers.every((marker) => commentBody.includes(marker));
});

if (!alreadyPosted) {
  runCommand('gh', ['issue', 'comment', issueNumber, '--repo', repo, '--body', body]);
}

process.stdout.write(
  `${JSON.stringify(
    {
      canonicalEvidenceExists: existsSync(canonicalCruxPath),
      commentPosted: !alreadyPosted,
      issue: issue.url ?? null,
      latestLocalMonitoringVerifiedAt: monitoring.verifiedAt ?? null,
      result: alreadyPosted ? 'already-updated' : 'posted',
    },
    null,
    2,
  )}\n`,
);

function buildCommentBody() {
  const directProbeResult =
    cruxLiveProbe && pagespeedLiveProbe
      ? `CrUX records ${formatNamedProbeRecord(cruxLiveProbe, 'origin')}/${formatNamedProbeRecord(
          cruxLiveProbe,
          'url',
        )}; PageSpeed loadingExperience ${
          pagespeedLiveProbe.hasLoadingExperience === true ? 'present' : 'absent'
        }/${pagespeedLiveProbe.hasOriginLoadingExperience === true ? 'present' : 'absent'}`
      : 'Direct probe artifact not available';
  const pagesDomainResult = pagesDomain?.result ?? 'unknown';

  return [
    'Local credential preflight update.',
    '',
    `Fresh local monitoring artifact: \`${monitoringPath}\``,
    `Fresh local monitoring verifiedAt: \`${monitoring.verifiedAt ?? 'unknown'}\``,
    `Result: \`${monitoring.result ?? 'unknown'}\``,
    `Field data available: \`${String(monitoring.fieldDataAvailable === true)}\``,
    `Credential preflight result: \`${credentials.result ?? 'unknown'}\``,
    `Credential preflight monitor key source: \`${credentials.monitorApiKeySource?.source ?? 'unknown'}\``,
    `Credential preflight non-accepted local credential names: \`${formatNonAcceptedCredentialNames(
      credentials.nonAcceptedCredentialNames,
    )}\``,
    `Direct CrUX/PageSpeed field-data probe result: \`${directProbeResult}\``,
    `Pages domain result: \`${pagesDomainResult}\``,
    '',
    `Item 874 remains ${
      monitoring.fieldDataAvailable === true ? 'ready for canonical evidence review' : 'blocked'
    } until a usable CrUX/PageSpeed API key with quota and real field data for \`${
      monitoring.origin ?? 'https://komin0707.github.io'
    }\` is available.`,
    'Next evidence refresh command: `npm run refresh:crux-blocker-evidence`.',
    `Do not create \`${canonicalCruxPath}\` or check item 874 until that field-data evidence exists.`,
  ].join('\n');
}

function formatNonAcceptedCredentialNames(value) {
  if (!value?.checked) return 'unchecked';
  const envFileNames = Array.isArray(value.envFileNames)
    ? value.envFileNames.flatMap((entry) => (Array.isArray(entry.names) ? entry.names : []))
    : [];
  const localEnvironmentNames = Array.isArray(value.localEnvironmentNames) ? value.localEnvironmentNames : [];
  const names = [...new Set([...envFileNames, ...localEnvironmentNames])].sort();
  return names.length > 0 ? names.join(', ') : 'none';
}

function formatNamedProbeRecord(probe, name) {
  const entry = Array.isArray(probe.probes)
    ? probe.probes.find((candidate) => candidate?.name === name)
    : null;
  return entry?.recordPresent === true ? 'present' : 'absent';
}

function readRequiredJson(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required CrUX blocker artifact: ${path}`);
  }
  return readOptionalJson(path);
}

function readOptionalJson(path) {
  if (!existsSync(path)) return null;
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
