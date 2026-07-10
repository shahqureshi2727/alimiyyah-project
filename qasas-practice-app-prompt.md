# Build Prompt: "Qasas Practice" — an Arabic grammar & vocab drilling webapp

Build a mobile-first React.js single-page web application for students in a part-time
Alimiyyah class. The students are learning to read and understand Arabic. They have
completed basic *sarf* and are beginning basic *nahwu*. The app is for **quick practice**
of grammar concepts and vocabulary drawn from the first six chapters of *Qasas
un-Nabiyeen* (Book 1) — the story of Ibrahim (AS) and the idols.

The single most important quality bar: **this is a teaching tool, so every answer in the
question bank must be correct.** Do not invent grammatical analysis. Use only the
hand-authored bank provided in this prompt.

---

## 1. Tech & structure

- **React.js** (functional components + hooks). Use Vite to scaffold.
- **No backend, no API calls, no database, no accounts.** Everything runs client-side.
- The entire question bank lives in a single `src/data/bank.js` file as plain JS objects
  (structure defined below) so a non-programmer teacher can read and extend it.
- **No browser localStorage/sessionStorage** — keep all state in React state. Score is
  per-session only and resets on reload. (This is intentional; do not add persistence.)
- State is otherwise stateless across sessions: the student picks a mode, drills, sees a
  running session score, and that's it.

## 2. Arabic typography — READ THIS CAREFULLY

Arabic rendering is the thing most likely to look broken if done carelessly. Requirements:

- Load a proper Arabic webfont. Use **"Amiri"** (a Naskh font designed for classical/Quranic
  Arabic) for the Arabic text — import from Google Fonts. Use a clean Latin font for the
  English UI chrome (your choice, but NOT Inter/Roboto/Arial — pick something with character).
- Arabic text must be `dir="rtl"` and sized large enough to read harakat (vowel marks)
  comfortably on a phone — minimum 28px for sentence text, larger for single highlighted words.
- Preserve the harakat (tashkeel) exactly as given in the bank. Do not strip them.
- Line-height generous enough that vowel marks above and dots below don't collide.
- **No transliteration anywhere.** Arabic script only. (This is a deliberate pedagogical choice.)

## 3. The four practice modes

A home screen lets the student tap into any of four modes. Each mode pulls from the pooled
bank (NOT filtered by chapter — older material should keep resurfacing). Within a mode,
questions are served in random order. After answering, show immediate feedback (correct/
incorrect) and, where noted, a short explanation. A "Next" tap advances. Show a running
score ("7 / 10") for the session.

