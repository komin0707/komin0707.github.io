import { readFileSync } from 'node:fs';

const lockfile = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const forbiddenLicensePattern = /\b(?:AGPL|GPL|LGPL|SSPL)\b/i;

const forbiddenPackages = Object.entries(lockfile.packages ?? {})
  .filter(([path]) => path.startsWith('node_modules/'))
  .map(([path, metadata]) => ({
    license: typeof metadata.license === 'string' ? metadata.license : 'UNKNOWN',
    name: path.replace(/^node_modules\//, ''),
  }))
  .filter(({ license }) => forbiddenLicensePattern.test(license));

if (forbiddenPackages.length > 0) {
  const formatted = forbiddenPackages
    .map(({ license, name }) => `${name}: ${license}`)
    .sort()
    .join('\n');
  throw new Error(`Forbidden dependency licenses found:\n${formatted}`);
}
