import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/check-pages-domain.mjs');

describe('GitHub Pages production domain verifier', () => {
  it('records the connected GitHub Pages origin when no CNAME is configured', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'pages-domain-'));
    const bin = join(workspace, 'bin');
    mkdirSync(bin, { recursive: true });
    writeFakeGh(bin, {
      pages: {
        html_url: 'https://komin0707.github.io/',
        status: 'built',
        https_enforced: true,
        cname: null,
      },
      cnameStatus: 404,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}${delimiter}${process.env.PATH}`,
        PAGES_EXPECTED_ORIGIN: 'https://komin0707.github.io',
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      connectedOrigins: ['https://komin0707.github.io'],
      result: 'passed',
    });

    const artifact = JSON.parse(
      readFileSync(join(workspace, 'artifacts/manual-evidence/github-pages-domain.json'), 'utf8'),
    );
    expect(artifact).toMatchObject({
      expectedOrigin: 'https://komin0707.github.io',
      expectedOriginConnected: true,
      result: 'passed',
      cnameFile: {
        exists: false,
        value: null,
      },
      pages: {
        htmlOrigin: 'https://komin0707.github.io',
        status: 'built',
      },
    });
  });

  it('blocks when the expected origin is not connected to GitHub Pages', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'pages-domain-blocked-'));
    const bin = join(workspace, 'bin');
    mkdirSync(bin, { recursive: true });
    writeFakeGh(bin, {
      pages: {
        html_url: 'https://komin0707.github.io/',
        status: 'built',
        https_enforced: true,
        cname: null,
      },
      cnameStatus: 404,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}${delimiter}${process.env.PATH}`,
        PAGES_EXPECTED_ORIGIN: 'https://example.com',
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      connectedOrigins: ['https://komin0707.github.io'],
      expectedOrigin: 'https://example.com',
      result: 'blocked',
    });
  });

  it('passes when the expected origin is connected while Pages is rebuilding', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'pages-domain-building-'));
    const bin = join(workspace, 'bin');
    mkdirSync(bin, { recursive: true });
    writeFakeGh(bin, {
      pages: {
        html_url: 'https://komin0707.github.io/',
        status: 'building',
        https_enforced: true,
        cname: null,
      },
      cnameStatus: 404,
    });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}${delimiter}${process.env.PATH}`,
        PAGES_EXPECTED_ORIGIN: 'https://komin0707.github.io',
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const artifact = JSON.parse(
      readFileSync(join(workspace, 'artifacts/manual-evidence/github-pages-domain.json'), 'utf8'),
    );
    expect(artifact).toMatchObject({
      expectedOriginConnected: true,
      pages: {
        status: 'building',
      },
      result: 'passed',
    });
  });
});

function writeFakeGh(bin, { cnameStatus, pages }) {
  writeFileSync(
    join(bin, 'gh'),
    `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'api' && args[1] === 'repos/komin0707/komin0707.github.io/pages') {
  process.stdout.write(${JSON.stringify(`${JSON.stringify(pages)}\n`)});
  process.exit(0);
}
if (args[0] === 'api' && args[1] === 'repos/komin0707/komin0707.github.io/contents/CNAME') {
  process.exit(${String(cnameStatus)});
}
process.stderr.write('unexpected gh args: ' + args.join(' ') + '\\n');
process.exit(2);
`,
    { mode: 0o755 },
  );
}
