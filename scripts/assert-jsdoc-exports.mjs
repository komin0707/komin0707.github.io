import { readFileSync } from 'node:fs';
import ts from 'typescript';

const configPath = ts.findConfigFile('.', ts.sys.fileExists, 'tsconfig.json');

if (!configPath) {
  throw new Error('Unable to find tsconfig.json');
}

const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
const sourceFiles = parsedConfig.fileNames.filter((fileName) => fileName.startsWith('src/'));
const program = ts.createProgram(sourceFiles, parsedConfig.options);
const missingExports = [];

for (const sourceFile of program.getSourceFiles()) {
  if (sourceFile.isDeclarationFile || !sourceFile.fileName.startsWith('src/')) {
    continue;
  }

  const sourceText = readFileSync(sourceFile.fileName, 'utf8');

  const visit = (node) => {
    if (isDocumentedExport(node, sourceText, sourceFile)) {
      ts.forEachChild(node, visit);
      return;
    }

    if (isExportedDeclaration(node)) {
      const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      missingExports.push(`${sourceFile.fileName}:${location.line + 1}`);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

if (missingExports.length > 0) {
  throw new Error(`Missing JSDoc on exported declarations:\n${missingExports.join('\n')}`);
}

function isExportedDeclaration(node) {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  const exported = modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

  return (
    exported === true &&
    (ts.isClassDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isVariableStatement(node))
  );
}

function isDocumentedExport(node, sourceText, sourceFile) {
  if (!isExportedDeclaration(node)) {
    return true;
  }

  if (ts.getJSDocCommentsAndTags(node).length > 0) {
    return true;
  }

  const leadingText = sourceText.slice(Math.max(0, node.getFullStart() - 8), node.getStart(sourceFile));
  return leadingText.includes('/**');
}
