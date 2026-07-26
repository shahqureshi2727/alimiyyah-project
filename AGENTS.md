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

# [alimiyyah-project-main] recent context, 2026-07-25 11:14pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (25,453t read) | 1,605,742t work | 98% savings

### Jul 13, 2026
S61 graphify . on alimiyyah-project-main — parallel knowledge graph extraction in progress, 6 of 9 chunks now complete (Jul 13 at 9:46 PM)
S62 graphify . on alimiyyah-project-main — persistent polling loop waiting for PDF extraction chunks 01, 03, 04 to complete (Jul 13 at 9:46 PM)
### Jul 23, 2026
S68 Fix quiz bug where correct answer is always first option shown — shared-level Fisher-Yates shuffle + value-based correctness refactor across all quiz components (Jul 23 at 4:03 PM)
### Jul 25, 2026
820 7:23p 🔵 TimedQuiz.jsx: Final Console Calls Replaced + Quiz-Specific Error Boundary + Skip Question Handler
821 7:24p 🔵 Cleanup Pass: HomeScreen, Leaderboard, LeaderboardPreview Fetch Functions Wrapped in useCallback
822 7:25p 🔵 Step 3 Cleanup + Rules Test Infrastructure: All Writes Confirmed
842 7:53p 🔵 App.jsx Split-Personality Navigation Architecture in qasas-practice
843 " ⚖️ Full URL-Based Routing Plan for All App Screens
844 " 🔵 App.jsx Full Source Confirms Split-Personality Navigation with Exact String-Prefix Parsing
845 " 🔵 subjects.js is the Authoritative Topic Registry for All Subjects
846 7:54p 🔵 AuthContext Already Exposes isAdmin Computed from Cached userDoc
847 " 🔵 App Provider Tree: Bootstrap Dynamic Import → RootApp → BrowserRouter/AuthProvider → App
848 " 🔵 localStorage lastQuizMode: 4 Write Sites in App.jsx, 2 Read Sites in Leaderboard Components
849 " 🔵 TimedQuiz History-Push Mechanism: Lines 403/409 Push on Mount and Every popstate
850 " 🔵 HomeScreen Uses Local subject State for Subject Navigation — Must Become URL Navigation
851 " 🔵 Data Layer: getFiqhQuestions Supports 'all', Group Code, or Topic Code; Tafsir Has Dual Script Fields
852 " 🔵 Test Suite Uses renderToStaticMarkup and react-test-renderer — No Testing Library
853 7:56p 🔵 Login and Signup Navigate to '/' Hardcoded — Deep Link Redirect Not Yet Implemented
854 " 🔵 MorphologyMode Has Internal Scope Picker — :topic Route Param Maps to Scope
855 " ⚖️ Six-Step Implementation Plan Adopted for Routing Refactor
856 " 🟣 Failing Route Tests Written for app-routes.js Helpers and App Route Integration
857 " 🔵 Tests Are Red for the Correct Reasons — TDD RED Phase Confirmed
858 " 🔵 bank.js is a Barrel File — irab, noun, role, vocab Banks Defined Inline; morphology Re-exported
860 " 🟣 src/lib/app-routes.js Implemented — Route Helpers with Param Validation Against Live Question Banks
861 " 🟣 subjects.js Extended with UNTITLED_PRACTICE_MODES and MORPHOLOGY_TOPICS Exports
862 " 🟣 src/lib/last-quiz-mode.js Created — Centralized lastQuizMode localStorage Helper
859 7:57p ⚖️ Route Helper API Revised to Accept Structured Objects Instead of Legacy Encoded Strings
864 8:01p 🟣 App.jsx Completely Rewritten — Real URL Route Table Replaces Local State Machine
865 " 🟣 HomeScreen.jsx Updated — Mode Cards Use Structured target Objects, openPractice/openQuizPicker Replace Direct Callbacks
866 " 🟣 QuizPicker.jsx Completely Rewritten — Mode Array Uses Structured target Objects, startQuiz Navigates via quizPath()
867 " 🟣 MorphologyMode.jsx Updated — onSelectScope Prop Added for URL-Based Topic Navigation
868 " 🟣 Login.jsx Updated — Deep Link Redirect via location.state?.from
870 8:03p 🟣 Leaderboard.jsx and LeaderboardPreview.jsx Updated — lastQuizMode Read Site Migrated to getLastQuizMode()
871 " 🟣 TimedQuiz.jsx Updated — useBlocker Replaces window.history.pushState History Pollution
872 " 🟣 App.css Updated — .route-message CSS Added for InvalidRoute, NotFound, AdminDenied Screens
876 " 🟣 App.jsx Refactored to Fix 3 Lint Errors — headerOverride Pattern Replaces setHeaderHidden Effect; PracticeSession Split Replaces setScore Effect
877 " 🟣 TimedQuiz.jsx Refactored to Fix Lint Error — useEffect(blocker.state) Removed; Derived Variables Replace It
890 8:11p ⚖️ Large-Scale Refactoring Plan Defined for qasas-practice App
891 " 🔵 Superpowers Plugin Cached at v6.2.0, Not v6.1.1
892 8:12p 🔵 Baseline Line Counts Measured for All Refactor Target Files
893 " 🔵 subjects.js Already Contains a Full Mode Registry — Natural Home for Renderer Registry
894 " 🔵 Practice Mode State Machines Differ More Than Expected — Complicates usePracticeSession Extraction
895 " 🔵 TimedQuiz.jsx Internal Structure: Pure Functions Already Isolated, Timer Uses setInterval with stale-closure Risk
896 " 🔵 AdminPage.jsx Firestore Calls Already Delegated to lib — admin-queries.js Extraction is Smaller Than Expected
897 8:14p 🔵 Pre-Refactor Baseline: 71 Tests Passing, Lint Clean, Branch is codex/bug-fixes
898 " 🔵 score/setScore Props Owned by PracticeSession in App.jsx — Not Inside Individual Mode Components
901 " 🔵 Step 3 Started: PracticeShell.jsx Created at src/components/practice/PracticeShell.jsx
902 8:17p 🔴 CRITICAL: write_file apply_patch Returned success=true But Did NOT Modify IrabMode.jsx or NounMode.jsx
903 8:18p 🔵 Working Pattern for Component Rewrites: *** Delete File + *** Add File on Same Path Atomically Replaces Content
904 " 🔵 RoleMode.jsx and VocabMode.jsx Rewritten with Delete+Add Pattern — Both Patches Contained in a Single write_file Call
905 " 🔵 FiqhPracticeMode and HadithPracticeMode Rewritten — New answer() Object Pattern for Card-Style Modes
906 8:19p 🔵 MorphologyMode.jsx Refactored with *** Update File (Worked) — Key Gotchas: currentIndex Unused, Bank Re-Shuffled on Scope Change
907 " 🔵 TafsirPracticeMode.jsx Refactored — Dual Architecture: MCQ Delegates to usePracticeSession, Verse Mode Remains Manual

Access 1606k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>