import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const rasterAssetPattern = /\.(?:png|jpe?g|webp|gif)$/i;
const roots = ['dist', 'src/assets'];

function collectRasterAssets(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return collectRasterAssets(path);
    return rasterAssetPattern.test(path) ? [path] : [];
  });
}

const offenders = roots.flatMap((root) => collectRasterAssets(root));

if (offenders.length > 0) {
  const formatted = offenders.map((path) => relative(process.cwd(), path)).join('\n');
  throw new Error(`Raster assets are not allowed:\n${formatted}`);
}
