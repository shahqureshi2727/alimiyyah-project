import { irab, nounFeatures, roles, vocab } from '../data/arabic';
import { morphology } from '../data/morphology';
import { getFiqhQuestions } from '../data/fiqh';
import { getHadithQuestions } from '../data/hadith';
import { getTafsirQuestions } from '../data/tafsir';
import { QUIZ_QUESTION_TARGETS } from '../config/subjects';
import { buildDailyReviewBank } from './daily-review';
import { shuffleArray } from './shuffle';

export const STANDARD_QUIZ_LENGTH = 10;

const STATIC_BANKS = {
  irab,
  nounFeatures,
  morphology,
  roles,
  vocab,
};

export function getBank(mode, topic) {
  if (mode === 'fiqh') return getFiqhQuestions(topic || 'all');
  if (mode === 'hadith') return getHadithQuestions(topic || 'all');
  if (mode === 'tafsir') return getTafsirQuestions(topic || 'all');
  if (mode === 'review') return buildDailyReviewBank();
  return STATIC_BANKS[mode] || [];
}

export function getQuestionTarget(mode, question) {
  return QUIZ_QUESTION_TARGETS[mode]?.(question) || '';
}

export function selectQuestions(
  bank,
  length = STANDARD_QUIZ_LENGTH,
  { shuffle = shuffleArray } = {}
) {
  if (!bank || bank.length === 0) {
    return { questions: [], usedRepeats: false };
  }

  if (bank.length < length) {
    const shuffled = shuffle(bank);
    const questions = [];
    for (let i = 0; i < length; i++) {
      questions.push(shuffled[i % shuffled.length]);
    }
    return { questions, usedRepeats: true };
  }

  return {
    questions: shuffle(bank).slice(0, length),
    usedRepeats: false,
  };
}
