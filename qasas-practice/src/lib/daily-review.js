import { irab, nounFeatures, roles, vocab } from '../data/arabic';
import { morphology } from '../data/morphology';
import { getFiqhQuestions } from '../data/fiqh';
import { getHadithQuestions } from '../data/hadith';
import { getTafsirQuestions } from '../data/tafsir';
import { shuffleArray } from './shuffle';

export const DAILY_REVIEW_LENGTH = 15;
export const DAILY_REVIEW_COMPOSITION = { weak: 6, due: 5, general: 4 };

const REVIEW_SOURCES = [
  { reviewCategory: 'arabic', reviewMode: 'irab', questions: irab },
  { reviewCategory: 'arabic', reviewMode: 'nounFeatures', questions: nounFeatures },
  { reviewCategory: 'arabic', reviewMode: 'roles', questions: roles },
  { reviewCategory: 'arabic', reviewMode: 'vocab', questions: vocab },
  { reviewCategory: 'arabic', reviewMode: 'morphology', questions: morphology },
  { reviewCategory: 'fiqh', reviewMode: 'fiqh', questions: getFiqhQuestions('all') },
  { reviewCategory: 'hadith', reviewMode: 'hadith', questions: getHadithQuestions('all') },
  { reviewCategory: 'tafsir', reviewMode: 'tafsir', questions: getTafsirQuestions('all') },
];

export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value.seconds === 'number') {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
  }
  return 0;
}

export function buildDailyReviewBank() {
  return REVIEW_SOURCES.flatMap(({ reviewCategory, reviewMode, questions }) =>
    questions.map((question) => ({
      ...question,
      reviewCategory,
      reviewMode,
    }))
  );
}

function compositionForLength(length) {
  if (length === DAILY_REVIEW_LENGTH) return DAILY_REVIEW_COMPOSITION;

  const weak = Math.round(length * 0.4);
  const due = Math.round(length * 0.3);
  return {
    weak,
    due,
    general: Math.max(0, length - weak - due),
  };
}

function statKey(stat) {
  return `${stat?.category || ''}:${stat?.subtopic || ''}`;
}

function questionKey(question) {
  return `${question?.reviewCategory || ''}:${question?.topic || ''}`;
}

function isUsefulStat(stat) {
  return stat?.category && stat?.subtopic && (stat.attempts || 0) > 0;
}

function missedSetFrom(value) {
  if (!value) return new Set();
  if (typeof value.has === 'function') return value;
  return new Set(value);
}

function byTopicRank(stats) {
  return new Map(stats.map((stat, index) => [statKey(stat), index]));
}

function uniqueUnseen(candidates, seenIds) {
  return candidates.filter((question) => question?.id && !seenIds.has(question.id));
}

function takeRankedCandidates({ candidates, rankedStats, count, seenIds, missedQuestionIds, shuffle }) {
  if (count <= 0) return [];

  const rank = byTopicRank(rankedStats);
  const missed = missedSetFrom(missedQuestionIds);
  const ordered = shuffle(uniqueUnseen(candidates, seenIds)).sort((a, b) => {
    const rankDiff = (rank.get(questionKey(a)) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(questionKey(b)) ?? Number.MAX_SAFE_INTEGER);
    if (rankDiff !== 0) return rankDiff;

    const missedDiff = Number(missed.has(b.id)) - Number(missed.has(a.id));
    if (missedDiff !== 0) return missedDiff;

    return 0;
  });

  return ordered.slice(0, count);
}

function selectBroadMix({ candidates, count, seenIds, shuffle }) {
  const groups = new Map();
  for (const question of shuffle(uniqueUnseen(candidates, seenIds))) {
    const category = question.reviewCategory || 'mixed';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(question);
  }

  const selected = [];
  const categories = Array.from(groups.keys()).sort();

  while (selected.length < count && categories.length > 0) {
    let addedThisPass = false;
    for (const category of categories) {
      const group = groups.get(category);
      if (!group?.length) continue;
      selected.push(group.shift());
      addedThisPass = true;
      if (selected.length >= count) break;
    }
    if (!addedThisPass) break;
  }

  return selected;
}

function appendSelected(target, seenIds, questions, maxLength) {
  for (const question of questions) {
    if (target.length >= maxLength) return;
    if (!question?.id || seenIds.has(question.id)) continue;
    target.push(question);
    seenIds.add(question.id);
  }
}

export function selectDailyReviewQuestions({
  bank = buildDailyReviewBank(),
  topicStats = [],
  missedQuestionIds = new Set(),
  now = new Date(),
  length = DAILY_REVIEW_LENGTH,
  shuffle = shuffleArray,
} = {}) {
  if (!Array.isArray(bank) || bank.length === 0 || length <= 0) return [];

  const targetLength = Math.min(length, bank.length);
  const composition = compositionForLength(targetLength);
  const stats = topicStats.filter(isUsefulStat);
  const selected = [];
  const seenIds = new Set();
  const nowMillis = toMillis(now);

  const weakStats = [...stats]
    .sort((a, b) => {
      const scoreDiff = (a.ewmaScore ?? 1) - (b.ewmaScore ?? 1);
      if (scoreDiff !== 0) return scoreDiff;
      return toMillis(a.lastAttempted) - toMillis(b.lastAttempted);
    });

  const weakKeys = new Set(weakStats.map(statKey));
  appendSelected(
    selected,
    seenIds,
    takeRankedCandidates({
      candidates: bank.filter((question) => weakKeys.has(questionKey(question))),
      rankedStats: weakStats,
      count: composition.weak,
      seenIds,
      missedQuestionIds,
      shuffle,
    }),
    targetLength
  );

  const dueStats = stats
    .filter((stat) => toMillis(stat.nextDueAt) <= nowMillis)
    .sort((a, b) => {
      const dueDiff = toMillis(a.nextDueAt) - toMillis(b.nextDueAt);
      if (dueDiff !== 0) return dueDiff;
      return (a.ewmaScore ?? 1) - (b.ewmaScore ?? 1);
    });
  const dueKeys = new Set(dueStats.map(statKey));
  appendSelected(
    selected,
    seenIds,
    takeRankedCandidates({
      candidates: bank.filter((question) => dueKeys.has(questionKey(question))),
      rankedStats: dueStats,
      count: composition.due,
      seenIds,
      missedQuestionIds,
      shuffle,
    }),
    targetLength
  );

  const generalCount = targetLength - selected.length;
  appendSelected(
    selected,
    seenIds,
    selectBroadMix({
      candidates: bank,
      count: Math.max(composition.general, generalCount),
      seenIds,
      shuffle,
    }),
    targetLength
  );

  if (selected.length < targetLength) {
    appendSelected(selected, seenIds, shuffle(bank), targetLength);
  }

  return selected;
}
