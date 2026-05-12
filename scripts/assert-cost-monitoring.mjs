import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const distDirectory = 'dist';
const artifactDirectory = 'artifacts';
const artifactPath = join(artifactDirectory, 'cost-monitoring.json');
const maxMonthlyStaticHostingUsd = 0;
const maxArtifactStorageMegabytes = 25;
const estimatedCiMinutesPerRun = 12;

if (!existsSync(distDirectory)) {
  throw new Error('Missing dist output. Run npm run build before cost monitoring.');
}

const files = listFiles(distDirectory);
const totalBytes = files.reduce((total, file) => total + statSync(file).size, 0);
const gzipBytes = files.reduce((total, file) => total + gzipSync(readFileSync(file)).length, 0);
const artifactStorageMegabytes = Number((totalBytes / 1024 / 1024).toFixed(3));
const summary = {
  artifactStorageMegabytes,
  estimatedCiMinutesPerRun,
  estimatedMonthlyStaticHostingUsd: 0,
  gzipBytes,
  maxArtifactStorageMegabytes,
  maxMonthlyStaticHostingUsd,
  measuredAt: new Date().toISOString(),
  totalBytes,
};

if (summary.estimatedMonthlyStaticHostingUsd > maxMonthlyStaticHostingUsd) {
  throw new Error(
    `Static hosting cost exceeded: ${summary.estimatedMonthlyStaticHostingUsd} > ${maxMonthlyStaticHostingUsd}`,
  );
}

if (artifactStorageMegabytes > maxArtifactStorageMegabytes) {
  throw new Error(
    `Artifact storage budget exceeded: ${artifactStorageMegabytes} MB > ${maxArtifactStorageMegabytes} MB`,
  );
}

mkdirSync(artifactDirectory, { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(summary, null, 2)}\n`);

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}
