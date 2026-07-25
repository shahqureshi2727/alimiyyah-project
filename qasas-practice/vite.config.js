import { execSync } from 'node:child_process';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function gitSha() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }

  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'local';
  }
}

const release = gitSha();
const sentryUploadEnabled = Boolean(
  process.env.VERCEL &&
    process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT
);

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(release),
  },
  build: {
    sourcemap: sentryUploadEnabled,
  },
  test: {
    exclude: ['rules-tests/**', '**/node_modules/**', '**/dist/**'],
  },
  plugins: [
    react(),
    sentryUploadEnabled &&
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        release: {
          name: release,
          setCommits: {
            auto: true,
            ignoreMissing: true,
          },
        },
        sourcemaps: {
          assets: './dist/assets/**',
          filesToDeleteAfterUpload: './dist/**/*.map',
        },
      }),
  ].filter(Boolean),
});
