import { execSync } from 'node:child_process';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

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
const bundleAnalysisEnabled = process.env.ANALYZE_BUNDLE === '1';

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(release),
  },
  build: {
    sourcemap: sentryUploadEnabled,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined;
          if (
            id.includes('/node_modules/@firebase/firestore/') ||
            id.includes('/node_modules/@firebase/webchannel-wrapper/') ||
            id.includes('/node_modules/firebase/firestore')
          ) {
            return 'firebase-firestore';
          }
          if (
            id.includes('/node_modules/@firebase/auth/') ||
            id.includes('/node_modules/firebase/auth')
          ) {
            return 'firebase-auth';
          }
          if (
            id.includes('/node_modules/@firebase/') ||
            id.includes('/node_modules/firebase/')
          ) {
            return 'firebase-core';
          }
          if (id.includes('/node_modules/@sentry/')) {
            return 'sentry';
          }
          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    exclude: ['rules-tests/**', 'e2e/**', '**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: false,
      include: [
        'src/lib/{app-routes,auth-errors,daily-review,firebase-emulators,firebase-env,question-results,quiz-banks,shuffle,tafsir-scoring,topic-route-targets,topic-stats,weakness}.js',
        'src/hooks/{useCountdown,usePracticeSession,useQuizEngine,useShuffledOptions,useWeaknessTracking}.js',
        'src/components/{AppState,ErrorBoundary,ForgotPassword,FiqhQuestionCard,HadithQuestionCard,LeaderboardTable,Login,ProtectedLayout,Signup,TafsirQuestionCard,TafsirVerseCard}.jsx',
        'src/components/quiz/QuizQuestion.jsx',
        'src/components/quiz/renderers/{FiqhQuizRenderer,HadithQuizRenderer,IrabQuizRenderer,MorphologyQuizRenderer,NounFeaturesQuizRenderer,RolesQuizRenderer,TafsirQuizRenderer,VocabQuizRenderer}.jsx',
      ],
      exclude: [
        'src/data/**',
        'src/**/*.test.{js,jsx}',
        'src/test/**',
        'src/main.jsx',
        'src/Bootstrap.jsx',
      ],
      thresholds: {
        'src/lib/**/*.{js,jsx}': {
          lines: 80,
        },
        'src/hooks/**/*.{js,jsx}': {
          lines: 80,
        },
        'src/components/**/*.{js,jsx}': {
          lines: 60,
        },
      },
    },
  },
  plugins: [
    react(),
    bundleAnalysisEnabled &&
      visualizer({
        filename: 'dist/bundle-stats.json',
        gzipSize: true,
        template: 'raw-data',
      }),
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
