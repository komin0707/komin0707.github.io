import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { parse } from 'acorn';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { brotliCompress, constants, gzip } from 'node:zlib';
import { visualizer } from 'rollup-plugin-visualizer';
import { promisify } from 'node:util';
import type { Plugin, PluginOption, ResolvedConfig } from 'vite';

const sourceAlias = fileURLToPath(new URL('./src', import.meta.url));
const brotliCompressAsync = promisify(brotliCompress);
const gzipAsync = promisify(gzip);
const compressibleAssetPattern = /\.(?:js|mjs|json|css|html)$/i;
const minimumCompressedAssetBytes = 1024;
const javascriptAttributeAliasReplacements = [
  ['clipPath', '_a'],
  ['dominantBaseline', '_b'],
  ['fillOpacity', '_c'],
  ['fillRule', '_d'],
  ['shapeRendering', '_e'],
  ['stopColor', '_f'],
  ['stopOpacity', '_g'],
  ['strokeDasharray', '_h'],
  ['strokeDashoffset', '_i'],
  ['strokeLinecap', '_j'],
  ['strokeLinejoin', '_k'],
  ['strokeMiterlimit', '_l'],
  ['strokeOpacity', '_m'],
  ['strokeWidth', '_n'],
  ['textAnchor', '_o'],
  ['vectorEffect', '_p'],
] as const;
const javascriptDomPropertyAliasReplacements = [
  ['data-testid', '_A'],
  ['aria-label', '_B'],
  ['aria-hidden', '_C'],
  ['aria-describedby', '_D'],
  ['aria-labelledby', '_E'],
  ['aria-live', '_F'],
  ['aria-atomic', '_G'],
  ['aria-modal', '_H'],
  ['aria-checked', '_I'],
  ['aria-selected', '_J'],
  ['aria-valuemax', '_K'],
  ['aria-valuemin', '_L'],
  ['aria-valuenow', '_M'],
  ['htmlFor', '_N'],
  ['tabIndex', '_O'],
  ['onClick', '_P'],
  ['onChange', '_Q'],
  ['onSubmit', '_R'],
  ['onKeyDown', '_S'],
  ['onContextMenu', '_T'],
  ['onDragOver', '_U'],
  ['onDrop', '_V'],
  ['onTouchEnd', '_W'],
  ['onTouchMove', '_X'],
  ['onTouchStart', '_Y'],
  ['type', '_Z'],
  ['value', '_aa'],
  ['min', '_ab'],
  ['max', '_ac'],
  ['step', '_ad'],
  ['style', '_ae'],
  ['title', '_af'],
  ['disabled', '_ag'],
  ['placeholder', '_ah'],
  ['inputMode', '_ai'],
  ['href', '_aj'],
  ['aria-invalid', '_ak'],
  ['aria-required', '_al'],
  ['data-scenario-pending', '_am'],
  ['data-waveform-kind', '_an'],
  ['data-palette', '_ao'],
  ['data-scroll-bucket', '_ap'],
  ['data-viewport-width', '_aq'],
  ['data-fio2', '_ar'],
  ['data-breath-source', '_as'],
  ['data-breath-pattern', '_at'],
  ['data-condition', '_au'],
  ['data-expression', '_av'],
  ['data-alarm-level', '_aw'],
  ['className', '_q'],
  ['children', '_r'],
  ['fill', '_s'],
  ['stroke', '_t'],
  ['opacity', '_u'],
  ['width', '_v'],
  ['height', '_w'],
  ['viewBox', '_x'],
  ['preserveAspectRatio', '_y'],
  ['role', '_z'],
] as const;
const javascriptDomPropertyAliasMap = new Map<string, string>(javascriptDomPropertyAliasReplacements);
const classNamePattern = /(?<![A-Za-z0-9_-])\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g;
const classTokenMinimumLength = 10;
const classTokenPattern = /(?<![A-Za-z0-9_-])([_a-zA-Z][_a-zA-Z0-9-]*-[A-Za-z0-9_-]*)(?![A-Za-z0-9_-])/g;
const quotedClassTokenPattern = /['"`]([_a-zA-Z][_a-zA-Z0-9-]*-[A-Za-z0-9_-]*)['"`]/g;
const hyphenatedTokenPattern = /(?<![A-Za-z0-9_-])([_a-zA-Z][_a-zA-Z0-9-]*-[A-Za-z0-9_-]*)(?![A-Za-z0-9_-])/g;
const cssCustomPropertyPattern = /--[_a-zA-Z][_a-zA-Z0-9-]*/g;
const cssCustomPropertyMinimumLength = 10;
const productionClassPrefix = 'x';
const productionCustomPropertyPrefix = '--v';
const svgPathHelperName = '__vp';
const svgPathHelperProps = [
  ['className', 'c'],
  ['d', 'd'],
  ['fill', 'f'],
  ['fillOpacity', 'fo'],
  ['fillRule', 'fr'],
  ['filter', 'fi'],
  ['id', 'i'],
  ['opacity', 'o'],
  ['stroke', 's'],
  ['strokeDasharray', 'sd'],
  ['strokeDashoffset', 'sx'],
  ['strokeLinecap', 'sl'],
  ['strokeLinejoin', 'sj'],
  ['strokeMiterlimit', 'sm'],
  ['strokeOpacity', 'so'],
  ['strokeWidth', 'sw'],
  ['transform', 'tr'],
  ['vectorEffect', 've'],
] as const;
const svgPathHelperPropAliases = new Map<string, string>(svgPathHelperProps);
const svgBasicShapeHelperConfigs = [
  {
    helperName: '__vc',
    props: [
      ['className', 'c'],
      ['cx', 'x'],
      ['cy', 'y'],
      ['fill', 'f'],
      ['opacity', 'o'],
      ['r', 'r'],
      ['stroke', 's'],
      ['strokeOpacity', 'so'],
      ['strokeWidth', 'sw'],
    ],
    tagName: 'circle',
  },
  {
    helperName: '__vr',
    props: [
      ['className', 'c'],
      ['fill', 'f'],
      ['height', 'h'],
      ['opacity', 'o'],
      ['rx', 'rx'],
      ['stroke', 's'],
      ['strokeOpacity', 'so'],
      ['strokeWidth', 'sw'],
      ['width', 'w'],
      ['x', 'x'],
      ['y', 'y'],
    ],
    tagName: 'rect',
  },
  {
    helperName: '__ve',
    props: [
      ['className', 'c'],
      ['cx', 'x'],
      ['cy', 'y'],
      ['fill', 'f'],
      ['opacity', 'o'],
      ['rx', 'rx'],
      ['ry', 'ry'],
      ['stroke', 's'],
      ['strokeOpacity', 'so'],
      ['strokeWidth', 'sw'],
    ],
    tagName: 'ellipse',
  },
] as const;
const productionAliases = [
  { find: '@', replacement: sourceAlias },
  { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' },
  {
    find: 'react-dom/client',
    replacement: fileURLToPath(new URL('./src/preact/reactDomClientShim.ts', import.meta.url)),
  },
  { find: 'react', replacement: fileURLToPath(new URL('./src/preact/reactShim.ts', import.meta.url)) },
];

function compressedAssetsPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig;
  return {
    name: 'vent-simulator-compressed-assets',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      resolvedConfig = config;
    },
    async closeBundle() {
      const outputDirectory = resolve(resolvedConfig.root, resolvedConfig.build.outDir);
      const files = await listCompressibleAssets(outputDirectory);
      await rewriteJavaScriptSvgPathHelpers(files);
      await rewriteJavaScriptSvgBasicShapeHelpers(files);
      await rewriteJavaScriptAttributeAliases(files);
      await rewriteProductionClassNames(files);
      await rewriteProductionCustomProperties(files);
      await rewriteJavaScriptDomPropertyAliases(files);
      await Promise.all(files.map(writeCompressedVariants));
    },
  };
}