### Mode 1 — I'rab Identification (the core drill, list first)
- Show a full Arabic sentence with ONE word visually highlighted (e.g. colored / underlined).
- Ask: what is the i'rab (case) of the highlighted word?
- Three tappable choices: **رَفْع (raf')**, **نَصْب (nasb)**, **جَرّ (jarr)**.
- On answer: reveal correct/incorrect, then show the **reason** in English
  (e.g. "Object of the verb (maf'ul bihi)", "Mudaf ilayh", "Ism of kaana").

### Mode 2 — Noun Feature Tagging
- Show a single Arabic noun.
- Student tags it across THREE characteristics, each a small tappable group:
  - Definiteness: **definite (ma'rifa)** / **indefinite (nakirah)**
  - Gender: **masculine (mudhakkar)** / **feminine (muannath)**
  - Number: **singular** / **dual** / **plural**
- All three must be set, then "Check". Mark each characteristic right/wrong individually.

### Mode 3 — Identify the Grammatical Role
- Show a full Arabic sentence.
- Pose a question like "Tap the **mubtada**" / "Tap the **fa'il**" / "Tap the **mudaf**" /
  "Tap the **khabar**".
- Each word in the sentence is individually tappable. Student taps the word they believe
  fills that role. Mark right/wrong; highlight the correct word on a wrong answer.

### Mode 4 — Vocabulary Recall (flashcards)
- Flip-card. Front: Arabic word. Tap to flip → English meaning on the back.
- Student self-grades with two buttons: **"Knew it"** / **"Didn't know"**.
- Tally feeds the session score.

## 4. Design direction

Simple, fast, calm, and respectful of the subject matter. Quick-practice focused — a student
should be drilling within two taps of opening the app. Mobile-first (phones at the mosque),
but should look fine on a laptop too.

- Commit to a refined, restrained aesthetic — think a clean Islamic-manuscript-inspired
  palette (warm parchment/cream, deep ink, a single jewel-tone accent like teal or
  burgundy). Avoid generic AI look: no purple-on-white gradients, no Inter.
- Large tap targets, generous spacing, clear immediate feedback (color + a small
  checkmark/cross). A subtle, satisfying micro-animation on correct answers is welcome;
  keep it tasteful.
- Home screen: app title in Arabic + English, four large mode cards, nothing else.
- Accessible color contrast.

## 5. Question bank — USE THIS DATA VERBATIM

Put this in `src/data/bank.js`. Every item below is drawn from chapters 1–6 of the text
and is grammatically vetted. **Do not alter the Arabic or the answers.** You MAY add more
items later in the same shape, but ship with at least everything here.

```js
// src/data/bank.js

// MODE 1: I'rab identification.
// `sentence` is the full Arabic sentence (keep harakat).
// `target` is the exact highlighted word string as it appears in `sentence`.
// `answer` is one of: "raf", "nasb", "jarr".
// `reason` is a short English explanation shown after answering.
export const irab = [
  {
    sentence: "كَانَ فِي قَرْيَةٍ رَجُلٌ مَشْهُورٌ جِدًّا.",
    target: "رَجُلٌ",
    answer: "raf",
    reason: "Ism (subject) of kaana — comes after the khabar here. Raf'.",
  },
  {
    sentence: "كَانَ فِي قَرْيَةٍ رَجُلٌ مَشْهُورٌ جِدًّا.",
    target: "قَرْيَةٍ",
    answer: "jarr",
    reason: "Object of the preposition fee — takes jarr, which overrides its role as part of the khabar.",
  },
  {
    sentence: "وَكَانَ اسْمُ هٰذَا الرَّجُلِ آزَرَ.",
    target: "اسْمُ",
    answer: "raf",
    reason: "Ism of kaana (the subject). Raf'.",
  },
  {
    sentence: "وَكَانَ اسْمُ هٰذَا الرَّجُلِ آزَرَ.",
    target: "الرَّجُلِ",
    answer: "jarr",
    reason: "Mudaf ilayh of 'ismu hadha' — jarr.",
  },
  {
    sentence: "وَكَانَ النَّاسُ يَسْجُدُونَ لِهٰذِهِ الأَصْنَامِ.",
    target: "النَّاسُ",
    answer: "raf",
    reason: "Ism of kaana (the subject). Raf'.",
  },
  {
    sentence: "وَكَانَ إِبْرَاهِيمُ يَعْرِفُ أَنَّ الأَصْنَامَ حِجَارَةٌ.",
    target: "الأَصْنَامَ",
    answer: "nasb",
    reason: "Ism of anna (a sister of inna) — anna's ism takes nasb.",
  },
  {
    sentence: "وَكَانَ إِبْرَاهِيمُ يَعْرِفُ أَنَّ الأَصْنَامَ حِجَارَةٌ.",
    target: "حِجَارَةٌ",
    answer: "raf",
    reason: "Khabar of anna — raf'.",
  },
  {
    sentence: "إِنَّ هٰذِهِ الأَصْنَامَ لَا تَتَكَلَّمُ وَلَا تَسْمَعُ.",
    target: "الأَصْنَامَ",
    answer: "nasb",
    reason: "Ism of inna — takes nasb.",
  },
  {
    sentence: "إِنَّ هٰذِهِ الأَصْنَامَ لَا تَتَكَلَّمُ وَلَا تَسْمَعُ.",
    target: "تَتَكَلَّمُ",
    answer: "raf",
    reason: "Mudari' verb with no nasb- or jazm-giver present, so raf' by default (dhammah).",
  },
  {
    sentence: "قَالَ إِبْرَاهِيمُ: أَنَا أَكْسِرُ الأَصْنَامَ.",
    target: "الأَصْنَامَ",
    answer: "nasb",
    reason: "Maf'ul bihi (object) of the verb aksiru. Nasb.",
  },
  {
    sentence: "وَضَرَبَ إِبْرَاهِيمُ الأَصْنَامَ بِالفَأْسِ.",
    target: "إِبْرَاهِيمُ",
    answer: "raf",
    reason: "Fa'il (doer) of the verb daraba. Raf'.",
  },
  {
    sentence: "وَضَرَبَ إِبْرَاهِيمُ الأَصْنَامَ بِالفَأْسِ.",
    target: "الأَصْنَامَ",
    answer: "nasb",
    reason: "Maf'ul bihi (object) of daraba. Nasb.",
  },
  {
    sentence: "وَضَرَبَ إِبْرَاهِيمُ الأَصْنَامَ بِالفَأْسِ.",
    target: "الفَأْسِ",
    answer: "jarr",
    reason: "Object of the preposition bi. Jarr.",
  },
  {
    sentence: "سَمِعْنَا فَتًى يَذْكُرُهُمْ يُقَالُ لَهُ إِبْرَاهِيمُ.",
    target: "إِبْرَاهِيمُ",
    answer: "raf",
    reason: "Na'ib fa'il (deputy doer) of the passive yuqalu. Raf'.",
  },
  {
    sentence: "اجْتَمَعَ النَّاسُ وَقَالُوا: مَاذَا نَفْعَلُ؟",
    target: "النَّاسُ",
    answer: "raf",
    reason: "Fa'il of the verb ijtama'a. Raf'.",
  },
  {
    sentence: "إِنَّ إِبْرَاهِيمَ كَسَرَ الأَصْنَامَ وَأَهَانَ الآلِهَةَ.",
    target: "إِبْرَاهِيمَ",
    answer: "nasb",
    reason: "Ism of inna — nasb.",
  },
  {
    sentence: "لٰكِنَّ اللهَ نَصَرَ إِبْرَاهِيمَ.",
    target: "اللهَ",
    answer: "nasb",
    reason: "Ism of laakinna (a sister of inna) — nasb.",
  },
  {
    sentence: "يَا نَارُ كُونِي بَرْدًا وَسَلَامًا عَلَى إِبْرَاهِيمَ.",
    target: "بَرْدًا",
    answer: "nasb",
    reason: "Khabar of kaana (kooni) — nasb.",
  },
];

// MODE 2: Noun feature tagging.
// def: "marifa" | "nakirah"  |  gender: "m" | "f"  |  number: "sing" | "dual" | "plural"
export const nounFeatures = [
  { word: "الرَّجُلُ", def: "marifa", gender: "m", number: "sing" },
  { word: "رَجُلٌ", def: "nakirah", gender: "m", number: "sing" },
  { word: "قَرْيَةٌ", def: "nakirah", gender: "f", number: "sing" },
  { word: "الأَصْنَامُ", def: "marifa", gender: "m", number: "plural" },
  { word: "وَلَدٌ", def: "nakirah", gender: "m", number: "sing" },
  { word: "النَّاسُ", def: "marifa", gender: "m", number: "plural" },
  { word: "النَّارُ", def: "marifa", gender: "f", number: "sing" },
  { word: "حِجَارَةٌ", def: "nakirah", gender: "f", number: "plural" },
  { word: "بَيْتٌ", def: "nakirah", gender: "m", number: "sing" },
  { word: "الطَّعَامُ", def: "marifa", gender: "m", number: "sing" },
  { word: "الفَأْسُ", def: "marifa", gender: "f", number: "sing" },
  { word: "إِبْرَاهِيمُ", def: "marifa", gender: "m", number: "sing" },
];

// MODE 3: Identify the grammatical role.
// `words` is the sentence split into tappable tokens (in reading order, RTL handled by CSS).
// `role` is what to ask for. `answerIndex` is the index into `words` of the correct token.
export const roles = [
  {
    words: ["كَانَ", "اسْمُ", "هٰذَا", "الوَلَدِ", "إِبْرَاهِيمَ"],
    role: "ism of kaana",
    answerIndex: 1,
    reason: "'ismu' is the subject (ism) of kaana.",
  },
  {
    words: ["ضَرَبَ", "إِبْرَاهِيمُ", "الأَصْنَامَ"],
    role: "fa'il",
    answerIndex: 1,
    reason: "Ibrahim is the doer of the verb daraba.",
  },
  {
    words: ["ضَرَبَ", "إِبْرَاهِيمُ", "الأَصْنَامَ"],
    role: "maf'ul bihi (object)",
    answerIndex: 2,
    reason: "al-asnaam is what was struck — the object.",
  },
  {
    words: ["اسْمُ", "الوَلَدِ", "إِبْرَاهِيمُ"],
    role: "mudaf",
    answerIndex: 0,
    reason: "'ismu' is the mudaf; 'al-waladi' is the mudaf ilayh.",
  },
  {
    words: ["اسْمُ", "الوَلَدِ", "إِبْرَاهِيمُ"],
    role: "mudaf ilayh",
    answerIndex: 1,
    reason: "'al-waladi' is the mudaf ilayh, in jarr.",
  },
  {
    words: ["إِنَّ", "الأَصْنَامَ", "حِجَارَةٌ"],
    role: "ism of inna",
    answerIndex: 1,
    reason: "al-asnaam is the ism of inna, in nasb.",
  },
  {
    words: ["إِنَّ", "الأَصْنَامَ", "حِجَارَةٌ"],
    role: "khabar of inna",
    answerIndex: 2,
    reason: "hijaarah is the khabar of inna, in raf'.",
  },
  {
    words: ["ذَهَبَ", "النَّاسُ"],
    role: "fa'il",
    answerIndex: 1,
    reason: "an-naas is the doer of dhahaba.",
  },
  {
    words: ["زَيْدٌ", "تَاجِرٌ"],
    role: "mubtada",
    answerIndex: 0,
    reason: "Zaydun is the subject the sentence is about — the mubtada.",
  },
  {
    words: ["زَيْدٌ", "تَاجِرٌ"],
    role: "khabar",
    answerIndex: 1,
    reason: "taajirun is the predicate (khabar) giving information about Zayd.",
  },
];

// MODE 4: Vocabulary flashcards (Arabic -> English), pulled from the six chapters.
export const vocab = [
  { ar: "صَنَمٌ", en: "idol" },
  { ar: "قَرْيَةٌ", en: "village / town" },
  { ar: "رَجُلٌ", en: "man" },
  { ar: "اسْمٌ", en: "name" },
  { ar: "وَلَدٌ", en: "boy / child" },
  { ar: "رَشِيدٌ", en: "intelligent / rightly-guided" },
  { ar: "بَيْتٌ", en: "house" },
  { ar: "حَجَرٌ", en: "stone" },
  { ar: "حِجَارَةٌ", en: "stones" },
  { ar: "يَسْجُدُ", en: "he prostrates" },
  { ar: "يَعْبُدُ", en: "he worships" },
  { ar: "يَعْرِفُ", en: "he recognizes / knows" },
  { ar: "يَتَكَلَّمُ", en: "he speaks" },
  { ar: "يَسْمَعُ", en: "he hears" },
  { ar: "يَضُرُّ", en: "he/it harms" },
  { ar: "يَنْفَعُ", en: "he/it benefits" },
  { ar: "الذُّبَابُ", en: "the fly" },
  { ar: "الفَأْرُ", en: "the mouse" },
  { ar: "الطَّعَامُ", en: "the food" },
  { ar: "الشَّرَابُ", en: "the drink" },
  { ar: "أَبٌ", en: "father" },
  { ar: "نَصِيحَةٌ", en: "advice" },
  { ar: "يَغْضَبُ", en: "he becomes angry" },
  { ar: "يَفْهَمُ", en: "he understands" },
  { ar: "يَكْسِرُ", en: "he breaks" },
  { ar: "العِيدُ", en: "the festival / Eid" },
  { ar: "خَرَجَ", en: "he went out / left" },
  { ar: "سَقِيمٌ", en: "sick" },
  { ar: "الفَأْسُ", en: "the axe" },
  { ar: "عُنُقٌ", en: "neck" },
  { ar: "سَكَتَ", en: "he became / stayed silent" },
  { ar: "نَارٌ", en: "fire" },
  { ar: "بَرْدٌ", en: "cold(ness)" },
  { ar: "سَلَامٌ", en: "peace" },
  { ar: "نَصَرَ", en: "he helped / supported" },
];
```

## 6. Acceptance checklist

- [ ] App opens to a home screen with four mode cards, Arabic + English title.
- [ ] All four modes work as specified with tap-based interaction.
- [ ] Arabic renders in Amiri with visible, non-colliding harakat at readable size, RTL.
- [ ] No transliteration appears anywhere.
- [ ] Questions are served in random order, pooled across all chapters.
- [ ] Immediate right/wrong feedback; i'rab and role modes show the English reason.
- [ ] Running per-session score; resets on reload; no persistence, no API, no accounts.
- [ ] Looks clean and calm on a phone screen first.
- [ ] The bank lives in one readable `src/data/bank.js` file, easy for a teacher to extend.

## 7. After building

Print clear instructions to run it locally (`npm install`, `npm run dev`) and a one-paragraph
note for the teacher explaining exactly how to add a new question to each of the four arrays
in `bank.js`, with a tiny example for each.
