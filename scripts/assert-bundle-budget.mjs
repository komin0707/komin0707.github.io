import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const distAssetsDirectory = 'dist/assets';
const jsBundlePattern = /\.js$/i;
const cssBundlePattern = /\.css$/i;
const maxJavaScriptChunkBytes = 250_000;
const maxBrotliJsCssTransferBytes = 100_000;
const minimumCompressedAssetBytes = 1024;

if (!existsSync(distAssetsDirectory)) {
  throw new Error('Missing dist/assets. Run npm run build before checking bundle size.');
}

const assets = readdirSync(distAssetsDirectory).map((entry) => join(distAssetsDirectory, entry));

const oversizedBundles = readdirSync(distAssetsDirectory)
  .filter((entry) => jsBundlePattern.test(entry))
  .map((entry) => join(distAssetsDirectory, entry))
  .filter((path) => statSync(path).size >= maxJavaScriptChunkBytes);

if (oversizedBundles.length > 0) {
  const formatted = oversizedBundles
    .map((path) => `${relative(process.cwd(), path)} ${statSync(path).size} bytes`)
    .join('\n');
  throw new Error(`JavaScript bundle budget exceeded:\n${formatted}`);
}

const totalBrotliJsCssTransferBytes = assets
  .filter((path) => jsBundlePattern.test(path) || cssBundlePattern.test(path))
  .reduce((total, path) => total + brotliTransferBytes(path), 0);

if (totalBrotliJsCssTransferBytes >= maxBrotliJsCssTransferBytes) {
  throw new Error(
    `Brotli JS/CSS transfer budget exceeded: ${totalBrotliJsCssTransferBytes} bytes >= ${maxBrotliJsCssTransferBytes} bytes`,
  );
}

const missingCompressedVariants = assets
  .filter((path) => /\.(?:js|css)$/i.test(path))
  .filter((path) => statSync(path).size >= minimumCompressedAssetBytes)
  .flatMap((path) => {
    const expected = [`${path}.br`, `${path}.gz`];
    return expected.filter((compressedPath) => !existsSync(compressedPath));
  });

if (missingCompressedVariants.length > 0) {
  throw new Error(
    `Missing precompressed asset variants:\n${missingCompressedVariants
      .map((path) => relative(process.cwd(), path))
      .join('\n')}`,
  );
}

const ineffectiveCompressedVariants = assets
  .filter((path) => /\.(?:js|css)$/i.test(path))
  .filter((path) => statSync(path).size >= minimumCompressedAssetBytes)
  .filter((path) => {
    const source = readAsset(path);
    return brotliCompressSync(source).length >= source.length || gzipSync(source).length >= source.length;
  });

if (ineffectiveCompressedVariants.length > 0) {
  throw new Error(
    `Compression variants are not effective:\n${ineffectiveCompressedVariants
      .map((path) => relative(process.cwd(), path))
      .join('\n')}`,
  );
}

function readAsset(path) {
  return readFileSync(path);
}

function brotliTransferBytes(path) {
  const sidecarPath = `${path}.br`;
  if (existsSync(sidecarPath)) return statSync(sidecarPath).size;
  return brotliCompressSync(readAsset(path)).length;
}