async function listCompressibleAssets(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return listCompressibleAssets(path);
      return isCompressibleAsset(path) ? [path] : [];
    }),
  );
  return nestedFiles.flat();
}

function isCompressibleAsset(path: string): boolean {
  return compressibleAssetPattern.test(path) && !path.endsWith('.gz') && !path.endsWith('.br');
}

async function writeCompressedVariants(path: string): Promise<void> {
  const source = await readFile(path);
  if (source.byteLength < minimumCompressedAssetBytes) return;
  const [brotliCompressed, gzipped] = await Promise.all([
    brotliCompressAsync(source, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      },
    }),
    gzipAsync(source, { level: constants.Z_BEST_COMPRESSION }),
  ]);
  await Promise.all([writeFile(`${path}.br`, brotliCompressed), writeFile(`${path}.gz`, gzipped)]);
}

async function rewriteJavaScriptAttributeAliases(files: readonly string[]): Promise<void> {
  await Promise.all(files.filter((path) => path.endsWith('.js')).map(rewriteJavaScriptAttributeAliasFile));
}

async function rewriteJavaScriptSvgPathHelpers(files: readonly string[]): Promise<void> {
  await Promise.all(files.filter((path) => path.endsWith('.js')).map(rewriteJavaScriptSvgPathHelperFile));
}

