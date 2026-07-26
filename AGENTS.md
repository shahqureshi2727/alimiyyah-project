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


<claude-mem-context>
# Memory Context

# [alimiyyah-project-main] recent context, 2026-07-26 12:00am EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (23,594t read) | 1,497,156t work | 98% savings

### Jul 13, 2026
S61 graphify . on alimiyyah-project-main — parallel knowledge graph extraction in progress, 6 of 9 chunks now complete (Jul 13 at 9:46 PM)
S62 graphify . on alimiyyah-project-main — persistent polling loop waiting for PDF extraction chunks 01, 03, 04 to complete (Jul 13 at 9:46 PM)
### Jul 23, 2026
S68 Fix quiz bug where correct answer is always first option shown — shared-level Fisher-Yates shuffle + value-based correctness refactor across all quiz components (Jul 23 at 4:03 PM)
### Jul 25, 2026
915 11:16p 🔵 Admin Delegation Layer and Auth Architecture — Complete Audit Picture
916 " 🔵 Firestore Security Rules — isAdmin() Billed Read Impact and Save Status UI Honesty
917 " 🟣 Repository Layer TDD Tests Written — All 5 Fail Red for Correct Reason
918 11:26p 🔵 Bundle Optimization Plan for qasas-practice App
919 " 🔵 Working Branch and Repo State for Bundle Optimization Work
920 11:27p 🔵 Full Static Import Map: Question Banks Pulled Eagerly from 10+ Files
921 " 🔵 Baseline vite.config.js Has No manualChunks, No Bundle Analyzer, No Size Budget
922 " ⚖️ Implementation Plan: 7-Step Bundle Optimization Sequence
923 11:28p 🔵 Baseline Bundle Analysis: Concrete Size Measurements Per Module and Group
924 " 🟣 Bundle Visualizer Added to Vite Config (ANALYZE_BUNDLE=1 Flag)
925 " 🔵 Confirmed Baseline Bundle Sizes (zlib-measured from actual output files)
926 " 🔵 daily-review.js REVIEW_SOURCES Executes All Bank Calls at Module Init Time
927 " 🔵 Timer Re-renders Entire TimedQuiz Component 4x Per Second
928 " 🔵 App.jsx Imports All Route Components Statically — No React.lazy Anywhere
929 11:29p 🟣 Tests Written First for New Async loadBank API (TDD Red Phase)
930 " 🔵 HomeScreen Calls getTafsirSurahOptions() Synchronously in Component Body
931 11:30p 🔵 firebase.js Eagerly Initializes Both Auth and Firestore at Module Load
932 " 🔵 Bootstrap.jsx Already Does One-Level Lazy Load of RootApp via useEffect
933 " 🔵 Blocking Google Fonts @import in index.css — Both Amiri and Crimson Text Fonts
934 " 🟣 daily-review.js Refactored: Removed All Static Bank Imports (Green Phase Step 1)
935 11:33p 🟣 Step 2 and 3 Complete: All Data Banks Now Dynamically Imported, All Components React.lazy
936 " 🔵 Test Files Still Mock '../firebase' and './firebase' After Firestore Split — Will Fail
937 " 🟣 Step 5 Complete: Google Fonts @import Removed from CSS, Moved to Non-Blocking <link> Tags in HTML
938 " 🟣 vi.mock Paths Fixed in Both Test Files After Firestore Split
939 " 🟣 @lhci/cli Installed and Vite manualChunks Added for firebase/sentry/vendor Splits
940 11:34p 🟣 Post-Optimization Build Successful: Question Banks Split into Per-Topic Chunks, Initial Entry ~5 KB
941 " 🟣 New Scripts and Lighthouse CI Config Added (Step 7 Infrastructure)
942 " 🟣 5 Target Test Files All Pass After All Refactors (22/22 Tests Green)
943 11:35p 🔵 Critical: sentry and vendor Chunks Are In index.html as Blocking Script Tags
944 " 🔵 auth.js Split: Firestore-Using repositories/users.js Now Dynamically Imported in signUp/getUserDoc
945 " 🟣 HomeScreen Tafsir Retry Fixed: Removed setState(null)+setTimeout Race, Uses retryKey Pattern Instead
946 11:36p 🟣 TDD Cycle for Sentry Lazy Load: Test Added (Red), logger.js Refactored (Green), Syntax Bug Fixed
947 " 🔵 Sentry Dynamic Import Backfired: Chunk Grew 5x (483 KB) and Remains Blocking — Static Import Was Better
948 11:37p 🔴 Sentry Blocking Issue Fixed: HTML_JS_TOTAL Drops from 750 KB to 285 KB / 90.3 KB gzip
965 11:46p 🔵 Bundle Size Baseline and Optimization Plan for qasas-practice
963 11:55p ⚖️ Design Planning Session Initiated for qasas-practice App
964 11:56p 🔵 AUDIT.md Section 7 — UI/UX Consistency Issues Catalogued
966 " 🔵 App Routing and Complete Component Inventory Mapped
967 " 🔵 HomeScreen Two-Level Navigation Pattern and QuizPicker Gap Confirmed
968 " 🔵 TimedQuiz Layout Structure: Timer Lives in Header Row Between Progress and Score
974 11:57p 🔵 Quiz Renderer Architecture: Eight Per-Subject Renderers with Different Interaction Models
975 " 🔵 PracticeShell Is a 33-Line Shared Wrapper; All Practice Modes Use It
976 " 🔵 WeaknessDashboard Has No Navigate-to-Practice Links; Dashboard-to-Topic Path Is Broken
977 " 🔵 App.css Token System: Colors Complete, Spacing/Radius/Shadow/Type Scale Absent
978 " 🔵 AuthHeader Navigation and Settings Panel: Strength Map Accessible from User Menu
969 11:58p 🔴 App.test.jsx Fixed After ProtectedLayout Extraction
970 " 🟣 Dynamic Question Bank Loading via useAsyncQuestionBank Hook
971 " 🔄 Firebase Split Into Lazy-Loaded Modules and ProtectedLayout Extracted
972 " 🟣 Bundle Budget CI Check and Lighthouse CI Added
973 " 🔵 Final Bundle Metrics After All Optimizations

Access 1497k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>