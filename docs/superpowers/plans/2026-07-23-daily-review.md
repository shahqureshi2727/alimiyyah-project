# Daily Review Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the adaptive daily review quiz across Arabic, Fiqh, Hadith, and Tafsir using topic strength data and lightweight spaced repetition.

**Architecture:** Add a pure `daily-review` selector library and extend topic-stat updates with SRS fields. Keep `TimedQuiz` as the renderer, but make quiz length dynamic and let review mode load from the selector instead of the older weighted helper.

**Tech Stack:** React 19, Vite, Vitest, Firebase Auth, Firestore, static JS question banks, component-scoped CSS.

## Global Constraints

- Daily review mode id remains `review`.
- Daily review target length is 15 questions.
- Session composition is approximately 40% weak topics, 30% due topics, and 30% general mix.
- Cold-start users get a broad mixed review across categories.
- Topic stats remain under `users/{uid}/topicStats/{category}_{subtopic}`.
- Spaced repetition fields are `nextDueAt` and `reviewIntervalDays`.
- Correct answers multiply the previous interval by 1.8 and cap it at 30 days.
- Incorrect answers reset the interval to 1 day.
- Review questions must carry `reviewMode` for mode-specific rendering.
- No per-question SRS, daily streaks, or new Firestore question-bank collections.

---

## File Structure

- Create `qasas-practice/src/lib/daily-review.js`: pure bank assembly, adaptive selection, timestamp helpers, and SRS calculations.
- Create `qasas-practice/src/lib/daily-review.test.js`: RED/GREEN tests for session composition and spacing.
- Modify `qasas-practice/src/lib/topic-stats.js`: include SRS fields in `nextTopicStat()` and historical aggregation.
- Modify `qasas-practice/src/lib/topic-stats.test.js`: assert SRS updates.
- Modify `qasas-practice/src/lib/topic-stats-firestore.js`: pass a concrete date alongside `serverTimestamp()` so `nextDueAt` can be computed.
- Modify `qasas-practice/src/lib/quiz.js`: allow `submitQuizResult()` to store dynamic totals.
- Modify `qasas-practice/src/lib/question-results.test.js`: keep metadata coverage for mixed review categories if needed.
- Modify `qasas-practice/src/components/TimedQuiz.jsx`: remove old review selector, call the new selector, and use dynamic quiz length in progress/results.
- Modify `qasas-practice/src/components/QuizPicker.jsx`: rename the review option to "Today's Review".
- Modify `qasas-practice/src/components/HomeScreen.jsx`: update the quiz entry copy.
- Modify `qasas-practice/firestore.rules`: permit review totals up to 15 and topic-stat SRS fields.
- Modify `qasas-practice/docs/alimiyyah-implementation-plan.md`: mark Phase 3 implemented and Phase 4 implemented when complete.

---

### Task 1: Pure Daily Review Selector

**Files:**
- Create: `qasas-practice/src/lib/daily-review.js`
- Create: `qasas-practice/src/lib/daily-review.test.js`

**Interfaces:**
- Produces: `DAILY_REVIEW_LENGTH = 15`
- Produces: `DAILY_REVIEW_COMPOSITION = { weak: 6, due: 5, general: 4 }`
- Produces: `buildDailyReviewBank(): Array<Question & { reviewMode: string, reviewCategory: string }>`
- Produces: `selectDailyReviewQuestions({ bank, topicStats, missedQuestionIds, now, length }): Array<Question>`
- Produces: `toMillis(value): number`

- [ ] Write failing tests for weak-topic priority, due-topic priority, cold-start broad mixing, and duplicate avoidance.
- [ ] Run `npm test -- src/lib/daily-review.test.js` and confirm RED.
- [ ] Implement the pure selector with deterministic injection points for shuffling.
- [ ] Run `npm test -- src/lib/daily-review.test.js` and confirm GREEN.

### Task 2: SRS Topic Stat Updates

**Files:**
- Modify: `qasas-practice/src/lib/topic-stats.js`
- Modify: `qasas-practice/src/lib/topic-stats.test.js`
- Modify: `qasas-practice/src/lib/topic-stats-firestore.js`

**Interfaces:**
- Produces: `nextReviewSchedule({ existing, wasCorrect, answeredAt }): { reviewIntervalDays: number, nextDueAt: Date | string | object | null }`
- Extends: `nextTopicStat()` to include `reviewIntervalDays` and `nextDueAt`.

- [ ] Write failing tests for correct-answer interval growth and incorrect-answer reset.
- [ ] Run `npm test -- src/lib/topic-stats.test.js` and confirm RED.
- [ ] Implement the SRS helper and wire `recordAttempt()` to provide both server and local timestamps.
- [ ] Run `npm test -- src/lib/topic-stats.test.js` and confirm GREEN.

### Task 3: Dynamic Quiz Totals

**Files:**
- Modify: `qasas-practice/src/lib/quiz.js`
- Modify: `qasas-practice/src/components/TimedQuiz.jsx`
- Modify: `qasas-practice/firestore.rules`

**Interfaces:**
- Extends: `submitQuizResult({ total = 10 })`
- Changes: Timed quiz progress/results use `questions.length`.

- [ ] Write failing tests for `submitQuizResult()` preserving a supplied total where possible.
- [ ] Run focused tests and confirm RED.
- [ ] Implement dynamic total saving and UI length display.
- [ ] Update Firestore rules to allow `review` totals from 1 through 15 while keeping other quiz totals at 10.
- [ ] Run focused tests and confirm GREEN.

### Task 4: Review Mode Wiring And Copy

**Files:**
- Modify: `qasas-practice/src/components/TimedQuiz.jsx`
- Modify: `qasas-practice/src/components/QuizPicker.jsx`
- Modify: `qasas-practice/src/components/HomeScreen.jsx`

**Interfaces:**
- Consumes: `buildDailyReviewBank()` and `selectDailyReviewQuestions()`.
- Keeps: existing `review` mode id and leaderboard compatibility.

- [ ] Write a failing test that the daily bank contains all four categories and reviewMode values.
- [ ] Run focused tests and confirm RED if not already covered.
- [ ] Replace the old weighted review code in `TimedQuiz`.
- [ ] Update user-facing copy to "Today's Review".
- [ ] Run focused tests and confirm GREEN.

### Task 5: Full Verification

**Files:**
- Verify all modified files.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start the dev server and verify the app can load as far as local Firebase configuration allows.
