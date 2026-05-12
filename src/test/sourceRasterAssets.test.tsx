import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const rasterReferencePattern = new RegExp(
  String.raw`(?:<image\b|href=["'][^"']+\.(?:png|jpe?g|webp|gif)\b|["'][^"']+\.(?:png|jpe?g|webp|gif)["'])`,
  'i',
);

function collectSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return collectSourceFiles(path);
    return /\.(?:css|ts|tsx|svg)$/.test(path) ? [path] : [];
  });
}

describe('source asset policy', () => {
  it('keeps patient UI source free of raster image references', () => {
    const files = [
      ...collectSourceFiles(join(process.cwd(), 'src/components')),
      ...collectSourceFiles(join(process.cwd(), 'src/styles')),
      ...collectSourceFiles(join(process.cwd(), 'src/assets')),
    ];

    const offenders = files.filter((file) => rasterReferencePattern.test(readFileSync(file, 'utf8')));

    expect(offenders).toEqual([]);
  });
});
