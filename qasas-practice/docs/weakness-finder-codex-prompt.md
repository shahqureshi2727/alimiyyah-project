# Codex task: Build the Weakness Finder feature

You are working in the `qasas-practice` React app (React 19 + Vite, `react-router-dom` v7,
Firebase v12: Auth + Firestore). Build a "weakness finder" that tracks per-topic accuracy
from students' quiz answers, flags weak topics using recency-weighted accuracy, and helps
students strengthen them via a review-quiz builder and a strong/weak dashboard. Both
students and admins can view the data.

Follow the existing code conventions in the repo (plain JS modules, functional React
components with hooks, CSS-per-component files, `src/config/subjects.js` as the single
source of truth for mode/topic metadata). Do not add TypeScript, Redux, or new heavy deps.

## Context you must read first

- `src/lib/firebase.js` — exports `auth`, `db`.
- `src/lib/quiz.js` — current `submitQuizResult(...)` writes one `quizResults` doc
  (append-only). Read the honesty note at the top; keep the same client-trust posture.
- `src/config/subjects.js` — `QUIZ_MODES`, `FIQH_TOPICS`, `FIQH_GROUPS`.
- `src/data/fiqh/index.js` and `src/data/fiqh/wudhu.js` — Fiqh questions already have a
  stable `id` (e.g. `"FQH-WUD-Q01"`), a `topic` code (e.g. `"WUD"`), and `sourceIds`.
- `src/components/FiqhPracticeMode.jsx`, `IrabMode.jsx`, `NounMode.jsx`, `RoleMode.jsx`,
  `VocabMode.jsx`, `MorphologyMode.jsx` — the quiz-taking components.
- `src/components/QuizPicker.jsx`, `TimedQuiz.jsx`, `AdminPage.jsx`.
- `firestore.rules` — existing per-user, append-only rules and the admin check pattern
  (`get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin"`).

## Assumptions

- The Arabic question banks (`irab`, `nounFeatures`, `roles`, `vocab`, `morphology`) WILL
  gain a stable `id` and a `topic` code per question. Write all code to read
  `question.id` and `question.topic`; do NOT hardcode Fiqh-only behavior. Where a topic is
  missing (during the transition), fall back to the `mode` name as the topic code and log
  a `console.warn` once per session — never crash.

## Deliverables

### 1. Config — `src/config/weakness.js`
Export tunable constants and the status mapping. No Firebase imports here.
```js
export const RECENCY_WEIGHT = 0.7;          // recent answers count ~2-3x older
export const WEAK_MAX = 0.55;               // score < WEAK_MAX  => "weak"
export const STRONG_MIN = 0.75;             // score >= STRONG_MIN => "strong"
export const MIN_ATTEMPTS_TO_FLAG = 3;      // don't flag "weak" before this many attempts
export const INITIAL_SCORE = 1.0;           // assume-competent until proven otherwise
```

### 2. Pure logic — `src/lib/weakness.js` (NO Firebase imports; must be unit-testable)
Implement and export:
- `statusFor(score, attempts)` → `"weak" | "developing" | "strong"` using the config
  thresholds and `MIN_ATTEMPTS_TO_FLAG` (never return `"weak"` below the min).
- `applyAnswer(topicState, correct, answeredAt)` → new topic state. Recency-weighted:
  `score = w*x + (1-w)*prevScore` (x = 1 if correct else 0), increment `attempts`,
  `streak = correct ? streak+1 : 0`, update `lastSeen`, recompute `status`. If
  `topicState` is undefined, initialize with `score = INITIAL_SCORE`, `attempts = 0`,
  `streak = 0`.
- `updateProfile(profile, events)` → new profile object; folds an array of answer events
  (`{topic, correct, answeredAt}`) into `profile.topics` via `applyAnswer`.
- `getWeakTopics(profile, limit)` → topic codes sorted weakest-first (lowest score, then
  least-recently-seen), including `"weak"` and `"developing"`.
- `reviewWeights(profile)` → `{ [topic]: weight }` where `weight = 1 - score`, for sampling.
Keep every function pure and side-effect free.

### 3. Firestore writes — extend `src/lib/quiz.js` (or new `src/lib/weakness-store.js`)
- Add `submitAnswerEvents({ userId, username, mode, bankSource, results, quizResultId })`
  where `results` is `[{ questionId, topic, group, correct }]`.
- Use a single `writeBatch(db)` to:
  - create N docs in `answerEvents` (schema below), and
  - `set(..., { merge: true })` the recomputed `weaknessProfiles/{userId}` doc.