async function rewriteJavaScriptSvgBasicShapeHelpers(files: readonly string[]): Promise<void> {
  await Promise.all(
    files.filter((path) => path.endsWith('.js')).map(rewriteJavaScriptSvgBasicShapeHelperFile),
  );
}

async function rewriteJavaScriptSvgPathHelperFile(path: string): Promise<void> {
  const source = await readFile(path, 'utf8');
  const parsed = parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });
  const replacements: SourceReplacement[] = [];
  const helper = collectJavaScriptSvgPathHelperReplacements(source, parsed, replacements);
  if (!helper || replacements.length === 0) return;

  replacements.push({ end: helper.insertAt, start: helper.insertAt, text: helper.source });
  const rewritten = applySourceReplacements(source, replacements);
  if (rewritten !== source) await writeFile(path, rewritten);
}

async function rewriteJavaScriptSvgBasicShapeHelperFile(path: string): Promise<void> {
  const source = await readFile(path, 'utf8');
  const parsed = parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });
  const replacements: SourceReplacement[] = [];
  const helpers = collectJavaScriptSvgBasicShapeHelperReplacements(source, parsed, replacements);
  if (helpers.length === 0 || replacements.length === 0) return;

  replacements.push({
    end: helpers[0]?.insertAt ?? 0,
    start: helpers[0]?.insertAt ?? 0,
    text: helpers.map((helper) => helper.source).join(''),
  });
  const rewritten = applySourceReplacements(source, replacements);
  if (rewritten !== source) await writeFile(path, rewritten);
}

function collectJavaScriptSvgPathHelperReplacements(
  source: string,
  parsed: unknown,
  replacements: SourceReplacement[],
): { insertAt: number; source: string } | null {
  if (source.includes(svgPathHelperName)) return null;

  let factoryName: string | null = null;
  collectJavaScriptNodes(parsed, (node) => {
    if (node.type !== 'CallExpression') return;
    const args = asJavaScriptNodeArray(node.arguments);
    const tag = args[0];
    const props = args[1];
    if (!isSvgPathFactoryCall(tag, props)) return;

    const compactProps = compactSvgPathProps(source, props);
    if (compactProps === null) return;

    const callee = node.callee;
    if (!isJavaScriptNode(callee)) return;
    const candidateFactoryName = source.slice(callee.start, callee.end);
    if (factoryName === null) factoryName = candidateFactoryName;
    if (factoryName !== candidateFactoryName) return;

    replacements.push({
      end: node.end,
      start: node.start,
      text: `${svgPathHelperName}([${compactProps}])`,
    });
  });

  if (factoryName === null) return null;
  return {
    insertAt: moduleHelperInsertPosition(parsed),
    source: `const ${svgPathHelperName}=e=>${factoryName}("path",{className:e[0],d:e[1],fill:e[2],fillOpacity:e[3],fillRule:e[4],filter:e[5],id:e[6],opacity:e[7],stroke:e[8],strokeDasharray:e[9],strokeDashoffset:e[10],strokeLinecap:e[11],strokeLinejoin:e[12],strokeMiterlimit:e[13],strokeOpacity:e[14],strokeWidth:e[15],transform:e[16],vectorEffect:e[17]});`,
  };
}

