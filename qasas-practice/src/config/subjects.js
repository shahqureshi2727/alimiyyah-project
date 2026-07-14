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

// Fiqh topics available for topic-first navigation. Add one entry here per
// topic once its question bank exists in src/data/fiqh/ (see
// content/Fiqh/_Fiqh-MOC.md for the full topic list — only WUD is seeded so
// far).
export const FIQH_TOPICS = [
  { code: 'WUD', label: 'Wudhu' },
];
