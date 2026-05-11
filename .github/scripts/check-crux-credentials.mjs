import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';

const acceptedKeyNames = ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'];
const artifactPath = 'artifacts/manual-evidence/chrome-ux-report-credentials.json';
const environment = Object.fromEntries(acceptedKeyNames.map((name) => [name, Boolean(process.env[name])]));
const localEnvironmentNames = acceptedKeyNames.filter((name) => environment[name]);

const artifact = {
  verifiedAt: new Date().toISOString(),
  verifier: 'GitHub Pages CrUX credential preflight',
  result: localEnvironmentNames.length > 0 ? 'present' : 'missing',
  evidence:
    'Checked accepted CrUX/PageSpeed credential names passed into the GitHub Actions environment without exposing secret values.',
  acceptedKeyNames,
  usableByCurrentMonitor: {
    localEnvironmentNames,
    githubSecretNames: localEnvironmentNames,
  },
  localEnvironment: environment,
  informationalOnly: [
    'GitHub Actions secrets are exposed to this workflow only as environment variables; this artifact records names and booleans, never values.',
  ],
  requiredToComplete: [
    'Configure one of CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY with Chrome UX Report/PageSpeed quota.',
    'Rerun the CrUX Monitoring workflow after the production origin has available field data.',
  ],
};

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(artifactPath, JSON.stringify(artifact, null, 2) + '\n');
process.stdout.write(JSON.stringify({ artifactPath, result: artifact.result }, null, 2) + '\n');

if (artifact.result !== 'present') {
  process.exitCode = 1;
}