function collectJavaScriptSvgBasicShapeHelperReplacements(
  source: string,
  parsed: unknown,
  replacements: SourceReplacement[],
): Array<{ insertAt: number; source: string }> {
  return svgBasicShapeHelperConfigs.flatMap((config) =>
    collectJavaScriptSvgBasicShapeHelperConfigReplacements(source, parsed, replacements, config),
  );
}

function collectJavaScriptSvgBasicShapeHelperConfigReplacements(
  source: string,
  parsed: unknown,
  replacements: SourceReplacement[],
  config: (typeof svgBasicShapeHelperConfigs)[number],
): Array<{ insertAt: number; source: string }> {
  if (source.includes(config.helperName)) return [];

  const propAliases = new Map<string, string>(config.props);
  let factoryName: string | null = null;
  let replacementCount = 0;

  collectJavaScriptNodes(parsed, (node) => {
    if (node.type !== 'CallExpression') return;
    const args = asJavaScriptNodeArray(node.arguments);
    if (args.length !== 2) return;
    const tag = args[0];
    const props = args[1];
    if (!isSvgElementFactoryCall(tag, props, config.tagName)) return;

    const compactProps = compactSvgElementProps(source, props, propAliases);
    if (compactProps === null) return;

    const callee = node.callee;
    if (!isJavaScriptNode(callee)) return;
    const candidateFactoryName = source.slice(callee.start, callee.end);
    if (factoryName === null) factoryName = candidateFactoryName;
    if (factoryName !== candidateFactoryName) return;

    replacementCount += 1;
    replacements.push({
      end: node.end,
      start: node.start,
      text: `${config.helperName}([${compactProps}])`,
    });
  });

  if (factoryName === null || replacementCount === 0) return [];
  return [
    {
      insertAt: moduleHelperInsertPosition(parsed),
      source: `const ${config.helperName}=e=>${factoryName}("${config.tagName}",{${config.props
        .map(([propertyName], index) => `${propertyName}:e[${index}]`)
        .join(',')}});`,
    },
  ];
}

function isSvgPathFactoryCall(
  tag: JavaScriptNode | undefined,
  props: JavaScriptNode | undefined,
): props is JavaScriptNode {
  return tag?.type === 'Literal' && tag.value === 'path' && props?.type === 'ObjectExpression';
}

function isSvgElementFactoryCall(
  tag: JavaScriptNode | undefined,
  props: JavaScriptNode | undefined,
  tagName: string,
): props is JavaScriptNode {
  return tag?.type === 'Literal' && tag.value === tagName && props?.type === 'ObjectExpression';
}

function compactSvgPathProps(source: string, props: JavaScriptNode): string | null {
  return compactSvgElementProps(source, props, svgPathHelperPropAliases);
}

function compactSvgElementProps(
  source: string,
  props: JavaScriptNode,
  propAliases: ReadonlyMap<string, string>,
): string | null {
  const compactProps: string[] = Array.from({ length: propAliases.size }, () => '');
  for (const property of asJavaScriptNodeArray(props.properties)) {
    const compactProp = compactSvgElementProp(source, property, propAliases);
    if (compactProp === null) return null;
    compactProps[compactProp.index] = compactProp.value;
  }
  while (compactProps.at(-1) === '') compactProps.pop();
  return compactProps.join(',');
}

function compactSvgElementProp(
  source: string,
  property: JavaScriptNode,
  propAliases: ReadonlyMap<string, string>,
): { index: number; value: string } | null {
  if (property.type !== 'Property' || property.computed === true || property.shorthand === true) return null;
  const key = property.key;
  const value = property.value;
  if (!isJavaScriptNode(key) || !isJavaScriptNode(value)) return null;

  const propertyName = propertyNameFromKey(key);
  if (propertyName === null) return null;

  const compactName = propAliases.get(propertyName);
  if (compactName === undefined) return null;
  const index = [...propAliases.values()].indexOf(compactName);
  if (index === -1) return null;
  return { index, value: source.slice(value.start, value.end) };
}

