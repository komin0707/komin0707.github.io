import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

export const acceptedCruxKeyNames = ['CRUX_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_API_KEY'];
export const cruxEnvFilePaths = ['.env.local', '.env', '.env.production.local', '.env.production'];

export function resolveCruxApiKey({ cwd = process.cwd(), env = process.env } = {}) {
  for (const name of acceptedCruxKeyNames) {
    const value = env[name];
    if (typeof value === 'string' && value.length > 0) {
      return {
        key: value,
        name,
        source: 'process',
      };
    }
  }

  for (const file of readCruxEnvFiles(cwd)) {
    for (const name of acceptedCruxKeyNames) {
      const value = file.values[name];
      if (typeof value === 'string' && value.length > 0) {
        return {
          key: value,
          name,
          path: file.path,
          source: 'env-file',
        };
      }
    }
  }

  return {
    key: '',
    name: null,
    source: 'none',
  };
}

export function summarizeCruxEnvFiles(cwd = process.cwd()) {
  const files = cruxEnvFilePaths.map((path) => {
    if (!existsSync(join(cwd, path))) {
      return {
        acceptedPresent: [],
        checked: false,
        exists: false,
        path,
      };
    }

    const values = parseEnvFile(readFileSync(join(cwd, path), 'utf8'));
    const names = Object.keys(values);
    return {
      acceptedPresent: acceptedCruxKeyNames.filter((name) => names.includes(name)),
      checked: true,
      exists: true,
      path,
    };
  });

  return {
    acceptedPresent: acceptedCruxKeyNames.filter((name) =>
      files.some((file) => file.acceptedPresent.includes(name)),
    ),
    checked: true,
    files,
  };
}

function readCruxEnvFiles(cwd) {
  return cruxEnvFilePaths
    .filter((path) => existsSync(join(cwd, path)))
    .map((path) => ({
      path,
      values: parseEnvFile(readFileSync(join(cwd, path), 'utf8')),
    }));
}

function parseEnvFile(source) {
  const entries = {};

  for (const line of source.split('\n')) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    const [, name, rawValue] = match;
    entries[name] = normalizeEnvValue(rawValue);
  }

  return entries;
}

function normalizeEnvValue(rawValue) {
  const value = rawValue.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value.replace(/\s+#.*$/, '');
}
