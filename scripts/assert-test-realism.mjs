import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const artifactPath = 'artifacts/manual-evidence/test-realism.json';
const roots = ['src', 'scripts'];
const testFilePattern = /\.(?:test|spec)\.(?:ts|tsx|mjs|js)$/;
const doublePattern =
  /\b(?:vi|jest)\.mock\b|\bvi\.spyOn\b|\bvi\.stub(?:Global|Env)\b|mock(?:Implementation|ReturnValue|ResolvedValue|RejectedValue)\b/;
const assertionPattern = /\bexpect\s*\(/;
const behaviorPattern = /\brender\s*\(|\buserEvent\.|\bfireEvent\.|\bpage\.|\btest\.step\s*\(/;
const localProductionImportPattern =
  /^\s*import(?:\s+type)?\s+.+?\s+from\s+['"](?:\.\.?\/)(?!.*(?:\.test|\.spec|\/test\/|\/e2e\/))/m;

const testFiles = roots.flatMap(listFiles).filter((file) => testFilePattern.test(file));
const vitestList = readOptionalJson('artifacts/vitest-list.json');
const fileSummaries = testFiles.map(readTestFileSummary);
const e2eFiles = fileSummaries.filter((file) => file.isE2e);
const behaviorFiles = fileSummaries.filter((file) => file.hasBehaviorSignal);
const productionImportFiles = fileSummaries.filter((file) => file.hasProductionImport);
const doubleFiles = fileSummaries.filter((file) => file.usesTestDoubles);
const doubleFilesWithoutAssertions = doubleFiles.filter((file) => !file.hasAssertion);
const doubleOnlyFiles = doubleFiles.filter((file) => !file.hasBehaviorSignal && !file.hasProductionImport);
const vitestCandidateFiles = fileSummaries.filter((file) => !file.isE2e);
const vitestListedFiles = new Set(
  Array.isArray(vitestList) ? vitestList.map((testCase) => normalizePath(testCase.file)) : [],
);
const vitestMissingFiles = vitestCandidateFiles
  .map((file) => file.path)
  .filter((path) => !vitestListedFiles.has(normalizePath(path)));
const vitestTestCount = Array.isArray(vitestList) ? vitestList.length : 0;
const vitestFileCount = Array.isArray(vitestList)
  ? new Set(vitestList.map((testCase) => testCase.file)).size
  : 0;

const failures = [
  testFiles.length === 0 ? 'No test files were found.' : '',
  vitestTestCount === 0 ? 'Vitest list evidence is missing or empty.' : '',
  vitestMissingFiles.length > 0
    ? `Vitest list evidence does not include current test files: ${vitestMissingFiles.join(', ')}`
    : '',
  e2eFiles.length === 0 ? 'No E2E spec file was found.' : '',
  behaviorFiles.length === 0 ? 'No behavior-oriented render, interaction, or browser spec was found.' : '',
  productionImportFiles.length === 0 ? 'No test file imports production source.' : '',
  doubleFiles.length === testFiles.length
    ? 'Every test file uses test doubles; the suite is not independently behavioral.'
    : '',
  doubleFilesWithoutAssertions.length > 0
    ? `Files using test doubles without assertions: ${doubleFilesWithoutAssertions
        .map((file) => file.path)
        .join(', ')}`
    : '',
  doubleOnlyFiles.length > 0
    ? `Files using test doubles without behavior or production-import signals: ${doubleOnlyFiles
        .map((file) => file.path)
        .join(', ')}`
    : '',
].filter(Boolean);

const artifact = {
  verifiedAt: new Date().toISOString(),
  verifier: 'Codex test realism verifier',
  result: failures.length === 0 ? 'passed' : 'failed',
  evidence:
    'The test suite combines production-source imports, behavior-oriented component/browser checks, E2E coverage, and constrained test doubles for platform boundaries.',
  testFileCount: testFiles.length,
  vitestCandidateFileCount: vitestCandidateFiles.length,
  vitestFileCount,
  vitestTestCount,
  vitestMissingFiles,
  e2eFileCount: e2eFiles.length,
  behaviorFileCount: behaviorFiles.length,
  productionImportFileCount: productionImportFiles.length,
  testDoubleFileCount: doubleFiles.length,
  testDoubleFilesWithoutAssertions: doubleFilesWithoutAssertions.map((file) => file.path),
  testDoubleOnlyFiles: doubleOnlyFiles.map((file) => file.path),
  representativeFiles: {
    behavior: behaviorFiles.slice(0, 10).map((file) => file.path),
    e2e: e2eFiles.map((file) => file.path),
    productionImports: productionImportFiles.slice(0, 10).map((file) => file.path),
    testDoubles: doubleFiles.slice(0, 10).map((file) => file.path),
  },
  requiredToComplete:
    failures.length === 0
      ? []
      : [
          'Keep behavior and E2E tests that exercise production code paths.',
          'Use test doubles only for platform boundaries, and pair them with assertions and production behavior checks.',
        ],
  failures,
};

mkdirSync('artifacts/manual-evidence', { recursive: true });
await writeJson(artifactPath, artifact);

process.stdout.write(
  `${JSON.stringify(
    {
      artifactPath,
      result: artifact.result,
      testFileCount: artifact.testFileCount,
      vitestTestCount: artifact.vitestTestCount,
      e2eFileCount: artifact.e2eFileCount,
      testDoubleFileCount: artifact.testDoubleFileCount,
    },
    null,
    2,
  )}\n`,
);

if (artifact.result !== 'passed') {
  process.exitCode = 1;
}

function listFiles(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') return [];
    return listFiles(join(path, entry.name));
  });
}

function readTestFileSummary(path) {
  const source = readFileSync(path, 'utf8');
  return {
    path,
    hasAssertion: assertionPattern.test(source),
    hasBehaviorSignal: behaviorPattern.test(source),
    hasProductionImport: localProductionImportPattern.test(source),
    isE2e: path.includes('/e2e/') || /\.spec\./.test(path),
    usesTestDoubles: doublePattern.test(source),
  };
}

function readOptionalJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

function normalizePath(path) {
  return isAbsolute(path) ? relative(process.cwd(), path) : path;
}

async function writeJson(path, value) {
  writeFileSync(
    path,
    await format(JSON.stringify(value), { ...((await resolveConfig(path)) ?? {}), parser: 'json' }),
  );
}
