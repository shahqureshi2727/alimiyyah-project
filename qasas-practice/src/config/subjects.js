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
  morphology: { label: 'Morphology', bankSource: 'qasas', timerSeconds: 20 },
  fiqh: { label: 'Fiqh', bankSource: 'fiqh', timerSeconds: 25 },
  hadith: { label: 'Hadith', bankSource: 'hadith', timerSeconds: 25 },
  tafsir: { label: 'Tafsir', bankSource: 'tafsir', timerSeconds: 25 },
  review: { label: 'Weak Spots Review', bankSource: 'mixed', timerSeconds: 20 },
};

// Arabic topics available for topic-first navigation. Add one entry here per
// topic once its question bank exists in src/data/arabic/.
export const ARABIC_TOPICS = [
  { code: 'IRB', label: "I'rab Identification", mode: 'irab' },
  { code: 'NF', label: 'Noun Features', mode: 'nounFeatures' },
  { code: 'ROL', label: 'Grammatical Role', mode: 'roles' },
  { code: 'VOC', label: 'Vocabulary', mode: 'vocab' },
  { code: 'MOR_PST_ACT', label: 'Morphology: Past Active', mode: 'morphology' },
  { code: 'MOR_PST_PAS', label: 'Morphology: Past Passive', mode: 'morphology' },
  { code: 'MOR_MDR_ACT', label: 'Morphology: Mudari Active', mode: 'morphology' },
  { code: 'MOR_MDR_PAS', label: 'Morphology: Mudari Passive', mode: 'morphology' },
  { code: 'MOR_MDR_NEG', label: 'Morphology: Negative Mudari', mode: 'morphology' },
  { code: 'MOR_CMD_AMR', label: 'Morphology: Imperative', mode: 'morphology' },
  { code: 'MOR_CMD_NAH', label: 'Morphology: Prohibitive', mode: 'morphology' },
];

// Fiqh topics available for topic-first navigation. Add one entry here per
// topic once its question bank exists in src/data/fiqh/ (see
// content/Fiqh/_Fiqh-MOC.md for the full topic list).
export const FIQH_TOPICS = [
  { code: 'NJS', label: 'Najasah (Impurities)', group: 'tahara' },
  { code: 'WTR', label: 'Water Classification', group: 'tahara' },
  { code: 'WUD', label: 'Wudhu', group: 'tahara' },
  { code: 'GHS', label: 'Ghusl', group: 'tahara' },
  { code: 'TYM', label: 'Tayammum', group: 'tahara' },
  { code: 'KHF', label: 'Wiping over Khuffs', group: 'tahara' },
  { code: 'JBR', label: 'Casts & Bandages', group: 'tahara' },
  { code: 'SJD', label: 'Sajdah al-Tilawah', group: 'prayer' },
  { code: 'SLH', label: 'Salah', group: 'prayer' },
  { code: 'ADH', label: 'Adhan & Iqamah', group: 'prayer' },
  { code: 'VEH', label: 'Prayer on Vehicles', group: 'prayer' },
  { code: 'TRV', label: 'Travel (Safar)', group: 'prayer' },
  { code: 'MRD', label: 'Prayer of the Sick', group: 'prayer' },
  { code: 'MSB', label: 'Masbuq', group: 'prayer' },
];

export const FIQH_GROUPS = [
  {
    code: 'tahara',
    label: 'Tahara',
    titleAr: 'الطَّهَارَة',
    description: 'Purification, wudhu, ghusl, tayammum, khuffs, and related rulings',
  },
  {
    code: 'prayer',
    label: 'Prayer',
    titleAr: 'الصَّلَاة',
    description: 'Salah, adhan, travel, vehicles, sickness, masbuq, and prayer rulings',
  },
];

// Hadith topics available for topic-first navigation. The first bank is built
// from the extracted Arba'een slides in content/Hadith/.
export const HADITH_TOPICS = [
  {
    code: 'ARB40',
    label: "Arba'een Hadith",
    titleAr: 'الأَرْبَعُون',
    description: 'Arabic hadith text with English translation recall',
  },
];

// Tafsir topics available for verse-by-verse recall and translation MCQs.
// Source records are extracted under content/Tafsir/.
export const TAFSIR_TOPICS = [
  {
    code: 'ASR',
    label: 'Surah Al-Asr',
    titleAr: 'سُورَةُ العَصْر',
    description: 'Verse-by-verse translation and tafsir notes',
  },
  {
    code: 'FIL',
    label: 'Surah Al-Fil',
    titleAr: 'سُورَةُ الفِيل',
    description: 'Verse-by-verse translation and tafsir notes',
  },
  {
    code: 'QUR',
    label: 'Surah Quraysh',
    titleAr: 'سُورَةُ قُرَيْش',
    description: 'Verse-by-verse translation and tafsir notes',
  },
  {
    code: 'MAU',
    label: "Surah Al-Ma'un",
    titleAr: 'سُورَةُ المَاعُون',
    description: 'Verse-by-verse translation and tafsir notes',
  },
  {
    code: 'KAW',
    label: 'Surah Al-Kawthar',
    titleAr: 'سُورَةُ الكَوْثَر',
    description: 'Verse-by-verse translation and tafsir notes',
  },
  {
    code: 'KAF',
    label: 'Surah Al-Kafirun',
    titleAr: 'سُورَةُ الكَافِرُون',
    description: 'Verse-by-verse translation and tafsir notes',
  },
];
