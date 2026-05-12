import { mkdir, rename } from 'node:fs/promises';
import { get } from 'node:http';
import { join } from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const previewPort = 4174;
const previewUrl = `http://127.0.0.1:${previewPort}`;
const artifactsDir = 'artifacts';
const videoDir = join(artifactsDir, 'demo-video');

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

async function waitForPreview() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await isPreviewReady()) {
      return;
    }
    await delay(250);
  }
  throw new Error(`Preview server did not start at ${previewUrl}`);
}

function isPreviewReady() {
  return new Promise((resolve) => {
    const request = get(previewUrl, (response) => {
      response.resume();
      resolve(Boolean(response.statusCode && response.statusCode < 500));
    });
    request.on('error', () => resolve(false));
    request.end();
  });
}

await mkdir(videoDir, { recursive: true });
await runCommand('npm', ['run', 'build']);

const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(previewPort)], {
  stdio: 'ignore',
});

try {
  await waitForPreview();
  const browser = await chromium.launch(chromiumLaunchOptions());
  const context = await browser.newContext({
    recordVideo: { dir: videoDir, size: { height: 720, width: 1280 } },
    viewport: { height: 720, width: 1280 },
  });
  const page = await context.newPage();

  await page.goto(previewUrl);
  await page.getByRole('button', { name: 'CPAP' }).click();
  await page.locator('.scenario-select select').selectOption('normal');
  await page.getByLabel('시뮬레이션 속도').selectOption('5');
  await page.getByRole('button', { name: /JSON 내보내기/ }).click();
  await page.waitForTimeout(1200);
  await page.locator('.scenario-select select').selectOption('ards');
  await page.waitForTimeout(1200);
  await page.locator('.scenario-select select').selectOption('pneumothorax');
  await page.waitForTimeout(1200);

  const video = page.video();
  await context.close();
  await browser.close();
  if (!video) {
    throw new Error('Playwright did not produce a demo video');
  }
  await rename(await video.path(), join(artifactsDir, 'demo.webm'));
} finally {
  preview.kill('SIGTERM');
}

function chromiumLaunchOptions() {
  return { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' };
}
