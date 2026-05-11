import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';

const origin = normalizeOrigin(process.env.CRUX_ORIGIN ?? 'https://komin0707.github.io');
const artifactPath = 'artifacts/manual-evidence/chrome-ux-report-monitoring.json';
const apiKey = process.env.CRUX_API_KEY ?? process.env.PAGESPEED_API_KEY ?? '';
const shouldScanCruxCache = process.env.CRUX_CACHE_SCAN === '1';
const timeoutMs = Number(process.env.CRUX_REQUEST_TIMEOUT_MS ?? 20_000);
const cruxCacheBaseUrl = 'https://raw.githubusercontent.com/lonetis/crux-cache/main/';

const startedAt = new Date().toISOString();
const discoverability = await queryDiscoverability(origin);
const cruxApi = await queryCruxApi(origin, apiKey);
const pageSpeed = await queryPageSpeed(origin, apiKey);
const cruxCache = await queryCruxCache(origin, shouldScanCruxCache);
const hasFieldData = Boolean(
  cruxApi.hasRecord || pageSpeed.hasLoadingExperience || pageSpeed.hasOriginLoadingExperience || cruxCache.foundOrigin,
);

const artifact = {
  verifiedAt: new Date().toISOString(),
  verifier: 'GitHub Pages CrUX monitoring workflow',
  result: hasFieldData ? 'passed' : 'blocked',
  evidence: hasFieldData
    ? `Chrome UX Report monitoring found field-data evidence for ${origin}.`
    : `Chrome UX Report monitoring is configured for ${origin}, but no CrUX field-data evidence is currently available to verify the production origin.`,
  origin,
  startedAt,
  checks: {
    discoverability,
    cruxApi,
    pageSpeed,
    cruxCache,
  },
};

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ artifactPath, hasFieldData, origin, result: artifact.result }, null, 2)}\n`);

if (!hasFieldData) {
  process.exitCode = 1;
}

async function queryDiscoverability(targetOrigin) {
  const nonce = Date.now();
  const [home, robots, sitemap] = await Promise.all([
    getTextResponse(`${targetOrigin}/?crux-monitoring=${nonce}`),
    getTextResponse(`${targetOrigin}/robots.txt?crux-monitoring=${nonce}`),
    getTextResponse(`${targetOrigin}/sitemap.xml?crux-monitoring=${nonce}`),
  ]);

  return {
    canonicalPresent: home.text.includes(`<link rel="canonical" href="${targetOrigin}/" />`),
    homeStatus: home.status,
    homeStatusText: home.statusText,
    noIndexPresent: /noindex/i.test(home.text) || /x-robots-tag:\s*noindex/i.test(home.headers),
    robotsAllowsAll: /User-agent:\s*\*/i.test(robots.text) && /Allow:\s*\//i.test(robots.text),
    robotsSitemapPresent: robots.text.includes(`Sitemap: ${targetOrigin}/sitemap.xml`),
    robotsStatus: robots.status,
    sitemapHasOrigin: sitemap.text.includes(`<loc>${targetOrigin}/</loc>`),
    sitemapStatus: sitemap.status,
  };
}

async function queryCruxApi(targetOrigin, key) {
  const url = appendApiKey('https://chromeuxreport.googleapis.com/v1/records:queryRecord', key);
  const response = await postJson(url, { origin: targetOrigin });
  return {
    endpoint: 'records:queryRecord',
    hasApiKey: key.length > 0,
    hasRecord: Boolean(response.body?.record),
    status: response.status,
    statusText: response.statusText,
    error: simplifyGoogleError(response.body),
  };
}

async function queryPageSpeed(targetOrigin, key) {
  const url = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  url.searchParams.set('url', `${targetOrigin}/`);
  url.searchParams.set('strategy', 'mobile');
  url.searchParams.set('category', 'performance');
  if (key.length > 0) {
    url.searchParams.set('key', key);
  }

  const response = await getJson(url);
  const loadingExperience = response.body?.loadingExperience;
  const originLoadingExperience = response.body?.originLoadingExperience;

  return {
    endpoint: 'pagespeedonline/v5/runPagespeed',
    hasApiKey: key.length > 0,
    hasLoadingExperience: hasMetrics(loadingExperience),
    hasOriginLoadingExperience: hasMetrics(originLoadingExperience),
    loadingExperienceCategory: loadingExperience?.overall_category ?? null,
    originLoadingExperienceCategory: originLoadingExperience?.overall_category ?? null,
    status: response.status,
    statusText: response.statusText,
    error: simplifyGoogleError(response.body),
  };
}

async function queryCruxCache(targetOrigin, scanChunks) {
  const datasetsResponse = await getJson(`${cruxCacheBaseUrl}data/datasets.json`);
  const manifestResponse = await getJson(`${cruxCacheBaseUrl}data/global/manifest.json`);
  const latestMonth = manifestResponse.body?.summary?.latest_month ?? null;
  const latestData = latestMonth ? manifestResponse.body?.months?.[latestMonth] : null;
  const summary = {
    dataset: 'global',
    datasetsStatus: datasetsResponse.status,
    foundOrigin: false,
    latestMonth,
    manifestStatus: manifestResponse.status,
    origins: latestData?.origins ?? null,
    scannedChunks: 0,
    scanEnabled: scanChunks,
    totalChunks: latestData?.total_chunks ?? latestData?.chunks?.length ?? null,
  };

  if (!scanChunks || !latestMonth || !Array.isArray(latestData?.chunks)) {
    return summary;
  }

  for (const chunk of latestData.chunks) {
    summary.scannedChunks += 1;
    const text = await getText(`${cruxCacheBaseUrl}data/global/${chunk.filename}`);
    if (containsOriginCsvLine(text, targetOrigin)) {
      summary.foundOrigin = true;
      summary.foundInChunk = chunk.filename;
      break;
    }
  }

  return summary;
}

async function postJson(url, body) {
  return requestJson(url, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

async function getJson(url) {
  return requestJson(url, { method: 'GET' });
}

async function requestJson(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return {
      body: parseJson(await response.text()),
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    return {
      body: null,
      error: error instanceof Error ? error.message : String(error),
      status: 0,
      statusText: 'request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getText(url) {
  const response = await getTextResponse(url);
  if (response.status < 200 || response.status > 299) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }
  return response.text;
}

async function getTextResponse(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const headers = Array.from(response.headers.entries())
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    return {
      headers,
      status: response.status,
      statusText: response.statusText,
      text: await response.text(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function appendApiKey(url, key) {
  if (key.length === 0) {
    return url;
  }
  const keyedUrl = new URL(url);
  keyedUrl.searchParams.set('key', key);
  return keyedUrl;
}

function containsOriginCsvLine(text, targetOrigin) {
  const normalized = targetOrigin.toLowerCase();
  return text
    .split('\n')
    .some((line) => line.trim().toLowerCase().startsWith(`${normalized},`));
}

function hasMetrics(value) {
  return typeof value === 'object' && value !== null && Object.keys(value.metrics ?? {}).length > 0;
}

function normalizeOrigin(value) {
  const url = new URL(value);
  return url.origin.toLowerCase();
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function simplifyGoogleError(body) {
  if (!body?.error) {
    return null;
  }
  return {
    code: body.error.code ?? null,
    message: body.error.message ?? null,
    status: body.error.status ?? null,
  };
}
