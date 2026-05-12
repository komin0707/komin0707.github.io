import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const roots = ['src', 'scripts', 'vite.config.ts'];
const sourceFilePattern = /\.(?:mjs|ts|tsx)$/;
const skippedPathPattern = /\.(?:test|stories)\.(?:mjs|js|ts|tsx)$/;
const bannedTextPatterns = [
  { id: 'ts-ignore', pattern: new RegExp(`@ts-${'ignore'}`) },
  { id: 'console-log', pattern: new RegExp(`console\\.${'log'}`) },
  { id: 'todo-comment', pattern: new RegExp(`\\b(?:TO${'DO'}|FIX${'ME'})\\b`) },
  {
    id: 'bypass-marker',
    pattern: new RegExp(
      `\\b(?:tempo${'rary'}|work${'around'}|ha${'ck'}|quick\\s*fi${'x'}|for\\s+no${'w'}|임${'시'})\\b`,
      'i',
    ),
  },
];

const files = roots.flatMap(listSourceFiles);
const findings = files.flatMap((file) => [...findBannedText(file), ...findExplicitAny(file)]);
const ruleIds = [...bannedTextPatterns.map((pattern) => pattern.id), 'explicit-any'];

if (findings.length > 0) {
  process.stderr.write(`${JSON.stringify(findings, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify(
      {
        result: 'passed',
        roots,
        ruleIds,
        scannedFileCount: files.length,
      },
      null,
      2,
    )}\n`,
  );
}

function listSourceFiles(path) {
  if (!existsSync(path)) return [];
  if (!isDirectory(path)) return isScannedFile(path) ? [path] : [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') return [];
    return listSourceFiles(join(path, entry.name));
  });
}

function isDirectory(path) {
  return statSync(path).isDirectory();
}

function isScannedFile(path) {
  return sourceFilePattern.test(path) && !skippedPathPattern.test(path);
}

function findBannedText(file) {
  const source = readFileSync(file, 'utf8');
  return bannedTextPatterns.flatMap(({ id, pattern }) => {
    const match = pattern.exec(source);
    return match ? [{ file, id, line: lineForOffset(source, match.index) }] : [];
  });
}

function findExplicitAny(file) {
  if (!/\.(?:ts|tsx)$/.test(file)) return [];
  const source = readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const findings = [];
  visit(sourceFile, (node) => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      findings.push({
        file,
        id: 'explicit-any',
        line: sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1,
      });
    }
  });
  return findings;
}

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
}

function lineForOffset(source, offset) {
  return source.slice(0, offset).split('\n').length;
}