function moduleHelperInsertPosition(parsed: unknown): number {
  if (!isJavaScriptNode(parsed)) return 0;
  const body = asJavaScriptNodeArray(parsed.body);
  let insertAt = 0;
  for (const node of body) {
    if (node.type !== 'ImportDeclaration') break;
    insertAt = node.end;
  }
  return insertAt;
}

async function rewriteJavaScriptAttributeAliasFile(path: string): Promise<void> {
  const source = await readFile(path, 'utf8');
  let rewritten = source;

  for (const [reactName, productionName] of javascriptAttributeAliasReplacements) {
    rewritten = rewritten.split(`${reactName}:`).join(`${productionName}:`);
  }

  if (rewritten !== source) await writeFile(path, rewritten);
}

async function rewriteProductionClassNames(files: readonly string[]): Promise<void> {
  const cssFiles = files.filter((path) => path.endsWith('.css'));
  if (cssFiles.length === 0) return;

  const preservedClassNames = await readPreservedClassNames();
  const cssSources = await Promise.all(cssFiles.map((path) => readFile(path, 'utf8')));
  const classNames = collectProductionClassNames(cssSources, preservedClassNames);
  const replacements = buildProductionClassNameReplacements(classNames);
  if (replacements.length === 0) return;

  await Promise.all(
    files
      .filter((path) => path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.html'))
      .map((path) => rewriteProductionClassNameFile(path, replacements)),
  );
}

async function readPreservedClassNames(): Promise<ReadonlySet<string>> {
  const source = await readFile(
    fileURLToPath(new URL('./src/e2e/simulator.spec.ts', import.meta.url)),
    'utf8',
  );
  return new Set([
    ...collectFirstCaptures(source, classNamePattern),
    ...collectFirstCaptures(source, quotedClassTokenPattern),
    ...collectFirstCaptures(source, hyphenatedTokenPattern),
  ]);
}

function collectProductionClassNames(
  cssSources: readonly string[],
  preservedClassNames: ReadonlySet<string>,
): string[] {
  const classNames = new Set<string>();
  for (const source of cssSources) {
    for (const match of source.matchAll(classNamePattern)) {
      const className = match[1];
      if (className === undefined) continue;
      if (
        className.includes('-') &&
        className.length >= classTokenMinimumLength &&
        !preservedClassNames.has(className)
      ) {
        classNames.add(className);
      }
    }
  }
  return [...classNames].sort((left, right) => right.length - left.length || left.localeCompare(right));
}

function collectFirstCaptures(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].flatMap((match) => {
    const value = match[1];
    return value === undefined ? [] : [value];
  });
}

function buildProductionClassNameReplacements(
  classNames: readonly string[],
): ReadonlyArray<readonly [string, string]> {
  const existingClassNames = new Set(classNames);
  return classNames.map((className, index) => [
    className,
    nextProductionClassName(index, existingClassNames),
  ]);
}

function nextProductionClassName(index: number, existingClassNames: ReadonlySet<string>): string {
  let candidateIndex = index;
  let candidate = productionClassPrefix + encodeClassNameIndex(candidateIndex);
  while (existingClassNames.has(candidate)) {
    candidateIndex += 1;
    candidate = productionClassPrefix + encodeClassNameIndex(candidateIndex);
  }
  return candidate;
}

function encodeClassNameIndex(index: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let remainder = index;
  let encoded = '';
  do {
    encoded = alphabet[remainder % alphabet.length] + encoded;
    remainder = Math.floor(remainder / alphabet.length) - 1;
  } while (remainder >= 0);
  return encoded;
}

