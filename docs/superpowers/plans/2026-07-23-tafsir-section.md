# Tafsir Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Tafsir as a first-class app section with mixed MCQ translation review and fully functional surah-selected verse-by-verse free response.

**Architecture:** Reuse the existing static bank, subject doorway, self-paced practice, timed quiz, topic stats, admin bank viewer, and strength-map patterns. Add one deterministic scoring library for free-response translations and a Tafsir-specific practice component that branches between MCQ review and verse-by-verse mode.

**Tech Stack:** React 19, Vite, Vitest, Firebase/Firestore topic stats, static JS question banks, component-scoped CSS.

## Global Constraints

- Tafsir records live in `qasas-practice/src/data/tafsir/`.
- Mixed Review uses MCQ questions generated from the extracted records.
- Surah Selection is a dropdown, not a grid of separate cards.
- Verse-by-verse mode is self-paced free response with word-level feedback.
- Timed Tafsir uses MCQs only.
- Arabic ayat must use the clean canonical fields already present in the Tafsir records.
- Correctness must be value-based after render-time option shuffling.
- Topic stats use category `tafsir` and subtopic equal to the surah code.
- No AI-based semantic grading, Firestore-backed bank loading, or timed free response in this pass.

---

## File Structure

- Create `qasas-practice/src/lib/tafsir-scoring.js`: pure normalization, token comparison, edit distance, score classification.
- Create `qasas-practice/src/lib/tafsir-scoring.test.js`: RED/GREEN tests for exact answers, punctuation, typos, missing words, extra words.
- Modify `qasas-practice/src/data/tafsir/index.js`: export `getTafsirSurahOptions()` and keep existing MCQ/record exports.
- Modify `qasas-practice/src/data/tafsir/tafsir.test.js`: assert surah option ordering and topic metadata.
- Modify `qasas-practice/src/config/subjects.js`: add `tafsir` quiz mode if not already present and keep `TAFSIR_TOPICS`.
- Modify `qasas-practice/src/lib/question-results.js`: map Tafsir topic codes through `TAFSIR_TOPICS`.
- Modify `qasas-practice/src/lib/question-results.test.js`: assert Tafsir topic/group output.
- Create `qasas-practice/src/components/TafsirQuestionCard.jsx`: MCQ card with Arabic ayah and translation options.
- Create `qasas-practice/src/components/TafsirQuestionCard.css`: compact mushaf-margin treatment and MCQ feedback styles.
- Create `qasas-practice/src/components/TafsirVerseCard.jsx`: free-response card with textarea, score, missing/extra words, commentary.
- Create `qasas-practice/src/components/TafsirVerseCard.css`: verse prompt, feedback, and summary styling.
- Create `qasas-practice/src/components/TafsirPracticeMode.jsx`: orchestrates mixed MCQ and selected-surah verse flow.
- Create `qasas-practice/src/components/TafsirPracticeMode.test.jsx`: server-render component smoke tests where possible.
- Modify `qasas-practice/src/App.jsx`: route home selections into Tafsir practice.
- Modify `qasas-practice/src/components/HomeScreen.jsx`: add Tafsir doorway, mixed review card, and surah dropdown.
- Modify `qasas-practice/src/components/QuizPicker.jsx`: add Tafsir timed mixed review.
- Modify `qasas-practice/src/components/TimedQuiz.jsx`: add Tafsir bank, review bank, target display, card rendering.
- Modify `qasas-practice/src/components/AdminPage.jsx`: include Tafsir bank counts and rows.
- Modify `qasas-practice/src/components/WeaknessDashboard.jsx`: include Tafsir topic section.

---

### Task 1: Free-Response Scoring Library

**Files:**
- Create: `qasas-practice/src/lib/tafsir-scoring.js`
- Create: `qasas-practice/src/lib/tafsir-scoring.test.js`

**Interfaces:**
- Produces: `scoreTafsirAnswer(reference: string, answer: string, acceptableVariants?: string[]): { score: number, status: 'correct' | 'close' | 'review', matchedWords: string[], missingWords: string[], extraWords: string[], referenceTokens: string[], answerTokens: string[] }`
- Produces: `normalizeTranslation(value: string): string`

- [ ] **Step 1: Write failing scoring tests**

Add tests that expect exact answers to score `correct`, punctuation/case to normalize away, small typos to still match, missing content words to appear in `missingWords`, and extra words to appear in `extraWords`.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/lib/tafsir-scoring.test.js`
Expected: FAIL because `src/lib/tafsir-scoring.js` does not exist.

- [ ] **Step 3: Implement scoring**

Implement normalization, tokenization, stopword weighting, Levenshtein distance, greedy token matching, score thresholds, missing word collection, and extra word collection.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test -- src/lib/tafsir-scoring.test.js`
Expected: PASS.

---

### Task 2: Tafsir Data Helpers And Topic Metadata

**Files:**
- Modify: `qasas-practice/src/data/tafsir/index.js`
- Modify: `qasas-practice/src/data/tafsir/tafsir.test.js`
- Modify: `qasas-practice/src/config/subjects.js`
- Modify: `qasas-practice/src/lib/question-results.js`
- Modify: `qasas-practice/src/lib/question-results.test.js`

