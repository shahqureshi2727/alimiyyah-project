# Ilm Arena Content Vault — Conventions

This Obsidian vault is the content brain for Ilm Arena. Open it directly in Obsidian by
pointing "Open folder as vault" at this `content/` folder.

## Two-layer model

- **Layer 1 — source-of-truth rulings** (this vault). Each slide deck is ingested into one
  markdown "deck" file: a set of atomic rulings/facts, each with a stable ID, a source tag,
  and an Obsidian block anchor. Deck status starts at `extracted`, moves to `reviewed` once a
  human checks flags, then to `seeded` once questions are generated and pushed live.
- **Layer 2 — quiz questions** (lives in the app, `qasas-practice/`). Generated later, by hand,
  from Layer 1 ruling IDs. Never generated automatically during ingest.

## Folder layout

```
content/
├── README.md                     ← this file
├── _templates/deck-template.md   ← template for new deck files
├── _attachments/                 ← raw source PDFs, named <Subject-NN>.pdf
├── Fiqh/  Hadith/  Tafsir/  Nahw/  Sarf/  Qasas/
│   ├── _<Subject>-MOC.md          ← per-subject index + coverage log
│   └── <Subject-NN> <Title>.md    ← one file per deck
```

## ID scheme

Format: `<SUBJ>-<TOPIC>-<NN>`

- `<SUBJ>` — fixed 3-letter subject code: `FQH` Fiqh · `HAD` Hadith · `TFS` Tafsir · `NHW` Nahw ·
  `SRF` Sarf · `QAS` Qasas.
- `<TOPIC>` — a short stable 3-4 letter code for the topic within the subject (e.g. `WUD` wudhu).
  Continues numbering from the highest existing `NN` for that topic if more slides on the same
  topic arrive later; never restarts at 01, never reused for a different meaning.
- `<NN>` — two-digit sequence number, unique within `<SUBJ>-<TOPIC>`, assigned in the order
  rulings are encountered across decks (not necessarily in thematic order).

IDs are never renumbered or reused, even if an earlier one is later judged miscategorized.

## Block-anchor convention

Every ruling bullet ends with `^<ID>` (exact match to the ID in the bold prefix) — this is what
makes Obsidian backlinks (`[[Deck#^ID]]`) work. Anchors are not added anywhere else.

## Flags

Anything uncertain (harakāt, ambiguous wording, a possible slide contradiction) is written as a
best-guess ruling plus a line under the deck's `## Flags` section, then rolled up into the
subject MOC's "Open flags" table. A deck's status does not move past `extracted` until a human
resolves its flags.
