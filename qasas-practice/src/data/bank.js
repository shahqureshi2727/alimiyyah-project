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
