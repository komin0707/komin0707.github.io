/* global PerformanceObserver, fetch, performance, setTimeout, window */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { chromium } from 'playwright';

const port = Number(process.env.PERF_PORT ?? 4173);
const baseUrl = `http://127.0.0.1:${port}`;
const budgets = {
  cls: 0.1,
  fcp: 1800,
  fid: 100,
  lcp: 2500,
  tbt: 200,
  tti: 3800,
};

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(baseUrl);
  const metrics = await measurePerformance(baseUrl);
  mkdirSync('artifacts', { recursive: true });
  writeFileSync('artifacts/performance-budget.json', `${JSON.stringify({ budgets, metrics }, null, 2)}\n`);

  const failures = Object.entries(budgets)
    .filter(([key, max]) => metrics[key] > max)
    .map(([key, max]) => `${key.toUpperCase()} ${metrics[key].toFixed(1)} > ${max}`);

  if (failures.length > 0) {
    throw new Error(`Performance budget exceeded:\n${failures.join('\n')}`);
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

async function measurePerformance(url) {
  const browser = await chromium.launch(chromiumLaunchOptions());
  const page = await browser.newPage({ viewport: { height: 900, width: 1440 } });

  await page.addInitScript(() => {
    window.__performanceBudget = {
      cls: 0,
      firstInputDelay: 0,
      largestContentfulPaint: 0,
      totalBlockingTime: 0,
    };

    const budget = window.__performanceBudget;

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries.at(-1);
        budget.largestContentfulPaint = lastEntry?.startTime ?? budget.largestContentfulPaint;
      }).observe({ buffered: true, type: 'largest-contentful-paint' });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry;
          if (!layoutShift.hadRecentInput) budget.cls += layoutShift.value;
        }
      }).observe({ buffered: true, type: 'layout-shift' });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          budget.totalBlockingTime += Math.max(0, entry.duration - 50);
        }
      }).observe({ buffered: true, type: 'longtask' });

      new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0];
        budget.firstInputDelay = firstInput ? firstInput.processingStart - firstInput.startTime : 0;
      }).observe({ buffered: true, type: 'first-input' });
    } catch {
      // Older browsers may not expose every observer type; missing metrics remain zero.
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.mouse.click(24, 24);
  await page.waitForTimeout(1200);

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? 0;
    const budget = window.__performanceBudget;
    return {
      cls: budget.cls,
      fcp,
      fid: budget.firstInputDelay,
      lcp: budget.largestContentfulPaint || fcp,
      tbt: budget.totalBlockingTime,
      tti: navigation ? navigation.domInteractive : 0,
    };
  });

  await browser.close();
  return metrics;
}

function chromiumLaunchOptions() {
  return { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' };
}
