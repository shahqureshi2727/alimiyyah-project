# Fiqh Quiz Section — Design

Status: approved by user, pending implementation plan
Date: 2026-07-10

## Context

The Obsidian vault at `content/Fiqh/` now has 448 atomic rulings ("Layer 1") across 24 decks and
15 topics, ingested from slide decks per `AGENT_INGEST_INSTRUCTIONS.md`. That doc explicitly
defers "Layer 2" (actual quiz questions) to a later, human-directed pass. This spec is that pass:
turning the ruling bank into real quiz content inside the `qasas-practice` app, and giving Fiqh
its own section in the app alongside the existing Qasas (Arabic grammar) subject.

`qasas-practice` is a Vite + React 19 SPA with Firebase (Auth + Firestore for accounts/leaderboard
only — question content itself is static JS, not in Firestore). Today it has no generic "subject"
concept: everything is hardcoded around Qasas's four grammar-specific modes (i'rab, noun features,
roles, vocab), each threaded through ~6 files (`bank.js`, `HomeScreen.jsx`, `QuizPicker.jsx`,
`TimedQuiz.jsx`, `AdminPage.jsx`, `Leaderboard.jsx`/`LeaderboardPreview.jsx`) with duplicated label
maps. A `bankSource: 'qasas' | 'quran'` enum already exists in `firestore.rules` as an unused seam
for future subjects.

## Scope for this pass

Pilot with **one topic**: Wudhu (`WUD`, 97 rulings, FQH-WUD-01…97, spanning decks Fiqh-03 through
Fiqh-07). Once reviewed, the same schema/engine scales to the other 14 topics (INT, NJS, WTR, SJD,
GHS, TYM, KHF, JBR, SLH, ADH, VEH, TRV, MRD, MSB) without further design work.

Out of scope for this pass: authoring questions for topics beyond Wudhu; any change to the
vault ingest process itself; any change to a deck's `status:` frontmatter (that stays the human
reviewer's call, per the vault's own rules — this pass will populate the MOC's "Question coverage"
table but never flip `status`).

## 1. Content schema

New folder `qasas-practice/src/data/fiqh/`, one file per topic (mirrors the vault's per-topic
structure; keeps files small — the existing single `bank.js` is already 445 lines for just 4
flat arrays, and 15 topics' worth of Fiqh questions in one file would be far larger).

```
src/data/fiqh/
├── index.js        # aggregates all topic files; exports the topic registry consumed by subjects.js
└── wudhu.js         # pilot content: FQH-WUD-* questions
```

Question shape:

```js
{
  id: "FQH-WUD-Q01",             // question ID, distinct from the ruling ID
  sourceIds: ["FQH-WUD-01"],      // ruling ID(s) this question tests — traces back to the vault;
                                   // grouping questions ("which of these is NOT...") list multiple IDs
  topic: "WUD",
  type: "mcq",                    // "mcq" | "tf"
  prompt: "What is Farḍ 1 of wuḍūʾ?",
  options: [ "...", "...", "...", "..." ],  // mcq only
  answerIndex: 0,                            // mcq only
  answer: true,                    // tf only, in place of options/answerIndex
  madhhab: "Hanafi",               // optional — only present when the underlying ruling is
                                     // tagged [madhhab-specific] in the vault
  explanation: "...",              // shown after the learner answers, right or wrong
}
```

Ratio: mostly 1 question per ruling, plus a handful of grouping questions for repetitive runs
(the 17 sunnahs of wuḍūʾ, the makrūh/adab lists, etc.) that reference multiple `sourceIds`.

### Quality guardrail: madhhab-specific rulings

Several Wudhu rulings are `[madhhab-specific]` (e.g. FQH-WUD-13 wājib-not-farḍ for Ṭawāf,
FQH-WUD-21 the Islam condition, FQH-WUD-96/97 on touching a woman/private part). MCQ distractors
will never present a position that is genuinely correct in another accepted madhhab as flatly
"wrong," unless the question is explicitly scoped to Ḥanafī fiqh via the `madhhab` field and a
visible badge in the UI. Distractors are otherwise drawn from sibling rulings within the same
topic — plausible-but-wrong, not absurd or unrelated.

## 2. App architecture

New shared config module `qasas-practice/src/config/subjects.js` — the "light refactor" seam
both Qasas and Fiqh read from, replacing the copy-pasted label maps for anything added going
forward (Hadith/Tafsir/Nahw/Sarf later will follow the same seam without new duplication):

```js
export const SUBJECTS = {
  qasas: { label: "Qasas", modes: [ /* existing 4 modes, migrated in-place: label, timer, path */ ] },
  fiqh:  { label: "Fiqh",  topics: [ { code: "WUD", label: "Wudhu", count: 97 } ] },
};
```

Qasas's four existing modes and their components are **not rewritten** — `subjects.js` wraps
their existing config, it doesn't replace `bank.js` or the mode components.

### Navigation

`HomeScreen` gains a subject picker above the existing mode picker. Picking Qasas behaves exactly
as it does today. Picking Fiqh shows a topic list (currently just "Wudhu"); picking "all topics"
(trivial once topic filtering exists, meaningful once more topics are added) gives the pooled
"mixed review" option you asked for.

### Modes: timed and untimed

Fiqh gets both, matching Qasas:
- **Timed**: reuses the existing `TimedQuiz` engine, with a new `renderQuestion` case for
  `type: "mcq" | "tf"`, pulling from `src/data/fiqh/index.js` instead of `bank.js`.
- **Untimed practice**: new `FiqhPracticeMode` component, self-paced with immediate feedback,
  matching the feel of Qasas's `IrabMode`/`NounMode`/`RoleMode`/`VocabMode`.

Both modes render questions through one shared presentational component, `FiqhQuestionCard`
(prompt, options/TF buttons, explanation-on-answer) — written once, used by both, rather than
duplicating MCQ/TF rendering logic in two places.

### Firestore / accounts

`bankSource` enum in `firestore.rules` extends to `["qasas", "quran", "fiqh"]`. `AdminPage`'s
`BankViewer` gets a Fiqh tab. `Leaderboard`/`LeaderboardPreview`'s hardcoded
`currentBankSource = 'qasas'` becomes subject-aware.

## 3. Traceability back to the vault

After the Wudhu question file is written, `content/Fiqh/_Fiqh-MOC.md`'s "Question coverage"
section (currently a placeholder) gets filled in with links from each ruling ID range to
`qasas-practice/src/data/fiqh/wudhu.js`. No deck's `status:` frontmatter is touched.

## 4. Testing / verification

Beyond any unit-level checks on the data file (schema shape, no duplicate question IDs, every
`sourceIds` entry resolves to a real FQH-WUD-* ID), this will be verified by actually running the
dev server and clicking through: subject picker → Fiqh → Wudhu → both timed and untimed modes,
several MCQ and TF questions, explanation display, and the admin BankViewer showing the new bank.

## Open items for the implementation plan

- Exact visual treatment of the `madhhab` badge (deferred to implementation/frontend-design pass).
- Whether "mixed review" needs its own nav entry now or can wait until a second topic exists to
  make pooling meaningful (functionally trivial either way once topic filtering exists).
