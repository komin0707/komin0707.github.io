import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname } from 'node:path';
import process from 'node:process';
import { acceptedCruxKeyNames, resolveCruxApiKey, summarizeCruxEnvFiles } from './crux-env.mjs';

const acceptedKeyNames = acceptedCruxKeyNames;
const repo = process.env.CRUX_GITHUB_REPO ?? 'komin0707/komin0707.github.io';
const artifactPath =
  process.env.CRUX_CREDENTIALS_ARTIFACT ?? 'artifacts/manual-evidence/chrome-ux-report-credentials.json';

const environment = Object.fromEntries(acceptedKeyNames.map((name) => [name, Boolean(process.env[name])]));
const localEnvFiles = summarizeCruxEnvFiles();
const apiKeyResolution = resolveCruxApiKey();
const keychain = checkMacosKeychain();
const googleApplicationDefaultCredentials = checkGoogleApplicationDefaultCredentials();
const gcloud = checkGcloud();
const secrets = listGitHubNames('secret');
const variables = listGitHubNames('variable');

const artifact = {
  verifiedAt: new Date().toISOString(),
  verifier: 'Codex CrUX credential preflight',
  result: hasUsableCredential(apiKeyResolution, secrets.names) ? 'present' : 'missing',
  evidence:
    'Checked accepted CrUX/PageSpeed credential names in sources consumed by the monitor and inspected adjacent credential surfaces without exposing secret values.',
  acceptedKeyNames,
  usableByCurrentMonitor: {
    envFileNames:
      apiKeyResolution.source === 'env-file' && apiKeyResolution.name ? [apiKeyResolution.name] : [],
    localEnvironmentNames: acceptedKeyNames.filter((name) => environment[name]),
    githubSecretNames: acceptedKeyNames.filter((name) => secrets.names.includes(name)),
  },
  monitorApiKeySource: {
    name: apiKeyResolution.name,
    path: apiKeyResolution.path ?? null,
    source: apiKeyResolution.source,
  },
  informationalOnly: [
    'Local env files are consumed by local monitor runs when they contain an accepted key name. macOS Keychain, Google ADC, gcloud, and GitHub repository variables are recorded for troubleshooting but are not consumed by the current CrUX monitor unless exported to an accepted environment variable or configured as a GitHub Actions secret.',
  ],
  localEnvironment: environment,
  localEnvFiles,
  macosKeychain: keychain,
  googleApplicationDefaultCredentials,
  gcloud,
  githubRepository: repo,
  githubSecrets: secrets,
  githubVariables: variables,
  requiredToComplete: [
    'Configure one of CRUX_API_KEY, PAGESPEED_API_KEY, or GOOGLE_API_KEY with Chrome UX Report/PageSpeed quota.',
    'Rerun npm run check:crux-monitoring after the production origin has available field data.',
  ],
};

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ artifactPath, repo, result: artifact.result }, null, 2)}\n`);

if (artifact.result !== 'present') {
  process.exitCode = 1;
}

function listGitHubNames(kind) {
  const command = kind === 'secret' ? 'secret' : 'variable';
  try {
    const output = execFileSync('gh', [command, 'list', '--repo', repo, '--json', 'name,updatedAt'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const rows = JSON.parse(output);
    const names = Array.isArray(rows)
      ? rows.map((row) => row.name).filter((name) => typeof name === 'string')
      : [];
    return {
      acceptedPresent: acceptedKeyNames.filter((name) => names.includes(name)),
      checked: true,
      count: names.length,
      names,
    };
  } catch (error) {
    return {
      acceptedPresent: [],
      checked: false,
      count: null,
      error: error instanceof Error ? error.message : String(error),
      names: [],
    };
  }
}

function checkMacosKeychain() {
  if (process.platform !== 'darwin') {
    return {
      acceptedPresent: [],
      checked: false,
      reason: 'macOS Keychain is only checked on darwin.',
    };
  }

  return {
    acceptedPresent: acceptedKeyNames.filter(hasKeychainGenericPassword),
    checked: true,
  };
}

function hasKeychainGenericPassword(serviceName) {
  try {
    execFileSync('security', ['find-generic-password', '-s', serviceName, '-w'], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function checkGoogleApplicationDefaultCredentials() {
  const path = `${homedir()}/.config/gcloud/application_default_credentials.json`;
  return {
    checked: true,
    path,
    present: existsSync(path),
  };
}

function checkGcloud() {
  try {
    execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], {
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 10_000,
    });
    return {
      applicationDefaultTokenAvailable: true,
      checked: true,
    };
  } catch (error) {
    return {
      applicationDefaultTokenAvailable: false,
      checked: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function hasUsableCredential(apiKeyResolution, secretNames) {
  return apiKeyResolution.source !== 'none' || acceptedKeyNames.some((name) => secretNames.includes(name));
}
