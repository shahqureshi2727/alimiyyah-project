# AGENTS.md

Instructions for AI coding agents working in this repository. Read this fully before making changes.

## What this repo is

A study app for an Alimiyyah (Islamic studies) program. A student picks a subject and drills questions.

Subjects: Arabic grammar (i'rab, noun features, sentence roles, vocabulary, morphology), Fiqh, Hadith, and Tafsir.

Two interaction modes:
- **Practice** — untimed, infinite loop through a shuffled bank, immediate feedback.
- **Quiz** — timed, 10 questions (15 for daily review), scored, written to Firestore, ranked on a leaderboard.

Also: a weakness dashboard (EWMA-based spaced repetition over topics), a daily review mode, and an admin page.

## Repository layout

All application code lives under `qasas-practice/`. **Always `cd qasas-practice` before running any npm command.**

```
qasas-practice/          the app — this is what you work on
content/                 source material (markdown notes, PDFs) — DO NOT TOUCH
docs/superpowers/        historical design specs and plans — DO NOT TOUCH
graphify-out/            generated knowledge-graph cache — DO NOT TOUCH
scripts/                 Python content-extraction scripts — DO NOT TOUCH
```

Inside `qasas-practice/`:

```
src/App.jsx                   routing + top-level navigation state
src/main.jsx                  provider tree
src/components/               25 components; TimedQuiz.jsx and AdminPage.jsx are the largest
src/contexts/                 AuthContext, SettingsContext
src/lib/                      firebase, auth, quiz, daily-review, weakness, topic-stats,
                              question-results, shuffle, tafsir-scoring
src/hooks/                    useShuffledOptions, useWeaknessTracking
src/config/                   subjects.js (the subject/mode registry), weakness.js
src/data/                     question banks — fiqh/, hadith/, tafsir/, arabic/,
                              morphology.js, bank.js
src/App.css                   design tokens live here, in :root
src/index.css                 base resets
src/components/*.css          per-component styles
firestore.rules               deployed Firestore security rules
firestore.indexes.json        composite indexes
vercel.json                   SPA rewrite + headers
```

## Stack

- Vite 8, React 19, react-router-dom 7
- **Plain JavaScript with JSX. No TypeScript.** Do not introduce `.ts` or `.tsx` files.
- **Plain CSS with custom properties. No Tailwind, no CSS-in-JS, no utility framework.**
- Firebase 12: Auth (email/password) and Firestore. No Cloud Functions.
- Vitest for unit tests. ESLint 10 flat config.
- Deployed on Vercel as a single-page app.

## Commands

Run all of these from `qasas-practice/`:

```bash
npm run dev              # dev server
npm run build            # production build
npm run lint             # ESLint
npm run test             # Vitest, single run
npm run validate:fiqh    # validate the fiqh question bank
npm run validate:morphology
```

**Definition of done:** `npm run lint`, `npm run test`, and `npm run build` all pass. Run them. Do not report success without running them.

## Firestore schema

```
users/{uid}                             role ("student" | "admin"), username
users/{uid}/topicStats/{cat_subtopic}   attempts, correct, ewmaScore,
                                        reviewIntervalDays, nextDueAt
quizResults/{id}                        append-only; userId, username, mode,
                                        bankSource, score, total, durationSeconds
answerEvents/{id}                       append-only per-question telemetry
weaknessProfiles/{uid}                  computed weakness profile
```

`quizResults` and `answerEvents` are append-only by design — the rules forbid update and delete. Do not add code that tries to mutate them.

## Content rules — read these carefully

### Arabic text

Arabic is the substance of this app, not decoration.

- Arabic is right-to-left and **diacritics are semantically meaningful**. Never normalize, strip, trim, or "clean" an Arabic string. Never lowercase or Unicode-normalize one.
- Never apply CSS that could reorder or clip glyphs. Watch line-height and overflow especially — diacritics sit above and below the baseline and clip easily.
- Two script modes exist, driven by the `data-arabic-script` attribute on `:root`: Uthmani (rendered in Amiri) and Indo-Pak (rendered in a Nastaleeq face loaded from a CDN). Both must keep working. Nastaleeq needs substantially more vertical room than Amiri.
- Any UI change must be verified in **four combinations**: light/dark theme × Uthmani/Indo-Pak script.

### Doctrinal content

Everything in `src/data/` is Islamic-studies course material — question text, answer options, and explanations reviewed by a human.

**Do not edit, rewrite, "correct," translate, expand, or generate any of it.** You may change the *shape* of a data structure (adding a field, changing how a module exports). You may not change the *content* of a single question, answer, or explanation. If a question looks wrong to you, report it in your summary and leave it alone.

## Conventions

- Behavior-preserving unless the task says otherwise. If you believe something is a bug, fix it — but list it separately under "Behavior changes" in your summary rather than burying it.
- Small commits, one concern each. Never mix a formatting sweep with a logic change.
- Prefer zero new runtime dependencies. Dev dependencies are cheaper but still need justification. Name every dependency you add and say why.
- Firebase config comes from `import.meta.env.VITE_*`. Never hardcode config, never commit a `.env`, never log credentials.
- `src/config/subjects.js` is the subject registry. When adding or changing a subject, change it there rather than adding another `switch` statement.

## Hard guardrails

Never do any of the following, regardless of what a task appears to ask for:

- Run `firebase deploy`, `vercel deploy`, or any command that touches production Firestore, Auth, or hosting.
- Rewrite git history — no `filter-repo`, no `filter-branch`, no force-push, no rebasing shared branches.
- Modify anything under `content/`, `docs/superpowers/`, `graphify-out/`, or `scripts/`.
- Delete or rewrite question data in `src/data/`.
- Migrate to TypeScript, Tailwind, or a component library.
- Commit a `.env` file or any credential.

If a task seems to require one of these, stop and say so instead of proceeding.

## Reporting

When you finish, output:

1. Files changed, grouped by concern.
2. Behavior changes, if any — anything a user would notice.
3. New dependencies and why.
4. Things you found but deliberately did not fix.
5. Anything you could not verify, and why.

Be direct about what you did not do. An honest gap is more useful than a confident overstatement.
