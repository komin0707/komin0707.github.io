/* global Event, fetch, setTimeout */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { chromium } from 'playwright';

const port = Number(process.env.LONG_MEMORY_PORT ?? 4176);
const durationMs = Number(process.env.LONG_MEMORY_DURATION_MS ?? 600_000);
const minDurationMs = Number(process.env.LONG_MEMORY_MIN_DURATION_MS ?? 600_000);
const sampleIntervalMs = Number(process.env.LONG_MEMORY_SAMPLE_INTERVAL_MS ?? 60_000);
const interactionIntervalMs = Number(process.env.LONG_MEMORY_INTERACTION_INTERVAL_MS ?? 15_000);
const baseUrl = `http://127.0.0.1:${port}`;
const artifactPath = process.env.LONG_MEMORY_ARTIFACT ?? 'artifacts/memory-profile-10min.json';
const budgets = {
  maxDocumentsGrowth: 0,
  maxFinalHeapGrowthBytes: 8_000_000,
  maxJsEventListenersGrowth: 40,
  maxNodesGrowth: 120,
  maxUsedHeapBytes: 90_000_000,
  minDurationMs,
};

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(baseUrl);
  const profile = await profileLongRunningMemory(baseUrl);
  mkdirSync('artifacts', { recursive: true });
  writeFileSync(artifactPath, `${JSON.stringify({ budgets, profile }, null, 2)}\n`);

  const failures = [
    profile.actualDurationMs < budgets.minDurationMs
      ? `Duration ${profile.actualDurationMs} < ${budgets.minDurationMs}`
      : '',
    profile.maxUsedHeapBytes > budgets.maxUsedHeapBytes
      ? `Max heap ${profile.maxUsedHeapBytes} > ${budgets.maxUsedHeapBytes}`
      : '',
    profile.finalHeapGrowthBytes > budgets.maxFinalHeapGrowthBytes
      ? `Final heap growth ${profile.finalHeapGrowthBytes} > ${budgets.maxFinalHeapGrowthBytes}`
      : '',
    profile.domGrowth.nodes > budgets.maxNodesGrowth
      ? `Node growth ${profile.domGrowth.nodes} > ${budgets.maxNodesGrowth}`
      : '',
    profile.domGrowth.documents > budgets.maxDocumentsGrowth
      ? `Document growth ${profile.domGrowth.documents} > ${budgets.maxDocumentsGrowth}`
      : '',
    profile.domGrowth.jsEventListeners > budgets.maxJsEventListenersGrowth
      ? `Listener growth ${profile.domGrowth.jsEventListeners} > ${budgets.maxJsEventListenersGrowth}`
      : '',
  ].filter(Boolean);

  if (failures.length > 0) {
    throw new Error(`Long-running memory profile budget exceeded:\n${failures.join('\n')}`);
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

async function profileLongRunningMemory(url) {
  const browser = await chromium.launch(chromiumLaunchOptions());
  const page = await browser.newPage({ viewport: { height: 900, width: 1440 } });
  const client = await page.context().newCDPSession(page);

  await page.goto(url, { waitUntil: 'networkidle' });
  await exerciseSimulator(page);
  const startedAt = Date.now();
  const samples = [await collectSample(client, startedAt)];
  let nextSampleAt = startedAt + sampleIntervalMs;
  let nextInteractionAt = startedAt + interactionIntervalMs;
  const deadline = startedAt + durationMs;

  while (Date.now() < deadline) {
    const now = Date.now();

    if (now >= nextInteractionAt) {
      await exerciseSimulator(page);
      nextInteractionAt += interactionIntervalMs;
      continue;
    }

    if (now >= nextSampleAt) {
      samples.push(await collectSample(client, startedAt));
      nextSampleAt += sampleIntervalMs;
      continue;
    }

    await page.waitForTimeout(Math.min(1_000, nextInteractionAt - now, nextSampleAt - now, deadline - now));
  }

  samples.push(await collectSample(client, startedAt));
  await browser.close();

  const first = samples[0];
  const last = samples.at(-1);

  if (!first || !last) {
    throw new Error('Long-running memory profile did not record samples.');
  }

  return {
    actualDurationMs: last.elapsedMs,
    domGrowth: {
      documents: last.domCounters.documents - first.domCounters.documents,
      jsEventListeners: last.domCounters.jsEventListeners - first.domCounters.jsEventListeners,
      nodes: last.domCounters.nodes - first.domCounters.nodes,
    },
    finalHeapGrowthBytes: last.heap.usedSize - first.heap.usedSize,
    maxUsedHeapBytes: Math.max(...samples.map((sample) => sample.heap.usedSize)),
    samples,
  };
}

async function collectSample(client, startedAt) {
  await collectGarbage(client);
  const [heap, domCounters] = await Promise.all([
    client.send('Runtime.getHeapUsage'),
    client.send('Memory.getDOMCounters'),
  ]);

  return {
    domCounters,
    elapsedMs: Date.now() - startedAt,
    heap,
  };
}

async function collectGarbage(client) {
  await client.send('HeapProfiler.enable');
  await client.send('HeapProfiler.collectGarbage');
  await client.send('HeapProfiler.disable');
}

async function exerciseSimulator(page) {
  for (const scenario of ['normal', 'pneumonia', 'ards', 'airwayObstruction', 'pneumothorax']) {
    await page.locator('.scenario-select select').selectOption(scenario);
  }

  for (const mode of ['A/C', 'V/C', 'P/C', 'PSV', 'CPAP', 'BiPAP', 'SIMV', 'APRV', 'HFOV', 'NIV']) {
    await page.getByRole('button', { name: mode }).click();
  }

  await setSliderValue(page, 'FiO2 (%)', '21');
  await setSliderValue(page, 'FiO2 (%)', '100');
  await setSliderValue(page, 'Respiratory Rate (/min)', '4');
  await setSliderValue(page, 'Respiratory Rate (/min)', '32');
  await page.getByRole('button', { name: /중지|재개/ }).click();
  await page.getByRole('button', { name: /중지|재개/ }).click();
}

async function setSliderValue(page, label, value) {
  const slider = page.locator('label').filter({ hasText: label }).getByRole('slider');
  await slider.evaluate((element, nextValue) => {
    const input = element;
    input.value = nextValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

function chromiumLaunchOptions() {
  return { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' };
}
