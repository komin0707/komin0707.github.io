import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const artifactPath = 'artifacts/manual-evidence/phase-gate-command-results.json';
const maxOutputChars = 20_000;
const gates = [
  {
    command: 'npm run type-check',
    id: 'typeCheck',
    npmArgs: ['run', 'type-check'],
  },
  {
    command: 'npm run format:check',
    id: 'formatCheck',
    npmArgs: ['run', 'format:check'],
  },
  {
    command: 'npm run lint',
    id: 'lint',
    npmArgs: ['run', 'lint', '--', '--quiet'],
  },
  {
    command: 'npm run lint:css',
    id: 'lintCss',
    npmArgs: ['run', 'lint:css'],
  },
  {
    command: 'npm run build',
    id: 'build',
    npmArgs: ['run', 'build'],
  },
  {
    command: 'npm test',
    id: 'test',
    npmArgs: ['test'],
  },
  {
    command: 'npm run test:e2e',
    id: 'e2e',
    npmArgs: ['run', 'test:e2e'],
  },
  {
    command: 'npm run check:no-raster',
    id: 'noRaster',
    npmArgs: ['run', 'check:no-raster'],
  },
  {
    command: 'npm run check:bundle-size',
    id: 'bundleSize',
    npmArgs: ['run', 'check:bundle-size'],
  },
  {
    command: 'npm run check:contrast',
    id: 'contrast',
    npmArgs: ['run', 'check:contrast'],
  },
  {
    command: 'npm run check:performance',
    id: 'performance',
    npmArgs: ['run', 'check:performance'],
  },
  {
    command: 'npm run check:lighthouse',
    id: 'lighthouse',
    npmArgs: ['run', 'check:lighthouse'],
  },
  {
    command: 'npm run check:memory',
    id: 'memory',
    npmArgs: ['run', 'check:memory'],
  },
  {
    command: 'npm run check:jsdoc-exports',
    id: 'jsdocExports',
    npmArgs: ['run', 'check:jsdoc-exports'],
  },
  {
    command: 'npm run check:licenses',
    id: 'licenses',
    npmArgs: ['run', 'check:licenses'],
  },
  {
    command: 'npm run check:forbidden-patterns',
    id: 'forbiddenPatterns',
    npmArgs: ['run', 'check:forbidden-patterns'],
  },
  {
    command: 'npm run docs:codemap',
    id: 'docsCodemap',
    npmArgs: ['run', 'docs:codemap'],
  },
  {
    command: 'npm run docs:api',
    id: 'docsApi',
    npmArgs: ['run', 'docs:api'],
  },
  {
    command: 'npm run docs:pdf',
    id: 'docsPdf',
    npmArgs: ['run', 'docs:pdf'],
  },
  {
    command: 'npm run test:coverage',
    id: 'coverage',
    npmArgs: ['run', 'test:coverage'],
  },
];

const startedAt = new Date().toISOString();
const commands = Object.fromEntries(gates.map((gate) => [gate.id, runGate(gate)]));
const artifact = {
  artifactPath,
  commands,
  dist: summarizeDist(),
  result: Object.values(commands).every((command) => command.exitCode === 0) ? 'passed' : 'failed',
  screenshots: ['artifacts/patient-avatar-current.png', 'artifacts/simulator-current.png'].map(
    readFileEvidence,
  ),
  startedAt,
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

function runGate(gate) {
  const result = spawnSync('npm', gate.npmArgs, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });

  return {
    command: gate.command,
    exitCode: result.status,
    signal: result.signal,
    stderr: truncate(result.stderr ?? ''),
    stdout: truncate(result.stdout ?? ''),
  };
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
  const rasterAssets = files.filter((file) => /\.(?:avif|gif|jpe?g|png|webp)$/i.test(file));

  return {
    exists: true,
    fileCount: files.length,
    primaryBytesNoCompressedSidecars: byteTotal(primaryFiles),
    primaryJsCssBytes: byteTotal(primaryJsCssFiles),
    primaryJsCssFiles,
    rasterAssets,
    transferBrotliJsCssBytes: byteTotal(
      primaryJsCssFiles.map((file) => (existsSync(`${file}.br`) ? `${file}.br` : file)),
    ),
    totalBytes: byteTotal(files),
  };
}

function readFileEvidence(path) {
  if (!existsSync(path)) {
    return {
      exists: false,
      path,
    };
  }

  const bytes = readFileSync(path);
  return {
    exists: true,
    path,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sizeBytes: bytes.length,
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

function truncate(value) {
  if (value.length <= maxOutputChars) return value;
  const suffix = `\n[truncated to ${String(maxOutputChars)} characters]\n`;
  return `${value.slice(0, maxOutputChars)}${suffix}`;
}

async function formatJson(path, value) {
  const options = (await resolveConfig(path)) ?? {};
  return format(JSON.stringify(value), { ...options, parser: 'json' });
}