async function rewriteProductionClassNameFile(
  path: string,
  replacements: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  const source = await readFile(path, 'utf8');
  let rewritten = source;
  for (const [className, productionName] of replacements) {
    rewritten = rewritten.replace(classTokenPattern, (token, matchedClassName: string) =>
      matchedClassName === className ? productionName : token,
    );
  }
  if (rewritten !== source) await writeFile(path, rewritten);
}

async function rewriteProductionCustomProperties(files: readonly string[]): Promise<void> {
  const cssFiles = files.filter((path) => path.endsWith('.css'));
  if (cssFiles.length === 0) return;

  const cssSources = await Promise.all(cssFiles.map((path) => readFile(path, 'utf8')));
  const propertyNames = collectProductionCustomProperties(cssSources);
  const replacements = buildProductionCustomPropertyReplacements(propertyNames);
  if (replacements.length === 0) return;

  await Promise.all(
    files
      .filter((path) => path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.html'))
      .map((path) => rewriteProductionCustomPropertyFile(path, replacements)),
  );
}

function collectProductionCustomProperties(cssSources: readonly string[]): string[] {
  const propertyNames = new Set<string>();
  for (const source of cssSources) {
    for (const match of source.matchAll(cssCustomPropertyPattern)) {
      const propertyName = match[0];
      if (propertyName.length >= cssCustomPropertyMinimumLength) propertyNames.add(propertyName);
    }
  }
  return [...propertyNames].sort((left, right) => right.length - left.length || left.localeCompare(right));
}

function buildProductionCustomPropertyReplacements(
  propertyNames: readonly string[],
): ReadonlyArray<readonly [string, string]> {
  const existingPropertyNames = new Set(propertyNames);
  return propertyNames.map((propertyName, index) => [
    propertyName,
    nextProductionCustomPropertyName(index, existingPropertyNames),
  ]);
}

function nextProductionCustomPropertyName(index: number, existingPropertyNames: ReadonlySet<string>): string {
  let candidateIndex = index;
  let candidate = productionCustomPropertyPrefix + candidateIndex.toString(36);
  while (existingPropertyNames.has(candidate)) {
    candidateIndex += 1;
    candidate = productionCustomPropertyPrefix + candidateIndex.toString(36);
  }
  return candidate;
}

async function rewriteProductionCustomPropertyFile(
  path: string,
  replacements: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  const source = await readFile(path, 'utf8');
  let rewritten = source;
  for (const [propertyName, productionName] of replacements) {
    rewritten = rewritten.split(propertyName).join(productionName);
  }
  if (rewritten !== source) await writeFile(path, rewritten);
}

type JavaScriptNode = {
  end: number;
  start: number;
  type: string;
  [key: string]: unknown;
};

type SourceReplacement = {
  end: number;
  start: number;
  text: string;
};

async function rewriteJavaScriptDomPropertyAliases(files: readonly string[]): Promise<void> {
  await Promise.all(files.filter((path) => path.endsWith('.js')).map(rewriteJavaScriptDomPropertyAliasFile));
}

async function rewriteJavaScriptDomPropertyAliasFile(path: string): Promise<void> {
  const source = await readFile(path, 'utf8');
  let parsed: unknown;
  try {
    parsed = parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    });
  } catch {
    return;
  }
  const replacements: SourceReplacement[] = [];
  collectJavaScriptDomPropertyAliasReplacements(parsed, replacements);
  if (replacements.length === 0) return;

  const rewritten = applySourceReplacements(source, replacements);
  if (rewritten !== source) await writeFile(path, rewritten);
}

function collectJavaScriptDomPropertyAliasReplacements(
  value: unknown,
  replacements: SourceReplacement[],
): void {
  collectJavaScriptNodes(value, (node) => {
    if (node.type === 'CallExpression') {
      collectDomCallPropertyAliasReplacements(node, replacements);
    }
  });
}

function collectJavaScriptNodes(value: unknown, visit: (node: JavaScriptNode) => void): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJavaScriptNodes(item, visit));
    return;
  }
  if (!isJavaScriptNode(value)) return;

  visit(value);

  for (const [key, child] of Object.entries(value)) {
    if (key === 'start' || key === 'end') continue;
    collectJavaScriptNodes(child, visit);
  }
}

