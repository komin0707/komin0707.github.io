import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/check-crux-monitoring.mjs');
const servers = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolveClose, reject) => {
          server.close((error) => (error ? reject(error) : resolveClose()));
        }),
    ),
  );
});

describe('CrUX monitoring verifier', () => {
  it('removes stale canonical CrUX evidence when a fresh run has no field data', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'crux-monitoring-'));
    const server = await startFixtureServer({ hasFieldData: false });
    const origin = `http://127.0.0.1:${String(server.address().port)}`;
    const canonicalPath = join(workspace, 'artifacts/manual-evidence/chrome-ux-report.json');
    mkdirSync(join(workspace, 'artifacts/manual-evidence'), { recursive: true });
    writeFileSync(canonicalPath, '{"result":"passed","fieldDataAvailable":true}\n');

    const result = await runScript(workspace, monitoringEnv(origin));

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(existsSync(canonicalPath)).toBe(false);

    const stdout = JSON.parse(result.stdout);
    expect(stdout).toMatchObject({
      canonicalEvidencePath: null,
      hasFieldData: false,
      origin,
      result: 'blocked',
    });

    const artifact = readJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report-monitoring.json'));
    expect(artifact).toMatchObject({
      fieldDataAvailable: false,
      result: 'blocked',
      staleCanonicalEvidenceRemoved: true,
    });
  });

  it('writes canonical CrUX evidence when PageSpeed field data is available', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'crux-monitoring-'));
    const server = await startFixtureServer({ hasFieldData: true });
    const origin = `http://127.0.0.1:${String(server.address().port)}`;

    const result = await runScript(workspace, monitoringEnv(origin));

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      canonicalEvidencePath: 'artifacts/manual-evidence/chrome-ux-report.json',
      hasFieldData: true,
      origin,
      result: 'passed',
    });

    const canonical = readJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report.json'));
    expect(canonical).toMatchObject({
      fieldDataAvailable: true,
      result: 'passed',
      staleCanonicalEvidenceRemoved: false,
    });
  });

  it('uses an accepted local env-file API key without writing the value to artifacts', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'crux-monitoring-'));
    const server = await startFixtureServer({
      expectedApiKey: 'secret-value-that-must-not-leak',
      hasFieldData: true,
    });
    const origin = `http://127.0.0.1:${String(server.address().port)}`;
    writeFileSync(join(workspace, '.env'), 'PAGESPEED_API_KEY=secret-value-that-must-not-leak\n');

    const result = await runScript(workspace, monitoringEnv(origin));

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('secret-value-that-must-not-leak');

    const artifactText = readFileSync(
      join(workspace, 'artifacts/manual-evidence/chrome-ux-report-monitoring.json'),
      'utf8',
    );
    expect(artifactText).not.toContain('secret-value-that-must-not-leak');
    expect(JSON.parse(artifactText)).toMatchObject({
      apiKeySource: {
        name: 'PAGESPEED_API_KEY',
        path: '.env',
        source: 'env-file',
      },
      checks: {
        pageSpeed: {
          hasApiKey: true,
          status: 200,
        },
      },
      fieldDataAvailable: true,
      result: 'passed',
    });
  });
});

async function runScript(workspace, env) {
  return await new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: workspace,
      env,
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => {
      resolveRun({ status, stderr, stdout });
    });
  });
}

function monitoringEnv(origin) {
  return {
    ...process.env,
    CRUX_API_ENDPOINT: `${origin}/crux`,
    CRUX_CACHE_BASE_URL: `${origin}/`,
    CRUX_ORIGIN: origin,
    CRUX_REQUEST_TIMEOUT_MS: '5000',
    PAGESPEED_API_ENDPOINT: `${origin}/pagespeed`,
  };
}

async function startFixtureServer({ expectedApiKey = '', hasFieldData }) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const origin = `http://127.0.0.1:${String(server.address().port)}`;

    if (url.pathname === '/') {
      writeHtml(
        response,
        `<html><head><link rel="canonical" href="${origin}/" /></head><body></body></html>`,
      );
      return;
    }
    if (url.pathname === '/robots.txt') {
      writeText(response, `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
      return;
    }
    if (url.pathname === '/sitemap.xml') {
      writeXml(response, `<urlset><url><loc>${origin}/</loc></url></urlset>`);
      return;
    }
    if (url.pathname === '/crux') {
      writeJson(response, {});
      return;
    }
    if (url.pathname === '/pagespeed') {
      if (expectedApiKey.length > 0 && url.searchParams.get('key') !== expectedApiKey) {
        writeJson(response, {
          error: { code: 403, message: 'missing test key', status: 'PERMISSION_DENIED' },
        });
        return;
      }
      writeJson(
        response,
        hasFieldData
          ? {
              loadingExperience: {
                metrics: {
                  LARGEST_CONTENTFUL_PAINT_MS: { percentile: 1200 },
                },
                overall_category: 'FAST',
              },
            }
          : {},
      );
      return;
    }
    if (url.pathname === '/data/datasets.json') {
      writeJson(response, { datasets: ['global'] });
      return;
    }
    if (url.pathname === '/data/global/manifest.json') {
      writeJson(response, {
        months: {
          202603: {
            chunks: [],
            origins: 0,
            total_chunks: 0,
          },
        },
        summary: { latest_month: '202603' },
      });
      return;
    }

    response.writeHead(404);
    response.end('not found');
  });

  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  servers.push(server);
  return server;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeHtml(response, body) {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(body);
}

function writeJson(response, body) {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

function writeText(response, body) {
  response.writeHead(200, { 'content-type': 'text/plain' });
  response.end(body);
}

function writeXml(response, body) {
  response.writeHead(200, { 'content-type': 'application/xml' });
  response.end(body);
}