**Interfaces:**
- Consumes: existing `tafsirVerseRecords`, `tafsirMcqQuestions`
- Produces: `getTafsirSurahOptions(): Array<{ code: string, label: string, titleAr: string, ayahCount: number, surahNumber: number }>`
- Produces: `QUIZ_MODES.tafsir = { label: 'Tafsir', bankSource: 'tafsir', timerSeconds: 25 }`

- [ ] **Step 1: Write failing metadata tests**

Extend Tafsir data tests to assert surah dropdown options are sorted by surah number and include ayah counts. Extend question result tests to assert `questionResultFromAnswer({ question: { id: 'TFS-FIL-001-MCQ', topic: 'FIL' }, correct: true, mode: 'tafsir' })` returns `{ topic: 'FIL', group: 'FIL', correct: true }`.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/data/tafsir/tafsir.test.js src/lib/question-results.test.js`
Expected: FAIL for missing helper and Tafsir topic mapping.

- [ ] **Step 3: Implement metadata**

Add `tafsir` to `QUIZ_MODES`, add `TAFSIR_TOPICS` to question-result topic lookup, and export `getTafsirSurahOptions()`.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test -- src/data/tafsir/tafsir.test.js src/lib/question-results.test.js`
Expected: PASS.

---

### Task 3: Tafsir Practice Components

**Files:**
- Create: `qasas-practice/src/components/TafsirQuestionCard.jsx`
- Create: `qasas-practice/src/components/TafsirQuestionCard.css`
- Create: `qasas-practice/src/components/TafsirVerseCard.jsx`
- Create: `qasas-practice/src/components/TafsirVerseCard.css`
- Create: `qasas-practice/src/components/TafsirPracticeMode.jsx`
- Create: `qasas-practice/src/components/TafsirPracticeMode.test.jsx`

**Interfaces:**
- Consumes: `getTafsirQuestions(topic)`, `getTafsirVerseRecords(topic)`, `scoreTafsirAnswer()`, `useWeaknessTracking()`
- Produces: `TafsirPracticeMode({ variant, topic, onBack, score, setScore })`
- Produces: `TafsirQuestionCard({ question, showFeedback, currentAnswer, onAnswer })`
- Produces: `TafsirVerseCard({ verse, answer, setAnswer, feedback, onSubmit, onNext, isLastVerse })`

- [ ] **Step 1: Write failing component smoke tests**

Use `react-dom/server` to assert `TafsirQuestionCard` renders the ayah reference and Arabic text, and `TafsirVerseCard` renders a textarea and feedback labels when feedback is supplied.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/components/TafsirPracticeMode.test.jsx`
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement components**

Implement mixed MCQ review using the shared `useShuffledOptions` hook. Implement verse mode with textarea submission, deterministic scoring, per-ayah feedback, Next, session summary, and `useWeaknessTracking()` calls for each submitted ayah.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test -- src/components/TafsirPracticeMode.test.jsx`
Expected: PASS.

---

### Task 4: App Navigation, Timed Quiz, Admin, And Strength Map Wiring

**Files:**
- Modify: `qasas-practice/src/App.jsx`
- Modify: `qasas-practice/src/components/HomeScreen.jsx`
- Modify: `qasas-practice/src/components/QuizPicker.jsx`
- Modify: `qasas-practice/src/components/TimedQuiz.jsx`
- Modify: `qasas-practice/src/components/AdminPage.jsx`
- Modify: `qasas-practice/src/components/WeaknessDashboard.jsx`

**Interfaces:**
- Consumes: `TafsirPracticeMode`, `TAFSIR_TOPICS`, `getTafsirQuestions()`
- Produces: Home subject selection values `tafsir-all` and `tafsir-verse-<TOPIC>`
- Produces: timed quiz mode `tafsir`

- [ ] **Step 1: Write failing integration tests**

Extend existing pure tests where available to assert Tafsir mode metadata and topic map visibility. Component-level routing is manually verified because the project does not have a DOM testing library.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test`
Expected: FAIL before wiring if metadata/components are not connected.

- [ ] **Step 3: Implement wiring**

Add Tafsir to home subject doorways, render Mixed Review and Surah Selection dropdown, parse Tafsir mode IDs in `App.jsx`, include Tafsir in quiz picker, timed bank, review bank, target display, timed card rendering, admin bank viewer, and strength map sections.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test`
Expected: PASS.

---

### Task 5: Final Verification

**Files:**
- Verify all modified files.

**Interfaces:**
- Consumes: completed Tasks 1-4.
- Produces: validated implementation.

- [ ] **Step 1: Run tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: exit 0. Existing Vite chunk-size warning is acceptable if unchanged.

- [ ] **Step 4: Manual visual check**

Start dev server with `npm run dev -- --host 127.0.0.1`, open the app, and verify Tafsir appears on Home, Mixed Review opens MCQs, Surah Selection opens verse-by-verse mode, feedback fits, and timed Tafsir renders.