function collectDomCallPropertyAliasReplacements(
  node: JavaScriptNode,
  replacements: SourceReplacement[],
): void {
  const args = asJavaScriptNodeArray(node.arguments);
  const tag = args[0];
  const props = args[1];
  if (!isDomTagLiteral(tag) || props?.type !== 'ObjectExpression') return;

  for (const property of asJavaScriptNodeArray(props.properties)) {
    const replacement = domPropertyAliasReplacement(property);
    if (replacement) replacements.push(replacement);
  }
}

function domPropertyAliasReplacement(property: JavaScriptNode): SourceReplacement | null {
  if (property.type !== 'Property' || property.computed === true || property.shorthand === true) return null;
  const key = property.key;
  if (!isJavaScriptNode(key)) return null;

  const propertyName = propertyNameFromKey(key);
  if (propertyName === null) return null;

  const productionName = javascriptDomPropertyAliasMap.get(propertyName);
  if (productionName === undefined) return null;
  return { end: key.end, start: key.start, text: productionName };
}

function propertyNameFromKey(key: JavaScriptNode): string | null {
  if (key.type === 'Identifier') return typeof key.name === 'string' ? key.name : null;
  if (key.type === 'Literal') return typeof key.value === 'string' ? key.value : null;
  return null;
}

function isDomTagLiteral(node: JavaScriptNode | undefined): boolean {
  if (!node || node.type !== 'Literal' || typeof node.value !== 'string') return false;
  return /^[a-z][a-z0-9-]*$/.test(node.value);
}

function isJavaScriptNode(value: unknown): value is JavaScriptNode {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<JavaScriptNode>;
  return (
    typeof candidate.type === 'string' &&
    typeof candidate.start === 'number' &&
    typeof candidate.end === 'number'
  );
}

function asJavaScriptNodeArray(value: unknown): JavaScriptNode[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJavaScriptNode);
}

function applySourceReplacements(source: string, replacements: readonly SourceReplacement[]): string {
  let rewritten = source;
  for (const replacement of [...replacements].sort((left, right) => right.start - left.start)) {
    rewritten = `${rewritten.slice(0, replacement.start)}${replacement.text}${rewritten.slice(replacement.end)}`;
  }
  return rewritten;
}

export default defineConfig(({ command, mode }) => {
  const plugins: PluginOption[] = [react(), compressedAssetsPlugin()];
  const vercelEnvironment = process.env.VITE_VERCEL_ENV ?? process.env.VERCEL_ENV ?? '';

  if (mode === 'analyze') {
    plugins.push(
      visualizer({
        filename: 'artifacts/bundle-report.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }) as unknown as PluginOption,
    );
  }

  return {
    plugins,
    define: {
      'import.meta.env.VERCEL': JSON.stringify(process.env.VERCEL ?? ''),
      'import.meta.env.VITE_VERCEL_ENV': JSON.stringify(vercelEnvironment),
    },
    build: {
      assetsInlineLimit: 4096,
      cssCodeSplit: false,
      cssMinify: true,
      emptyOutDir: true,
      minify: 'terser',
      modulePreload: true,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          manualChunks(id) {
            if (id.includes('/node_modules/')) return 'vendor';
            return undefined;
          },
        },
      },
      sourcemap: false,
      target: 'es2022',
      terserOptions: {
        compress: {
          hoist_props: true,
          passes: 3,
          pure_getters: true,
          toplevel: true,
          unsafe: true,
          unsafe_arrows: true,
        },
        format: {
          comments: false,
        },
        mangle: {
          toplevel: true,
        },
        module: true,
      },
    },
    resolve: {
      alias: command === 'build' ? productionAliases : { '@': sourceAlias },
    },
    test: {
      environment: 'jsdom',
      exclude: ['node_modules/**', 'dist/**', 'src/e2e/**'],
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/**/*.stories.{ts,tsx}', 'src/**/*.test.{ts,tsx}', 'src/test/**'],
        thresholds: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  };
});
