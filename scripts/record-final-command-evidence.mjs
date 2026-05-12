/* global fetch, setTimeout */

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const artifactPath = 'artifacts/manual-evidence/final-command-evidence.json';
const maxOutputChars = 20_000;
const devPort = Number(process.env.FINAL_DEV_SMOKE_PORT ?? 4177);
const devUrl = `http://127.0.0.1:${devPort}`;

const commands = {};
commands['npm run clean'] = runCommand('npm', ['run', 'clean']);
commands['npm install'] = runCommand('npm', ['install']);
commands['npm run build'] = runCommand('npm', ['run', 'build']);
commands['npm run docs:storybook'] = runCommand('npm', ['run', 'docs:storybook']);
commands['npm run dev'] = await runDevSmoke();

const artifact = {
  artifactPath,
  commands,
  dist: summarizeDist(),
  docsStorybook: readDirectoryEvidence('docs/storybook'),
  result: Object.values(commands).every((command) => command.result === 'passed') ? 'passed' : 'failed',
  verifiedAt: new Date().toISOString(),
};

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(artifactPath, await formatJson(artifactPath, artifact));
process.stdout.write(
  `${JSON.stringify(
    {
      artifactPath,
      result: artifact.result,
      verifiedAt: artifact.verifiedAt,
    },
    null,
    2,
  )}\n`,
);

if (artifact.result !== 'passed') {
  process.exitCode = 1;
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });

  return {
    command: [command, ...args].join(' '),
    exitCode: result.status,
    result: result.status === 0 ? 'passed' : 'failed',
    signal: result.signal,
    stderr: truncate(result.stderr ?? ''),
    stdout: truncate(result.stdout ?? ''),
  };
}

async function runDevSmoke() {
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(devPort)], {
    env: { ...process.env, FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    const response = await waitForServer(devUrl);
    return {
      command: `npm run dev -- --host 127.0.0.1 --port ${String(devPort)}`,
      exitCode: 0,
      httpStatus: response.status,
      result: 'passed',
      stderr: truncate(stderr),
      stdout: truncate(stdout),
      url: devUrl,
    };
  } catch (error) {
    return {
      command: `npm run dev -- --host 127.0.0.1 --port ${String(devPort)}`,
      exitCode: 1,
      result: 'failed',
      stderr: truncate(`${stderr}\n${error instanceof Error ? error.message : String(error)}`),
      stdout: truncate(stdout),
      url: devUrl,
    };
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('close', resolve));
  }
}

async function waitForServer(url) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`Dev server did not become ready at ${url}`);
}

function summarizeDist() {
  if (!existsSync('dist')) {
    return {
      exists: false,
    };
  }

  const files = listFiles('dist');
  const primaryFiles = files.filter((file) => !/\.(?:br|gz)$/i.test(file));
  const primaryJsCssFiles = primaryFiles.filter((file) => /^dist\/assets\/.+\.(?:css|js)$/i.test(file));

  return {
    exists: true,
    fileCount: files.length,
    primaryBytesNoCompressedSidecars: byteTotal(primaryFiles),
    primaryJsCssBytes: byteTotal(primaryJsCssFiles),
    primaryJsCssFiles,
    sha256: hashFiles(files),
    totalBytes: byteTotal(files),
  };
}

function readDirectoryEvidence(path) {
  if (!existsSync(path)) {
    return {
      exists: false,
      path,
    };
  }
  const files = listFiles(path);
  return {
    exists: true,
    fileCount: files.length,
    path,
    sha256: hashFiles(files),
    totalBytes: byteTotal(files),
  };
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : path;
  });
}

function byteTotal(files) {
  return files.reduce((total, file) => total + statSync(file).size, 0);
}

function hashFiles(files) {
  const hash = createHash('sha256');
  for (const file of [...files].sort()) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function truncate(value) {
  if (value.length <= maxOutputChars) return value;
  const suffix = `\n[truncated to ${String(maxOutputChars)} characters]\n`;
  return `${value.slice(0, maxOutputChars)}${suffix}`;
}

async function formatJson(path, value) {
  const options = (await resolveConfig(path)) ?? {};
  return format(JSON.stringify(value), { ...options, parser: 'json' });
}