- Read the current `weaknessProfiles/{userId}` (single `getDoc`) before the batch, fold the
  new events in with `updateProfile`, write the result back. One extra read + one batched
  write per quiz.
- Wire this into the existing quiz-submit flow so it runs alongside `submitQuizResult`.
  Collect the per-question `{questionId, topic, group, correct}` array inside each quiz
  component and pass it through.

`answerEvents/{eventId}` schema:
```
userId: string        username: string
mode: string          bankSource: string
topic: string         group: string|null
questionId: string    correct: boolean
answeredAt: serverTimestamp()
quizResultId: string|null
```

`weaknessProfiles/{userId}` schema:
```
userId, username, updatedAt,
topics: { [topicCode]: { attempts, score, lastSeen, streak, status } }
```

### 4. Quiz components — capture per-question results
In each `*Mode.jsx` quiz component, accumulate a `results` array as the student answers
(`{ questionId: q.id, topic: q.topic, group: <from subjects.js or null>, correct }`).
On quiz completion, pass it to the submit path from step 3. Do not change the existing
scoring/leaderboard behavior.

### 5. Student dashboard — `src/components/WeaknessDashboard.jsx` (+ `.css`)
- Reads `weaknessProfiles/{currentUser.uid}`.
- Renders a strong/weak **heatmap** grouped by `FIQH_GROUPS` (Tahara / Prayer) and by
  Arabic modes, coloring each topic by `status` (weak = red, developing = amber,
  strong = green), showing accuracy % and attempts.
- Empty state when a student has no data yet.
- Add a route and a nav entry (match how existing routes/components are registered).

### 6. Review-quiz builder — in `QuizPicker.jsx` / `TimedQuiz.jsx`
- Add a "Review your weak spots" option.
- Build a ~10-question set sampled across the student's weak + developing topics using
  `reviewWeights(profile)`; prefer questions previously answered wrong (query
  `answerEvents` where `userId == uid && correct == false`, dedup by `questionId`) before
  pulling fresh questions from the same topics.
- Reuse the existing timed-quiz UI; on completion it flows through the same submit path so
  scores recover.

### 7. Admin view — extend `AdminPage.jsx`
- Class-wide heatmap: read all `weaknessProfiles`, show per-topic average status/accuracy
  across students, and a "topics to reteach" list (topics where a high share of students
  are weak).
- Per-student drill-down reusing the same heatmap component.

### 8. Firestore rules — `firestore.rules`
Add rules for the two new collections, reusing the existing admin-check pattern. Keep
`answerEvents` append-only (`update, delete: if false`). Example:
```
match /answerEvents/{eventId} {
  allow read: if request.auth != null &&
    (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if request.auth != null &&
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.correct is bool &&
    request.resource.data.topic is string &&
    request.resource.data.answeredAt == request.time;
  allow update, delete: if false;
}
match /weaknessProfiles/{userId} {
  allow read: if request.auth != null &&
    (userId == request.auth.uid || isAdmin());
  allow write: if request.auth != null && userId == request.auth.uid;
}
```
Factor the admin check into a `function isAdmin()` helper if the ruleset doesn't have one.

### 9. Tests
Add unit tests for `src/lib/weakness.js` (pure functions): recency weighting, status
thresholds, min-attempts gate, `getWeakTopics` ordering, `reviewWeights`. Use whatever
test runner is already configured; if none exists, add a minimal `vitest` setup and a
`test` script — nothing more.

## Constraints & acceptance criteria

- `npm run lint` and `npm run build` must pass.
- No new Firestore reads/writes on paths that already work (leaderboard unaffected).
- Exactly one extra read + one batched write per quiz submission.
- All weakness code degrades gracefully when `question.topic`/`question.id` is missing.
- Do NOT add fake anti-cheat; preserve the honesty note in `quiz.js`. If server-side
  integrity is ever needed, leave a code comment noting a Cloud Function on `answerEvents`
  is the upgrade path — do not build it now.
- Ship Fiqh-first: the feature must fully work on Fiqh today (already tagged) and light up
  automatically for Arabic modes once their questions carry `id` + `topic`.

## Suggested commit order
1. `config/weakness.js` + `lib/weakness.js` + tests.
2. `answerEvents` + `weaknessProfiles` writes wired into the submit path + rules.
3. `WeaknessDashboard` + route.
4. Review-quiz builder.
5. Admin class/per-student views.
