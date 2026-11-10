# AGENTS.md

Instructions for AI coding agents working in this repository.

## What This Repo Is

This repository contains a study app for an Alimiyyah Islamic-studies program. A student picks a subject and drills questions.

Subjects:

- Arabic grammar: i'rab, noun features, sentence roles, vocabulary, and morphology.
- Fiqh.
- Hadith.
- Tafsir.

Modes:

- Practice: untimed, shuffled, immediate feedback.
- Quiz: timed, scored, written to Firestore, and shown on leaderboards.
- Today's Review: 15 timed questions chosen from weak topics, due topics, and general review.

The app also has a Strength Map, daily review logic, and an admin page.

## Repository Layout

All application code lives under `qasas-practice/`. Always `cd qasas-practice` before running npm commands.

```text
qasas-practice/          app code
content/                 source material and extracted content; do not touch unless asked
docs/superpowers/        historical design specs and plans; do not touch
graphify-out/            generated knowledge-graph cache; do not touch
scripts/                 root content-extraction scripts; do not touch unless asked
```

Important app paths:

```text
src/App.jsx
src/main.jsx
src/components/
src/contexts/
src/hooks/
src/lib/
src/config/subjects.js
src/data/
src/App.css
src/index.css
firestore.rules
firestore.indexes.json
vercel.json
```

## Stack And Style

- Vite 8, React 19, react-router-dom 7.
- Plain JavaScript with JSX. Do not introduce TypeScript files.
- Plain CSS with custom properties. Do not add Tailwind, CSS-in-JS, or a component library.
- Firebase 12 Auth and Firestore. No Cloud Functions.
- Vitest, ESLint 10 flat config, Playwright, and Firebase emulator tests.
- Deployed on Vercel as an SPA.

Prefer existing app patterns and helpers. In particular, use `src/config/subjects.js` as the mode/topic registry and `src/lib/app-routes.js` for route helpers.

## Required Commands

Run commands from `qasas-practice/`.

```bash
npm run lint
npm run test
npm run build
```

Do not declare work complete until all three have run and passed. If one cannot run, say exactly why.

Useful extra checks:

```bash
npm run validate:fiqh
npm run validate:morphology
npm run test:rules
npm run test:e2e
npm run check:bundle
```

## Arabic Text Rules

Arabic text is core content, not decoration.

- Diacritics are semantically meaningful.
- Never normalize, strip, trim, lowercase, or "clean" an Arabic string.
- Never Unicode-normalize Arabic strings.
- Do not apply CSS that can reorder glyphs or clip diacritics.
- Watch `line-height`, `overflow`, tight containers, and transforms.
- Two script modes exist through `data-arabic-script` on `:root`: `madina` and `indopak`.
- Indo-Pak/Nastaleeq rendering needs more vertical space than Uthmani/Amiri rendering.
- UI work touching Arabic display should be checked in light and dark themes, with both script modes.

## Doctrinal Content Rules

Everything in `qasas-practice/src/data/` is reviewed Islamic-studies material.

Do not edit, rewrite, correct, translate, expand, or generate question text, answer options, Arabic strings, or explanations unless the human explicitly asks for a content edit.

You may change data shape when needed, such as adding metadata fields or changing exports, but do not change the reviewed content itself. If something appears wrong, report it in the summary and leave it unchanged.

## Firestore Rules

Current collections:

```text
users/{uid}
users/{uid}/topicStats/{category_subtopic}
quizResults/{id}
answerEvents/{id}
weaknessProfiles/{uid}
```

`quizResults` and `answerEvents` are append-only. Do not add code that updates or deletes them.

Firebase config must come from `import.meta.env.VITE_*`. Never hardcode config, commit `.env` files, or log credentials.

## Hard Guardrails

Never do the following unless the human explicitly asks and the repo instructions allow it:

- Run `firebase deploy`, `vercel deploy`, or commands that mutate production Firebase/Auth/Firestore/hosting.
- Rewrite git history, force-push, or rebase shared branches.
- Modify `content/`, `docs/superpowers/`, `graphify-out/`, or root `scripts/` unless the prompt explicitly asks for that area.
- Delete or rewrite question data in `qasas-practice/src/data/`.
- Migrate to TypeScript, Tailwind, CSS-in-JS, or a component library.
- Commit secrets or `.env` files.

## Reporting

When finished, report:

1. Files changed, grouped by concern.
2. Behavior changes a user would notice.
3. New dependencies and why.
4. Things found but deliberately not fixed.
5. Anything that could not be verified and why.
