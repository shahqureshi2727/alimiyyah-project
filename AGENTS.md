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

# [alimiyyah-project-main] recent context, 2026-07-25 7:10pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (25,092t read) | 3,033,513t work | 99% savings

### Jul 13, 2026
S61 graphify . on alimiyyah-project-main — parallel knowledge graph extraction in progress, 6 of 9 chunks now complete (Jul 13 at 9:46 PM)
S62 graphify . on alimiyyah-project-main — persistent polling loop waiting for PDF extraction chunks 01, 03, 04 to complete (Jul 13 at 9:46 PM)
### Jul 23, 2026
S68 Fix quiz bug where correct answer is always first option shown — shared-level Fisher-Yates shuffle + value-based correctness refactor across all quiz components (Jul 23 at 4:03 PM)
740 6:03p 🔵 pdftoppm PNG Rendering Timed Out on Large Canva Surah PDFs
741 " 🔵 Surah Text Extraction Succeeded: English Notes Readable, Arabic Verse Text Absent
742 6:04p 🟣 All 6 Surah Text Files Successfully Extracted to tmp/pdfs/tafsir-raw/
743 " 🔵 Tafsir Integration Points and Arabic Unicode Quality Constraint
744 " ⚖️ TDD Approach Chosen for Tafsir Data Module
745 6:05p 🟣 Tafsir Test Suite Written and Confirmed Failing (TDD Red Phase)
746 " ⚖️ quran.com API v4 Chosen for Clean Arabic Ayah Text in Both Scripts
747 6:06p 🔵 Surah Slide-to-Ayah Mapping Confirmed: Non-1:1 Ratio Requires Manual Slide Assignment
748 " 🟣 Tafsir Phase 3 Data Module — All Tests Green, Build Passing
749 6:14p 🔴 App Architecture Context for Tafsir UI Integration
751 " ⚖️ Tafsir UI Design Approved — Implementation Phase Begins
750 6:19p 🔴 Full Tafsir Integration Surface — All Files Requiring Changes
752 6:37p 🔵 Git Working Tree Clean — Tafsir Implementation Not Yet Started
753 " 🔵 Design Spec Format Used in This Project — Morphology Spec as Template
754 6:38p 🟣 Tafsir Section Design Spec Written and Saved
755 " 🔵 Tafsir Spec Verified Clean — No TODOs or Placeholders
757 " ⚖️ Implementation Plan Phase Begins — writing-plans, TDD, and frontend-design Skills Loaded
756 6:39p ✅ Tafsir Design Spec Committed to Git
758 " 🔵 Complete Tafsir Data Layer File Inventory Confirmed
759 " 🔵 All 19 Tafsir Data Files Confirmed Committed to Git
761 " 🟣 Tafsir Implementation Plan Written — 5 Tasks, 19 Files
760 6:40p 🔵 Clean Test Baseline — 30/30 Tests Passing Before Tafsir UI Implementation
762 6:41p 🔴 Implementation Plan Committed — Task 1 Now In Progress
763 6:43p 🔴 Tasks 1 and 2 Complete — 38 Tests Passing, Task 3 Now In Progress
764 6:44p 🔴 Task 3 RED Phase Confirmed — Component Smoke Tests Written and Failing
765 " 🟣 TafsirQuestionCard.jsx Implemented
766 " 🟣 TafsirVerseCard, TafsirPracticeMode, and TafsirQuestionCard.css All Implemented
767 6:46p 🟣 Phase 4 Firestore Rules Deployed to Production
### Jul 25, 2026
768 6:55p 🔵 qasas-practice App Architecture & Constraints Established
769 6:56p ⚖️ Phase 1 Scope: Audit-Only + Tooling Baseline Before Any Refactoring
770 " 🔵 Pre-Audit Repo State: Key Gaps Confirmed
771 6:57p 🔵 Baseline Build: 1.19 MB JS Bundle Exceeds Vite 500 kB Threshold
772 " 🔵 Firestore Unbounded Queries: Three Critical P0/P1 Findings
773 " 🔵 App.jsx Uses In-Memory State for Navigation — No URL Per Practice Mode
774 " 🔵 Source Map: 21k Lines, Data Layer is 60% of Bundle
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

Access 3034k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>