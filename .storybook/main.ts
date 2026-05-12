import type { StorybookConfig } from '@storybook/react-vite';
import type { AliasOptions } from 'vite';
import { fileURLToPath } from 'node:url';

const sourceAlias = fileURLToPath(new URL('../src', import.meta.url));

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  viteFinal: (config) => {
    const existingAliases = normalizeAliases(config.resolve?.alias).filter((alias) => alias.find !== '@');

    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: [...existingAliases, { find: '@', replacement: sourceAlias }],
      },
    };
  },
};

export default config;

function normalizeAliases(alias: AliasOptions | undefined): Array<{ find: string; replacement: string }> {
  if (!alias) return [];
  if (Array.isArray(alias)) {
    return alias.flatMap((entry: unknown) => (isStringAlias(entry) ? [entry] : []));
  }

  return Object.entries(alias).flatMap(([find, replacement]) =>
    typeof replacement === 'string' ? [{ find, replacement }] : [],
  );
}

function isStringAlias(value: unknown): value is { find: string; replacement: string } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { find?: unknown; replacement?: unknown };
  return typeof candidate.find === 'string' && typeof candidate.replacement === 'string';
}
