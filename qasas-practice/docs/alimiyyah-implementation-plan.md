# Alimiyyah / Qasas Practice — Implementation Plan

**Current stack:** React + Vite frontend, Firebase Auth, Firestore persistence, deployed on Vercel. The strength-map foundation uses `answerEvents`, `quizResults`, and per-user `topicStats` documents.

---

## Build Order (and why)

Don't build top-to-bottom as listed in the request — some items are foundations for others:

1. **Phase 0 — Bug fixes** (#3 answer bias, #4 dark mode/spacing): completed. Shared Fisher-Yates shuffle infrastructure is in place, Fiqh MCQ correctness is value-based after render-time shuffling, and dark-mode/spacing fixes are shipped.
2. **Phase 1 — Data model overhaul** (#5 strength map foundation): completed. Quiz submissions write `answerEvents` and aggregate into Firestore `users/{uid}/topicStats/{category}_{subtopic}` docs.
3. **Phase 2 — Hadith section** (#1): implemented. This is the simplest new content type and the first new category plugged into the Firestore topic-stats model.
4. **Phase 3 — Tafsir section** (#2): implemented. Mixed MCQs, surah selection, and verse-by-verse free-response scoring are wired into topic stats.
5. **Phase 4 — Daily review quiz** (#6): implemented. The review flow now uses all four question banks, weak-topic ranking, due spaced review, and broad cold-start mixing.

---

## Phase 0: Bug Fixes — Completed

### 3. Fix "first answer always correct" bias

**Status:** completed and re-audited for Phase 2. Production source contains no `array.sort(() => Math.random() - 0.5)` shuffle path and no production `options[0]` correctness check. Timed quiz selection and morphology option shuffling use shared Fisher-Yates `shuffleArray`; Fiqh and Hadith MCQ cards shuffle render options with `useShuffledOptions` and check correctness by option value.

**Root cause pattern:** questions are almost certainly stored with the correct answer hardcoded at index 0 of the options array, and the UI renders options in stored order.

**Fix:**
- Never store a fixed "correct index." Store the correct answer as a **value/ID**, not a position.
- At render time (not at data-authoring time), shuffle the options array and then look up where the correct value landed.
- Use `useMemo(() => shuffle(options), [questionId])` so the shuffle happens once per question instance and doesn't re-shuffle on every re-render (which would look buggy — options jumping around as the user interacts).
- Use a proper Fisher-Yates shuffle, not `Array.sort(() => Math.random() - 0.5)` (the latter is a well-known biased-shuffle bug and would just reintroduce a subtler version of this exact problem).

```js
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

- **Audit checklist:** grep the codebase for anywhere `options[0]` or `correctIndex: 0` is used as an assumption — this bug is often copy-pasted across multiple quiz components (multiple choice, hadith matching once you add it, etc.), so fix the shared component/hook, not just one instance.
- Add a quick regression check: log correct-answer position distribution over ~50 renders in dev to confirm it's roughly uniform before shipping.

### 4. UI bugs

**Dark mode text contrast:**
- The likely cause is hardcoded text colors (e.g. `text-gray-900`) without a paired `dark:` variant, so in dark mode the background flips but the text doesn't.
- Best practice: don't hunt these one-by-one forever — do a systematic audit:
  ```bash
  grep -rn "text-gray-900\|text-black\|text-slate-900" src/ --include="*.jsx"
  ```
  For every hit, either add the matching `dark:text-*` class or (better long-term) move to semantic CSS variables (`--text-primary`, `--text-secondary`) defined once in your Tailwind config / global CSS for light and dark, so components use `text-[var(--text-primary)]` and never need a `dark:` variant per component again.
- If you're on Tailwind's `darkMode: 'class'` strategy, double check the toggle actually sets the class on `<html>`, not just some inner wrapper — a common cause of "some text respects dark mode, some doesn't" is that only part of the tree is inside the class boundary.

**Button spacing (timed quizzes / strength map):**
- Increase spacing using `gap-*` utilities on the flex/grid container rather than per-button margins — margins are what usually causes inconsistent spacing when buttons wrap or resize.
- Enforce a minimum touch target: `min-h-11 min-w-11` (44px) is the standard accessible minimum, important since this is likely used on mobile too.
- Quick fix pattern: wrap the button group in `<div className="flex gap-3 flex-wrap">` instead of individually margined buttons.

---

## Phase 1: Strength Map Overhaul (foundation for everything else) — Completed

### 5. Restructure strength tracking

**Firestore data model:**
- `quizResults/{id}` stores completed timed quiz summaries for leaderboard views.
- `answerEvents/{id}` stores each answered question with `userId`, `mode`, `bankSource`, `topic`, `group`, `questionId`, `correct`, and `answeredAt`.
- `users/{uid}/topicStats/{category}_{subtopic}` stores aggregate strength data: `category`, `subtopic`, `attempts`, `correct`, `lastAttempted`, and `ewmaScore`.

**Why EWMA (exponentially weighted moving average) instead of raw accuracy %:**
Raw lifetime accuracy is exactly the "too much info, not actionable" problem you're describing — a topic mastered months ago but not reviewed since still shows high scores. EWMA gives recent performance more weight, so the strength map reflects *current* standing, not history.

```js
// on each answer:
const alpha = 0.3; // tune: higher = more weight to recent attempts
newScore = alpha * (correct ? 1 : 0) + (1 - alpha) * oldScore;
```

**UI structure (two-level drill-down):**
- **Top level:** 4 cards — Fiqh / Hadith / Arabic / Tafsir — each showing one aggregate score (average EWMA across that category's subtopics) and a simple color band (red < 50%, yellow 50–75%, green > 75%).
- **Drill-down:** tapping a card expands (or navigates) to a per-subtopic breakdown within that category, same color-band treatment, sorted weakest-first so the user immediately sees what to work on.
- This keeps the default view to 4 numbers instead of a wall of stats, while the detail is still there for anyone who wants it.

**Quiz integration:** timed quizzes write `quizResults`, then batch-write `answerEvents`, then update `topicStats`. Self-paced modes write answer events immediately through `useWeaknessTracking`. This is the hook point that Phases 2–4 rely on.

---

## Phase 2: Hadith Section — Implemented

### 1. Arabic hadith → pick English translation

**Data model:** Hadith questions live in `src/data/hadith/` as app-bundled source data derived from `content/Hadith/hadith-source-facts.csv`. Each question carries `id`, `sourceIds`, `topic`, `collection`, `hadithNumber`, `arabicText`, `correctTranslation`, `options`, and `answerIndex`.

**Question generation (best practice):**
- Don't hand-write distractor sets per question if you can avoid it — pull 3 plausible-but-wrong translations from *other* hadiths in the same batch/collection as distractors. This is both less authoring work and produces harder, more meaningful distractors (translations that are topically similar but wrong) rather than obviously-unrelated wrong answers.
- Apply the same shuffle fix from Phase 0 here — this is a fresh feature, so build it correctly from day one rather than needing to patch it later.
- Arabic text rendering: make sure the hadith text field uses `dir="rtl"` and a proper Arabic-supporting font (e.g., Amiri, Scheherazade, or whatever you're already using elsewhere in the app for consistency).

**Workflow for adding content:** source PDFs are extracted into markdown, CSV, JSON, and raw text under `content/Hadith/`. The app bank can be regenerated from the CSV; longer term, this can become a Firebase import/admin workflow if the content starts changing often.

**Implemented surface:**
- `src/data/hadith/` contains 37 Arabic-to-English translation MCQs generated from the extracted Hadith source CSV.
- Hadith topic metadata is registered in `subjects.js` as `ARB40`.
- Self-paced Hadith practice and timed Hadith quizzes render via a Hadith-specific card.
- Distractors are generated from other Hadith translations in the bank and shuffled at render time.
- Hadith answer events flow through `submitAnswerEvents` and aggregate into Firestore `topicStats` with category `hadith`.
- Admin bank viewer and Strength Map now include Hadith visibility.

---

## Phase 3: Tafsir Section — Implemented

This was the most involved piece — two sub-features are now in place.

### 2a. Multiple choice — mixed-up verses

Same pattern as Hadith (Phase 2): verse text as prompt, correct translation, distractors pulled from other verses (ideally same surah, so distractors are contextually plausible, not just random). In the current Firebase/app-bundled pattern, source records should live in `src/data/tafsir/` first; if they need live editing later, move them into Firestore collection documents.

### 2b. Surah-by-surah, verse-by-verse free-response with fuzzy matching

This is the genuinely hard part — free-text translation scoring. Here's a solid, buildable approach:

**Data model:** start with app-bundled `src/data/tafsir/` records shaped as `{ id, surah, ayah, arabicText, referenceTranslation, acceptableVariants, topic }`. If we later need teacher-editable content, mirror that shape in a Firestore `tafsirVerses` collection and keep quiz submissions writing the existing `answerEvents` and `topicStats` documents.

**Scoring algorithm — word-level diff, not just a similarity score:**

The requirement ("mark which words are off") means you need alignment, not just a distance number. Best-practice approach:

1. **Normalize** both the user's answer and the reference translation: lowercase, strip punctuation, collapse whitespace.
2. **Tokenize** into words.
3. **Run a sequence alignment / diff algorithm** (Myers diff, or the standard Longest Common Subsequence approach) between the two token arrays — this is the same class of algorithm behind `git diff` and Python's `difflib.SequenceMatcher`. It gives you, per word: match / substitution / insertion / deletion, not just an overall score.
4. **Tolerance layer on top of raw diff:** exact word match is too strict for translation (e.g. "the" vs "a", synonyms, word order in a phrase). Two practical options, can combine:
   - **Synonym/variant lists** per verse (the `acceptable_variants` column above) — small extra authoring cost but most accurate.
   - **Fuzzy word matching** using Levenshtein distance per word pair (catches typos/minor spelling) plus a small stopword-tolerant pass (ignore mismatches on "a/the/of" type words) — cheaper to build, less precise than manual variants.
5. **Score = matched-words / reference-words**, displayed as a percentage, with the diff rendered inline: correct words in default color, substituted/wrong words highlighted (e.g. red strikethrough + the correct word shown), missing words shown as insertions.

**Practical implementation note:** you don't need to write the diff algorithm from scratch — `diff-match-patch` (Google's library, has a JS port) or a word-level wrapper around `fast-diff` will do the alignment; you're mainly writing the normalization + tolerance layer and the UI to render it clearly (think Duolingo's "almost!" feedback screens as a UX reference).

**Surah view flow:**
- User picks a surah → sees ayah list (progress indicator per ayah: not attempted / correct / close / wrong, feeding the same visual language as the strength map).
- Per-ayah: Arabic text shown, free-text input, submit → diff feedback shown inline, result written through `submitAnswerEvents` so `topicStats/{tafsir}_{surah_name}` updates like the other categories.

---

## Phase 4: Daily Review Quiz — Implemented

### 6. Adaptive daily review (5–10 min)

This is the payoff feature for the data model built in Phase 1. It now runs as "Today's Review" using the Arabic, Fiqh, Hadith, and Tafsir question banks.

**Session composition (15 questions for a 5–10 min session):**
- **~40% weak-topic questions** — pulled from Firestore `topicStats` docs with the lowest EWMA scores across all 4 categories (so weak fiqh topics compete fairly with weak arabic topics, not siloed).
- **~30% spaced-repetition due items** — see below.
- **~30% general mix** — random across categories, weighted by category size, to keep broad coverage and avoid the review feeling repetitive.

**Spaced repetition layer (lightweight SM-2 style, not full SM-2 complexity):** add `nextDueAt` and `reviewIntervalDays` fields to each `users/{uid}/topicStats/{category}_{subtopic}` document.
- On correct answer: `nextDueAt = now + reviewIntervalDays`, and increase `reviewIntervalDays` (e.g. multiply by ~1.8, capped at some max like 30 days).
- On incorrect answer: reset `reviewIntervalDays = 1`, `nextDueAt = tomorrow`.
- This is applied at the *subtopic* level (not per-question) to keep it simple — you're spacing out review of topics, not individual questions, which is enough granularity for a "cover weak points as days go on" goal without building a full flashcard-grade SRS.

**Cold start (first few days, no data yet):** when `attempts = 0` for most subtopics, the "weak topic" logic has nothing to rank — fall back to a broad, evenly-sampled mix across all categories until enough attempts accumulate (e.g. after ~3-5 sessions) for the weighting to become meaningful. This is what naturally produces the "maps out strengths/weaknesses after a few days" behavior you described — it's not a separate mechanism, it's just the natural result of Firestore `topicStats` filling in.

**Selection query shape (pseudocode):**
```js
const topicStats = await getUserTopicStats(userId);
const missedQuestionIds = await getMissedQuestionIds(userId);
const questions = [
  ...pickQuestionsFromLowestEwmaTopics(topicStats, count: 6),
  ...pickQuestionsFromDueTopics(topicStats, count: 5),
  ...pickBroadCategoryMix(count: 4),
];
```

---

## Summary Checklist

| Phase | Item | Depends on |
|---|---|---|
| 0 | Fix shuffle bug (#3) | Completed |
| 0 | Fix dark mode + spacing (#4) | Completed |
| 1 | Strength map data model + UI overhaul (#5) | Completed |
| 2 | Hadith section (#1) | Implemented |
| 3 | Tafsir MCQ + verse-by-verse fuzzy matching (#2) | Implemented |
| 4 | Daily review quiz (#6) | Implemented |
