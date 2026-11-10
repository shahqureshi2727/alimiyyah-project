import { defineConfig, devices } from '@playwright/test';

const firebaseEnv =
  'VITE_FIREBASE_API_KEY=fake ' +
  'VITE_FIREBASE_AUTH_DOMAIN=demo-qasas-practice.firebaseapp.com ' +
  'VITE_FIREBASE_PROJECT_ID=demo-qasas-practice ' +
  'VITE_FIREBASE_STORAGE_BUCKET=demo-qasas-practice.appspot.com ' +
  'VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000 ' +
  'VITE_FIREBASE_APP_ID=1:000000000000:web:e2e ' +
  'VITE_USE_FIREBASE_EMULATORS=true ' +
  'VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 ' +
  'VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `${firebaseEnv} npm run dev -- --host 127.0.0.1 --port 4173`,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
