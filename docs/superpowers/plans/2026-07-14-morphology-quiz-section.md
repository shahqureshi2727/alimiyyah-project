# Morphology Quiz Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Morphology practice section with focused untimed drills and a mixed timed quiz.

**Architecture:** Add Morphology as a new Qasas bank mode backed by static JS data and a focused validator script. Reuse the existing practice-mode and timed-quiz patterns, adding a small morphology picker and render branch rather than changing the Fiqh topic system.

**Tech Stack:** React, Vite, plain CSS, static JS question banks, Node validation scripts.

## Global Constraints

- Practice Morphology has four scopes: `mixed`, `past`, `mudari`, `amrNahi`.
- Timed Morphology exposes only Mixed Review.
- Each item keeps a fine-grained `category`: `pastActive`, `pastPassive`, `mudariActive`, `mudariPassive`, `mudariNegative`, `imperative`, `prohibitive`.
- Answers are multiple choice; all choices for a question use the same base meaning.
- Use textbook-style English wording and Arabic form labels.
- Do not build weakness analytics in this pass.

---

### Task 1: Morphology Bank And Validator

**Files:**
- Create: `qasas-practice/src/data/morphology.js`
- Modify: `qasas-practice/src/data/bank.js`
- Create: `qasas-practice/scripts/validate-morphology-bank.mjs`
- Modify: `qasas-practice/package.json`

**Interfaces:**
- Produces: `morphology` array of question objects.
- Produces: `MORPHOLOGY_SCOPES`, `MORPHOLOGY_CATEGORIES`, `getMorphologyQuestions(scope)`.
- Consumes: no app UI state.

- [ ] Write validator script that imports the bank and fails before `morphology` exists.
- [ ] Run `node scripts/validate-morphology-bank.mjs` from `qasas-practice`; expect module/export missing failure.
- [ ] Add `src/data/morphology.js` with generated regular-form questions across all categories.
- [ ] Re-export morphology helpers from `src/data/bank.js`.
- [ ] Add `validate:morphology` npm script.
- [ ] Run `npm run validate:morphology`; expect pass with at least 120 items.

### Task 2: Untimed Morphology Practice

**Files:**
- Create: `qasas-practice/src/components/MorphologyMode.jsx`
- Modify: `qasas-practice/src/components/HomeScreen.jsx`
- Modify: `qasas-practice/src/App.jsx`
- Modify: `qasas-practice/src/components/ModeCommon.css`

**Interfaces:**
- Consumes: `getMorphologyQuestions(scope)` and question shape from Task 1.
- Produces: `MorphologyMode({ scope, onBack, score, setScore })`.

- [ ] Add Morphology to Home practice cards.
- [ ] Route selecting `morphology` to a scope picker.
- [ ] Render scope choices: Mixed Review, Past Tense, Present & Future, Imperative & Prohibitive.
- [ ] Render untimed MCQ question with verb, base verb meaning, choices, immediate feedback, explanation, and Next.
- [ ] Verify manually in dev server that all four scopes can be entered and advanced.

### Task 3: Timed Morphology Mixed Quiz

**Files:**
- Modify: `qasas-practice/src/config/subjects.js`
- Modify: `qasas-practice/src/components/QuizPicker.jsx`
- Modify: `qasas-practice/src/components/TimedQuiz.jsx`

**Interfaces:**
- Consumes: `morphology` bank from Task 1.
- Produces: timed mode id `morphology` with bank source `qasas`.

- [ ] Add `morphology` to `QUIZ_MODES`.
- [ ] Add exactly one timed quiz picker entry: Morphology: Mixed Review.
- [ ] Add TimedQuiz render branch for morphology MCQ.
- [ ] Add morphology target text for result breakdown.
- [ ] Verify timed quiz picker does not show focused Morphology subcategories.

### Task 4: Labels And Leaderboard Surfaces

**Files:**
- Modify: `qasas-practice/src/components/HomeScreen.jsx`
- Modify: `qasas-practice/src/components/Leaderboard.jsx`
- Modify: `qasas-practice/src/components/LeaderboardPreview.jsx`
- Modify: `qasas-practice/src/components/AdminPage.jsx`

**Interfaces:**
- Consumes: `QUIZ_MODES.morphology.label`.
- Produces: user-facing label `Morphology`.

- [ ] Ensure recent results display Morphology.
- [ ] Ensure leaderboard mode tabs include Morphology.
- [ ] Ensure leaderboard preview can show Morphology.
- [ ] Ensure admin quiz result displays do not crash on morphology mode.

### Task 5: Verification

**Files:**
- Read all modified files.

- [ ] Run `npm run validate:morphology`.
- [ ] Run existing Fiqh validator if available: `npm run validate:fiqh`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start dev server and manually inspect the app if build succeeds.
