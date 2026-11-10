import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['rules-tests/**/*.test.js'],
    pool: 'forks',
  },
});
