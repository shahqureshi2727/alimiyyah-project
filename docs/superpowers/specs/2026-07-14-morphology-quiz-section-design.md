# Morphology Quiz Section Design

## Goal

Add a Morphology section to the existing Arabic/Qasas side of the app. Students should be able to practice verb-form recognition by seeing a conjugated Arabic verb plus the base verb meaning, then choosing the correct textbook-style English meaning from multiple-choice answers.

The content is based on *Das Sabaq / The Ten Lessons*, especially:

- Lesson 3: past tense active and passive forms
- Lesson 7: present/future active and passive forms
- Lesson 9: imperative and prohibitive command forms

The bank may also use common additional triliteral base verbs beyond the PDF examples, as long as they follow the same patterns.

## User-Facing Structure

Morphology appears as a new Arabic practice card alongside I'rab, Noun Features, Grammatical Role, and Vocabulary.

Clicking Morphology opens a Morphology picker with four choices:

- Mixed Review
- Past Tense / مَاضِي
- Present & Future / مُضَارِع
- Imperative & Prohibitive / أَمْر وَنَهْي

Timed quizzes expose only one Morphology option:

- Morphology: Mixed Review

Focused subcategory practice is for study. Timed Morphology should stay mixed so leaderboard results remain comparable between students.

## Question Format

Each question shows:

1. The conjugated Arabic verb.
2. The base verb and base English meaning.
3. Four multiple-choice English meanings.

Example:

```text
نَصَرْتُمْ
نَصَرَ = to help
```

Options:

- you (plural masculine) helped
- they (plural masculine) helped
- you (dual masculine) helped
- we helped

All options for a question must use the same base meaning. The question tests whether the student recognizes the seeghah/form, not whether they can infer the root meaning.

English answer text should use textbook-style wording, such as:

- he helped
- they (dual masculine) helped
- you (plural feminine) were helped
- she is writing or will write
- they (plural masculine) are being opened or will be opened
- do not go (singular masculine)

## Categories

The visible practice buckets are broad, but each item keeps a fine-grained category key for future weakness tracking:

- `pastActive`
- `pastPassive`
- `mudariActive`
- `mudariPassive`
- `mudariNegative`
- `imperative`
- `prohibitive`

Each question stores a broad Morphology scope used for filtering practice:

- `mixed`
- `past`
- `mudari`
- `amrNahi`

Today `scope` drives practice filtering only. Timed Morphology always uses `mixed` and stores a normal Morphology quiz result. In a later pass, the question-level `category` and `scope` fields can support weakness analytics without reworking old content.

## Negative Mudari

The Present & Future bucket may include negative present/future forms such as:

```text
لَا يَتَكَلَّمُ
تَكَلَّمَ = to speak
```

Answer:

```text
he does not / cannot speak
```

These are not the Lesson 9 command-style prohibitives. They belong in the `mudariNegative` key and the Present & Future practice bucket.

Lesson 9 prohibitives remain command-style:

```text
لَا تَذْهَبْ
ذَهَبَ = to go
```

Answer:

```text
do not go (singular masculine)
```

## Feedback

After answering, feedback should identify:

- the correct English meaning
- the broad category
- the subject/form in Arabic and English

Example:

```text
Correct: you (plural masculine) helped.
Past active - حَاضِر مُذَكَّر جَمْع - second person masculine plural.
```

Arabic subject/form labels should mirror the style of the existing Arabic topics by keeping Arabic text prominent and readable.

## Data Model

Morphology questions can live in the existing static bank layer, either in `src/data/bank.js` or a new nearby module imported by it if the file becomes too large.

Suggested item shape:

```js
{
  id: 'MOR-PST-ACT-001',
  category: 'pastActive',
  scope: 'past',
  verb: 'نَصَرْتُمْ',
  baseVerb: 'نَصَرَ',
  baseMeaning: 'to help',
  answer: 'you (plural masculine) helped',
  options: [
    'you (plural masculine) helped',
    'they (plural masculine) helped',
    'you (dual masculine) helped',
    'we helped',
  ],
  arabicLabel: 'حَاضِر مُذَكَّر جَمْع',
  englishLabel: 'second person masculine plural',
  explanation: 'Past active - حَاضِر مُذَكَّر جَمْع - second person masculine plural.',
}
```

The first pass should target about 120-180 items spread across the fine-grained categories. Mixed Review draws from the full bank. Focused practice filters by scope.

## Components And Flow

Practice mode:

- Add Morphology to the home Practice card list.
- Selecting Morphology opens a Morphology picker.
- Selecting a scope starts an untimed practice session using that filtered bank.
- The interaction should match the existing Arabic practice modes: question, choices, immediate feedback, Next button.

Timed mode:

- Add one Morphology: Mixed Review entry to the timed quiz picker.
- Reuse the existing timed quiz shell, timer, inline choice feedback, results screen, saving, and leaderboard flow.
- Do not add timed subcategory entries.

Leaderboard:

- Morphology appears as a normal quiz mode on leaderboards.
- Since timed Morphology is mixed only, its scores are comparable across students.
- Future weakness tracking can use item `category` and `scope` keys, but this feature is out of scope for this pass.

## Testing

Data checks:

- No duplicate Morphology question IDs.
- Every item has a valid fine-grained `category`.
- Every item has a valid broad `scope`.
- Each question has exactly four options.
- Each answer is present in its options.
- Each option uses the same base meaning as the question.

Manual app checks:

- Home screen shows Morphology in the Arabic practice section.
- Morphology picker opens and filters Mixed, Past, Mudari, and Amr/Nahi correctly.
- Untimed practice shows Arabic verb, base verb, base meaning, choices, feedback, and Next.
- Timed quiz picker shows only Morphology: Mixed Review, not focused Morphology categories.
- Timed Morphology can complete a 10-question quiz and save a result.
- Leaderboard and recent results display Morphology labels correctly.

## Out Of Scope

- Automatic weakness analytics.
- Per-student recommendations.
- Teacher dashboards for Morphology category performance.
- Free-text answer grading.
