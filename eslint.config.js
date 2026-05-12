import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'artifacts/**',
      'coverage/**',
      'dist/**',
      'docs/api/**',
      'docs/storybook/**',
      'node_modules/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'testing-library': testingLibrary,
    },
    settings: {
      react: {
        version: '19.1',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      'arrow-body-style': ['warn', 'as-needed'],
      complexity: ['warn', 10],
      'consistent-return': 'warn',
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'max-depth': ['warn', 4],
      'max-lines': ['warn', 300],
      'max-lines-per-function': ['warn', 50],
      'max-nested-callbacks': ['warn', 3],
      'max-params': ['warn', 4],
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-magic-numbers': ['warn', { ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true }],
      'no-redeclare': 'error',
      'no-shadow': 'warn',
      'no-unused-vars': 'off',
      'no-useless-rename': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'warn',
      'prefer-const': 'error',
      'prefer-destructuring': 'warn',
      'prefer-template': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'sort-imports': ['warn', { ignoreDeclarationSort: true }],
      'template-curly-spacing': ['error', 'never'],
    },
  },
  prettier,
);
