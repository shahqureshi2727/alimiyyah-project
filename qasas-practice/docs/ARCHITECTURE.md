# Architecture

Alimiyyah Practice is a Vite SPA. The runtime shape is intentionally simple: React Router owns URLs, local component state owns active UI interactions, and Firebase owns authentication plus durable quiz/strength data.

## Routing Model

Routes are declared in `src/App.jsx`.

Public routes:

- `/login`
- `/signup`
- `/forgot-password`

Authenticated routes live under `ProtectedLayout`:

- `/` home/study desk
- `/practice/:mode`
- `/practice/:mode/:topic`
- `/quiz`
- `/quiz/:mode`
- `/quiz/:mode/:topic`
- `/leaderboard`
- `/weakness`
- `/admin`

`ProtectedLayout` owns the authenticated shell. It mounts `AuthProvider`, renders `AuthHeader`, hides the header during quiz attempts, and wraps route content in an error boundary.

Route parsing and titles live in `src/lib/app-routes.js`. Use `practicePath`, `quizPath`, `resolvePracticeRoute`, and `resolveQuizRoute` instead of hand-building paths in components.

## State Ownership

- Auth state: `src/contexts/AuthContext.jsx`, backed by Firebase Auth and `users/{uid}`.
- User settings: `src/contexts/SettingsContext.jsx`, persisted in localStorage and reflected on `document.documentElement.dataset`.
- Routing state: React Router plus helpers in `src/lib/app-routes.js`.
- Practice session state: shared hooks/components where available, plus per-mode renderers for subject-specific prompts.
- Quiz state: `src/hooks/useQuizEngine.js` handles loading, countdown, answering, completion, and persistence orchestration. `src/components/TimedQuiz.jsx` renders the timed quiz screen.
- Weakness state: Firestore `users/{uid}/topicStats/*` is the source of truth. Pure scoring utilities live in `src/lib/topic-stats.js` and `src/lib/weakness.js`.

## Data Layer

Question banks are bundled app data in `src/data/`.

- Arabic grammar: `src/data/arabic/`
- Morphology: `src/data/morphology.js`
- Fiqh: `src/data/fiqh/`
- Hadith: `src/data/hadith/`
- Tafsir: `src/data/tafsir/`

Question banks are loaded through `src/lib/quiz-banks.js`. That file uses dynamic imports so a route loads the banks it needs instead of putting every subject into the initial bundle.

Firestore access is isolated under `src/lib/repositories/` where possible:

- `quiz-results.js`: append-only quiz summaries and leaderboard queries.
- `answer-events.js`: append-only per-question telemetry.
- `topic-stats.js`: per-user aggregate topic strength.
- `users.js`: user profile/admin-role reads and initial user docs.
- `weakness-profiles.js`: legacy profile reads.

The higher-level modules `src/lib/quiz.js` and `src/lib/topic-stats-firestore.js` provide app-facing functions.

## Mode Registry

`src/config/subjects.js` is the subject and mode registry. It contains:

- `QUIZ_MODES`: labels, bank sources, and timer settings.
- `QUIZ_QUESTION_TARGETS`: how each quiz mode displays its main target.
- `UNTITLED_PRACTICE_MODES`: simple Arabic practice routes.
- `MORPHOLOGY_TOPICS`
- `ARABIC_TOPICS`
- `FIQH_TOPICS` and `FIQH_GROUPS`
- `HADITH_TOPICS`
- `TAFSIR_TOPICS`

Add subject metadata there first. Avoid adding new switch statements when the registry can express the same thing.

## Firestore Schema

```text
users/{uid}
  role: "student" | "admin"
  username: string
  recoveryEmail?: string|null

users/{uid}/topicStats/{category_subtopic}
  userId: string
  category: "fiqh" | "hadith" | "arabic" | "tafsir"
  subtopic: string
  attempts: number
  correct: number
  lastAttempted: timestamp
  ewmaScore: number
  reviewIntervalDays: number
  nextDueAt: timestamp

quizResults/{id}
  userId: string
  username: string
  mode: string
  bankSource: string
  score: number
  total: number
  durationSeconds: number
  completedAt: timestamp

answerEvents/{id}
  userId: string
  username: string
  mode: string
  bankSource: string
  topic: string
  group: string|null
  questionId: string
  correct: boolean
  answeredAt: timestamp
  quizResultId: string|null

weaknessProfiles/{uid}
  legacy computed weakness profile
```

`quizResults` and `answerEvents` are append-only by design. Do not add app code that updates or deletes those documents.

## Add A New Subject End To End

1. Define the subject model.

Choose stable topic codes, a `bankSource`, and the question shape. Every question needs a stable `id`, a `topic`, and enough fields for the renderer to show a prompt, answer options or answer input, and feedback.

2. Add source data.

Create a folder under `src/data/<subject>/`. Keep doctrinal text exactly as reviewed. Do not normalize Arabic, strip diacritics, rewrite explanations, or silently "correct" content.

3. Add bank loaders.

Update `src/lib/quiz-banks.js` with dynamic imports for the new banks. Add grouped or `all` loading if the subject needs topic groups.

4. Register metadata.

Update `src/config/subjects.js` with the quiz mode, topic list, labels, bank source, timer, and target selector. If the subject needs practice routes, add its topic metadata here too.

5. Resolve routes.

Update `src/lib/app-routes.js` so `/practice/<subject>/:topic` and `/quiz/<subject>/:topic` validate topics and produce labels. Use existing helper patterns for Fiqh, Hadith, and Tafsir.

6. Add practice UI.

Create a subject practice mode in `src/components/`. Reuse `PracticeShell`, `useAsyncQuestionBank`, `usePracticeSession`, `useShuffledOptions`, and existing question card patterns where they fit.

7. Add quiz rendering.

Add or update a renderer under `src/components/quiz/renderers/` and route it from `src/components/quiz/QuizQuestion.jsx`. Ensure answer correctness is value-based after shuffling, not tied to option position.

8. Wire navigation.

Expose the subject from `HomeScreen` and `QuizPicker` using registry data where possible. Prefer route helpers over string concatenation.

9. Wire weakness tracking.

Ensure `questionResultFromAnswer` can derive `questionId`, `topic`, and `group`. Update `categoryForTopic` in `src/lib/topic-stats.js` if the new subject adds a category. Update Firestore rules to allow the category before writing data.

10. Add validation and tests.

Add pure tests for topic routing, bank loading, quiz target selection, scoring, and any validators. For content banks, add a validation script if humans will maintain many entries by hand.

11. Verify Arabic rendering.

If the subject includes Arabic, check light/dark and both script modes (`madina` and `indopak`). Avoid CSS that clips diacritics or reorders glyphs.

12. Run the required checks.

```bash
npm run lint
npm run test
npm run build
```

