import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL, URL } from 'node:url';
import process from 'node:process';
import { resolveCruxApiKey } from './crux-env.mjs';

/* global fetch */

const defaultOrigin = 'https://komin0707.github.io';
const defaultCruxApiEndpoint = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
const defaultPageSpeedEndpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const defaultCruxLiveProbePath = 'artifacts/manual-evidence/crux-live-probe.json';
const defaultPageSpeedLiveProbePath = 'artifacts/manual-evidence/pagespeed-live-probe.json';

if (isMain()) {
  const config = {
    apiKeyResolution: resolveCruxApiKey(),
    cruxArtifactPath: process.env.CRUX_LIVE_PROBE_ARTIFACT ?? defaultCruxLiveProbePath,
    cruxApiEndpoint: process.env.CRUX_API_ENDPOINT ?? defaultCruxApiEndpoint,
    fetchFn: fetch,
    now: () => new Date().toISOString(),
    origin: normalizeOrigin(process.env.CRUX_ORIGIN ?? defaultOrigin),
    pageSpeedArtifactPath: process.env.PAGESPEED_LIVE_PROBE_ARTIFACT ?? defaultPageSpeedLiveProbePath,
    pageSpeedEndpoint: process.env.PAGESPEED_API_ENDPOINT ?? defaultPageSpeedEndpoint,
    targetUrl: normalizeUrl(
      process.env.CRUX_URL ?? `${normalizeOrigin(process.env.CRUX_ORIGIN ?? defaultOrigin)}/`,
    ),
  };

  const result = await runLiveProbes(config);
  process.stdout.write(
    `${JSON.stringify(
      {
        cruxArtifactPath: config.cruxArtifactPath,
        hasFieldData: result.hasFieldData,
        pageSpeedArtifactPath: config.pageSpeedArtifactPath,
        result: result.hasFieldData ? 'passed' : 'blocked',
      },
      null,
      2,
    )}\n`,
  );

  if (!result.hasFieldData) {
    process.exitCode = 1;
  }
}

export async function runLiveProbes(config) {
  const result = await buildLiveProbeArtifacts(config);
  writeJson(config.cruxArtifactPath, result.cruxArtifact);
  writeJson(config.pageSpeedArtifactPath, result.pageSpeedArtifact);
  return result;
}

export async function buildLiveProbeArtifacts({
  apiKeyResolution = { key: '', name: null, path: null, source: 'none' },
  cruxApiEndpoint = defaultCruxApiEndpoint,
  fetchFn,
  now,
  origin = defaultOrigin,
  pageSpeedEndpoint = defaultPageSpeedEndpoint,
  targetUrl = `${origin}/`,
}) {
  const verifiedAt = now();
  const apiKey = apiKeyResolution.key ?? '';
  const [cruxArtifact, pageSpeedArtifact] = await Promise.all([
    probeCruxApi({
      apiKey,
      endpoint: cruxApiEndpoint,
      fetchFn,
      origin,
      targetUrl,
      verifiedAt,
    }),
    probePageSpeed({
      apiKey,
      endpoint: pageSpeedEndpoint,
      fetchFn,
      targetUrl,
      verifiedAt,
    }),
  ]);
  const hasFieldData = Boolean(
    cruxArtifact.probes.some((probe) => probe.recordPresent) ||
    pageSpeedArtifact.hasLoadingExperience ||
    pageSpeedArtifact.hasOriginLoadingExperience,
  );

  return {
    cruxArtifact: {
      ...cruxArtifact,
      apiKeySource: {
        name: apiKeyResolution.name,
        path: apiKeyResolution.path ?? null,
        source: apiKeyResolution.source,
      },
      result: hasFieldData ? 'passed' : 'blocked',
    },
    hasFieldData,
    pageSpeedArtifact: {
      ...pageSpeedArtifact,
      apiKeySource: {
        name: apiKeyResolution.name,
        path: apiKeyResolution.path ?? null,
        source: apiKeyResolution.source,
      },
      result: hasFieldData ? 'passed' : 'blocked',
    },
  };
}

async function probeCruxApi({ apiKey, endpoint, fetchFn, origin, targetUrl, verifiedAt }) {
  const url = appendApiKey(endpoint, apiKey);
  const [originProbe, urlProbe] = await Promise.all([
    postJson(fetchFn, url, { origin }),
    postJson(fetchFn, url, { url: targetUrl }),
  ]);

  return {
    verifiedAt,
    verifier: 'direct CrUX API probe',
    url: endpoint,
    targetOrigin: origin,
    targetUrl,
    hasApiKey: apiKey.length > 0,
    probes: [summarizeCruxProbe('origin', originProbe), summarizeCruxProbe('url', urlProbe)],
  };
}

async function probePageSpeed({ apiKey, endpoint, fetchFn, targetUrl, verifiedAt }) {
  const url = new URL(endpoint);
  url.searchParams.set('url', targetUrl);
  url.searchParams.set('category', 'performance');
  url.searchParams.set('strategy', 'mobile');
  if (apiKey.length > 0) {
    url.searchParams.set('key', apiKey);
  }

  const response = await getJson(fetchFn, url);
  const loadingExperience = response.body?.loadingExperience;
  const originLoadingExperience = response.body?.originLoadingExperience;

  return {
    verifiedAt,
    verifier: 'direct PageSpeed Insights API probe',
    url: endpoint,
    targetUrl,
    status: response.status,
    hasApiKey: apiKey.length > 0,
    hasLoadingExperience: hasMetrics(loadingExperience),
    loadingExperienceOrigin: loadingExperience?.origin ?? null,
    loadingExperienceMetrics: Object.keys(loadingExperience?.metrics ?? {}),
    hasOriginLoadingExperience: hasMetrics(originLoadingExperience),
    originLoadingExperienceOrigin: originLoadingExperience?.origin ?? null,
    originLoadingExperienceMetrics: Object.keys(originLoadingExperience?.metrics ?? {}),
    errorStatus: response.body?.error?.status ?? null,
    errorMessage: response.body?.error?.message ?? response.error ?? null,
  };
}

async function postJson(fetchFn, url, body) {
  return requestJson(fetchFn, url, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

async function getJson(fetchFn, url) {
  return requestJson(fetchFn, url, { method: 'GET' });
}

async function requestJson(fetchFn, url, options) {
  try {
    const response = await fetchFn(url, options);
    const text = await response.text();
    return {
      body: parseJson(text),
      status: response.status,
      statusText: response.statusText ?? '',
    };
  } catch (error) {
    return {
      body: null,
      error: error instanceof Error ? error.message : String(error),
      status: 0,
      statusText: 'request failed',
    };
  }
}

function summarizeCruxProbe(name, response) {
  return {
    name,
    status: response.status,
    ok: response.status >= 200 && response.status <= 299,
    recordPresent: Boolean(response.body?.record),
    metrics: Object.keys(response.body?.record?.metrics ?? {}),
    errorStatus: response.body?.error?.status ?? null,
    errorMessage: response.body?.error?.message ?? response.error ?? null,
  };
}

function hasMetrics(value) {
  return Boolean(value?.metrics && Object.keys(value.metrics).length > 0);
}

function appendApiKey(endpoint, key) {
  if (key.length === 0) return endpoint;
  const url = new URL(endpoint);
  url.searchParams.set('key', key);
  return url.toString();
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeOrigin(value) {
  const url = new URL(value);
  return url.origin;
}

function normalizeUrl(value) {
  return new URL(value).toString();
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function isMain() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}
