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

# [alimiyyah-project-main] recent context, 2026-07-25 7:53pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (24,386t read) | 3,159,254t work | 99% savings

### Jul 13, 2026
S61 graphify . on alimiyyah-project-main — parallel knowledge graph extraction in progress, 6 of 9 chunks now complete (Jul 13 at 9:46 PM)
S62 graphify . on alimiyyah-project-main — persistent polling loop waiting for PDF extraction chunks 01, 03, 04 to complete (Jul 13 at 9:46 PM)
### Jul 23, 2026
S68 Fix quiz bug where correct answer is always first option shown — shared-level Fisher-Yates shuffle + value-based correctness refactor across all quiz components (Jul 23 at 4:03 PM)
### Jul 25, 2026
772 6:57p 🔵 Firestore Unbounded Queries: Three Critical P0/P1 Findings
773 " 🔵 App.jsx Uses In-Memory State for Navigation — No URL Per Practice Mode
775 6:58p 🔵 TimedQuiz.jsx: Multiple Correctness Risks Identified in Timer and Save Logic
776 " 🔵 Firestore: Missing answerEvents Index + weaknessProfiles Over-Permissive Write Rule
777 " 🔵 Auth System: Fake Email Pattern with Non-Functional Password Reset for Users Without Recovery Email
778 6:59p 🔵 Repo Hygiene: 158MB PDFs, graphify-out Cache, .pyc Files, and Duplicate Spec File All Tracked in Git
779 " 🔵 CSS: Duplicate :root Definitions in App.css vs index.css; success Color Fails WCAG AA on Light Theme
780 " 🔵 Test Coverage: 12 Test Files; Zero Tests for App Routing, TimedQuiz, HomeScreen, Auth Flow, or AdminPage
781 " 🔵 Practice Mode Components: useWeaknessTracking Fires One Firestore Write Per Answer Across All 8 Self-Paced Modes
782 " 🔵 Leaderboard: Double Firestore Read on Every Mode Tab Switch; HomeScreen Fires Leaderboard + Recent Results on Mount
783 " 🔵 Build Config: Minimal vite.config.js with No Code Splitting; package.json Missing Prettier/format Scripts
784 " 🔵 Accessibility: AuthHeader Has Full ARIA Menu Pattern; VocabMode Flashcard div is Keyboard-Inaccessible; No Error Boundaries Anywhere
785 7:04p 🔴 Step 2 Complete: Prettier 3.9.6 + eslint-config-prettier 10.1.8 Installed; format/format:check Scripts Added
786 " 🔴 Step 3 Complete: Prettier Reformatted 66 Files in src/ as Isolated Commit
787 " 🔴 Step 4 Complete: ESLint Tightened — 0 Errors, 15 Warnings (All no-console); No Missing Hook Deps Found
788 " 🔴 Step 5 Complete: CI Workflow, .env.example, .gitignore Fixes, HTML Metadata, Duplicate Spec File Deleted
789 " 🔵 Architecture Map: BANKS Object in TimedQuiz is the Complete Mode-to-Data Binding; getAllQuizResults() Confirmed Unbounded
790 7:10p 🔴 Fixed Hardcoded "/10" Score Displays to Use result.total
791 " 🟣 Added Tests for Dynamic Score Total Rendering
792 " ✅ Removed Tracked .DS_Store Files from Repository
793 " 🔵 Code Audit Confirmed Exactly Three Hardcoded "/10" Display Sites
794 " 🔵 .DS_Store Files Exist on Disk But Are Not Git-Tracked
795 " 🔵 LeaderboardTable Is the Single Rendering Leaf for All Score Displays
796 7:11p 🔵 LeaderboardTable Tests Require Mocking ../lib/quiz to Avoid Firebase Init Crash
797 7:12p 🔴 TDD RED Confirmed: Test Caught Hardcoded "/10" Bug in LeaderboardTable
798 " 🔴 Applied result.total Fixes to HomeScreen and LeaderboardTable
799 " ✅ Deleted src/.DS_Store and src/data/.DS_Store from Disk
800 " 🔴 TDD GREEN: LeaderboardTable Test Passed — Fix Confirmed Complete
801 " 🔵 Post-Fix Audit Confirmed No Remaining Hardcoded "/10" Score Display Bugs
802 7:13p 🔴 Full Test Suite, Lint, and Build All Pass After Score Total Fix
803 " ✅ Final Verification Confirmed Complete Change Surface Before Commit
804 7:16p 🔵 qasas-practice App: Error Handling Audit Findings
805 " ⚖️ Error Resilience Hardening Plan: Six-Phase Approach
806 " 🔵 Console Call Audit: 15 Calls Confirmed Across 15 Files
807 7:17p 🔵 weaknessProfiles Confirmed Dead Code — Safe to Delete
808 " 🔵 Firestore Rules Gap: answerEvents Writes group and quizResultId Not in Rules
809 " 🔵 App Entry Points Confirmed: No Error Boundaries in main.jsx or App.jsx
810 " 🔵 Baseline Verified: 52 Tests Pass, 15 Lint Warnings, Build Succeeds
811 " 🔵 User-Facing Error State Audit: HomeScreen Silently Swallows Fetch Error
812 " 🔵 JSX Bug in TimedQuiz: Duplicate Closing Button Tag in ExitDialog
813 7:19p 🔵 New Dependencies Installed: @sentry/react, @sentry/vite-plugin, @firebase/rules-unit-testing, firebase-tools
814 7:20p 🔵 TDD Red Phase: 5 New Test Files Written, 4 Fail on Missing Modules, 1 Skips on No Emulator
815 " 🔵 answerEvents Rules Gap: quizResultId Can Be null (Weakness Tracking Path)
816 " 🔵 Step 3 Core Modules Written: firebase-env.js, auth-errors.js, logger.js, ErrorBoundary.jsx
817 7:21p 🔵 Step 3 Wiring Complete: 6 Existing Files Updated to Use New Modules
818 " 🔵 Step 3 UI Wiring: Route ErrorBoundary + Retry Controls Added to 5 Components
819 7:23p 🔵 Step 3 Remaining Console Calls Replaced + Retry Controls Added: 4 More Files Updated
820 " 🔵 TimedQuiz.jsx: Final Console Calls Replaced + Quiz-Specific Error Boundary + Skip Question Handler
821 7:24p 🔵 Cleanup Pass: HomeScreen, Leaderboard, LeaderboardPreview Fetch Functions Wrapped in useCallback
822 7:25p 🔵 Step 3 Cleanup + Rules Test Infrastructure: All Writes Confirmed

Access 3159k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>