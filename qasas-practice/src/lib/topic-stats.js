import { ARABIC_TOPICS, FIQH_TOPICS } from '../config/subjects';
import { statusFor, reviewWeights } from './weakness';

export const TOPIC_STAT_RECENT_WEIGHT = 0.3;
export const TOPIC_STAT_INITIAL_SCORE = 1;
export const TOPIC_STAT_CATEGORIES = ['fiqh', 'hadith', 'arabic', 'tafsir'];

const ARABIC_TOPIC_CODES = new Set(ARABIC_TOPICS.map((topic) => topic.code));
const FIQH_TOPIC_CODES = new Set([...FIQH_TOPICS.map((topic) => topic.code), 'INT']);

export function topicStatDocId(category, subtopic) {
  return `${category}_${subtopic}`;
}

export function categoryForTopic(topic, mode, bankSource) {
  if (TOPIC_STAT_CATEGORIES.includes(bankSource)) return bankSource;
  if (TOPIC_STAT_CATEGORIES.includes(mode)) return mode;
  if (FIQH_TOPIC_CODES.has(topic)) return 'fiqh';
  if (ARABIC_TOPIC_CODES.has(topic) || topic?.startsWith('MOR_')) return 'arabic';
  return 'arabic';
}

export function nextTopicStat({ userId, category, subtopic, existing, wasCorrect, lastAttempted }) {
  const previousScore =
    typeof existing?.ewmaScore === 'number' ? existing.ewmaScore : TOPIC_STAT_INITIAL_SCORE;
  const resultScore = wasCorrect ? 1 : 0;
  const ewmaScore =
    TOPIC_STAT_RECENT_WEIGHT * resultScore + (1 - TOPIC_STAT_RECENT_WEIGHT) * previousScore;

  return {
    userId,
    category,
    subtopic,
    attempts: (existing?.attempts || 0) + 1,
    correct: (existing?.correct || 0) + (wasCorrect ? 1 : 0),
    lastAttempted,
    ewmaScore,
  };
}

export function profileFromTopicStats(stats = []) {
  const topics = {};

  for (const stat of stats) {
    if (!stat?.subtopic) continue;
    const attempts = stat.attempts || 0;
    const score = typeof stat.ewmaScore === 'number' ? stat.ewmaScore : TOPIC_STAT_INITIAL_SCORE;
    topics[stat.subtopic] = {
      attempts,
      score,
      lastSeen: stat.lastAttempted || null,
      status: statusFor(score, attempts),
    };
  }

  return { topics };
}

export function reviewWeightsFromTopicStats(stats = []) {
  return reviewWeights(profileFromTopicStats(stats));
}
