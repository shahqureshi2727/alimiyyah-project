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
};

// Arabic topics available for topic-first navigation. Add one entry here per
// topic once its question bank exists in src/data/arabic/.
export const ARABIC_TOPICS = [
  { code: 'IRB', label: "I'rab Identification", mode: 'irab' },
  { code: 'NF', label: 'Noun Features', mode: 'nounFeatures' },
  { code: 'ROL', label: 'Grammatical Role', mode: 'roles' },
  { code: 'VOC', label: 'Vocabulary', mode: 'vocab' },
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
