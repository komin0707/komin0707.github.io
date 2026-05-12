import { execFileSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';

const repo = process.env.PAGES_REPO ?? 'komin0707/komin0707.github.io';
const expectedOrigin = normalizeOrigin(process.env.PAGES_EXPECTED_ORIGIN ?? 'https://komin0707.github.io');
const artifactPath =
  process.env.PAGES_DOMAIN_ARTIFACT ?? 'artifacts/manual-evidence/github-pages-domain.json';

const pages = readGitHubPages(repo);
const cname = readCname(repo);
const htmlOrigin = pages.html_url ? normalizeOrigin(pages.html_url) : null;
const customDomain = pages.cname ?? cname;
const cnameOrigin = customDomain ? normalizeOrigin(`https://${customDomain}`) : null;
const connectedOrigins = [htmlOrigin, cnameOrigin].filter(Boolean);
const expectedOriginConnected = connectedOrigins.includes(expectedOrigin);
const pagesStatus = pages.status ?? null;

const artifact = {
  verifiedAt: new Date().toISOString(),
  verifier: 'Codex GitHub Pages production domain verifier',
  result: expectedOriginConnected ? 'passed' : 'blocked',
  evidence:
    'Checked the GitHub Pages configured URL and optional CNAME so CrUX monitoring targets the connected production origin.',
  repository: repo,
  expectedOrigin,
  pages: {
    htmlUrl: pages.html_url ?? null,
    htmlOrigin,
    status: pagesStatus,
    httpsEnforced: pages.https_enforced ?? null,
    cname: pages.cname ?? null,
  },
  cnameFile: {
    exists: cname !== null,
    origin: cnameOrigin,
    value: cname,
  },
  connectedOrigins,
  expectedOriginConnected,
  requiredToComplete: expectedOriginConnected
    ? []
    : [
        'Set PAGES_EXPECTED_ORIGIN to the connected GitHub Pages production origin or configure the Pages CNAME before rerunning CrUX monitoring.',
      ],
};

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
process.stdout.write(
  `${JSON.stringify(
    {
      artifactPath,
      connectedOrigins,
      expectedOrigin,
      result: artifact.result,
    },
    null,
    2,
  )}\n`,
);

if (artifact.result !== 'passed') {
  process.exitCode = 1;
}

function readGitHubPages(repository) {
  const output = execFileSync('gh', ['api', `repos/${repository}/pages`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}

function readCname(repository) {
  try {
    const output = execFileSync('gh', ['api', `repos/${repository}/contents/CNAME`, '--jq', '.content'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return Buffer.from(output.trim(), 'base64').toString('utf8').trim() || null;
  } catch {
    return null;
  }
}

function normalizeOrigin(value) {
  return new URL(value).origin.toLowerCase();
}
