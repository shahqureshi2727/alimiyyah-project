# Alimiyyah Practice

Alimiyyah Practice is a React study app for an Islamic studies program. Students drill Arabic grammar and vocabulary, morphology, Fiqh, Hadith, and Tafsir through untimed practice loops and timed quizzes.

The app includes:

- Practice mode: untimed, shuffled, immediate feedback.
- Quiz mode: timed, 10 questions, saved to Firestore and ranked on leaderboards.
- Today's Review: 15 timed questions selected from weak topics, due topics, and a broad mix.
- Strength Map: per-topic EWMA scores for spaced review.
- Admin: teacher-facing bank review, class stats, and weakness dashboards.

## Stack

- Vite 8, React 19, react-router-dom 7.
- Plain JavaScript with JSX. No TypeScript.
- Plain CSS with custom properties. No Tailwind or CSS-in-JS.
- Firebase 12 Auth and Firestore. No Cloud Functions.
- Vitest, ESLint 10 flat config, Playwright, and Firebase emulator tests.
- Vercel SPA deployment with rewrites to `index.html`.

## Setup

Install dependencies from this directory:

```bash
cd qasas-practice
npm install
```

Create a local env file:

```bash
cp .env.example .env.local
```

Fill in Firebase values from the Firebase console. Never commit `.env.local`.

Start local development:

```bash
npm run dev
```

## Environment Variables

Required:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Optional:

```text
VITE_SENTRY_DSN=
VITE_GIT_SHA=
VITE_USE_FIREBASE_EMULATORS=true
```

`VITE_GIT_SHA` is injected by `vite.config.js` during builds when available. Sentry source-map upload is enabled only in Vercel when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are also present.

## Scripts

Run all commands from `qasas-practice/`.

```bash
npm run dev                  # Vite dev server
npm run build                # Production build
npm run build:analyze        # Production build plus bundle-stats JSON
npm run check:bundle         # Check built JS budgets in dist/
npm run lhci                 # Build, preview, and run Lighthouse CI
npm run lint                 # ESLint
npm run format               # Prettier over src JS/CSS files
npm run format:check         # Prettier check over src JS/CSS files
npm run test                 # Vitest single run
npm run test:coverage        # Vitest with coverage
npm run test:rules           # Firestore rules tests in the emulator
npm run test:e2e             # Playwright against Auth and Firestore emulators
npm run preview              # Preview the production build
npm run validate:fiqh        # Validate Fiqh bank structure and coverage
npm run validate:morphology  # Validate morphology bank structure
npm run migrate:topic-stats  # Dry-run historical answerEvents -> topicStats migration
```

The normal definition of done is:

```bash
npm run lint
npm run test
npm run build
```

## Firebase Emulator

The emulator config lives in `firebase.json`.

One-shot rules tests:

```bash
npm run test:rules
```

One-shot E2E tests against Auth and Firestore emulators:

```bash
npm run test:e2e
```

Manual emulator session:

```bash
npx firebase-tools@14.22.0 emulators:start --only auth,firestore --project demo-qasas-practice
```

Then run the app with:

```bash
VITE_USE_FIREBASE_EMULATORS=true npm run dev
```

## Deployment

Vercel serves the app as a single-page application. Pushes to the configured production branch trigger the Vercel deployment.

Do not deploy production services from agent sessions. In particular, do not run `firebase deploy`, `vercel deploy`, or commands that mutate production Auth, Firestore, or hosting unless a human explicitly asks for that operation outside the protected workflow.

## Admin Access

Admin access is controlled by the Firestore user document:

```text
users/{uid}.role = "admin"
```

Users sign up normally through the app. A teacher/admin then changes the role in Firebase Console. The app intentionally has no self-service path to become an admin.

## Security Headers

`vercel.json` ships a `Content-Security-Policy-Report-Only` header first. Watch browser and hosting reports for missing Firebase, font, or Sentry sources before converting it to enforcing `Content-Security-Policy`.

Manual Firebase console checklist:

- Restrict the Firebase API key to authorized web domains.
- Confirm the Firebase Auth authorized-domains list contains only expected app domains and localhost/dev domains.
- Enable App Check if practical for the current hosting/runtime setup.
- Set a Firestore budget alert.
- Turn on daily Firestore backups.

