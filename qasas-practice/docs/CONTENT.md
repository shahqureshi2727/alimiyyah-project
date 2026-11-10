# Content

This app treats Islamic-studies content as reviewed source material. Code can change how content is loaded or displayed, but agents should not rewrite doctrinal text, Arabic strings, answer options, or explanations.

## Source And App Data

There are two layers:

- `../content/`: course notes, extracted markdown, raw text, PDFs, CSV/JSON source facts, and attachments.
- `src/data/`: app-ready JavaScript question banks imported by the React app.

The root-level `../scripts/` directory contains extraction tooling that reads source PDFs/notes and writes artifacts under `../content/`. Some tooling may also generate app data. Do not run or edit those scripts unless the task explicitly asks for content extraction work.

## Question Bank Shapes

Common expectations:

- `id`: stable question ID.
- `topic`: stable topic code used for routing and weakness tracking.
- `sourceIds`: source references back to extracted content where available.
- Prompt fields: subject-specific text such as `prompt`, `arabicText`, `word`, `verb`, or `target`.
- Answer fields: subject-specific correct answer data.
- Feedback fields: explanation/commentary when available.

Subject notes:

- Arabic grammar banks live in `src/data/arabic/`.
- Morphology lives in `src/data/morphology.js` and includes categories, scopes, and topic codes.
- Fiqh banks live in `src/data/fiqh/`, split by topic, then combined by `src/data/fiqh/index.js`.
- Hadith records live in `src/data/hadith/index.js` and are generated from extracted Hadith source facts.
- Tafsir verse records live in `src/data/tafsir/index.js`; Quranic Arabic uses canonical fields for Uthmani and Indo-Pak display.

Do not change Arabic normalization, whitespace, diacritics, or Unicode form to make tests easier. Those details are semantic.

## Validation

App-level validation scripts live under `qasas-practice/scripts/`.

```bash
npm run validate:fiqh
npm run validate:morphology
```

`validate:fiqh` checks duplicate IDs, `sourceIds`, topic coverage, prompt/explanation presence, and MCQ/true-false answer shape.

`validate:morphology` checks stable IDs, valid categories/scopes/topics, required fields, option uniqueness, and answer consistency.

Hadith and Tafsir also have Vitest coverage:

```bash
npm run test -- src/data/hadith/hadith.test.js src/data/tafsir/tafsir.test.js
```

## Extraction Pipeline

The current source-material pipeline is outside the app:

```text
PDFs/notes
  -> ../scripts/extract-*.py
  -> ../content/<Subject>/*.md
  -> ../content/<Subject>/_raw_text/*.txt
  -> ../content/<Subject>/*source*.csv
  -> ../content/<Subject>/*source*.json
  -> src/data/<subject>/ app bank modules
```

Known extraction scripts:

- `../scripts/extract-hadith-sources.py`
- `../scripts/extract-tafsir-sources.py`

These scripts depend on local source PDFs and tools such as `pdftotext`. They are not normal app build steps.

## Adding Or Updating Content

1. Update source material only when the task explicitly asks for content work.
2. Preserve reviewed wording exactly. If something looks wrong, report it instead of fixing it silently.
3. Keep stable IDs stable. Changing IDs can break historical `answerEvents` and weakness tracking.
4. Add or update validation coverage before editing large hand-maintained banks.
5. Run the subject validator and the full app checks:

```bash
npm run validate:fiqh
npm run validate:morphology
npm run lint
npm run test
npm run build
```

Only run validators that match the banks you touched, plus the required final checks.

