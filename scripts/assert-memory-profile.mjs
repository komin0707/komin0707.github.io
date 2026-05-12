/* global Event, fetch, setTimeout */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { chromium } from 'playwright';

const port = Number(process.env.MEMORY_PORT ?? 4174);
const baseUrl = `http://127.0.0.1:${port}`;
const budgets = {
  maxDocumentsGrowth: 0,
  maxHeapGrowthBytes: 6_000_000,
  maxJsEventListenersGrowth: 40,
  maxNodesGrowth: 80,
  maxUsedHeapBytes: 80_000_000,
};

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(baseUrl);
  const profile = await profileMemory(baseUrl);
  mkdirSync('artifacts', { recursive: true });
  writeFileSync('artifacts/memory-profile.json', `${JSON.stringify({ budgets, profile }, null, 2)}\n`);

  const failures = [
    profile.maxUsedHeapBytes > budgets.maxUsedHeapBytes
      ? `Max heap ${profile.maxUsedHeapBytes} > ${budgets.maxUsedHeapBytes}`
      : '',
    profile.heapGrowthBytes > budgets.maxHeapGrowthBytes
      ? `Heap growth ${profile.heapGrowthBytes} > ${budgets.maxHeapGrowthBytes}`
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
    throw new Error(`Memory profile budget exceeded:\n${failures.join('\n')}`);
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

async function profileMemory(url) {
  const browser = await chromium.launch(chromiumLaunchOptions());
  const page = await browser.newPage({ viewport: { height: 900, width: 1440 } });
  const client = await page.context().newCDPSession(page);

  await page.goto(url, { waitUntil: 'networkidle' });
  await exerciseSimulator(page);
  await collectGarbage(client);
  const before = await readMemorySnapshot(client);

  for (let cycle = 0; cycle < 8; cycle += 1) {
    await exerciseSimulator(page);
  }

  await collectGarbage(client);
  const after = await readMemorySnapshot(client);
  await browser.close();

  return {
    after,
    before,
    domGrowth: {
      documents: after.domCounters.documents - before.domCounters.documents,
      jsEventListeners: after.domCounters.jsEventListeners - before.domCounters.jsEventListeners,
      nodes: after.domCounters.nodes - before.domCounters.nodes,
    },
    heapGrowthBytes: after.heap.usedSize - before.heap.usedSize,
    maxUsedHeapBytes: Math.max(before.heap.usedSize, after.heap.usedSize),
  };
}

function chromiumLaunchOptions() {
  return { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' };
}

async function collectGarbage(client) {
  await client.send('HeapProfiler.enable');
  await client.send('HeapProfiler.collectGarbage');
  await client.send('HeapProfiler.disable');
}

async function readMemorySnapshot(client) {
  const [heap, domCounters] = await Promise.all([
    client.send('Runtime.getHeapUsage'),
    client.send('Memory.getDOMCounters'),
  ]);

  return { domCounters, heap };
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
  await page.waitForTimeout(40);
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
