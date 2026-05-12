import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildLiveProbeArtifacts, runLiveProbes } from './check-crux-live-probes.mjs';

describe('CrUX live probes', () => {
  it('records blocked direct API probes when neither API returns field data', async () => {
    const result = await buildLiveProbeArtifacts({
      fetchFn: fakeFetch([
        googleError(403, 'PERMISSION_DENIED', 'Method does not allow unregistered callers.'),
        googleError(403, 'PERMISSION_DENIED', 'Method does not allow unregistered callers.'),
        googleError(429, 'RESOURCE_EXHAUSTED', 'Quota exceeded.'),
      ]),
      now: () => '2026-05-11T00:00:00.000Z',
      origin: 'https://komin0707.github.io',
      targetUrl: 'https://komin0707.github.io/',
    });

    expect(result.hasFieldData).toBe(false);
    expect(result.cruxArtifact).toMatchObject({
      result: 'blocked',
      probes: [
        {
          errorStatus: 'PERMISSION_DENIED',
          name: 'origin',
          recordPresent: false,
          status: 403,
        },
        {
          errorStatus: 'PERMISSION_DENIED',
          name: 'url',
          recordPresent: false,
          status: 403,
        },
      ],
    });
    expect(result.pageSpeedArtifact).toMatchObject({
      errorStatus: 'RESOURCE_EXHAUSTED',
      hasLoadingExperience: false,
      hasOriginLoadingExperience: false,
      result: 'blocked',
      status: 429,
    });
  });

  it('passes when either direct API returns field data', async () => {
    const result = await buildLiveProbeArtifacts({
      apiKeyResolution: {
        key: 'test-key',
        name: 'CRUX_API_KEY',
        source: 'process',
      },
      fetchFn: fakeFetch([
        jsonResponse(200, {
          record: {
            metrics: {
              largest_contentful_paint: {},
            },
          },
        }),
        jsonResponse(404, {
          error: {
            status: 'NOT_FOUND',
          },
        }),
        jsonResponse(200, {
          loadingExperience: {
            metrics: {
              CUMULATIVE_LAYOUT_SHIFT_SCORE: {},
            },
            origin: 'https://komin0707.github.io',
          },
        }),
      ]),
      now: () => '2026-05-11T00:00:00.000Z',
      origin: 'https://komin0707.github.io',
      targetUrl: 'https://komin0707.github.io/',
    });

    expect(result.hasFieldData).toBe(true);
    expect(result.cruxArtifact.result).toBe('passed');
    expect(result.cruxArtifact.probes[0]).toMatchObject({
      metrics: ['largest_contentful_paint'],
      recordPresent: true,
      status: 200,
    });
    expect(result.pageSpeedArtifact).toMatchObject({
      hasApiKey: true,
      hasLoadingExperience: true,
      result: 'passed',
      status: 200,
    });
  });

  it('writes both probe artifacts', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'crux-live-probes-'));
    const cruxArtifactPath = join(workspace, 'artifacts/manual-evidence/crux-live-probe.json');
    const pageSpeedArtifactPath = join(workspace, 'artifacts/manual-evidence/pagespeed-live-probe.json');

    await runLiveProbes({
      cruxArtifactPath,
      fetchFn: fakeFetch([
        googleError(403, 'PERMISSION_DENIED', 'Method does not allow unregistered callers.'),
        googleError(403, 'PERMISSION_DENIED', 'Method does not allow unregistered callers.'),
        googleError(429, 'RESOURCE_EXHAUSTED', 'Quota exceeded.'),
      ]),
      now: () => '2026-05-11T00:00:00.000Z',
      origin: 'https://komin0707.github.io',
      pageSpeedArtifactPath,
      targetUrl: 'https://komin0707.github.io/',
    });

    expect(JSON.parse(readFileSync(cruxArtifactPath, 'utf8'))).toMatchObject({
      result: 'blocked',
      targetOrigin: 'https://komin0707.github.io',
    });
    expect(JSON.parse(readFileSync(pageSpeedArtifactPath, 'utf8'))).toMatchObject({
      result: 'blocked',
      targetUrl: 'https://komin0707.github.io/',
    });
  });
});

function fakeFetch(responses) {
  let callIndex = 0;
  return async () => responses[callIndex++];
}

function googleError(status, errorStatus, message) {
  return jsonResponse(status, {
    error: {
      message,
      status: errorStatus,
    },
  });
}

function jsonResponse(status, body) {
  return {
    status,
    statusText: '',
    async text() {
      return JSON.stringify(body);
    },
  };
}
