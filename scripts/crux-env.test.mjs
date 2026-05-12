import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveCruxApiKey, summarizeCruxEnvFiles } from './crux-env.mjs';

describe('CrUX environment helpers', () => {
  it('prefers exported environment keys over local env-file keys', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'crux-env-'));
    writeFileSync(join(workspace, '.env.local'), 'CRUX_API_KEY=env-file-value\n');

    const result = resolveCruxApiKey({
      cwd: workspace,
      env: {
        PAGESPEED_API_KEY: 'process-value',
      },
    });

    expect(result).toEqual({
      key: 'process-value',
      name: 'PAGESPEED_API_KEY',
      source: 'process',
    });
  });

  it('reads accepted local env-file names without reading .env.example placeholders', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'crux-env-'));
    writeFileSync(join(workspace, '.env.example'), 'CRUX_API_KEY=documentation-only\n');
    writeFileSync(
      join(workspace, '.env'),
      '# PAGESPEED_API_KEY=commented-out\nGOOGLE_API_KEY="env-file-value"\n',
    );

    expect(resolveCruxApiKey({ cwd: workspace, env: {} })).toEqual({
      key: 'env-file-value',
      name: 'GOOGLE_API_KEY',
      path: '.env',
      source: 'env-file',
    });

    expect(summarizeCruxEnvFiles(workspace)).toMatchObject({
      acceptedPresent: ['GOOGLE_API_KEY'],
      checked: true,
    });
  });

  it('uses .env.local before .env for local key resolution', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'crux-env-'));
    mkdirSync(workspace, { recursive: true });
    writeFileSync(join(workspace, '.env'), 'GOOGLE_API_KEY=env-value\n');
    writeFileSync(join(workspace, '.env.local'), 'CRUX_API_KEY=local-value\n');

    expect(resolveCruxApiKey({ cwd: workspace, env: {} })).toEqual({
      key: 'local-value',
      name: 'CRUX_API_KEY',
      path: '.env.local',
      source: 'env-file',
    });
  });
});
