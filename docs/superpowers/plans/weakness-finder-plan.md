# Weakness Finder — Implementation Plan

_Alimiyyah / Qasas Practice app · Firebase (Firestore + Auth) · React 19 + Vite_

## Goal

After a student answers questions, track accuracy **per tagged topic/category** so the
app can flag weak areas and help each student strengthen them. Both students and admin
accounts can see the data. Weakness is measured with **recency-weighted accuracy** and
acted on through **targeted review quizzes** and a **strong/weak heatmap dashboard**.

---

## 1. What exists today (and the gaps)

**Already in place**

- `quizResults` collection stores quiz-level rollups only: `mode`, `bankSource`,
  `score`, `total: 10`, `durationSeconds`, `completedAt`. Append-only, no per-question data.
- Fiqh questions are well structured: stable `id` (`FQH-WUD-Q01`), a `topic` code
  (`WUD`), and `sourceIds` back to the ruling. Topics/groups are already modeled in
  `src/config/subjects.js` (`FIQH_TOPICS`, `FIQH_GROUPS`) and `src/data/fiqh/index.js`.
- Firestore rules enforce per-user writes and append-only results.

**Gaps that block a weakness finder**

1. **No per-question record.** `quizResults` can't tell you _which_ questions were missed,
   so it can't attribute a miss to a topic. This is the core thing to add.
2. **Arabic modes have no stable IDs and no tags.** `irab`, `nounFeatures`, `roles`,
   `vocab`, `morphology` questions are plain objects keyed by array position. You said
   tags/categories are being added — they also need a **stable `id`** and a **`topic`/
   `category` code** per question, exactly like Fiqh, or misses can't be attributed.
3. **No weakness state to read.** Nothing aggregates accuracy per topic per user.

---

## 2. Data model (Firestore)

Three additions. Keep the append-only event log as the source of truth; derive
everything else from it.

### 2a. `answerEvents` (new collection) — raw, append-only

One document per answered question. This is the ground truth the weakness score is
computed from.

```
answerEvents/{eventId}
  userId:       string        // request.auth.uid
  username:     string        // denormalized, for admin views
  mode:         string        // "fiqh" | "irab" | "nounFeatures" | ...
  bankSource:   string        // "fiqh" | "qasas" | "quran"
  topic:        string        // topic/category code — "WUD", "NJS", or arabic tag
  group:        string|null   // "tahara" | "prayer" | arabic super-category (optional)
  questionId:   string        // stable question id — REQUIRES arabic IDs (gap #2)
  correct:      boolean
  answeredAt:   timestamp     // request.time
  quizResultId: string|null   // link back to the parent quizResults doc
```

Write these in the same submit path as `quizResults` (batched write, one round trip).
For a 10-question quiz that's 10 event docs + 1 result doc.

### 2b. `weaknessProfiles/{userId}` — derived, one doc per user

A compact rollup the app reads for the dashboard and to weight review quizzes. Updated
incrementally on each quiz submit (cheap) rather than recomputed from scratch.

```
weaknessProfiles/{userId}
  userId:   string
  username: string
  updatedAt: timestamp
  topics: {
    WUD: {
      attempts: number,
      score: number,        // recency-weighted accuracy 0..1 (see §3)
      lastSeen: timestamp,
      streak: number,       // consecutive correct, for "recovering" state
      status: "weak" | "developing" | "strong"
    },
    NJS: { ... },
    ...
  }
```

### 2c. Aggregate for admin (choose one)

- **Simplest:** admin dashboard queries all `weaknessProfiles` (fine for a mosque-class
  roster of tens of students; one read per student).
- **Scales better:** a `classWeakness` summary doc updated by a Cloud Function, giving
  per-topic averages across the class without reading every profile. Add later only if
  the roster grows.

---

## 3. How "weak" is computed (recency-weighted)

Use an **exponentially-weighted moving accuracy** so recent answers dominate and a
student's flag clears as they improve — no slow-to-recover lifetime average.

On each answered question for a topic:

```
w = 0.7                      // recency weight; recent answers count ~2–3x older ones
x = correct ? 1 : 0
score_new = w * x + (1 - w) * score_old      // score starts at 1.0 (assume-competent)
attempts += 1
streak = correct ? streak + 1 : 0
```

