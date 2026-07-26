import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-console': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['src/lib/logger.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['vite.config.js', 'vite.rules.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
]);
