# Fiqh Quiz Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Fiqh subject to the `qasas-practice` app — a Wudhu question bank (MCQ + True/False,
generated from the 97 rulings already ingested in `content/Fiqh/`) playable in both timed-quiz and
untimed-practice modes, wired through the existing navigation/leaderboard/admin surfaces via one
new shared subject/mode registry.

**Architecture:** Follow the existing Qasas pattern (per-mode config threaded through
`HomeScreen`/`QuizPicker`/`TimedQuiz`/`AdminPage`/`Leaderboard`/`LeaderboardPreview`) but replace
the copy-pasted label/timer maps with one shared registry (`src/config/subjects.js`) that both
Qasas's existing modes and the new `fiqh` mode read from. Fiqh questions live in
`src/data/fiqh/<topic>.js` (one file per topic, mirroring the vault's per-topic decks), aggregated
by `src/data/fiqh/index.js`. A single new shared component, `FiqhQuestionCard`, renders both MCQ
and TF questions and is used by both the timed (`TimedQuiz`) and untimed (`FiqhPracticeMode`)
experiences, so the rendering logic is written once. No existing Qasas mode component
(`IrabMode.jsx` etc.) is touched.

**Tech Stack:** Vite + React 19, react-router-dom v7, Firebase (Auth + Firestore for accounts and
`quizResults` only — question content stays static JS, no DB). No test framework exists in this
project (`package.json` has no test script) — verification is a Node validation script for data
integrity plus manual dev-server click-through, matching the project's existing conventions.

**Reference doc:** `docs/superpowers/specs/2026-07-10-fiqh-quiz-section-design.md`

---

## Before you start

Read these two files in full — they define the exact IDs, wording, and madhhab tags you're
converting into questions. Do not paraphrase from memory; quote/adapt the ruling text as written.

- `content/Fiqh/Fiqh-03 Wudhu Occasions and Sajdah al-Tilawah.md` (rulings FQH-WUD-01…12 — ignore
  the FQH-SJD-* rulings in this file, they're a different topic, out of scope)
- `content/Fiqh/Fiqh-04 Wudhu Rulings and Conditions.md` (rulings FQH-WUD-13…28)
- `content/Fiqh/Fiqh-05 Faraidh of Wudhu and Misc Rulings.md` (rulings FQH-WUD-29…43)
- `content/Fiqh/Fiqh-06 Sunan Adab and Duas of Wudhu.md` (rulings FQH-WUD-44…80)
- `content/Fiqh/Fiqh-07 Nullifiers of Wudhu.md` (rulings FQH-WUD-81…97)
- `content/Fiqh/_Fiqh-MOC.md` (has the full topic/ID-range table and open flags — flags on
  FQH-WUD-96/97 don't block question generation per the design doc)

---

### Task 1: Shared subject/mode registry

**Files:**
- Create: `qasas-practice/src/config/subjects.js`

- [ ] **Step 1: Write the registry**

```js
// qasas-practice/src/config/subjects.js
//
// Single source of truth for quiz-mode metadata (label, per-question timer,
// bankSource). Qasas's four existing modes and the new "fiqh" mode both read
// from here — this replaces the copy-pasted label/timer maps that used to
// live separately in HomeScreen, QuizPicker, TimedQuiz, AdminPage,
// Leaderboard, and LeaderboardPreview. Adding a future subject (Hadith,
// Tafsir, Nahw, Sarf) means adding one entry here, not editing six files.

export const QUIZ_MODES = {
  irab: { label: "I'rab", bankSource: 'qasas', timerSeconds: 20 },
  nounFeatures: { label: 'Noun Features', bankSource: 'qasas', timerSeconds: 10 },
  roles: { label: 'Grammatical Role', bankSource: 'qasas', timerSeconds: 20 },
  vocab: { label: 'Vocabulary', bankSource: 'qasas', timerSeconds: 10 },
  fiqh: { label: 'Fiqh', bankSource: 'fiqh', timerSeconds: 25 },
};

// Fiqh topics available for topic-first navigation. Add one entry here per
// topic once its question bank exists in src/data/fiqh/ (see
// content/Fiqh/_Fiqh-MOC.md for the full topic list — only WUD is seeded so
// far).
export const FIQH_TOPICS = [
  { code: 'WUD', label: 'Wudhu' },
];
```

- [ ] **Step 2: Verify it loads**

Run: `cd qasas-practice && node --input-type=module -e "import('./src/config/subjects.js').then(m => console.log(m.QUIZ_MODES.fiqh, m.FIQH_TOPICS))"`

Expected output: `{ label: 'Fiqh', bankSource: 'fiqh', timerSeconds: 25 } [ { code: 'WUD', label: 'Wudhu' } ]`

- [ ] **Step 3: Commit**

```bash
cd qasas-practice
git add src/config/subjects.js 2>/dev/null || true
```

(This repo has no `.git` yet — skip `git commit` for every task in this plan; just leave changes
staged in the working tree. If a `.git` is later initialized, these `git add` calls become a no-op
safety net, not a requirement.)

---

### Task 2: Fiqh question schema validator

Write this before authoring content, so every subsequent content task can be checked against it
immediately.

**Files:**
- Create: `qasas-practice/scripts/validate-fiqh-bank.mjs`
- Modify: `qasas-practice/package.json`

- [ ] **Step 1: Write the validator**

```js
// qasas-practice/scripts/validate-fiqh-bank.mjs
//
// Run with: npm run validate:fiqh
//
// Checks the Fiqh question bank for structural problems that are easy to
// introduce by hand across ~100 questions: duplicate question IDs, malformed
// sourceIds, MCQ options/answerIndex mismatches, missing explanations, and
// (for the WUD topic specifically) full coverage of ruling IDs 01-97.

import { FIQH_TOPICS } from '../src/config/subjects.js';
import { getFiqhQuestions } from '../src/data/fiqh/index.js';

let failed = false;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed = true;
}

const allQuestions = getFiqhQuestions('all');

// 1. Unique question IDs
const seenIds = new Set();
for (const q of allQuestions) {
  if (seenIds.has(q.id)) fail(`duplicate question id: ${q.id}`);
  seenIds.add(q.id);
}

// 2. Per-question schema checks
for (const q of allQuestions) {
  if (!/^FQH-[A-Z]+-Q\d+$/.test(q.id)) fail(`${q.id}: bad id format`);
  if (!Array.isArray(q.sourceIds) || q.sourceIds.length === 0) {
    fail(`${q.id}: sourceIds must be a non-empty array`);
  } else {
    for (const sid of q.sourceIds) {
      if (!/^FQH-[A-Z]+-\d+$/.test(sid)) fail(`${q.id}: bad sourceId "${sid}"`);
    }
  }
  if (!q.topic) fail(`${q.id}: missing topic`);
  if (!q.prompt || typeof q.prompt !== 'string') fail(`${q.id}: missing prompt`);
  if (!q.explanation || typeof q.explanation !== 'string') fail(`${q.id}: missing explanation`);

  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      fail(`${q.id}: mcq must have >=2 options`);
    } else if (
      !Number.isInteger(q.answerIndex) ||
      q.answerIndex < 0 ||
      q.answerIndex >= q.options.length
    ) {
      fail(`${q.id}: answerIndex out of range`);
    }
  } else if (q.type === 'tf') {
    if (typeof q.answer !== 'boolean') fail(`${q.id}: tf must have boolean answer`);
  } else {
    fail(`${q.id}: type must be "mcq" or "tf", got "${q.type}"`);
  }
}

// 3. Coverage check for WUD: every FQH-WUD-01..97 ruling must be referenced
// by at least one question's sourceIds.
const wudQuestions = allQuestions.filter((q) => q.topic === 'WUD');
const coveredWudIds = new Set(
  wudQuestions.flatMap((q) => q.sourceIds).filter((id) => id.startsWith('FQH-WUD-'))
);
const missingWud = [];
for (let n = 1; n <= 97; n++) {
  const id = `FQH-WUD-${String(n).padStart(2, '0')}`;
  if (!coveredWudIds.has(id)) missingWud.push(id);
}
if (missingWud.length > 0) {
  fail(`WUD coverage incomplete, missing: ${missingWud.join(', ')}`);
}

if (failed) {
  console.error(`\nValidation failed. Total questions checked: ${allQuestions.length}`);
  process.exit(1);
} else {
  console.log(`OK: ${allQuestions.length} questions, ${wudQuestions.length} in WUD, full FQH-WUD-01..97 coverage.`);
  for (const topic of FIQH_TOPICS) {
    const count = allQuestions.filter((q) => q.topic === topic.code).length;
    console.log(`  ${topic.code} (${topic.label}): ${count} questions`);
  }
}
```

- [ ] **Step 2: Add the npm script**

In `qasas-practice/package.json`, add to `"scripts"`:

```json
    "validate:fiqh": "node scripts/validate-fiqh-bank.mjs"
```

- [ ] **Step 3: Verify it fails correctly against an empty bank**

Since `src/data/fiqh/index.js` doesn't exist yet, this will error on import — that's expected and
fine; it's fixed by Task 3 (which creates `index.js` with a placeholder empty `wudhu.js` first) and
proven working at the end of Task 8.

---

### Task 3: Fiqh data aggregator (scaffold, empty content)

**Files:**
- Create: `qasas-practice/src/data/fiqh/wudhu.js` (empty array scaffold — filled in Tasks 4-8)
- Create: `qasas-practice/src/data/fiqh/index.js`

- [ ] **Step 1: Scaffold the (empty) Wudhu question file**

```js
// qasas-practice/src/data/fiqh/wudhu.js
//
// Layer 2 quiz questions for the Wudhu topic (FQH-WUD-01..97), generated from
// content/Fiqh/Fiqh-03.md through Fiqh-07.md. Each question's `sourceIds`
// references the ruling ID(s) it tests, for traceability back to the vault
// (see content/Fiqh/_Fiqh-MOC.md "Question coverage").
//
// Question shape:
// {
//   id: "FQH-WUD-Q01",            // question ID, distinct from the ruling ID
//   sourceIds: ["FQH-WUD-01"],     // ruling ID(s) this question tests
//   topic: "WUD",
//   type: "mcq" | "tf",
//   prompt: "...",
//   options: [...],                // mcq only
//   answerIndex: 0,                // mcq only
//   answer: true,                  // tf only
//   madhhab: "Hanafi",             // optional — only when ruling is [madhhab-specific]
//   explanation: "...",            // shown after answering, right or wrong
// }

export const wudhuQuestions = [
  // Filled in by Tasks 4-8, one block per source deck.
];
```

- [ ] **Step 2: Write the aggregator**

```js
// qasas-practice/src/data/fiqh/index.js
import { wudhuQuestions } from './wudhu';

const TOPIC_BANKS = {
  WUD: wudhuQuestions,
};

/**
 * Get all Fiqh questions for a topic code, or every topic if 'all'.
 * @param {string} topicCode - e.g. "WUD", or "all" for pooled mixed review.
 * @returns {Array} question objects
 */
export function getFiqhQuestions(topicCode) {
  if (topicCode === 'all') {
    return Object.values(TOPIC_BANKS).flat();
  }
  return TOPIC_BANKS[topicCode] || [];
}
```

- [ ] **Step 3: Verify the validator now runs (and correctly fails on empty content)**

Run: `cd qasas-practice && npm run validate:fiqh`
Expected: exits non-zero, prints `FAIL: WUD coverage incomplete, missing: FQH-WUD-01, FQH-WUD-02, ...` — this confirms the wiring is correct; content comes next.

---

### Task 4: Author Wudhu questions — Fiqh-03 rulings (FQH-WUD-01…12)

**Files:**
- Modify: `qasas-practice/src/data/fiqh/wudhu.js`

Source rulings (from `content/Fiqh/Fiqh-03 Wudhu Occasions and Sajdah al-Tilawah.md`):

- FQH-WUD-01: Wuḍūʾ is farḍ before performing Ṣalāh.
- FQH-WUD-02: Wuḍūʾ is farḍ before touching the Muṣḥaf.
- FQH-WUD-03: Wuḍūʾ is farḍ before performing Ṣalāt al-Janāzah.
- FQH-WUD-04: Wuḍūʾ is farḍ before performing Sajdah al-Tilāwah.
- FQH-WUD-05: Mustaḥabb to sleep in a state of wuḍūʾ.
- FQH-WUD-06: Mustaḥabb to perform wuḍūʾ upon waking from sleep.
- FQH-WUD-07: Mustaḥabb to maintain continuous wuḍūʾ throughout the day.
- FQH-WUD-08: Mustaḥabb to renew wuḍūʾ after backbiting, slander, lying, or any sin.
- FQH-WUD-09: Mustaḥabb to be in wuḍūʾ at the time of every prayer.
- FQH-WUD-10: Mustaḥabb to be in wuḍūʾ when reciting the Qurʾān verbally.
- FQH-WUD-11: Mustaḥabb to be in wuḍūʾ when reading or narrating Ḥadīth.
- FQH-WUD-12: Mustaḥabb to be in wuḍūʾ when studying Islamic knowledge.

Note: FQH-WUD-01…04 form one numbered list (the farḍ occasions of wuḍūʾ) — use each other as MCQ
distractors. FQH-WUD-05…12 form another list (mustaḥabb occasions) — same treatment, plus one
grouping question at the end.

- [ ] **Step 1: Replace the placeholder array content**

Replace the `// Filled in by Tasks 4-8...` comment line inside `wudhuQuestions` in
`qasas-practice/src/data/fiqh/wudhu.js` with:

```js
  // --- Fiqh-03: Wudhu occasions (FQH-WUD-01..12) ---
  {
    id: 'FQH-WUD-Q01',
    sourceIds: ['FQH-WUD-01'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Wuḍūʾ is farḍ (obligatory) before which of the following?',
    options: ['Performing Ṣalāh', 'Eating a meal', 'Sleeping', 'Reading a non-Quranic book'],
    answerIndex: 0,
    explanation: 'Wuḍūʾ is farḍ before performing Ṣalāh — one of four occasions covered in this list.',
  },
  {
    id: 'FQH-WUD-Q02',
    sourceIds: ['FQH-WUD-02'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Wuḍūʾ is farḍ before touching the Muṣḥaf (the physical copy of the Qurʾān).',
    answer: true,
    explanation: 'Correct — touching the Muṣḥaf is one of the four occasions where wuḍūʾ is farḍ.',
  },
  {
    id: 'FQH-WUD-Q03',
    sourceIds: ['FQH-WUD-03'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Wuḍūʾ is farḍ before performing which prayer specifically named among the four farḍ-wuḍūʾ occasions?',
    options: ['Ṣalāt al-Janāzah', 'Ṣalāt al-Ḍuḥā', 'Ṣalāt al-Tarāwīḥ', 'Ṣalāt al-Istikhārah'],
    answerIndex: 0,
    explanation: 'Ṣalāt al-Janāzah (the funeral prayer) is one of the four occasions where wuḍūʾ is farḍ.',
  },
  {
    id: 'FQH-WUD-Q04',
    sourceIds: ['FQH-WUD-04'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Wuḍūʾ is farḍ before performing Sajdah al-Tilāwah.',
    answer: true,
    explanation: 'Correct — the prostration of recitation is one of the four occasions where wuḍūʾ is farḍ.',
  },
  {
    id: 'FQH-WUD-Q05',
    sourceIds: ['FQH-WUD-01', 'FQH-WUD-02', 'FQH-WUD-03', 'FQH-WUD-04'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following is NOT one of the occasions where wuḍūʾ is farḍ?',
    options: ['Touching the Muṣḥaf', 'Performing Ṣalāt al-Janāzah', 'Reciting Qurʾān from memory without touching it', 'Performing Sajdah al-Tilāwah'],
    answerIndex: 2,
    explanation: 'Reciting the Qurʾān from memory (without touching the Muṣḥaf) does not itself require wuḍūʾ — the other three are farḍ occasions.',
  },
  {
    id: 'FQH-WUD-Q06',
    sourceIds: ['FQH-WUD-05'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: It is mustaḥabb to sleep while in a state of wuḍūʾ.',
    answer: true,
    explanation: 'Correct — sleeping in a state of wuḍūʾ is recommended.',
  },
  {
    id: 'FQH-WUD-Q07',
    sourceIds: ['FQH-WUD-06'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'It is mustaḥabb to perform wuḍūʾ at which of these times?',
    options: ['Upon waking from sleep', 'Only before Jumuʿah', 'Only in Ramaḍān', 'Never — only farḍ occasions require it'],
    answerIndex: 0,
    explanation: 'Performing wuḍūʾ upon waking from sleep is mustaḥabb — one of several recommended occasions.',
  },
  {
    id: 'FQH-WUD-Q08',
    sourceIds: ['FQH-WUD-07'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: It is mustaḥabb to maintain continuous wuḍūʾ throughout the day.',
    answer: true,
    explanation: 'Correct — maintaining continuous wuḍūʾ is one of the mustaḥabb occasions.',
  },
  {
    id: 'FQH-WUD-Q09',
    sourceIds: ['FQH-WUD-08'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'It is mustaḥabb to renew wuḍūʾ after which of the following?',
    options: ['Backbiting, slander, lying, or any sin', 'Drinking water', 'Reading a novel', 'Walking outside'],
    answerIndex: 0,
    explanation: 'Renewing wuḍūʾ after backbiting, slander, lying, or any sin is mustaḥabb.',
  },
  {
    id: 'FQH-WUD-Q10',
    sourceIds: ['FQH-WUD-09'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: It is mustaḥabb to be in wuḍūʾ at the time of every prayer, even outside the farḍ occasions.',
    answer: true,
    explanation: 'Correct — being in wuḍūʾ at every prayer time is mustaḥabb.',
  },
  {
    id: 'FQH-WUD-Q11',
    sourceIds: ['FQH-WUD-10'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'It is mustaḥabb to be in wuḍūʾ when doing which of the following?',
    options: ['Reciting the Qurʾān verbally', 'Watching television', 'Cooking a meal', 'Doing physical exercise'],
    answerIndex: 0,
    explanation: 'Being in wuḍūʾ while reciting the Qurʾān verbally is mustaḥabb.',
  },
  {
    id: 'FQH-WUD-Q12',
    sourceIds: ['FQH-WUD-11'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: It is mustaḥabb to be in wuḍūʾ when reading or narrating Ḥadīth.',
    answer: true,
    explanation: 'Correct — this is one of the mustaḥabb occasions for wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q13',
    sourceIds: ['FQH-WUD-12'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'It is mustaḥabb to be in wuḍūʾ in which of these situations?',
    options: ['Studying Islamic knowledge', 'Doing arithmetic homework', 'Painting a wall', 'Playing a sport'],
    answerIndex: 0,
    explanation: 'Being in wuḍūʾ while studying Islamic knowledge is mustaḥabb.',
  },
  {
    id: 'FQH-WUD-Q14',
    sourceIds: ['FQH-WUD-05', 'FQH-WUD-06', 'FQH-WUD-07', 'FQH-WUD-08', 'FQH-WUD-09', 'FQH-WUD-10', 'FQH-WUD-11', 'FQH-WUD-12'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following is NOT listed among the mustaḥabb occasions for being in wuḍūʾ?',
    options: ['Studying Islamic knowledge', 'Reciting the Qurʾān verbally', 'Eating a meal', 'Reading or narrating Ḥadīth'],
    answerIndex: 2,
    explanation: 'Eating a meal is not one of the mustaḥabb wuḍūʾ occasions in this list; the other three are.',
  },
```

- [ ] **Step 2: Run the validator (expect partial coverage, not a crash)**

Run: `cd qasas-practice && npm run validate:fiqh`
Expected: still `FAIL`, but the missing-ID list should now start at `FQH-WUD-13` (not `FQH-WUD-01`)
— confirming IDs 01-12 are now covered and no schema errors were introduced.

---

### Task 5: Author Wudhu questions — Fiqh-04 rulings (FQH-WUD-13…28)

**Files:**
- Modify: `qasas-practice/src/data/fiqh/wudhu.js`

Source rulings (from `content/Fiqh/Fiqh-04 Wudhu Rulings and Conditions.md`):

- FQH-WUD-13 `[madhhab-specific]`: Wuḍūʾ is wājib (not farḍ) before Ṭawāf — a Ḥanafī distinction.
- FQH-WUD-14: Renewing wuḍūʾ unnecessarily is makrūh if done before changing place in the same sitting.
- FQH-WUD-15: Renewing wuḍūʾ unnecessarily is makrūh if done before using it for an act of worship requiring it.
- FQH-WUD-16: Wuḍūʾ with stolen/usurped water is ḥarām.
- FQH-WUD-17: Wuḍūʾ with an orphan's water without permission is ḥarām.
- FQH-WUD-18: Shurūṭ al-wujūb are conditions making wuḍūʾ required; absent = not yet responsible.
- FQH-WUD-19: ʿAql (sound mind) is a condition of obligation.
- FQH-WUD-20: Bulūgh (puberty) is a condition of obligation.
- FQH-WUD-21 `[madhhab-specific]`: Islam is a condition of obligation; Ḥanafī view — not required of non-Muslim.
- FQH-WUD-22: Access to sufficient pure water is a condition of obligation.
- FQH-WUD-23: Termination of ḥayḍ/nifās/ritual impurity is a condition of obligation.
- FQH-WUD-24: Wuḍūʾ becomes obligatory when prayer time is nearly ending.
- FQH-WUD-25: Shurūṭ al-ṣiḥḥah determine whether a performed wuḍūʾ is valid.
- FQH-WUD-26: Complete washing of the skin is a condition of validity.
- FQH-WUD-27: Ḥadath must have fully ended before starting, as a condition of validity.
- FQH-WUD-28: Removal of barriers preventing water reaching skin is a condition of validity.

Guardrail reminder (per the design doc): FQH-WUD-13/21 are `[madhhab-specific]`. Frame their
questions explicitly as Ḥanafī positions (e.g. "In the Ḥanafī view...") rather than presenting them
as an undisputed universal rule, and never use a genuinely-correct-in-another-madhhab position as
a "wrong" MCQ distractor.

- [ ] **Step 1: Append to the array (after the Task 4 block, before the closing `];`)**

```js
  // --- Fiqh-04: Makruh/Haram wudhu, Shurut al-Wujub, Shurut as-Sihhah (FQH-WUD-13..28) ---
  {
    id: 'FQH-WUD-Q15',
    sourceIds: ['FQH-WUD-13'],
    topic: 'WUD',
    madhhab: 'Hanafi',
    type: 'mcq',
    prompt: 'In the Ḥanafī view, wuḍūʾ before Ṭawāf carries which classification, distinct from the four occasions where it is farḍ?',
    options: ['Wājib', 'Mubāḥ', 'Makrūh', 'Sunnah'],
    answerIndex: 0,
    explanation: 'In the Ḥanafī madhhab, wuḍūʾ for Ṭawāf is wājib rather than farḍ — a distinct level of obligation from Ṣalāh, touching the Muṣḥaf, Janāzah, and Sajdah al-Tilāwah.',
  },
  {
    id: 'FQH-WUD-Q16',
    sourceIds: ['FQH-WUD-14'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Renewing wuḍūʾ unnecessarily while already in a state of wuḍūʾ is makrūh if done before changing one\'s place within the same sitting.',
    answer: true,
    explanation: 'Correct — this is one of two circumstances where an unnecessary renewal of wuḍūʾ is makrūh.',
  },
  {
    id: 'FQH-WUD-Q17',
    sourceIds: ['FQH-WUD-15'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Renewing wuḍūʾ unnecessarily is makrūh if done before using the existing wuḍūʾ for an act of worship that requires it.',
    answer: true,
    explanation: 'Correct — this is the second circumstance where an unnecessary renewal of wuḍūʾ is makrūh.',
  },
  {
    id: 'FQH-WUD-Q18',
    sourceIds: ['FQH-WUD-16'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'What is the ruling on performing wuḍūʾ with stolen or usurped water?',
    options: ['Ḥarām', 'Makrūh only', 'Mustaḥabb', 'Permissible without restriction'],
    answerIndex: 0,
    explanation: 'Using water taken without the owner\'s permission for wuḍūʾ is ḥarām.',
  },
  {
    id: 'FQH-WUD-Q19',
    sourceIds: ['FQH-WUD-17'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Performing wuḍūʾ using an orphan\'s water without permission is ḥarām.',
    answer: true,
    explanation: 'Correct — using an orphan\'s property unjustly for wuḍūʾ is ḥarām.',
  },
  {
    id: 'FQH-WUD-Q20',
    sourceIds: ['FQH-WUD-18'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'What do the shurūṭ al-wujūb (conditions of obligation) of wuḍūʾ determine?',
    options: ['Whether wuḍūʾ becomes required of a person at all', 'Whether a performed wuḍūʾ counts as valid', 'The sunnah order of wuḍūʾ', 'The permissible materials for tayammum'],
    answerIndex: 0,
    explanation: 'Shurūṭ al-wujūb are the conditions that must be present for wuḍūʾ to become required of a person; if absent, the person is not yet responsible for it.',
  },
  {
    id: 'FQH-WUD-Q21',
    sourceIds: ['FQH-WUD-19'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: ʿAql (sound mind) is one of the conditions of obligation for wuḍūʾ.',
    answer: true,
    explanation: 'Correct — ʿAql forms the basis of legal responsibility and is a condition of obligation.',
  },
  {
    id: 'FQH-WUD-Q22',
    sourceIds: ['FQH-WUD-20'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following is a condition of obligation for wuḍūʾ, alongside ʿaql?',
    options: ['Bulūgh (reaching puberty)', 'Owning a car', 'Living in a city', 'Speaking Arabic'],
    answerIndex: 0,
    explanation: 'Bulūgh (reaching puberty/maturity) is a condition of obligation for wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q23',
    sourceIds: ['FQH-WUD-21'],
    topic: 'WUD',
    madhhab: 'Hanafi',
    type: 'tf',
    prompt: 'True or False: In the Ḥanafī view, wuḍūʾ is not required of a non-Muslim.',
    answer: true,
    explanation: 'Correct — Islam is a condition of obligation for wuḍūʾ in the Ḥanafī view.',
  },
  {
    id: 'FQH-WUD-Q24',
    sourceIds: ['FQH-WUD-22'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Access to what is a condition of obligation for wuḍūʾ?',
    options: ['Sufficient pure water to wash all required limbs once', 'A private bathroom', 'A prayer mat', 'Warm water specifically'],
    answerIndex: 0,
    explanation: 'Having enough pure water to wash all the required limbs once is a condition of obligation.',
  },
  {
    id: 'FQH-WUD-Q25',
    sourceIds: ['FQH-WUD-23'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: The termination of menstruation, postnatal bleeding, or a state of ritual impurity is a condition of obligation for wuḍūʾ.',
    answer: true,
    explanation: 'Correct — this is one of the conditions of obligation (shurūṭ al-wujūb).',
  },
  {
    id: 'FQH-WUD-Q26',
    sourceIds: ['FQH-WUD-24'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'When does wuḍūʾ become obligatory due to the timing of prayer?',
    options: ['When the time for prayer is nearly ending', 'Only exactly at sunrise', 'Only on Fridays', 'It is never time-dependent'],
    answerIndex: 0,
    explanation: 'When the time for prayer is nearly ending, wuḍūʾ becomes obligatory as a condition of obligation.',
  },
  {
    id: 'FQH-WUD-Q27',
    sourceIds: ['FQH-WUD-18', 'FQH-WUD-19', 'FQH-WUD-20', 'FQH-WUD-21', 'FQH-WUD-22', 'FQH-WUD-23', 'FQH-WUD-24'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following is NOT one of the shurūṭ al-wujūb (conditions of obligation) for wuḍūʾ?',
    options: ['ʿAql (sound mind)', 'Bulūgh (puberty)', 'Wearing white clothing', 'Access to sufficient pure water'],
    answerIndex: 2,
    explanation: 'Wearing white clothing is not a condition of obligation for wuḍūʾ; the other three are.',
  },
  {
    id: 'FQH-WUD-Q28',
    sourceIds: ['FQH-WUD-25'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'What do the shurūṭ al-ṣiḥḥah (conditions of validity) of wuḍūʾ determine?',
    options: ['Whether a wuḍūʾ already performed counts as valid', 'Whether wuḍūʾ becomes required of a person', 'The sunnah timing of wuḍūʾ', 'Which water is pure'],
    answerIndex: 0,
    explanation: 'Shurūṭ al-ṣiḥḥah determine whether a performed wuḍūʾ is valid; if any is broken, the wuḍūʾ is invalid even if attempted.',
  },
  {
    id: 'FQH-WUD-Q29',
    sourceIds: ['FQH-WUD-26'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Even a tiny dry spot left on a required area invalidates wuḍūʾ.',
    answer: true,
    explanation: 'Correct — complete washing of the skin is a condition of validity; even a tiny dry spot invalidates it.',
  },
  {
    id: 'FQH-WUD-Q30',
    sourceIds: ['FQH-WUD-27'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'What must happen before starting wuḍūʾ, as a condition of its validity?',
    options: ['The ḥadath (e.g. blood, urine, ḥayḍ, nifās) must have fully ended', 'The sun must have risen', 'A full ghusl must precede it', 'One must be fasting'],
    answerIndex: 0,
    explanation: 'The ḥadath that breaks wuḍūʾ must have fully ended before starting it, as a condition of validity.',
  },
  {
    id: 'FQH-WUD-Q31',
    sourceIds: ['FQH-WUD-28'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Removing barriers preventing water from reaching the skin (e.g. wax, glue, thick cream) is a condition of validity for wuḍūʾ.',
    answer: true,
    explanation: 'Correct — any barrier preventing water from reaching the skin must be removed for wuḍūʾ to be valid.',
  },
```

- [ ] **Step 2: Run the validator**

Run: `cd qasas-practice && npm run validate:fiqh`
Expected: `FAIL`, missing-ID list should now start at `FQH-WUD-29`.

---

### Task 6: Author Wudhu questions — Fiqh-05 rulings (FQH-WUD-29…43)

**Files:**
- Modify: `qasas-practice/src/data/fiqh/wudhu.js`

Source rulings (from `content/Fiqh/Fiqh-05 Faraidh of Wudhu and Misc Rulings.md`):

- FQH-WUD-29: Farḍ 1 — washing the face (hairline to chin, ear to ear, including eyelids/pierced areas).
- FQH-WUD-30: Partial washing of the face invalidates this farḍ.
- FQH-WUD-31: Farḍ 2 — washing hands/arms to and including the elbows.
- FQH-WUD-32: Farḍ 3 — wiping (masḥ) a quarter of the head (forelock, back, or either side).
- FQH-WUD-33: Farḍ 4 — washing the feet to and including the ankles.
- FQH-WUD-34: Thick beard — outer part washed; thin beard — water reaches skin beneath.
- FQH-WUD-35: Beard hair beyond the face boundary need not be washed.
- FQH-WUD-36: Hidden part of closed lips need not be washed; visible part must be.
- FQH-WUD-37: Inner eyes need not be washed, even in full ghusl.
- FQH-WUD-38: Substances blocking eyelashes/outer eye must be removed and washed beneath.
- FQH-WUD-39: Tightly closed fingers must be separated for water to reach between them.
- FQH-WUD-40: Long nails need water reaching underneath; dirt under nails doesn't prevent validity.
- FQH-WUD-41: Tight rings must be moved to allow water beneath.
- FQH-WUD-42: Earrings must be moved if they block water from the pierced hole.
- FQH-WUD-43: Water may pass over medicine on wounds/foot cracks when necessary.

- [ ] **Step 1: Append to the array**

```js
  // --- Fiqh-05: Faraidh of Wudhu, Misc Rulings (FQH-WUD-29..43) ---
  {
    id: 'FQH-WUD-Q32',
    sourceIds: ['FQH-WUD-29'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Farḍ 1 of wuḍūʾ — washing the face — covers which boundary?',
    options: ['Hairline of the forehead to the bottom of the chin, ear to ear', 'Only the forehead', 'Only the cheeks', 'The entire head including hair'],
    answerIndex: 0,
    explanation: 'The face for wuḍūʾ purposes is defined as hairline-to-chin (length) and ear-to-ear (width), including the eyelids and pierced areas.',
  },
  {
    id: 'FQH-WUD-Q33',
    sourceIds: ['FQH-WUD-30'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Partial washing of the face is sufficient — the entire defined area does not need to be washed completely.',
    answer: false,
    explanation: 'False — partial washing of the face invalidates this farḍ; the entire defined area must be washed completely.',
  },
  {
    id: 'FQH-WUD-Q34',
    sourceIds: ['FQH-WUD-31'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Farḍ 2 of wuḍūʾ — washing the arms — extends to where?',
    options: ['Up to and including the elbows', 'Up to the wrist only', 'Up to the shoulder', 'Just the fingertips'],
    answerIndex: 0,
    explanation: 'Farḍ 2 is washing the hands and arms up to and including the elbows.',
  },
  {
    id: 'FQH-WUD-Q35',
    sourceIds: ['FQH-WUD-32'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Farḍ 3 of wuḍūʾ — wiping (masḥ) the head — requires wiping how much of the head?',
    options: ['A quarter of the head', 'The entire head', 'Half of the head', 'Only the ears'],
    answerIndex: 0,
    explanation: 'Farḍ 3 is wiping a quarter of the head, which may be on the forelock, back, or either side.',
  },
  {
    id: 'FQH-WUD-Q36',
    sourceIds: ['FQH-WUD-33'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Farḍ 4 of wuḍūʾ is washing the feet up to and including the ankles.',
    answer: true,
    explanation: 'Correct — the feet must be washed up to and including the ankles, with water reaching between the toes.',
  },
  {
    id: 'FQH-WUD-Q37',
    sourceIds: ['FQH-WUD-29', 'FQH-WUD-31', 'FQH-WUD-32', 'FQH-WUD-33'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following is NOT one of the four farāʾiḍ (obligatory acts) of wuḍūʾ?',
    options: ['Washing the face', 'Washing the arms to the elbows', 'Rinsing the mouth three times', 'Wiping a quarter of the head'],
    answerIndex: 2,
    explanation: 'Rinsing the mouth three times is a sunnah of wuḍūʾ, not one of the four farḍ acts — the other three are farḍ.',
  },
  {
    id: 'FQH-WUD-Q38',
    sourceIds: ['FQH-WUD-34'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'For a thick beard during wuḍūʾ, what must be washed?',
    options: ['Only the outer part', 'The skin beneath it must be reached', 'Nothing — it is exempt', 'It must be removed first'],
    answerIndex: 0,
    explanation: 'For a thick beard, only the outer part must be washed; for a thin beard, water should reach the skin beneath.',
  },
  {
    id: 'FQH-WUD-Q39',
    sourceIds: ['FQH-WUD-35'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Beard hair extending beyond the boundary of the face must be washed during wuḍūʾ.',
    answer: false,
    explanation: 'False — hair extending beyond the face boundary does not need to be washed, since it is not considered part of the face.',
  },
  {
    id: 'FQH-WUD-Q40',
    sourceIds: ['FQH-WUD-36'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Regarding the lips during wuḍūʾ, which part must be washed?',
    options: ['Only the visible part when closed', 'The entire inner mouth', 'Neither part', 'Only the hidden part'],
    answerIndex: 0,
    explanation: 'The hidden part of closed lips does not need washing; the visible part is considered part of the face and must be washed.',
  },
  {
    id: 'FQH-WUD-Q41',
    sourceIds: ['FQH-WUD-37'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: The inner eyes must be washed during wuḍūʾ, and even during a full ghusl.',
    answer: false,
    explanation: 'False — the inner eyes do not need to be washed during wuḍūʾ, even during a full ghusl.',
  },
  {
    id: 'FQH-WUD-Q42',
    sourceIds: ['FQH-WUD-38'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'What must be done about substances like eyeliner, wax, or kohl blocking the eyelashes/outer eye during wuḍūʾ?',
    options: ['They must be removed and the area washed beneath', 'They can be left as-is', 'Only the eyelashes need washing, not underneath', 'Ghusl is required instead'],
    answerIndex: 0,
    explanation: 'Substances blocking the eyelashes or outer eye must be removed, and the area washed beneath, for wuḍūʾ to be valid.',
  },
  {
    id: 'FQH-WUD-Q43',
    sourceIds: ['FQH-WUD-39'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: If the fingers are tightly closed, they must be separated during wuḍūʾ so water reaches between them.',
    answer: true,
    explanation: 'Correct — tightly closed fingers must be separated for water to reach between them.',
  },
  {
    id: 'FQH-WUD-Q44',
    sourceIds: ['FQH-WUD-40'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which is true about long nails and dirt underneath them during wuḍūʾ?',
    options: ['Water must reach under long nails, but dirt under nails does not prevent validity', 'Both long nails and dirt invalidate wuḍūʾ', 'Neither matters at all', 'Nails must be trimmed before wuḍūʾ'],
    answerIndex: 0,
    explanation: 'Long nails covering the fingertips require water to reach underneath; dirt under the nails or similar minor obstacles do not prevent wuḍūʾ from being valid.',
  },
  {
    id: 'FQH-WUD-Q45',
    sourceIds: ['FQH-WUD-41'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Tight rings must be moved during wuḍūʾ to allow water to reach beneath them.',
    answer: true,
    explanation: 'Correct — tight rings must be moved so water can reach the skin beneath.',
  },
  {
    id: 'FQH-WUD-Q46',
    sourceIds: ['FQH-WUD-42'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'When must earrings be moved during wuḍūʾ?',
    options: ['If they prevent water from reaching the pierced hole', 'Always, regardless of fit', 'Never — earrings are always exempt', 'Only if made of gold'],
    answerIndex: 0,
    explanation: 'Earrings must be moved during wuḍūʾ if they prevent water from reaching the pierced hole.',
  },
  {
    id: 'FQH-WUD-Q47',
    sourceIds: ['FQH-WUD-43'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Water may be passed over medicine applied to a wound or foot crack during wuḍūʾ, when removing it would be necessary or harmful.',
    answer: true,
    explanation: 'Correct — this is a concession (rukhṣah) for wounds and medicine.',
  },
```

- [ ] **Step 2: Run the validator**

Run: `cd qasas-practice && npm run validate:fiqh`
Expected: `FAIL`, missing-ID list should now start at `FQH-WUD-44`.

---

### Task 7: Author Wudhu questions — Fiqh-06 rulings (FQH-WUD-44…80)

**Files:**
- Modify: `qasas-practice/src/data/fiqh/wudhu.js`

Source rulings (from `content/Fiqh/Fiqh-06 Sunan Adab and Duas of Wudhu.md`) — this is the largest
chunk (37 rulings): definitions of sunnah/mustaḥabb (44-45), the 17 sunan of wuḍūʾ (46-62), the 8
adab/mustaḥabb (63-70), and the 10 duas (71-80). The exact ruling text (including full Arabic and
translations for the duas) is in the source file — read it and use the same wording verbatim for
the dua Arabic/translation pairs; do not paraphrase those.

Numbered-list treatment: 46-62 (17 sunan) and 63-70 (8 adab) each get 1:1 questions plus ONE
grouping question apiece ("which of these is NOT a sunnah of wuḍūʾ" / "...NOT an adab of wuḍūʾ").
For the 10 duas (71-80), author MCQ questions that ask which limb/act each dua corresponds to
(using the English translation as the prompt/options, not requiring the student to read Arabic) —
this is more testable in a quiz UI than reciting Arabic from memory.

- [ ] **Step 1: Append to the array**

```js
  // --- Fiqh-06: Sunnah/Adab definitions, 17 Sunan, 8 Adab, 10 Duas (FQH-WUD-44..80) ---
  {
    id: 'FQH-WUD-Q48',
    sourceIds: ['FQH-WUD-44'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'In the context of wuḍūʾ, what is a "sunnah" action?',
    options: ['An action the Prophet ﷺ regularly practiced, though occasionally left', 'An action never performed by the Prophet ﷺ', 'An action that is farḍ', 'An action that invalidates wuḍūʾ'],
    answerIndex: 0,
    explanation: 'A sunnah is an action the Prophet ﷺ regularly practiced, though he occasionally left it.',
  },
  {
    id: 'FQH-WUD-Q49',
    sourceIds: ['FQH-WUD-45'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: A mustaḥabb/adab action, in the context of wuḍūʾ, was not consistently practiced by the Prophet ﷺ, but is recommended.',
    answer: true,
    explanation: 'Correct — mustaḥabb/adab actions are recommended but not consistently practiced, unlike sunnah acts.',
  },
  {
    id: 'FQH-WUD-Q50',
    sourceIds: ['FQH-WUD-46'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Making the intention (niyyah) is a sunnah of wuḍūʾ.',
    answer: true,
    explanation: 'Correct — niyyah is one of the 17 sunan of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q51',
    sourceIds: ['FQH-WUD-47'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Using which item is a sunnah of wuḍūʾ?',
    options: ['The siwāk (tooth-stick)', 'A toothbrush specifically', 'Soap', 'A towel'],
    answerIndex: 0,
    explanation: 'Using the siwāk is one of the 17 sunan of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q52',
    sourceIds: ['FQH-WUD-48'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Mentioning the name of Allah (tasmiyah) at the start of wuḍūʾ is a sunnah.',
    answer: true,
    explanation: 'Correct — tasmiyah at the start is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q53',
    sourceIds: ['FQH-WUD-49'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Washing which body part up to the wrists at the start is a sunnah of wuḍūʾ?',
    options: ['The hands', 'The feet', 'The face', 'The forearms'],
    answerIndex: 0,
    explanation: 'Washing the hands up to the wrists at the start is one of the 17 sunan of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q54',
    sourceIds: ['FQH-WUD-50'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Maintaining tartīb (the order of actions, beginning with what Allah mentioned first) is a sunnah of wuḍūʾ.',
    answer: true,
    explanation: 'Correct — tartīb is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q55',
    sourceIds: ['FQH-WUD-51'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'What is muwālāt, one of the 17 sunan of wuḍūʾ?',
    options: ['Continuity — not engaging in an unrelated action between its acts', 'Washing each limb once only', 'Facing away from the qiblah', 'Reciting loudly'],
    answerIndex: 0,
    explanation: 'Muwālāt (continuity) means not engaging in an unrelated action between the acts of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q56',
    sourceIds: ['FQH-WUD-52'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Washing each limb three times is a sunnah of wuḍūʾ.',
    answer: true,
    explanation: 'Correct — this is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q57',
    sourceIds: ['FQH-WUD-53'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Rinsing the entire mouth (maḍmaḍah) how many times is a sunnah of wuḍūʾ?',
    options: ['Three times', 'Once', 'Five times', 'Not at all — it is only in ghusl'],
    answerIndex: 0,
    explanation: 'Rinsing the entire mouth three times is one of the 17 sunan of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q58',
    sourceIds: ['FQH-WUD-54'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Sniffing water into the nose and blowing it out (istinshāq/istinthār) is a sunnah of wuḍūʾ.',
    answer: true,
    explanation: 'Correct — this is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q59',
    sourceIds: ['FQH-WUD-55'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Running wet fingers through which part of the body is a sunnah of wuḍūʾ (takhlīl al-liḥyah)?',
    options: ['The beard', 'The eyebrows', 'The scalp', 'The chest'],
    answerIndex: 0,
    explanation: 'Takhlīl al-liḥyah — running wet fingers through the beard — is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q60',
    sourceIds: ['FQH-WUD-56'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Running wet fingers through the fingers and toes (takhlīl al-aṣābiʿ) is a sunnah of wuḍūʾ.',
    answer: true,
    explanation: 'Correct — this is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q61',
    sourceIds: ['FQH-WUD-57'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'What is the sunnah method for wiping the head and ears?',
    options: ['Wiping the entire head once, and the ears with the same water', 'Wiping the head three times', 'Wiping only the ears, not the head', 'Wiping the head with fresh water for the ears'],
    answerIndex: 0,
    explanation: 'Wiping the entire head once, and the ears with the same water, is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q62',
    sourceIds: ['FQH-WUD-58'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Rubbing the limbs while washing them (dalk) is a sunnah of wuḍūʾ.',
    answer: true,
    explanation: 'Correct — dalk is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q63',
    sourceIds: ['FQH-WUD-59'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which limb should be started with, as a sunnah of wuḍūʾ?',
    options: ['The right limb before the left', 'The left limb before the right', 'Either limb, no preference', 'Both limbs simultaneously'],
    answerIndex: 0,
    explanation: 'Starting with the right limb before the left is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q64',
    sourceIds: ['FQH-WUD-60'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Starting with the fingers and toes when washing the hands and feet is a sunnah of wuḍūʾ.',
    answer: true,
    explanation: 'Correct — this is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q65',
    sourceIds: ['FQH-WUD-61'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'When performing masḥ (wiping) of the head, where is it sunnah to start?',
    options: ['The front of the head', 'The back of the head', 'The left side', 'The crown'],
    answerIndex: 0,
    explanation: 'Starting from the front of the head during masḥ is one of the 17 sunan.',
  },
  {
    id: 'FQH-WUD-Q66',
    sourceIds: ['FQH-WUD-62'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Wiping the back of the neck is a sunnah of wuḍūʾ.',
    answer: true,
    explanation: 'Correct — this is the last of the 17 sunan of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q67',
    sourceIds: ['FQH-WUD-46', 'FQH-WUD-47', 'FQH-WUD-48', 'FQH-WUD-52', 'FQH-WUD-53'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following is NOT one of the 17 sunan of wuḍūʾ?',
    options: ['Making the intention (niyyah)', 'Using the siwāk', 'Reciting an entire sūrah before starting', 'Rinsing the mouth three times'],
    answerIndex: 2,
    explanation: 'Reciting an entire sūrah before starting is not among the 17 sunan of wuḍūʾ; the other three are.',
  },
  {
    id: 'FQH-WUD-Q68',
    sourceIds: ['FQH-WUD-63'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Facing the qiblah while performing wuḍūʾ is a mustaḥabb adab.',
    answer: true,
    explanation: 'Correct — this is one of the 8 adab/mustaḥabb of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q69',
    sourceIds: ['FQH-WUD-64'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following is a mustaḥabb adab regarding water use during wuḍūʾ?',
    options: ['Avoiding contact with the water already used in one\'s own wuḍūʾ', 'Reusing all splashback water intentionally', 'Using only cold water', 'Using only warm water'],
    answerIndex: 0,
    explanation: 'Avoiding contact with the water that has already dripped off during one\'s own wuḍūʾ is a mustaḥabb adab.',
  },
  {
    id: 'FQH-WUD-Q70',
    sourceIds: ['FQH-WUD-65'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Mentioning Allah\'s name while washing each limb (not only at the start) is a mustaḥabb adab.',
    answer: true,
    explanation: 'Correct — this is one of the 8 adab of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q71',
    sourceIds: ['FQH-WUD-66'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of these is a mustaḥabb adab of wuḍūʾ?',
    options: ['Not seeking assistance from others while performing it oneself', 'Asking someone else to perform each step', 'Performing it in complete darkness', 'Performing it while lying down'],
    answerIndex: 0,
    explanation: 'Performing wuḍūʾ oneself without help is a mustaḥabb adab.',
  },
  {
    id: 'FQH-WUD-Q72',
    sourceIds: ['FQH-WUD-67'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Performing wuḍūʾ before the time of prayer begins, for one who is not excused, is a mustaḥabb adab.',
    answer: true,
    explanation: 'Correct — this is one of the 8 adab of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q73',
    sourceIds: ['FQH-WUD-68'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'What is a mustaḥabb adab to recite after completing wuḍūʾ?',
    options: ['The Shahādatayn (the two testimonies of faith)', 'Sūrat al-Fātiḥah', 'The adhan', 'The iqāmah'],
    answerIndex: 0,
    explanation: 'Reciting the Shahādatayn after wuḍūʾ is a mustaḥabb adab.',
  },
  {
    id: 'FQH-WUD-Q74',
    sourceIds: ['FQH-WUD-69'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Standing and drinking from the leftover water of one\'s wuḍūʾ is a mustaḥabb adab.',
    answer: true,
    explanation: 'Correct — this is one of the 8 adab of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q75',
    sourceIds: ['FQH-WUD-70'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'What is a mustaḥabb adab to do during or after wuḍūʾ, beyond the fixed narrated duas?',
    options: ['Making a personal duʿāʾ with the narrated prayers', 'Remaining completely silent', 'Reciting the Qurʾān aloud continuously', 'Reciting poetry'],
    answerIndex: 0,
    explanation: 'Making duʿāʾ with the narrated prayers during wuḍūʾ is a mustaḥabb adab.',
  },
  {
    id: 'FQH-WUD-Q76',
    sourceIds: ['FQH-WUD-63', 'FQH-WUD-66', 'FQH-WUD-68', 'FQH-WUD-69'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following is NOT one of the 8 adab/mustaḥabb of wuḍūʾ?',
    options: ['Facing the qiblah', 'Not seeking assistance from others', 'Reciting the Shahādatayn after wuḍūʾ', 'Performing wuḍūʾ twice in a row for extra reward'],
    answerIndex: 3,
    explanation: 'Performing wuḍūʾ twice in a row is not one of the 8 adab (in fact unnecessary repetition is makrūh per FQH-WUD-14/15) — the other three are genuine adab.',
  },
  {
    id: 'FQH-WUD-Q77',
    sourceIds: ['FQH-WUD-71'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'During which action of wuḍūʾ is it mustaḥabb to recite a duʿāʾ asking Allah for help in reciting the Qurʾān, remembrance, and worship?',
    options: ['Rinsing the mouth', 'Rinsing the nose', 'Wiping the head', 'Washing the feet'],
    answerIndex: 0,
    explanation: 'While rinsing the mouth, it is mustaḥabb to recite a duʿāʾ asking Allah\'s help in reciting the Qurʾān, remembering Him, thanking Him, and perfecting worship of Him.',
  },
  {
    id: 'FQH-WUD-Q78',
    sourceIds: ['FQH-WUD-72'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'The duʿāʾ asking Allah to let one smell the fragrance of Paradise (and not the stench of Hellfire) is recited during which action?',
    options: ['Rinsing the nose', 'Washing the face', 'Wiping the ears', 'Washing the right arm'],
    answerIndex: 0,
    explanation: 'This duʿāʾ is recited while rinsing the nose during wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q79',
    sourceIds: ['FQH-WUD-73'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: The duʿāʾ asking Allah to "illuminate my face on the Day when some faces will be illuminated and others darkened" is recited while washing the face.',
    answer: true,
    explanation: 'Correct — this duʿāʾ is recited while washing the face.',
  },
  {
    id: 'FQH-WUD-Q80',
    sourceIds: ['FQH-WUD-74'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'The duʿāʾ asking Allah to "give me my record in my right hand and make my reckoning easy" is recited while washing which limb?',
    options: ['The right arm', 'The left arm', 'The face', 'The right foot'],
    answerIndex: 0,
    explanation: 'This duʿāʾ is recited while washing the right arm.',
  },
  {
    id: 'FQH-WUD-Q81',
    sourceIds: ['FQH-WUD-75'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: The duʿāʾ asking Allah not to give one\'s record in the left hand, nor from behind the back, is recited while washing the left arm.',
    answer: true,
    explanation: 'Correct — this duʿāʾ is recited while washing the left arm.',
  },
  {
    id: 'FQH-WUD-Q82',
    sourceIds: ['FQH-WUD-76'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'The duʿāʾ asking Allah to "shade me under the shade of Your Throne" is recited during which action?',
    options: ['Wiping the head', 'Washing the feet', 'Rinsing the mouth', 'Washing the arms'],
    answerIndex: 0,
    explanation: 'This duʿāʾ is recited while wiping the head.',
  },
  {
    id: 'FQH-WUD-Q83',
    sourceIds: ['FQH-WUD-77'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: The duʿāʾ asking Allah to make one "among those who listen to speech and follow the best of it" is recited while wiping the ears.',
    answer: true,
    explanation: 'Correct — this duʿāʾ is recited while wiping the ears.',
  },
  {
    id: 'FQH-WUD-Q84',
    sourceIds: ['FQH-WUD-78'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'The short duʿāʾ "O Allah, free my neck from the Fire" is recited during which action?',
    options: ['Wiping the neck', 'Washing the face', 'Rinsing the nose', 'Washing the right foot'],
    answerIndex: 0,
    explanation: 'This duʿāʾ is recited while wiping the neck.',
  },
  {
    id: 'FQH-WUD-Q85',
    sourceIds: ['FQH-WUD-79'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: The duʿāʾ asking Allah to "make my foot firm upon the Ṣirāṭ on the Day when feet will slip" is recited while washing the right foot.',
    answer: true,
    explanation: 'Correct — this duʿāʾ is recited while washing the right foot.',
  },
  {
    id: 'FQH-WUD-Q86',
    sourceIds: ['FQH-WUD-80'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'The duʿāʾ asking Allah to "forgive my sins, accept my efforts, and make my trade never fail" is recited while washing which limb?',
    options: ['The left foot', 'The right foot', 'The left arm', 'The face'],
    answerIndex: 0,
    explanation: 'This duʿāʾ is recited while washing the left foot, the final limb of wuḍūʾ.',
  },
```

- [ ] **Step 2: Run the validator**

Run: `cd qasas-practice && npm run validate:fiqh`
Expected: `FAIL`, missing-ID list should now start at `FQH-WUD-81`.

---

### Task 8: Author Wudhu questions — Fiqh-07 rulings (FQH-WUD-81…97) and finalize

**Files:**
- Modify: `qasas-practice/src/data/fiqh/wudhu.js`

Source rulings (from `content/Fiqh/Fiqh-07 Nullifiers of Wudhu.md`) — this deck is naturally
True/False territory (does X nullify wuḍūʾ, or not):

- FQH-WUD-81: Anything exiting the two openings nullifies wuḍūʾ.
- FQH-WUD-82: Flowing blood/pus from elsewhere on the body nullifies wuḍūʾ.
- FQH-WUD-83: Vomiting a mouthful or more nullifies wuḍūʾ.
- FQH-WUD-84: Blood from the mouth predominating/equal to saliva nullifies wuḍūʾ.
- FQH-WUD-85: Sleeping without buttocks firmly planted nullifies wuḍūʾ.
- FQH-WUD-86: Fainting nullifies wuḍūʾ.
- FQH-WUD-87: Insanity nullifies wuḍūʾ.
- FQH-WUD-88: Intoxication/drunkenness nullifies wuḍūʾ.
- FQH-WUD-89: Loud laughter during Ṣalāh by an adult nullifies wuḍūʾ (unique nullifier).
- FQH-WUD-90: Blood appearing without flowing does NOT nullify wuḍūʾ.
- FQH-WUD-91: Flesh falling off without blood flowing does NOT nullify wuḍūʾ.
- FQH-WUD-92: Vomiting less than a mouthful does NOT nullify wuḍūʾ.
- FQH-WUD-93: Vomiting phlegm does NOT nullify wuḍūʾ.
- FQH-WUD-94: Sleeping during prayer in the sunnah posture does NOT nullify wuḍūʾ.
- FQH-WUD-95: Sleeping sitting firmly on the ground does NOT nullify wuḍūʾ.
- FQH-WUD-96 `[madhhab-specific]`: Touching one's own private part does NOT nullify wuḍūʾ (Ḥanafī).
- FQH-WUD-97 `[madhhab-specific]`: Touching a woman does NOT nullify wuḍūʾ (Ḥanafī).

Per the design doc's guardrail and the open flag on FQH-WUD-96/97 (madhhab tag inferred, not
slide-stated): frame both as explicit Ḥanafī positions via the `madhhab` field.

- [ ] **Step 1: Append the final content block, and close the array**

```js
  // --- Fiqh-07: Nullifiers of Wudhu (FQH-WUD-81..97) ---
  {
    id: 'FQH-WUD-Q87',
    sourceIds: ['FQH-WUD-81'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Anything exiting from the two openings (front or rear private parts) — such as urine, stool, wind, madhy, or blood — nullifies wuḍūʾ.',
    answer: true,
    explanation: 'Correct — this is one of the main categories of wuḍūʾ nullifiers.',
  },
  {
    id: 'FQH-WUD-Q88',
    sourceIds: ['FQH-WUD-82'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Blood or pus flowing from elsewhere on the body (not the two openings) nullifies wuḍūʾ under which condition?',
    options: ['If it flows beyond its source', 'Only if it is from a wound on the face', 'Never — it only applies to the two openings', 'Only if it is more than a cupful'],
    answerIndex: 0,
    explanation: 'Blood or pus from elsewhere on the body nullifies wuḍūʾ if it flows beyond its source.',
  },
  {
    id: 'FQH-WUD-Q89',
    sourceIds: ['FQH-WUD-83'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Vomiting a mouthful or more nullifies wuḍūʾ.',
    answer: true,
    explanation: 'Correct — vomiting a mouthful or more is a nullifier of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q90',
    sourceIds: ['FQH-WUD-84'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Blood coming out from the mouth nullifies wuḍūʾ under which condition?',
    options: ['If it predominates over, or equals, the saliva', 'Only if it is a large visible amount', 'Never', 'Only if swallowed'],
    answerIndex: 0,
    explanation: 'If blood from the mouth predominates over or equals the saliva, wuḍūʾ is nullified.',
  },
  {
    id: 'FQH-WUD-Q91',
    sourceIds: ['FQH-WUD-85'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Sleeping in a position where the buttocks are not firmly planted on the ground nullifies wuḍūʾ.',
    answer: true,
    explanation: 'Correct — this is one of the "loss of awareness" nullifiers.',
  },
  {
    id: 'FQH-WUD-Q92',
    sourceIds: ['FQH-WUD-86'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following nullifies wuḍūʾ due to loss of awareness?',
    options: ['Fainting', 'Yawning', 'Sneezing', 'Blinking'],
    answerIndex: 0,
    explanation: 'Fainting is one of the loss-of-awareness nullifiers of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q93',
    sourceIds: ['FQH-WUD-87'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Insanity nullifies wuḍūʾ.',
    answer: true,
    explanation: 'Correct — insanity is one of the loss-of-awareness nullifiers.',
  },
  {
    id: 'FQH-WUD-Q94',
    sourceIds: ['FQH-WUD-88'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following nullifies wuḍūʾ, alongside fainting and insanity?',
    options: ['Intoxication or drunkenness', 'Feeling sleepy but awake', 'Deep concentration', 'Closing one\'s eyes briefly'],
    answerIndex: 0,
    explanation: 'Intoxication or drunkenness is one of the loss-of-awareness nullifiers of wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q95',
    sourceIds: ['FQH-WUD-89'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Loud laughter by an adult during Ṣalāh nullifies wuḍūʾ — a unique nullifier specific to being in prayer.',
    answer: true,
    explanation: 'Correct — laughing loudly during Ṣalāh is a unique nullifier that only applies while praying.',
  },
  {
    id: 'FQH-WUD-Q96',
    sourceIds: ['FQH-WUD-90'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Blood that appears on the skin without flowing nullifies wuḍūʾ.',
    answer: false,
    explanation: 'False — blood that appears without flowing does not nullify wuḍūʾ; it must flow to nullify.',
  },
  {
    id: 'FQH-WUD-Q97',
    sourceIds: ['FQH-WUD-91'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following does NOT nullify wuḍūʾ?',
    options: ['Flesh falling off the body without blood flowing', 'Fainting', 'Loud laughter during Ṣalāh', 'Insanity'],
    answerIndex: 0,
    explanation: 'Flesh falling off without blood flowing does not nullify wuḍūʾ; the other three do.',
  },
  {
    id: 'FQH-WUD-Q98',
    sourceIds: ['FQH-WUD-92'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Vomiting less than a mouthful nullifies wuḍūʾ.',
    answer: false,
    explanation: 'False — vomiting less than a mouthful does not nullify wuḍūʾ; a mouthful or more is required.',
  },
  {
    id: 'FQH-WUD-Q99',
    sourceIds: ['FQH-WUD-93'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Vomiting phlegm, whether little or much, has what effect on wuḍūʾ?',
    options: ['Does not nullify it', 'Always nullifies it', 'Only nullifies it if a large amount', 'Requires ghusl'],
    answerIndex: 0,
    explanation: 'Vomiting phlegm, whether little or much, does not nullify wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q100',
    sourceIds: ['FQH-WUD-94'],
    topic: 'WUD',
    type: 'tf',
    prompt: 'True or False: Sleeping during prayer while maintaining the correct (sunnah) prayer posture nullifies wuḍūʾ.',
    answer: false,
    explanation: 'False — sleeping during prayer while maintaining the sunnah posture does not nullify wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q101',
    sourceIds: ['FQH-WUD-95'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Sleeping while sitting firmly on the ground has what effect on wuḍūʾ?',
    options: ['Does not nullify it', 'Always nullifies it', 'Nullifies it only at night', 'Requires renewing wuḍūʾ regardless'],
    answerIndex: 0,
    explanation: 'Sleeping while sitting firmly on the ground does not nullify wuḍūʾ — only sleeping without the buttocks firmly planted does.',
  },
  {
    id: 'FQH-WUD-Q102',
    sourceIds: ['FQH-WUD-96'],
    topic: 'WUD',
    madhhab: 'Hanafi',
    type: 'tf',
    prompt: 'True or False: In the Ḥanafī view, touching one\'s own private part nullifies wuḍūʾ.',
    answer: false,
    explanation: 'False — in the Ḥanafī view, touching one\'s own private part does not nullify wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q103',
    sourceIds: ['FQH-WUD-97'],
    topic: 'WUD',
    madhhab: 'Hanafi',
    type: 'mcq',
    prompt: 'In the Ḥanafī view, what is the ruling on touching a woman with regard to wuḍūʾ?',
    options: ['It does not nullify wuḍūʾ', 'It always nullifies wuḍūʾ', 'It nullifies wuḍūʾ only if intentional', 'It requires ghusl'],
    answerIndex: 0,
    explanation: 'In the Ḥanafī view, touching a woman does not nullify wuḍūʾ.',
  },
  {
    id: 'FQH-WUD-Q104',
    sourceIds: ['FQH-WUD-90', 'FQH-WUD-91', 'FQH-WUD-92', 'FQH-WUD-93', 'FQH-WUD-94', 'FQH-WUD-95'],
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Which of the following DOES nullify wuḍūʾ, unlike the others listed?',
    options: ['Vomiting a full mouthful', 'Vomiting less than a mouthful', 'Vomiting phlegm', 'Blood appearing without flowing'],
    answerIndex: 0,
    explanation: 'Vomiting a full mouthful nullifies wuḍūʾ; the other three, taken from the "does not nullify" list, do not.',
  },
];
```

- [ ] **Step 2: Run the full validator — must pass now**

Run: `cd qasas-practice && npm run validate:fiqh`
Expected: exits 0, prints `OK: <N> questions, <N> in WUD, full FQH-WUD-01..97 coverage.` followed
by `WUD (Wudhu): <N> questions`. If it still fails, fix the reported issue (missing ID, duplicate
ID, or schema error) before moving on — do not proceed to Task 9 with a failing validator.

---

### Task 9: `FiqhQuestionCard` shared component

**Files:**
- Create: `qasas-practice/src/components/FiqhQuestionCard.jsx`
- Create: `qasas-practice/src/components/FiqhQuestionCard.css`

This is the one place MCQ/TF rendering logic lives — both `TimedQuiz` (Task 11) and
`FiqhPracticeMode` (Task 10) use it.

- [ ] **Step 1: Write the component**

```jsx
// qasas-practice/src/components/FiqhQuestionCard.jsx
import './FiqhQuestionCard.css';

const MADHHAB_LABELS = {
  Hanafi: 'Ḥanafī',
};

// Inline check/x icons matching the style used elsewhere in the app (TimedQuiz.jsx, IrabMode.jsx)
function CheckIcon() {
  return (
    <svg className="inline-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="inline-icon x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Renders one Fiqh question (MCQ or True/False) with feedback + explanation.
 * Used by both TimedQuiz (scored, timed) and FiqhPracticeMode (self-paced).
 *
 * @param {Object} props
 * @param {Object} props.question - a question object from src/data/fiqh
 * @param {boolean} props.showFeedback - whether to reveal correct/incorrect state
 * @param {*} props.currentAnswer - the answer the learner picked (answerIndex for mcq, boolean for tf)
 * @param {(correct: boolean, answer: *) => void} props.onAnswer - called when the learner answers
 */
export default function FiqhQuestionCard({ question, showFeedback, currentAnswer, onAnswer }) {
  const madhhabBadge = question.madhhab && (
    <span className="fiqh-madhhab-badge">{MADHHAB_LABELS[question.madhhab] || question.madhhab}</span>
  );

  if (question.type === 'tf') {
    const tfOptions = [
      { value: true, label: 'True' },
      { value: false, label: 'False' },
    ];

    return (
      <div className="fiqh-question-card">
        {madhhabBadge}
        <h2 className="fiqh-question-prompt">{question.prompt}</h2>
        <div className={`fiqh-tf-choices ${showFeedback ? 'feedback-shown' : ''}`}>
          {tfOptions.map((opt) => {
            const isTapped = currentAnswer === opt.value;
            const isCorrectAnswer = opt.value === question.answer;
            let className = 'fiqh-choice-btn fiqh-tf-btn';

            if (showFeedback) {
              if (isTapped && isCorrectAnswer) className += ' correct-tapped';
              else if (isTapped && !isCorrectAnswer) className += ' incorrect-tapped';
              else if (isCorrectAnswer) className += ' correct-outline';
              else className += ' dimmed';
            }

            return (
              <button
                key={String(opt.value)}
                className={className}
                onClick={() => onAnswer(opt.value === question.answer, opt.value)}
                disabled={showFeedback}
              >
                {opt.label}
                {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
                {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
              </button>
            );
          })}
        </div>
        {showFeedback && <p className="fiqh-explanation">{question.explanation}</p>}
      </div>
    );
  }

  // mcq
  return (
    <div className="fiqh-question-card">
      {madhhabBadge}
      <h2 className="fiqh-question-prompt">{question.prompt}</h2>
      <div className={`fiqh-mcq-choices ${showFeedback ? 'feedback-shown' : ''}`}>
        {question.options.map((option, index) => {
          const isTapped = currentAnswer === index;
          const isCorrectAnswer = index === question.answerIndex;
          let className = 'fiqh-choice-btn fiqh-mcq-btn';

          if (showFeedback) {
            if (isTapped && isCorrectAnswer) className += ' correct-tapped';
            else if (isTapped && !isCorrectAnswer) className += ' incorrect-tapped';
            else if (isCorrectAnswer) className += ' correct-outline';
            else className += ' dimmed';
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => onAnswer(index === question.answerIndex, index)}
              disabled={showFeedback}
            >
              {option}
              {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
              {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
            </button>
          );
        })}
      </div>
      {showFeedback && <p className="fiqh-explanation">{question.explanation}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Write the styles**

```css
/* qasas-practice/src/components/FiqhQuestionCard.css */
.fiqh-question-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.fiqh-madhhab-badge {
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: #f0e6d2;
  color: #7a5c1e;
}

.fiqh-question-prompt {
  font-size: 1.15rem;
  line-height: 1.5;
  margin: 0;
}

.fiqh-mcq-choices,
.fiqh-tf-choices {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fiqh-tf-choices {
  flex-direction: row;
}

.fiqh-choice-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid #d8d2c4;
  border-radius: 0.75rem;
  background: #fff;
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.fiqh-tf-btn {
  flex: 1;
  justify-content: center;
}

.fiqh-choice-btn:disabled {
  cursor: default;
}

.fiqh-choice-btn.correct-tapped {
  border-color: #22863a;
  background: #e6f4ea;
  color: #22863a;
}

.fiqh-choice-btn.incorrect-tapped {
  border-color: #d1242f;
  background: #fdeeee;
  color: #d1242f;
}

.fiqh-choice-btn.correct-outline {
  border-color: #22863a;
}

.fiqh-choice-btn.dimmed {
  opacity: 0.5;
}

.fiqh-explanation {
  margin: 0;
  padding: 0.75rem 1rem;
  background: #f6f3ea;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #4a4030;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd qasas-practice && npx vite build --mode development 2>&1 | tail -30`
Expected: no errors mentioning `FiqhQuestionCard` (it isn't imported anywhere yet, so this mainly
confirms no syntax errors — full behavioral check happens in Task 12/20 once it's wired up).

---

### Task 10: `FiqhPracticeMode` (untimed practice)

**Files:**
- Create: `qasas-practice/src/components/FiqhPracticeMode.jsx`

Modeled directly on `qasas-practice/src/components/IrabMode.jsx` (self-paced, immediate feedback,
uses the shared `ModeCommon.css` classes), but delegates question rendering to `FiqhQuestionCard`.

- [ ] **Step 1: Write the component**

```jsx
// qasas-practice/src/components/FiqhPracticeMode.jsx
import { useState, useMemo } from 'react';
import { getFiqhQuestions } from '../data/fiqh';
import FiqhQuestionCard from './FiqhQuestionCard';
import './ModeCommon.css';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function FiqhPracticeMode({ topic, onBack, score, setScore }) {
  const questions = useMemo(() => shuffleArray(getFiqhQuestions(topic)), [topic]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);

  const current = questions[currentIndex];

  const handleAnswer = (correct, answer) => {
    if (answered) return;
    setCurrentAnswer(answer);
    setAnswered(true);
    setSessionTotal((prev) => prev + 1);
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setCurrentAnswer(null);
    setAnswered(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  if (!current) {
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>Back</button>
        </header>
        <div className="mode-content">
          <p>No questions available for this topic yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mode-container">
      <header className="mode-header">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <span className="score">
          {score} / {sessionTotal}
        </span>
      </header>

      <div className="mode-content">
        <FiqhQuestionCard
          question={current}
          showFeedback={answered}
          currentAnswer={currentAnswer}
          onAnswer={handleAnswer}
        />

        {answered && (
          <button className="next-btn" onClick={handleNext}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd qasas-practice && npx vite build --mode development 2>&1 | tail -30`
Expected: no errors.

---

### Task 11: Wire `TimedQuiz.jsx` for the `fiqh` mode

**Files:**
- Modify: `qasas-practice/src/components/TimedQuiz.jsx`

- [ ] **Step 1: Import the new pieces and replace the local mode-config constants**

Replace lines 1-27 (the imports and `MODE_TIMERS`/`MODE_LABELS`/`BANKS` consts) with:

```js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { submitQuizResult, formatDuration } from '../lib/quiz';
import { irab, nounFeatures, roles, vocab } from '../data/bank';
import { getFiqhQuestions } from '../data/fiqh';
import { QUIZ_MODES } from '../config/subjects';
import FiqhQuestionCard from './FiqhQuestionCard';
import './TimedQuiz.css';

const QUIZ_LENGTH = 10;

const BANKS = {
  irab,
  nounFeatures,
  roles,
  vocab,
  // 'fiqh' is intentionally absent here — its bank depends on the selected
  // topic, so it's resolved dynamically in getBank() below instead of a
  // static import.
};

function getBank(mode, topic) {
  if (mode === 'fiqh') return getFiqhQuestions(topic || 'all');
  return BANKS[mode];
}
```

(`MODE_TIMERS` and `MODE_LABELS` are gone — every remaining usage in this file switches to
`QUIZ_MODES[mode].timerSeconds`, per the next steps. `MODE_LABELS` was dead code — grep confirms
it was never referenced elsewhere in this file.)

- [ ] **Step 2: Accept the new `topic` prop and update the bank/timer lookups**

Change the component signature (was `export default function TimedQuiz({ mode, onBack, onPlayAgain, onExitRequest }) {`) to:

```js
export default function TimedQuiz({ mode, topic, onBack, onPlayAgain, onExitRequest }) {
```

Then update every `MODE_TIMERS[mode]` reference to `QUIZ_MODES[mode].timerSeconds`. There are 4
occurrences — in the `timeLeft` initializer, the timer `useEffect`'s `setTimeLeft` callback, and
twice in `advanceQuestion`/the header's `<TimerRing totalTime=... />`. For example, the state
initializer:

```js
  const [timeLeft, setTimeLeft] = useState(QUIZ_MODES[mode].timerSeconds);
```

and inside the timer effect:

```js
        if (prev <= 1) {
          handleTimeout();
          return QUIZ_MODES[mode].timerSeconds;
        }
```

and inside `advanceQuestion`:

```js
    setTimeLeft(QUIZ_MODES[mode].timerSeconds);
```

and in the JSX header:

```jsx
        <TimerRing timeLeft={timeLeft} totalTime={QUIZ_MODES[mode].timerSeconds} />
```

- [ ] **Step 3: Update the question-initialization effect to use `getBank`**

Replace:

```js
  useEffect(() => {
    const bank = BANKS[mode];
    const selected = selectQuestions(bank);
    setQuestions(selected);
    setQuestionStartTime(Date.now());
  }, [mode]);
```

with:

```js
  useEffect(() => {
    const bank = getBank(mode, topic);
    const selected = selectQuestions(bank);
    setQuestions(selected);
    setQuestionStartTime(Date.now());
  }, [mode, topic]);
```

- [ ] **Step 4: Add the `fiqh` case to `getQuestionTarget`**

In the `getQuestionTarget` function, add a case before `default`:

```js
      case 'fiqh':
        return question.prompt;
```

- [ ] **Step 5: Add the `fiqh` case to `renderQuestion`**

In `renderQuestion`'s switch, add a case before `default`:

```jsx
      case 'fiqh':
        return (
          <FiqhQuestionCard
            question={current}
            showFeedback={showFeedback}
            currentAnswer={currentAnswer}
            onAnswer={handleAnswer}
          />
        );
```

- [ ] **Step 6: Pass `bankSource` through to `submitQuizResult`**

In the "Submit quiz result when complete" `useEffect`, change:

```js
        await submitQuizResult({
          userId: user.uid,
          username,
          mode,
          score,
          durationSeconds: Math.round(totalDuration),
        });
```

to:

```js
        await submitQuizResult({
          userId: user.uid,
          username,
          mode,
          bankSource: QUIZ_MODES[mode].bankSource,
          score,
          durationSeconds: Math.round(totalDuration),
        });
```

(This requires `submitQuizResult` to accept a `bankSource` param — done in Task 15. Doing this step
now is fine; the function will just ignore the extra param until Task 15 lands, since JS doesn't
enforce parameter shape.)

- [ ] **Step 7: Verify it compiles and the existing Qasas modes still work**

Run: `cd qasas-practice && npx vite build --mode development 2>&1 | tail -40`
Expected: no errors. This does not yet exercise the `fiqh` mode in the browser (App.jsx doesn't
pass `mode="fiqh"` anywhere yet) — that's Task 14 — but confirms the refactor didn't break the
existing 4 modes' code paths.

---

### Task 12: Add Fiqh to `HomeScreen.jsx`

**Files:**
- Modify: `qasas-practice/src/components/HomeScreen.jsx`

- [ ] **Step 1: Import the topic registry**

Add near the top, after the existing imports:

```js
import { FIQH_TOPICS } from '../config/subjects';
```

- [ ] **Step 2: Add a Fiqh practice section**

After the existing `{/* Practice modes section */}` section (which ends at the `</section>` right
before `{/* Quizzes section */}`), insert a new section:

```jsx
      {/* Fiqh practice section */}
      <section className="home-section">
        <h3 className="section-title">Fiqh</h3>
        <div className="mode-grid">
          {FIQH_TOPICS.map((topic) => (
            <button
              key={topic.code}
              className="mode-card"
              onClick={() => onSelectMode(`fiqh-${topic.code}`)}
            >
              <span className="mode-title-ar">الفِقْه</span>
              <span className="mode-title-en">{topic.label}</span>
              <span className="mode-desc">Practice rulings from this topic</span>
            </button>
          ))}
        </div>
      </section>
```

- [ ] **Step 3: Add "Fiqh" to the recent-results mode label map**

Change the `MODE_LABELS` constant (used in the "Your Recent Results" section) from:

```js
const MODE_LABELS = {
  irab: "I'rab",
  nounFeatures: 'Noun Features',
  roles: 'Roles',
  vocab: 'Vocab',
};
```

to:

```js
const MODE_LABELS = {
  irab: "I'rab",
  nounFeatures: 'Noun Features',
  roles: 'Roles',
  vocab: 'Vocab',
  fiqh: 'Fiqh',
};
```

(This one stays local rather than importing `QUIZ_MODES` because its keys currently include
`irab`/`roles` short forms that don't perfectly match `QUIZ_MODES`' `nounFeatures`/`roles` keys in
a way worth unifying in this pass — see the Known Inconsistency note in Task 17. Keeping it a
simple local literal here is the smaller, safer diff.)

- [ ] **Step 4: Verify it compiles**

Run: `cd qasas-practice && npx vite build --mode development 2>&1 | tail -30`
Expected: no errors.

---

### Task 13: Add Fiqh to `QuizPicker.jsx`

**Files:**
- Modify: `qasas-practice/src/components/QuizPicker.jsx`

- [ ] **Step 1: Import the topic registry and extend `quizModes`**

Add the import at the top:

```js
import { FIQH_TOPICS } from '../config/subjects';
```

Change the `quizModes` array from a plain literal to a literal plus a mapped block. Replace:

```js
const quizModes = [
  {
    id: 'irab',
    titleAr: 'تَحْدِيدُ الإِعْرَاب',
    titleEn: "I'rab",
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    id: 'nounFeatures',
    titleAr: 'صِفَاتُ الاسْم',
    titleEn: 'Noun Features',
    format: '10 questions',
    timer: '10 sec per question',
  },
  {
    id: 'roles',
    titleAr: 'الدَّوْرُ النَّحْوِي',
    titleEn: 'Grammatical Role',
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    id: 'vocab',
    titleAr: 'المُفْرَدَات',
    titleEn: 'Vocabulary',
    format: '10 cards',
    timer: '10 sec per card',
  },
];
```

with:

```js
const quizModes = [
  {
    id: 'irab',
    titleAr: 'تَحْدِيدُ الإِعْرَاب',
    titleEn: "I'rab",
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    id: 'nounFeatures',
    titleAr: 'صِفَاتُ الاسْم',
    titleEn: 'Noun Features',
    format: '10 questions',
    timer: '10 sec per question',
  },
  {
    id: 'roles',
    titleAr: 'الدَّوْرُ النَّحْوِي',
    titleEn: 'Grammatical Role',
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    id: 'vocab',
    titleAr: 'المُفْرَدَات',
    titleEn: 'Vocabulary',
    format: '10 cards',
    timer: '10 sec per card',
  },
  ...FIQH_TOPICS.map((topic) => ({
    id: `fiqh-${topic.code}`,
    titleAr: 'الفِقْه',
    titleEn: `Fiqh: ${topic.label}`,
    format: '10 questions',
    timer: '25 sec per question',
  })),
  {
    id: 'fiqh-all',
    titleAr: 'الفِقْه',
    titleEn: 'Fiqh: Mixed Review',
    format: '10 questions',
    timer: '25 sec per question',
  },
];
```

(`onSelectMode` is called with these `id` strings unchanged — no signature change to `QuizPicker`
itself. `App.jsx`, in Task 14, is what interprets the `fiqh-*` prefix.)

- [ ] **Step 2: Verify it compiles**

Run: `cd qasas-practice && npx vite build --mode development 2>&1 | tail -30`
Expected: no errors.

---

### Task 14: Wire `App.jsx`'s state machine for Fiqh topics

**Files:**
- Modify: `qasas-practice/src/App.jsx`

- [ ] **Step 1: Import `FiqhPracticeMode`**

Add near the other component imports:

```js
import FiqhPracticeMode from './components/FiqhPracticeMode';
```

- [ ] **Step 2: Add topic state and a `fiqh` entry to `scores`**

Change:

```js
  const [currentMode, setCurrentMode] = useState(null);
  const [quizMode, setQuizMode] = useState(null);
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [showQuizPicker, setShowQuizPicker] = useState(false);
  const [scores, setScores] = useState({
    irab: 0,
    noun: 0,
    role: 0,
    vocab: 0,
  });
```

to:

```js
  const [currentMode, setCurrentMode] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [quizMode, setQuizMode] = useState(null);
  const [quizTopic, setQuizTopic] = useState(null);
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [showQuizPicker, setShowQuizPicker] = useState(false);
  const [scores, setScores] = useState({
    irab: 0,
    noun: 0,
    role: 0,
    vocab: 0,
    fiqh: 0,
  });
```

- [ ] **Step 3: Parse the `fiqh-<topic>` prefix in `handleSelectMode` and `handleSelectQuizMode`**

Change:

```js
  const handleSelectMode = (mode) => {
    setCurrentMode(mode);
    setShowQuizPicker(false);
    setQuizMode(null);
    setQuizInProgress(false);
  };
```

to:

```js
  const handleSelectMode = (mode) => {
    if (mode.startsWith('fiqh-')) {
      setCurrentMode('fiqh');
      setCurrentTopic(mode.slice('fiqh-'.length));
    } else {
      setCurrentMode(mode);
      setCurrentTopic(null);
    }
    setShowQuizPicker(false);
    setQuizMode(null);
    setQuizInProgress(false);
  };
```

Change:

```js
  const handleSelectQuizMode = (mode) => {
    // Store last played mode for leaderboard default
    localStorage.setItem('lastQuizMode', mode);
    setQuizMode(mode);
    setQuizInProgress(true);
    setShowQuizPicker(false);
  };
```

to:

```js
  const handleSelectQuizMode = (mode) => {
    if (mode.startsWith('fiqh-')) {
      const topic = mode.slice('fiqh-'.length);
      // Store last played mode for leaderboard default
      localStorage.setItem('lastQuizMode', 'fiqh');
      setQuizMode('fiqh');
      setQuizTopic(topic);
    } else {
      localStorage.setItem('lastQuizMode', mode);
      setQuizMode(mode);
      setQuizTopic(null);
    }
    setQuizInProgress(true);
    setShowQuizPicker(false);
  };
```

- [ ] **Step 4: Reset `currentTopic`/`quizTopic` in the other handlers**

In `handleBack`, `handleQuizBack`, and `handlePlayAgain`, add resets so a stale topic doesn't leak
into the next session. Change:

```js
  const handleBack = () => {
    setCurrentMode(null);
    setShowQuizPicker(false);
    setQuizMode(null);
    setQuizInProgress(false);
  };
```

to:

```js
  const handleBack = () => {
    setCurrentMode(null);
    setCurrentTopic(null);
    setShowQuizPicker(false);
    setQuizMode(null);
    setQuizInProgress(false);
  };
```

Change:

```js
  const handleQuizBack = () => {
    setQuizMode(null);
    setQuizInProgress(false);
    setShowQuizPicker(false);
    setCurrentMode(null);
  };
```

to:

```js
  const handleQuizBack = () => {
    setQuizMode(null);
    setQuizTopic(null);
    setQuizInProgress(false);
    setShowQuizPicker(false);
    setCurrentMode(null);
  };
```

`handlePlayAgain` restarts the same `quizMode` — it already re-triggers `TimedQuiz`'s
question-selection effect (which now depends on `[mode, topic]`, from Task 11 Step 3) as long as
`quizTopic` isn't cleared in between, so no change is needed there; `quizTopic` state is untouched
by `handlePlayAgain` and stays correct across a replay.

- [ ] **Step 5: Pass `topic` to `TimedQuiz`**

Change:

```js
  if (quizMode) {
    return (
      <ProtectedRoute hideHeader={quizInProgress}>
        <TimedQuiz
          mode={quizMode}
          onBack={handleQuizBack}
          onPlayAgain={handlePlayAgain}
          onQuizComplete={() => setQuizInProgress(false)}
        />
      </ProtectedRoute>
    );
  }
```

to:

```js
  if (quizMode) {
    return (
      <ProtectedRoute hideHeader={quizInProgress}>
        <TimedQuiz
          mode={quizMode}
          topic={quizTopic}
          onBack={handleQuizBack}
          onPlayAgain={handlePlayAgain}
          onQuizComplete={() => setQuizInProgress(false)}
        />
      </ProtectedRoute>
    );
  }
```

- [ ] **Step 6: Add the `fiqh` case to the untimed-mode switch**

In the `switch (currentMode)` inside the `if (currentMode)` block, add a case right after the
existing `case 'vocab':` block and before `default:`:

```jsx
        case 'fiqh':
          return (
            <FiqhPracticeMode
              topic={currentTopic}
              onBack={handleBack}
              score={scores.fiqh}
              setScore={setModeScore('fiqh')}
            />
          );
```

- [ ] **Step 7: Verify it compiles**

Run: `cd qasas-practice && npx vite build --mode development 2>&1 | tail -40`
Expected: no errors.

---

### Task 15: `lib/quiz.js` — accept `bankSource` as a parameter

**Files:**
- Modify: `qasas-practice/src/lib/quiz.js:40-52`

- [ ] **Step 1: Make `bankSource` a required parameter of `submitQuizResult`**

Change:

```js
export async function submitQuizResult({ userId, username, mode, score, durationSeconds }) {
  const docRef = await addDoc(collection(db, QUIZ_RESULTS_COLLECTION), {
    userId,
    username,
    mode,
    bankSource: 'qasas', // Always "qasas" for now. Pass 3 will add "quran".
    score,
    total: 10,
    durationSeconds,
    completedAt: serverTimestamp(),
  });
  return docRef.id;
}
```

to:

```js
export async function submitQuizResult({ userId, username, mode, bankSource, score, durationSeconds }) {
  const docRef = await addDoc(collection(db, QUIZ_RESULTS_COLLECTION), {
    userId,
    username,
    mode,
    bankSource,
    score,
    total: 10,
    durationSeconds,
    completedAt: serverTimestamp(),
  });
  return docRef.id;
}
```

Also update the JSDoc `@param {string} params.mode` comment above it to mention `bankSource`:

```js
 * @param {string} params.mode - One of: "irab", "nounFeatures", "roles", "vocab", "fiqh"
 * @param {string} params.bankSource - One of: "qasas", "fiqh"
```

- [ ] **Step 2: Confirm the only call site already passes it**

`TimedQuiz.jsx`'s `submitQuizResult` call was already updated in Task 11 Step 6 to pass
`bankSource: QUIZ_MODES[mode].bankSource`. No other call sites exist (grep confirms
`submitQuizResult` is only imported in `TimedQuiz.jsx`).

Run: `cd qasas-practice && grep -rn "submitQuizResult" src/`
Expected: two lines — the definition in `lib/quiz.js` and the one call in `TimedQuiz.jsx`.

---

### Task 16: `firestore.rules` — allow the `fiqh` mode/bankSource

**Files:**
- Modify: `qasas-practice/firestore.rules`

- [ ] **Step 1: Extend the `mode` and `bankSource` enums**

Change:

```
                         request.resource.data.mode in ["irab", "nounFeatures", "roles", "vocab"] &&
                         request.resource.data.bankSource in ["qasas", "quran"] &&
```

to:

```
                         request.resource.data.mode in ["irab", "nounFeatures", "roles", "vocab", "fiqh"] &&
                         request.resource.data.bankSource in ["qasas", "quran", "fiqh"] &&
```

- [ ] **Step 2: Verify the rules file is still valid syntax**

If the Firebase CLI is installed and this project is linked to a Firebase project:

Run: `cd qasas-practice && npx firebase-tools deploy --only firestore:rules --dry-run 2>&1 | tail -20`

If the Firebase CLI isn't installed/linked in this environment, skip actually deploying — just
visually confirm the edited block still matches valid `rules_version = '2'` syntax (matching
brackets/quotes) since there's no local rules linter otherwise. Do not deploy the rules from this
plan; deploying is the user's call to make separately, since it affects the live Firebase project.

---

### Task 17: Fiqh tab in `Leaderboard.jsx` and `LeaderboardPreview.jsx`

**Files:**
- Modify: `qasas-practice/src/components/Leaderboard.jsx`
- Modify: `qasas-practice/src/components/LeaderboardPreview.jsx`

**Known inconsistency (pre-existing, not introduced by this task):** these two files' local
`MODES` arrays use the same keys as `TimedQuiz`'s bank keys (`irab`, `nounFeatures`, `roles`,
`vocab`), which is what `QUIZ_MODES` also uses — so importing `QUIZ_MODES` here is a clean drop-in,
no key renaming needed.

- [ ] **Step 1: Update `Leaderboard.jsx`**

Replace:

```js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, getUserBestResult } from '../lib/quiz';
import LeaderboardTable from './LeaderboardTable';
import './Leaderboard.css';

const MODES = [
  { id: 'irab', label: "I'rab" },
  { id: 'nounFeatures', label: 'Noun Features' },
  { id: 'roles', label: 'Roles' },
  { id: 'vocab', label: 'Vocab' },
];

// Variable for bank source - will be configurable in Pass 3
const currentBankSource = 'qasas';
```

with:

```js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, getUserBestResult } from '../lib/quiz';
import { QUIZ_MODES } from '../config/subjects';
import LeaderboardTable from './LeaderboardTable';
import './Leaderboard.css';

const MODES = Object.entries(QUIZ_MODES).map(([id, config]) => ({
  id,
  label: config.label,
}));
```

Then update the two `getLeaderboard`/`getUserBestResult` calls that pass `bankSource:
currentBankSource` to instead derive it per the active mode. Change:

```js
        const data = await getLeaderboard({
          mode: activeMode,
          allTime,
          bankSource: currentBankSource,
          maxResults: 20,
        });
```

to:

```js
        const data = await getLeaderboard({
          mode: activeMode,
          allTime,
          bankSource: QUIZ_MODES[activeMode].bankSource,
          maxResults: 20,
        });
```

and:

```js
          const userBest = await getUserBestResult({
            userId: user.uid,
            mode: activeMode,
            allTime,
            bankSource: currentBankSource,
          });
```

to:

```js
          const userBest = await getUserBestResult({
            userId: user.uid,
            mode: activeMode,
            allTime,
            bankSource: QUIZ_MODES[activeMode].bankSource,
          });
```

- [ ] **Step 2: Update `LeaderboardPreview.jsx` the same way**

Replace:

```js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, getUserBestResult } from '../lib/quiz';
import LeaderboardTable from './LeaderboardTable';
import './LeaderboardPreview.css';

const MODES = [
  { id: 'irab', label: "I'rab" },
  { id: 'nounFeatures', label: 'Noun Features' },
  { id: 'roles', label: 'Roles' },
  { id: 'vocab', label: 'Vocab' },
];

// Variable for bank source - will be configurable in Pass 3
const currentBankSource = 'qasas';
```

with:

```js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, getUserBestResult } from '../lib/quiz';
import { QUIZ_MODES } from '../config/subjects';
import LeaderboardTable from './LeaderboardTable';
import './LeaderboardPreview.css';

const MODES = Object.entries(QUIZ_MODES).map(([id, config]) => ({
  id,
  label: config.label,
}));
```

Then update the two matching call sites, same substitution as Step 1:

```js
        const data = await getLeaderboard({
          mode: activeMode,
          allTime: false,
          bankSource: QUIZ_MODES[activeMode].bankSource,
          maxResults: 5,
        });
```

```js
          const userBest = await getUserBestResult({
            userId: user.uid,
            mode: activeMode,
            allTime: false,
            bankSource: QUIZ_MODES[activeMode].bankSource,
          });
```

- [ ] **Step 3: Verify it compiles**

Run: `cd qasas-practice && npx vite build --mode development 2>&1 | tail -30`
Expected: no errors.

---

### Task 18: Fiqh section in `AdminPage.jsx`

**Files:**
- Modify: `qasas-practice/src/components/AdminPage.jsx`

- [ ] **Step 1: Import the Fiqh data and topic registry**

Add near the top:

```js
import { getFiqhQuestions } from '../data/fiqh';
import { FIQH_TOPICS, QUIZ_MODES } from '../config/subjects';
```

- [ ] **Step 2: Add Fiqh state and filtering inside `BankViewer`**

Change:

```js
  const [expandedSections, setExpandedSections] = useState({
    irab: false,
    noun: false,
    role: false,
    vocab: false,
  });
```

to:

```js
  const [expandedSections, setExpandedSections] = useState({
    irab: false,
    noun: false,
    role: false,
    vocab: false,
    fiqh: false,
  });
```

Add, alongside the other `filter*`/`filtered*` declarations:

```js
  const filterFiqh = (item) => {
    if (!searchQuery) return true;
    return (
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const allFiqhQuestions = getFiqhQuestions('all');
  const filteredFiqh = allFiqhQuestions.filter(filterFiqh);
```

- [ ] **Step 3: Add the Fiqh count to the summary line**

Change:

```jsx
      <div className="bank-summary">
        I'rab: {irab.length} &middot; Noun features: {nounFeatures.length} &middot; Roles: {roles.length} &middot; Vocab: {vocab.length}
      </div>
```

to:

```jsx
      <div className="bank-summary">
        I'rab: {irab.length} &middot; Noun features: {nounFeatures.length} &middot; Roles: {roles.length} &middot; Vocab: {vocab.length} &middot; Fiqh: {allFiqhQuestions.length}
      </div>
```

- [ ] **Step 4: Add a Fiqh section, after the existing Vocab section's closing `</section>`**

```jsx
        {/* Fiqh Section */}
        <section className="bank-section">
          <button
            className="section-header"
            onClick={() => toggleSection('fiqh')}
          >
            <span className="section-title">Fiqh</span>
            <span className="section-count">{filteredFiqh.length}</span>
            <span className={`section-arrow ${expandedSections.fiqh ? 'expanded' : ''}`}>
              &#9662;
            </span>
          </button>
          {expandedSections.fiqh && (
            <div className="section-content">
              {FIQH_TOPICS.map((topicMeta) => {
                const topicQuestions = filteredFiqh.filter((q) => q.topic === topicMeta.code);
                if (topicQuestions.length === 0) return null;
                return (
                  <div key={topicMeta.code} className="fiqh-topic-group">
                    <h4 className="fiqh-topic-heading">{topicMeta.label} ({topicQuestions.length})</h4>
                    {topicQuestions.map((item) => (
                      <div key={item.id} className="fiqh-row">
                        <div className="fiqh-row-prompt">
                          {item.prompt}
                          {item.madhhab && <span className="fiqh-row-madhhab"> [{item.madhhab}]</span>}
                        </div>
                        <div className="fiqh-row-details">
                          <span className="fiqh-row-type">{item.type.toUpperCase()}</span>
                          <span className="fiqh-row-answer">
                            {item.type === 'mcq' ? item.options[item.answerIndex] : String(item.answer)}
                          </span>
                          <span className="fiqh-row-sources">{item.sourceIds.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>
```

- [ ] **Step 5: Add "Fiqh" to `ClassStats`'s `MODE_LABELS`**

Change:

```js
const MODE_LABELS = {
  irab: "I'rab",
  nounFeatures: 'Noun Features',
  roles: 'Roles',
  vocab: 'Vocab',
};
```

to:

```js
const MODE_LABELS = QUIZ_MODES;
```

Then update the one usage, `MODE_LABELS[student.weakestMode]`, to `MODE_LABELS[student.weakestMode]?.label` since `QUIZ_MODES` values are now objects, not plain strings:

```jsx
                    <td className="col-mode">
                      {student.weakestMode
                        ? MODE_LABELS[student.weakestMode]?.label
                        : '-'}
                    </td>
```

- [ ] **Step 6: Add minimal styles for the new rows**

Append to `qasas-practice/src/components/AdminPage.css`:

```css
.fiqh-topic-group {
  margin-bottom: 1rem;
}

.fiqh-topic-heading {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.5rem 0;
  color: #6b6252;
}

.fiqh-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.fiqh-row-prompt {
  font-size: 0.9rem;
}

.fiqh-row-madhhab {
  font-size: 0.75rem;
  color: #7a5c1e;
}

.fiqh-row-details {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #6b6252;
}
```

- [ ] **Step 7: Verify it compiles**

Run: `cd qasas-practice && npx vite build --mode development 2>&1 | tail -40`
Expected: no errors.

---

### Task 19: Update the vault's "Question coverage" table

**Files:**
- Modify: `content/Fiqh/_Fiqh-MOC.md`

Per the vault's own rules (and the design doc), this records that Layer 2 questions now exist for
the WUD topic, without touching any deck's `status:` frontmatter (that stays a human decision).

- [ ] **Step 1: Read the current file**

Read `content/Fiqh/_Fiqh-MOC.md` to get its current exact content before editing (it was last
updated at the end of the ingest batch and its "Question coverage" section is currently the
placeholder `_(links here once questions are generated per deck — leave empty during ingest)_`).

- [ ] **Step 2: Replace the placeholder**

Replace:

```markdown
## Question coverage

_(links here once questions are generated per deck — leave empty during ingest)_
```

with:

```markdown
## Question coverage

| Topic | Rulings | Question bank | Questions |
|-------|---------|----------------|-----------|
| WUD (Wudhu) | FQH-WUD-01…97 | `qasas-practice/src/data/fiqh/wudhu.js` | 104 (97 one-per-ruling MCQ/TF + 7 grouping questions) |
```

This count (104) was verified in advance by extracting and running Tasks 4-8's code blocks
through Node — 104 questions, zero duplicate IDs, full FQH-WUD-01…97 coverage, zero schema
problems. `npm run validate:fiqh` in Task 8 Step 2 should print exactly this.

---

### Task 20: Manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Use the `run` skill or `mcp__Claude_Preview__preview_start` with a `qasas-practice` dev config
(`npm run dev`, Vite default port) rather than plain `Bash`, so the server stays supervised and you
can screenshot/inspect it.

- [ ] **Step 2: Click through the untimed Fiqh practice path**

Log in (or use an existing test account), from the home screen click the new "Wudhu" card under
the "Fiqh" section, answer 2-3 questions (at least one MCQ and one TF), confirm: the explanation
appears after answering, the correct/incorrect highlighting matches what was tapped, the score in
the header increments correctly, and "Next" advances to a new question. Confirm a madhhab-tagged
question (e.g. one of the FQH-WUD-96/97-derived ones) shows the "Ḥanafī" badge.

- [ ] **Step 3: Click through the timed Fiqh quiz path**

From Home → Timed Quizzes, confirm "Fiqh: Wudhu" and "Fiqh: Mixed Review" both appear in the list
alongside the 4 Qasas entries, start "Fiqh: Wudhu", answer all 10 questions (or let a couple time
out), confirm the results screen shows a score out of 10, duration, and a "Saved" status (or a
clear "Could not save (offline?)" message if Firebase isn't reachable in this environment — that's
an acceptable, expected outcome, not a bug, since it's the existing app's documented offline
behavior).

- [ ] **Step 4: Check the leaderboard**

Navigate to `/leaderboard`, confirm a "Fiqh" tab/mode appears in the mode tabs, and (if the quiz in
Step 3 saved successfully) that the just-played result shows up.

- [ ] **Step 5: Check the admin bank viewer**

Navigate to `/admin` as an admin user (or note if the current user isn't an admin — this step then
just confirms the page still 404s cleanly for non-admins per existing behavior), expand the new
"Fiqh" section in the Bank tab, confirm questions display grouped by topic with prompt, type,
answer, and source ruling IDs visible, and that the search box filters them.

- [ ] **Step 6: Re-run the data validator one final time**

Run: `cd qasas-practice && npm run validate:fiqh`
Expected: exits 0, same clean output as Task 8 Step 2 (nothing should have regressed it during the
UI wiring tasks).

---

## Plan self-review notes

- **Spec coverage:** every section of the design doc is covered — schema (Task 3), quality
  guardrail on madhhab distractors (called out per-task in Tasks 5/8), shared registry (Task 1),
  navigation subject→topic→quiz (Tasks 12-14), timed+untimed via one shared `FiqhQuestionCard`
  (Tasks 9-11), Firestore/`bankSource` (Tasks 15-16), leaderboard/admin (Tasks 17-18), MOC
  traceability without touching `status:` (Task 19), and dev-server verification (Task 20).
- **Type/signature consistency check:** `FiqhQuestionCard`'s props (`question`, `showFeedback`,
  `currentAnswer`, `onAnswer`) are identical across its two call sites (Task 10's
  `FiqhPracticeMode` and Task 11's `TimedQuiz`). `getFiqhQuestions(topicCode)` signature (Task 3)
  matches every call site (Task 10, Task 11's `getBank`, Task 18's admin viewer using `'all'`).
  `QUIZ_MODES[mode].timerSeconds`/`.bankSource`/`.label` field names (Task 1) are used consistently
  in Tasks 11, 17, and 18 — no renamed fields anywhere.
- **No placeholders:** every step has complete, pasteable code. The one deliberate exception is
  that Tasks 4-8's question text is written out in full already (not deferred) precisely to avoid
  a "fill in later" gap on the highest-risk, highest-volume part of this plan.
