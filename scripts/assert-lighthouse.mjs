/* global fetch, setTimeout */

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const port = Number(process.env.LIGHTHOUSE_PORT ?? 4175);
const baseUrl = `http://127.0.0.1:${port}`;
const reportPath = 'artifacts/lighthouse-report.json';
const summaryPath = 'artifacts/lighthouse-summary.json';
const budgets = {
  accessibility: 0.95,
  bestPractices: 0.95,
  performance: 0.9,
  seo: 0.95,
  speedIndexMs: 5000,
};

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(baseUrl);
  mkdirSync('artifacts', { recursive: true });
  await runLighthouse(baseUrl);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const summary = {
    scores: {
      accessibility: report.categories.accessibility.score,
      bestPractices: report.categories['best-practices'].score,
      performance: report.categories.performance.score,
      seo: report.categories.seo.score,
    },
    speedIndexMs: report.audits['speed-index'].numericValue,
  };

  writeFileSync(summaryPath, `${JSON.stringify({ budgets, summary }, null, 2)}\n`);

  const failures = [
    summary.scores.performance < budgets.performance
      ? `Performance ${summary.scores.performance} < ${budgets.performance}`
      : '',
    summary.scores.accessibility < budgets.accessibility
      ? `Accessibility ${summary.scores.accessibility} < ${budgets.accessibility}`
      : '',
    summary.scores.bestPractices < budgets.bestPractices
      ? `Best Practices ${summary.scores.bestPractices} < ${budgets.bestPractices}`
      : '',
    summary.scores.seo < budgets.seo ? `SEO ${summary.scores.seo} < ${budgets.seo}` : '',
    summary.speedIndexMs > budgets.speedIndexMs
      ? `Speed Index ${summary.speedIndexMs.toFixed(1)} > ${budgets.speedIndexMs}`
      : '',
  ].filter(Boolean);

  if (failures.length > 0) {
    throw new Error(`Lighthouse budget exceeded:\n${failures.join('\n')}`);
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

async function runLighthouse(url) {
  await new Promise((resolve, reject) => {
    const lighthouse = spawn(
      'npx',
      [
        'lighthouse',
        url,
        '--chrome-flags=--headless=new --no-sandbox',
        '--preset=desktop',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--output=json',
        `--output-path=${reportPath}`,
        '--quiet',
      ],
      { env: { ...process.env, FORCE_COLOR: '0' }, stdio: ['ignore', 'pipe', 'pipe'] },
    );

    lighthouse.on('error', reject);
    lighthouse.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Lighthouse exited with code ${code}`));
    });
  });
}
