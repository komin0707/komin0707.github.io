/* global fetch, setTimeout */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { platform, release } from 'node:os';
import { dirname } from 'node:path';
import process from 'node:process';
import { chromium, devices, firefox, webkit } from 'playwright';
import { format, resolveConfig } from 'prettier';

const artifactPath = 'artifacts/manual-evidence/multi-environment-verification.json';
const externalMultiEnvironmentEvidencePath =
  'artifacts/manual-evidence/external-multi-environment-results.json';
const systemSafariMacOsEvidencePath = 'artifacts/manual-evidence/system-safari-macos-verification.json';
const port = Number(process.env.MULTI_ENV_PORT ?? 4178);
const baseUrl = `http://127.0.0.1:${port}`;
const requiredEnvironments = [
  'Chrome desktop',
  'Firefox desktop',
  'Safari macOS',
  'Edge desktop',
  'Linux Chromium',
  'Android Chrome',
  'iOS Safari',
  'tablet',
  '4K',
  'ultra-wide',
  'portrait',
  'landscape',
];

const targets = [
  {
    browser: chromium,
    label: 'Chrome desktop',
    launchOptions: { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' },
    viewport: { height: 900, width: 1440 },
  },
  {
    browser: firefox,
    label: 'Firefox desktop',
    launchOptions: {},
    viewport: { height: 900, width: 1440 },
  },
  {
    browser: webkit,
    label: 'Safari macOS',
    launchOptions: {},
    viewport: { height: 900, width: 1440 },
  },
  {
    browser: chromium,
    contextOptions: devices['Pixel 7'],
    label: 'Android Chrome',
    launchOptions: { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' },
  },
  {
    browser: webkit,
    contextOptions: devices['iPhone 15'],
    label: 'iOS Safari',
    launchOptions: {},
  },
  {
    browser: chromium,
    contextOptions: devices['iPad Pro 11'],
    label: 'tablet',
    launchOptions: { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' },
  },
  {
    browser: chromium,
    label: '4K',
    launchOptions: { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' },
    viewport: { height: 2160, width: 3840 },
  },
  {
    browser: chromium,
    label: 'ultra-wide',
    launchOptions: { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' },
    viewport: { height: 1440, width: 3440 },
  },
  {
    browser: chromium,
    label: 'portrait',
    launchOptions: { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' },
    viewport: { height: 1180, width: 820 },
  },
  {
    browser: chromium,
    label: 'landscape',
    launchOptions: { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' },
    viewport: { height: 820, width: 1180 },
  },
  {
    label: 'Edge desktop',
    synthetic: true,
  },
  {
    label: 'Linux Chromium',
    synthetic: true,
  },
];

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(baseUrl);
  const results = [];
  for (const target of targets) {
    results.push(await verifyTarget(target));
  }
  const mergedResults = mergeManualEnvironmentEvidence(results);

  const covered = new Set(
    mergedResults.filter((result) => result.result === 'passed').map((result) => result.label),
  );
  const unavailable = requiredEnvironments.filter((label) => !covered.has(label));
  const artifact = {
    artifactPath,
    baseUrl,
    checkedAt: new Date().toISOString(),
    localEnvironment: getLocalEnvironmentEvidence(),
    requiredEnvironments,
    result: unavailable.length === 0 ? 'passed' : 'partial',
    results: mergedResults,
    unavailable,
  };

  mkdirSync(dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, await formatJson(artifactPath, artifact));
  process.stdout.write(
    `${JSON.stringify(
      {
        artifactPath,
        passed: mergedResults.filter((result) => result.result === 'passed').length,
        result: artifact.result,
        unavailable,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  server.kill('SIGTERM');
}

async function verifyTarget(target) {
  if (target.synthetic) return syntheticBlockedTarget(target.label);

  let browser;
  try {
    browser = await target.browser.launch(target.launchOptions);
    const context = await browser.newContext({
      ...(target.contextOptions ?? {}),
      ...(target.viewport ? { viewport: target.viewport } : {}),
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const simulator = page.getByTestId('vent-simulator');
    const patient = page.getByTestId('patient-avatar');
    await simulator.waitFor({ state: 'visible', timeout: 10_000 });
    await patient.waitFor({ state: 'visible', timeout: 10_000 });
    const titleVisible = await page.getByText('VENT SIMULATOR 2D').isVisible();
    const patientBox = await patient.boundingBox();
    await browser.close();
    return {
      consoleErrorCount: consoleErrors.length,
      label: target.label,
      patientBox,
      result: consoleErrors.length === 0 && titleVisible && patientBox ? 'passed' : 'failed',
      titleVisible,
    };
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    return {
      error: error instanceof Error ? error.message : String(error),
      label: target.label,
      result: 'blocked',
    };
  }
}

function mergeManualEnvironmentEvidence(results) {
  const manualResults = [validatedSystemSafariMacOsResult(), ...validatedExternalEnvironmentResults()].filter(
    Boolean,
  );
  if (manualResults.length === 0) return results;

  const merged = [...results];
  for (const manualResult of manualResults) {
    const index = merged.findIndex((result) => result.label === manualResult.label);
    if (index === -1) {
      merged.push(manualResult);
      continue;
    }

    if (merged[index].result !== 'passed' && manualResult.result === 'passed') {
      merged[index] = {
        ...manualResult,
        automatedResult: merged[index],
      };
    }
  }

  return merged;
}

function validatedExternalEnvironmentResults() {
  const evidence = readOptionalJson(externalMultiEnvironmentEvidencePath);
  if (!evidence) return [];

  const allowedExternalLabels = new Set(['Firefox desktop', 'Edge desktop', 'Linux Chromium', 'iOS Safari']);
  const results = Array.isArray(evidence.results) ? evidence.results : [];
  return results
    .filter((result) => allowedExternalLabels.has(result.label))
    .map((result) => validatedExternalEnvironmentResult(result));
}

function validatedExternalEnvironmentResult(result) {
  const observedAccessibility = result.observedAccessibility ?? {};
  const passed =
    result.result === 'passed' &&
    Boolean(result.browserName) &&
    Boolean(result.checkedAt) &&
    Boolean(result.platform) &&
    screenshotEvidencePassed(result.screenshot) &&
    observedAccessibility.patientAvatarVisible === true &&
    observedAccessibility.simulatorHeadingVisible === true &&
    String(observedAccessibility.documentTitle ?? '').includes('Vent Simulator 2D') &&
    String(observedAccessibility.url ?? '').length > 0;

  return {
    browserName: result.browserName,
    checkedAt: result.checkedAt,
    evidenceMethod: result.evidenceMethod ?? 'External manual multi-environment verification',
    evidencePath: externalMultiEnvironmentEvidencePath,
    label: result.label,
    observedAccessibility,
    platform: result.platform,
    result: passed ? 'passed' : 'blocked',
    screenshot: result.screenshot,
    validation: passed
      ? 'External environment evidence validated against platform, browser, accessibility, and screenshot fields.'
      : 'External environment evidence is present but incomplete.',
  };
}

function validatedSystemSafariMacOsResult() {
  const evidence = readOptionalJson(systemSafariMacOsEvidencePath);
  if (!evidence) return null;

  const observedAccessibility = evidence.observedAccessibility ?? {};
  const passed =
    evidence.result === 'passed' &&
    evidence.label === 'Safari macOS' &&
    evidence.browserName === 'Safari' &&
    screenshotEvidencePassed(evidence.screenshot) &&
    observedAccessibility.patientAvatarVisible === true &&
    observedAccessibility.simulatorHeadingVisible === true &&
    String(observedAccessibility.documentTitle ?? '').includes('Vent Simulator 2D') &&
    String(observedAccessibility.url ?? '').includes('127.0.0.1');

  return {
    browserName: evidence.browserName,
    evidenceMethod: evidence.evidenceMethod,
    evidencePath: systemSafariMacOsEvidencePath,
    label: 'Safari macOS',
    observedAccessibility,
    result: passed ? 'passed' : 'blocked',
    screenshot: evidence.screenshot,
    validation: passed
      ? 'System Safari evidence validated against accessibility and screenshot fields.'
      : 'System Safari evidence artifact is present but incomplete.',
  };
}

function syntheticBlockedTarget(label) {
  if (label === 'Edge desktop') {
    return {
      evidence: {
        applications: {
          edgeAppInstalled: existsSync('/Applications/Microsoft Edge.app'),
        },
        pathLookupAttempted: ['msedge', 'microsoft-edge'],
      },
      error: 'Microsoft Edge is not installed in /Applications and no Edge CLI was found on PATH.',
      label,
      result: 'blocked',
    };
  }

  if (label === 'Linux Chromium') {
    return {
      evidence: {
        platform: platform(),
        release: release(),
      },
      error: 'Linux Chromium requires a Linux runtime; this verification host is not Linux.',
      label,
      result: 'blocked',
    };
  }

  return {
    error: 'Synthetic target is not implemented.',
    label,
    result: 'blocked',
  };
}

function readOptionalJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function screenshotEvidencePassed(screenshot) {
  const screenshotPath = screenshot?.path;
  if (!screenshotPath || !existsSync(String(screenshotPath))) return false;
  if (Number(screenshot.width) <= 0 || Number(screenshot.height) <= 0) return false;
  if (!screenshot.sha256 || String(screenshot.sha256).includes('REQUIRED')) return false;

  const source = readFileSync(String(screenshotPath));
  const dimensions = readPngDimensions(source);
  if (
    !dimensions ||
    dimensions.width !== Number(screenshot.width) ||
    dimensions.height !== Number(screenshot.height)
  ) {
    return false;
  }

  const actualHash = createHash('sha256').update(source).digest('hex');
  return actualHash === screenshot.sha256;
}

function readPngDimensions(source) {
  const pngSignature = '89504e470d0a1a0a';
  if (source.length < 24 || source.subarray(0, 8).toString('hex') !== pngSignature) return null;
  return {
    height: source.readUInt32BE(20),
    width: source.readUInt32BE(16),
  };
}

function getLocalEnvironmentEvidence() {
  return {
    applications: {
      chromeAppInstalled: existsSync('/Applications/Google Chrome.app'),
      edgeAppInstalled: existsSync('/Applications/Microsoft Edge.app'),
      firefoxAppInstalled: existsSync('/Applications/Firefox.app'),
      safariAppInstalled: existsSync('/Applications/Safari.app'),
    },
    platform: platform(),
    release: release(),
    safariDriverNote:
      'System Safari is present, but this Playwright-based verification requires WebKit browser files or separately enabled Safari remote automation.',
  };
}

async function waitForServer(url) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`Preview server did not become ready at ${url}`);
}

async function formatJson(path, value) {
  const options = (await resolveConfig(path)) ?? {};
  return format(JSON.stringify(value), { ...options, parser: 'json' });
}
