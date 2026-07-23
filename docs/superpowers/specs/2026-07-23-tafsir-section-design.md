# Tafsir Section Design

## Goal

Add Tafsir as a first-class subject in the app using the extracted short-surah content. Students should be able to practice two kinds of recall:

- Mixed multiple-choice review: see an Arabic ayah and pick the correct English translation.
- Verse-by-verse free response: select a surah, type each ayah's translation, and get useful word-level feedback.

The first content set covers Surah Al-Asr, Al-Fil, Quraysh, Al-Ma'un, Al-Kawthar, and Al-Kafirun.

## User-Facing Structure

Tafsir appears on the home screen beside Arabic, Fiqh, and Hadith.

Clicking Tafsir opens a focused Tafsir subject screen with:

- Mixed Review
- Surah Selection

Mixed Review starts the normal self-paced MCQ translation mode using all Tafsir ayat.

Surah Selection is a dropdown. The student selects one surah, then starts a verse-by-verse free-response session for that surah.

Timed quizzes include Tafsir mixed MCQs. Timed free response is out of scope because typing translation under a timer is awkward on mobile and produces noisy scoring data.

## Question Formats

### Multiple Choice

Each MCQ shows:

1. Surah and ayah reference.
2. Arabic ayah text.
3. Four English translation choices.

The correct translation is stored as a value, not inferred from rendered position. Choices are shuffled at render time using the shared shuffle hook.

### Verse By Verse

Each verse prompt shows:

1. Surah name and ayah progress.
2. Arabic ayah text.
3. A multiline input for the student's translation.
4. Submit feedback with score, missing words, and extra words.

After feedback, the student can continue to the next ayah. At the end of the surah, the screen shows a session summary and lets the student review the same surah again or go back.

## Scoring

Free-response scoring uses deterministic word-level comparison:

1. Normalize reference and student answers by lowercasing, removing punctuation, replacing contractions with plain forms, and collapsing whitespace.
2. Tokenize into words.
3. Compare words using a lightweight alignment:
   - exact token matches count as correct
   - close spelling matches count as correct when edit distance is small
   - common stopwords carry lower weight
   - missing content words are highlighted
   - extra student words are listed separately
4. Compute score from weighted matched reference tokens divided by weighted reference tokens.

Initial correctness thresholds:

- Correct: score >= 0.8
- Close: score >= 0.6
- Needs review: score < 0.6

The `acceptableVariants` field already exists on records and can support teacher-reviewed synonyms later. The first pass keeps the algorithm conservative and deterministic.

## Data Model

Tafsir records live in `src/data/tafsir/` and are generated from `content/Tafsir/tafsir-source-verses.json`.

Verse record shape:

```js
{
  id: 'TFS-FIL-001',
  sourceIds: ['TFS-FIL-01'],
  topic: 'FIL',
  surahNumber: 105,
  surahName: 'Al-Fil',
  ayah: 1,
  arabicText: '...',
  arabicTextUthmani: '...',
  arabicTextIndopak: '...',
  referenceTranslation: 'Have you not seen...',
  acceptableVariants: [],
  commentary: ['...'],
}
```

MCQ questions are generated from the same records with:

```js
{
  id: 'TFS-FIL-001-MCQ',
  type: 'mcq',
  topic: 'FIL',
  arabicText: '...',
  correctTranslation: '...',
  options: ['...', '...', '...', '...'],
  answerIndex: 0,
}
```

The stored `answerIndex: 0` is an authoring convention only. UI correctness is value-based after render-time shuffling.

## Components And Flow

Home screen:

- Add Tafsir subject doorway.
- Tafsir doorway opens the subject screen, not a separate route.

Tafsir subject screen:

- Mixed Review card starts MCQ practice for all records.
- Surah Selection dropdown lists the available surahs.
- Starting the selected surah opens verse-by-verse practice.

Practice mode:

- Add `TafsirPracticeMode`.
- It supports `variant="mcq"` for mixed MCQ review and `variant="verse"` for free response.
- MCQs can use a Tafsir-specific card modeled after Hadith.
- Verse mode uses a dedicated free-response card and summary view.

Timed quiz:

- Add `tafsir` to quiz metadata.
- Add Tafsir mixed MCQs to timed quiz picker and review bank.
- Timed quiz target display uses the Arabic ayah.

Strength map and admin:

- Add Tafsir topics to Strength Map.
- Add Tafsir bank visibility to Admin bank viewer.
- Topic stats use category `tafsir` and subtopic equal to the surah code.

## Visual Direction

Use the existing operational app language: compact, readable, and calm. The distinctive Tafsir touch is a "mushaf margin" treatment around the Arabic ayah: a quiet ruled line and centered RTL text, without decorative clutter.

The dropdown should feel like a study control, not a marketing card. Text must fit on mobile, Arabic must use the app's Arabic font stack, and feedback should be scannable without overwhelming the learner.

## Testing

Data tests:

- Tafsir records expose all extracted ayat.
- Every record has valid topic metadata.
- Arabic fields do not contain PDF extraction artifacts.
- MCQ questions have four unique options and value-based correct answers.

Scoring tests:

- Exact answer scores as correct.
- Punctuation and case do not affect scoring.
- Small typos can still pass.
- Missing content words lower the score and are reported.
- Extra words are reported.

Integration tests:

- Question result metadata maps Tafsir topics to group/topic stats correctly.
- Tafsir topic metadata is visible to Strength Map and Admin flows.

Manual app checks:

- Home screen shows Tafsir.
- Tafsir screen starts mixed MCQ review.
- Tafsir screen has a surah dropdown and opens verse-by-verse mode.
- Verse mode accepts typed answers, shows feedback, advances through ayat, and shows a summary.
- Timed quiz picker includes Tafsir mixed review.
- Timed Tafsir quiz completes and saves answer events.

## Out Of Scope

- Teacher editing for Tafsir records.
- Firestore-backed Tafsir bank loading.
- AI-based semantic translation grading.
- Timed free-response translation.
- Audio recitation or memorization mode.
