/* global fetch, setTimeout */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { format, resolveConfig } from 'prettier';

const artifactPath = 'artifacts/manual-evidence/patient-visual-review-packet.json';
const markdownPath = 'artifacts/manual-evidence/patient-visual-review-rubric.md';
const screenshotDirectory = 'artifacts/manual-evidence/patient-visual-review';
const port = Number(process.env.PATIENT_VISUAL_REVIEW_PORT ?? 4179);
const baseUrl = `http://127.0.0.1:${port}`;
const scenarios = [
  { id: 'normal', label: 'Normal baseline' },
  { id: 'pneumonia', label: 'Pneumonia' },
  { id: 'ards', label: 'ARDS' },
  { id: 'airwayObstruction', label: 'Airway obstruction' },
  { id: 'pneumothorax', label: 'Pneumothorax' },
];
const rubric = [
  'Human morphology: face, head, torso, arms, hands, and body proportions read as a patient rather than a symbolic diagram.',
  'Bedside context: pillow, bed surface, gown, lines, circuit, and airway equipment are visible and clinically coherent.',
  'Respiratory state: chest movement, breath source, breath pattern, and oxygenation cues match the selected scenario.',
  'Clinical pathology: scenario-specific color, perfusion, lung, secretion, or distress cues are visible without hiding anatomy.',
  'Readability: overlays and labels support clinical interpretation without visual clutter or occlusion.',
];

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(baseUrl);
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' });
  const page = await browser.newPage({ viewport: { height: 900, width: 1440 } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByTestId('vent-simulator').waitFor({ state: 'visible', timeout: 10_000 });

  mkdirSync(screenshotDirectory, { recursive: true });
  const captures = [];
  for (const scenario of scenarios) {
    await page.locator('.scenario-select select').selectOption(scenario.id);
    await page.waitForTimeout(250);
    const avatar = page.getByTestId('patient-avatar');
    await avatar.waitFor({ state: 'visible', timeout: 10_000 });
    const screenshotPath = join(screenshotDirectory, `${scenario.id}.png`);
    await avatar.screenshot({ animations: 'disabled', path: screenshotPath });
    captures.push({
      ...scenario,
      attributes: await avatar.evaluate((element) => ({
        alarmLevel: element.getAttribute('data-alarm-level'),
        breathPattern: element.getAttribute('data-breath-pattern'),
        breathSource: element.getAttribute('data-breath-source'),
        condition: element.getAttribute('data-condition'),
        expression: element.getAttribute('data-expression'),
        scenario: element.getAttribute('data-scenario'),
      })),
      boundingBox: await avatar.boundingBox(),
      screenshot: fileEvidence(screenshotPath),
    });
  }
  await browser.close();

  const artifact = {
    artifactPath,
    captures,
    checkedAt: new Date().toISOString(),
    limitation:
      'This packet prepares objective screenshots and rubric criteria for external visual/clinical reviewers; it is not a substitute for human reviewer sign-off.',
    result: captures.every((capture) => capture.screenshot.sizeBytes > 0 && capture.boundingBox)
      ? 'review-packet-ready'
      : 'failed',
    reviewerRubricPath: markdownPath,
    rubric,
  };

  mkdirSync(dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, await formatJson(artifactPath, artifact));
  writeFileSync(markdownPath, buildMarkdown(artifact));
  process.stdout.write(
    `${JSON.stringify(
      {
        artifactPath,
        captureCount: captures.length,
        result: artifact.result,
        reviewerRubricPath: markdownPath,
      },
      null,
      2,
    )}\n`,
  );
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

function fileEvidence(path) {
  const bytes = readFileSync(path);
  return {
    path,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sizeBytes: bytes.length,
  };
}

function buildMarkdown(artifact) {
  const lines = [
    '# Patient Visual Review Rubric',
    '',
    `Generated: ${artifact.checkedAt}`,
    '',
    'This packet is for external human review. A reviewer must inspect each screenshot and record pass/fail notes; automated capture alone does not satisfy the final human visual/clinical confirmation requirement.',
    '',
    '## Rubric',
    '',
    ...artifact.rubric.map((item) => `- [ ] ${item}`),
    '',
    '## Screenshots',
    '',
    ...artifact.captures.flatMap((capture) => [
      `### ${capture.label}`,
      '',
      `- Scenario: \`${capture.id}\``,
      `- Screenshot: \`${capture.screenshot.path}\``,
      `- State: condition=\`${capture.attributes.condition}\`, breathPattern=\`${capture.attributes.breathPattern}\`, breathSource=\`${capture.attributes.breathSource}\`, expression=\`${capture.attributes.expression}\`, alarmLevel=\`${capture.attributes.alarmLevel}\``,
      '',
      'Reviewer notes:',
      '',
      '- Human morphology:',
      '- Clinical coherence:',
      '- Respiratory/pathology cues:',
      '- Required changes:',
      '',
    ]),
  ];
  return `${lines.join('\n')}\n`;
}

async function formatJson(path, value) {
  const options = (await resolveConfig(path)) ?? {};
  return format(JSON.stringify(value), { ...options, parser: 'json' });
}