Then map to a status with hysteresis (so it doesn't flip-flop on one answer):

```
weak        if score < 0.55
developing  if 0.55 <= score < 0.75
strong      if score >= 0.75   (and attempts >= 3)
```

Notes:
- Require a minimum `attempts` (e.g. 3) before flagging **weak**, so one unlucky miss
  on a brand-new topic doesn't panic the student.
- Optionally decay `score` slightly over time-since-`lastSeen` so untouched topics drift
  toward "developing" and get resurfaced. Keep this optional for v1.
- All constants (`w`, thresholds, min attempts) live in one config file
  (`src/config/weakness.js`) so you can tune them without hunting through components.

---

## 4. Where it plugs into the app

1. **Question components** (`FiqhPracticeMode`, `IrabMode`, `NounMode`, `RoleMode`,
   `VocabMode`, `MorphologyMode`) already know each question and whether the answer was
   correct. Collect a per-question result array during the quiz.
2. **`src/lib/quiz.js`** — extend `submitQuizResult` (or add `submitAnswerEvents`) to
   write the 10 `answerEvents` + update `weaknessProfiles/{uid}` in one `writeBatch`.
3. **New `src/lib/weakness.js`** — pure functions: `updateProfile(profile, events)`,
   `getWeakTopics(profile, n)`, `statusFor(score, attempts)`. Unit-test these; they're
   the brain and have no Firebase dependency.
4. **New `src/components/WeaknessDashboard.jsx`** — the strong/weak heatmap for students.
5. **`QuizPicker` / `TimedQuiz`** — add a "Review weak spots" entry that builds a quiz
   weighted toward the student's weak topics (see §5).
6. **`AdminPage`** — add a class-wide + per-student weakness view.

---

## 5. Targeted review quizzes

When building a review quiz, draw questions with probability proportional to topic
weakness, capped so one topic doesn't dominate:

```
weight(topic) = 1 - score(topic)          // weaker topic → higher weight
```

- "Review my weak spots" mode: pull ~10 questions sampled across the student's weak +
  developing topics, favoring lower scores and least-recently-seen.
- Prefer questions the student actually got wrong (`answerEvents` where `correct=false`)
  before pulling fresh ones from the same topic — this is where per-question IDs pay off.
- After a review quiz, the same submit path updates the profile, so scores recover
  visibly. Show a small "topic upgraded to Strong 🎉" style confirmation.

---

## 6. Firestore rules changes

```
match /answerEvents/{eventId} {
  allow read:  if signed-in && (resource.data.userId == uid || isAdmin());
  allow create: if signed-in
                && request.resource.data.userId == uid
                && request.resource.data.correct is bool
                && request.resource.data.topic is string
                && request.resource.data.answeredAt == request.time;
  allow update, delete: if false;               // append-only
}

match /weaknessProfiles/{userId} {
  allow read:  if signed-in && (userId == uid || isAdmin());
  allow write: if signed-in && userId == uid;   // client-derived; or lock to a Function
}
```

Reuse the existing `isAdmin()` pattern (the `users/{uid}.role == "admin"` lookup already
used in the rules). **Honesty carry-over:** the same client-trust limitation noted in
`quiz.js` applies here — a determined student could fake events. Fine for a class; if it
ever matters, move the profile write into a Cloud Function triggered by `answerEvents`.

---

## 7. Build order (incremental, each step shippable)

1. Add stable `id` + `topic`/`category` tags to the Arabic banks (blocks everything for
   non-Fiqh modes; Fiqh already has them, so you can pilot on Fiqh first).
2. `src/config/weakness.js` (constants) + `src/lib/weakness.js` (pure logic) + unit tests.
3. Extend the submit path to write `answerEvents` + update `weaknessProfiles` in a batch.
4. Firestore rules for the two new collections; test in the emulator.
5. `WeaknessDashboard` heatmap for students.
6. "Review weak spots" quiz builder in `QuizPicker`/`TimedQuiz`.
7. Admin class-wide + per-student view in `AdminPage`.
8. (Optional, later) Cloud Function for server-side profile computation + `classWeakness`.

**Pilot suggestion:** ship steps 2–5 on Fiqh only (it's already tagged), validate the
scoring feels right with real students, then roll out to the Arabic modes once tagged.

---

## 8. Feature ideas — how an app like this can help this class

Grouped by effort. The first group is the natural extension of the plan above.

**Directly enabled by the weakness data**

- Strong/weak **topic heatmap** per student (Tahara vs Prayer groups, drill into topics).
- **"Review your weak spots"** auto-generated quiz weighted toward weak topics.
- **Priority queue / "Next best practice"** — one tap that always serves the highest-
  impact topic to work on right now.
- **Mastery badges** — a topic turns gold when it holds "strong" across several sessions.
- **Missed-question review deck** — flashcard pass over every question the student got
  wrong, with the `explanation` already stored on each question.
- **Progress-over-time chart** — accuracy trend per topic so students see improvement.
- **Wrong-answer explanations surfaced immediately** (Fiqh questions already carry
  `explanation` and `sourceIds` back to the ruling — link to the source text).

**Teacher / admin features**

- **Class heatmap** — which topics the whole class is weakest on, to steer the next lesson.
- **Per-student report cards** — printable/exportable summary for parent-teacher context.
- **"Topics to reteach" alert** — flag topics where >X% of the class is weak.
- **Assign targeted homework** — teacher pushes a review set on a specific topic.
- **Engagement view** — who's practicing, who's gone quiet.

**Learning-science features**

- **Spaced repetition** — resurface a mastered topic just before it's predicted to fade.
- **Daily streaks & gentle reminders** — keep practice habitual (schedule-driven).
- **Confidence check** — ask "how sure are you?" before revealing; over-confident misses
  weight the topic more (calibration training).
- **Adaptive difficulty** — once a topic is strong, mix in harder/edge-case questions.
- **Interleaving** — deliberately mix topics in a session (proven better than blocking).

**Content & motivation**

- **Source-linked learning** — from a missed Fiqh question, jump straight to the ruling
  in the vault (`sourceIds` already exists) or the lesson PDF.
- **Madhhab-aware review** — Fiqh questions already carry an optional `madhhab` field;
  let students filter/track by their madhhab.
- **Peer leaderboard by improvement** (not just raw score) — rewards growth, complements
  the existing leaderboard without discouraging weaker students.
- **Goal setting** — "get Tahara to all-strong by Friday" with a progress bar.
- **Explanatory hints on repeated misses** — after 2 misses on a question, offer a hint
  before the third attempt.

---

## Open questions for later

- Recency weight `w` and thresholds are guesses — tune against real class data.
- Time decay of stale topics: include in v1 or add once there's usage history?
- Admin aggregate: query-all vs. Cloud Function — decide based on final roster size.
