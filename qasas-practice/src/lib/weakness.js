import {
  INITIAL_SCORE,
  MIN_ATTEMPTS_TO_FLAG,
  RECENCY_WEIGHT,
  STRONG_MIN,
  WEAK_MAX,
} from '../config/weakness';

export function statusFor(score, attempts) {
  if (score >= STRONG_MIN) return 'strong';
  if (attempts >= MIN_ATTEMPTS_TO_FLAG && score < WEAK_MAX) return 'weak';
  return 'developing';
}

export function applyAnswer(topicState, correct, answeredAt) {
  const previous = topicState || {
    score: INITIAL_SCORE,
    attempts: 0,
    streak: 0,
  };
  const answerScore = correct ? 1 : 0;
  const score = RECENCY_WEIGHT * answerScore + (1 - RECENCY_WEIGHT) * previous.score;
  const attempts = previous.attempts + 1;
  const streak = correct ? previous.streak + 1 : 0;

  return {
    ...previous,
    attempts,
    score,
    lastSeen: answeredAt,
    streak,
    status: statusFor(score, attempts),
  };
}

export function updateProfile(profile = {}, events = []) {
  const topics = { ...(profile.topics || {}) };

  for (const event of events) {
    if (!event?.topic) continue;
    topics[event.topic] = applyAnswer(topics[event.topic], Boolean(event.correct), event.answeredAt);
  }

  return {
    ...profile,
    topics,
  };
}

function seenTime(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getWeakTopics(profile = {}, limit = 10) {
  return Object.entries(profile.topics || {})
    .filter(([, state]) => state.status === 'weak' || state.status === 'developing')
    .sort(([, a], [, b]) => {
      if (a.score !== b.score) return a.score - b.score;
      return seenTime(a.lastSeen) - seenTime(b.lastSeen);
    })
    .slice(0, limit)
    .map(([topic]) => topic);
}

export function reviewWeights(profile = {}) {
  return Object.fromEntries(
    Object.entries(profile.topics || {})
      .filter(([, state]) => state.status === 'weak' || state.status === 'developing')
      .map(([topic, state]) => [topic, Math.max(0, 1 - state.score)])
      .filter(([, weight]) => weight > 0)
  );
}
