/* global fetch, setTimeout */

import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { chromium } from 'playwright';
import { format, resolveConfig } from 'prettier';

const artifactPath = 'artifacts/manual-evidence/strict-accessibility-scan.json';
const port = Number(process.env.STRICT_ACCESSIBILITY_PORT ?? 4181);
const baseUrl = `http://127.0.0.1:${port}`;

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(baseUrl);
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' });
  const context = await browser.newContext({ viewport: { height: 900, width: 1440 } });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByTestId('vent-simulator').waitFor({ state: 'visible', timeout: 10_000 });

  const results = await new AxeBuilder({ page }).analyze();
  const { incomplete, recheckSummary } = await filterTransientColorContrastIncomplete(
    page,
    results.incomplete,
  );
  await browser.close();

  const artifact = {
    artifactPath,
    colorContrastRecheck: recheckSummary,
    consoleErrorCount: consoleErrors.length,
    consoleErrors,
    incomplete: incomplete.map(serializeCheck),
    incompleteCount: incomplete.length,
    result: results.violations.length === 0 && consoleErrors.length === 0 ? 'passed' : 'failed',
    url: baseUrl,
    verifiedAt: new Date().toISOString(),
    violationCount: results.violations.length,
    violations: results.violations.map(serializeCheck),
  };

  mkdirSync('artifacts/manual-evidence', { recursive: true });
  writeFileSync(artifactPath, await formatJson(artifactPath, artifact));
  process.stdout.write(
    `${JSON.stringify(
      {
        artifactPath,
        consoleErrorCount: artifact.consoleErrorCount,
        incompleteCount: artifact.incompleteCount,
        result: artifact.result,
        violationCount: artifact.violationCount,
      },
      null,
      2,
    )}\n`,
  );

  if (artifact.result !== 'passed') {
    process.exitCode = 1;
  }
} finally {
  server.kill('SIGTERM');
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

function serializeCheck(check) {
  return {
    description: check.description,
    help: check.help,
    helpUrl: check.helpUrl,
    id: check.id,
    impact: check.impact,
    nodes: check.nodes.map((node) => ({
      failureSummary: node.failureSummary ?? null,
      html: node.html,
      target: node.target,
    })),
    tags: check.tags,
  };
}

async function filterTransientColorContrastIncomplete(page, incomplete) {
  const colorContrast = incomplete.find((entry) => entry.id === 'color-contrast');
  if (!colorContrast) {
    return {
      incomplete,
      recheckSummary: {
        initialColorContrastNodes: 0,
        recheckedColorContrastNodes: 0,
        resolvedColorContrastNodes: 0,
        unresolvedColorContrastNodes: 0,
      },
    };
  }

  const unresolvedNodes = [];
  const waivedDecorativeSvgTextNodes = [];
  for (const node of colorContrast.nodes) {
    const selector = node.target?.[0];
    if (!selector || (await colorContrastNodePassesWhenScrolledIntoView(page, selector))) continue;
    if (await isDecorativePatientSvgTextIncomplete(page, selector)) {
      waivedDecorativeSvgTextNodes.push(node);
      continue;
    }
    unresolvedNodes.push(node);
  }

  const filtered = incomplete
    .map((entry) => (entry.id === 'color-contrast' ? { ...entry, nodes: unresolvedNodes } : entry))
    .filter((entry) => entry.nodes.length > 0);

  return {
    incomplete: filtered,
    recheckSummary: {
      initialColorContrastNodes: colorContrast.nodes.length,
      recheckedColorContrastNodes: colorContrast.nodes.length,
      resolvedColorContrastNodes:
        colorContrast.nodes.length - unresolvedNodes.length - waivedDecorativeSvgTextNodes.length,
      waivedDecorativeSvgTextNodes: waivedDecorativeSvgTextNodes.length,
      unresolvedColorContrastNodes: unresolvedNodes.length,
    },
  };
}

async function colorContrastNodePassesWhenScrolledIntoView(page, selector) {
  const locator = page.locator(selector).first();
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 1_000 });
    await page.waitForTimeout(40);
    const scoped = await new AxeBuilder({ page }).include(selector).withRules(['color-contrast']).analyze();
    const scopedColorContrast = scoped.incomplete.find((entry) => entry.id === 'color-contrast');
    if (!scopedColorContrast) return true;
    return !scopedColorContrast.nodes.some((node) => node.target?.includes(selector));
  } catch {
    return false;
  }
}

async function isDecorativePatientSvgTextIncomplete(page, selector) {
  const locator = page.locator(selector).first();
  try {
    return await locator.evaluate((element) => {
      if (element.namespaceURI !== 'http://www.w3.org/2000/svg' || element.localName !== 'text') {
        return false;
      }
      const svg = element.closest('svg.patient-avatar-svg[aria-hidden="true"]');
      const patientAvatar = element.closest('[data-testid="patient-avatar"][role="img"][aria-label]');
      if (!svg || !patientAvatar) return false;
      const label = patientAvatar.getAttribute('aria-label') ?? '';
      return label.includes('삽관 환자') || label.toLowerCase().includes('patient');
    });
  } catch {
    return false;
  }
}

async function formatJson(path, value) {
  const options = (await resolveConfig(path)) ?? {};
  return format(JSON.stringify(value), { ...options, parser: 'json' });
}
