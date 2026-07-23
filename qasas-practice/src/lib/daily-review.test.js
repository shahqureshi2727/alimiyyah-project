import { describe, expect, it } from 'vitest';
import {
  DAILY_REVIEW_COMPOSITION,
  DAILY_REVIEW_LENGTH,
  buildDailyReviewBank,
  selectDailyReviewQuestions,
  toMillis,
} from './daily-review';

function question(id, topic, reviewMode, reviewCategory) {
  return { id, topic, reviewMode, reviewCategory, prompt: id };
}

function questionsFor(topic, count, reviewMode, reviewCategory) {
  return Array.from({ length: count }, (_, index) =>
    question(`${topic}-${index + 1}`, topic, reviewMode, reviewCategory)
  );
}

describe('daily review selection', () => {
  it('builds a mixed bank with all current categories and render modes', () => {
    const bank = buildDailyReviewBank();
    const categories = new Set(bank.map((item) => item.reviewCategory));
    const modes = new Set(bank.map((item) => item.reviewMode));

    expect(DAILY_REVIEW_LENGTH).toBe(15);
    expect(DAILY_REVIEW_COMPOSITION).toEqual({ weak: 6, due: 5, general: 4 });
    expect(categories).toEqual(new Set(['arabic', 'fiqh', 'hadith', 'tafsir']));
    expect(modes).toEqual(new Set([
      'irab',
      'nounFeatures',
      'roles',
      'vocab',
      'morphology',
      'fiqh',
      'hadith',
      'tafsir',
    ]));
  });

  it('front-loads weak topics, prefers missed questions inside them, then adds due topics', () => {
    const now = new Date('2026-07-23T12:00:00.000Z');
    const bank = [
      ...questionsFor('WUD', 6, 'fiqh', 'fiqh'),
      ...questionsFor('ARB40', 6, 'hadith', 'hadith'),
      ...questionsFor('FIL', 6, 'tafsir', 'tafsir'),
      ...questionsFor('IRB', 6, 'irab', 'arabic'),
      ...questionsFor('VOC', 6, 'vocab', 'arabic'),
    ];

    const selected = selectDailyReviewQuestions({
      bank,
      topicStats: [
        { category: 'fiqh', subtopic: 'WUD', attempts: 5, ewmaScore: 0.2, nextDueAt: new Date('2026-07-30T12:00:00.000Z') },
        { category: 'hadith', subtopic: 'ARB40', attempts: 5, ewmaScore: 0.35, nextDueAt: new Date('2026-07-30T12:00:00.000Z') },
        { category: 'tafsir', subtopic: 'FIL', attempts: 5, ewmaScore: 0.95, nextDueAt: new Date('2026-07-22T12:00:00.000Z') },
        { category: 'arabic', subtopic: 'IRB', attempts: 5, ewmaScore: 0.9, nextDueAt: new Date('2026-07-30T12:00:00.000Z') },
      ],
      missedQuestionIds: new Set(['WUD-3', 'ARB40-2']),
      now,
      shuffle: (items) => items,
    });

    expect(selected).toHaveLength(15);
    expect(new Set(selected.map((item) => item.id)).size).toBe(selected.length);
    expect(selected.slice(0, 6).map((item) => item.topic)).toEqual([
      'WUD',
      'WUD',
      'WUD',
      'WUD',
      'WUD',
      'WUD',
    ]);
    expect(selected[0].id).toBe('WUD-3');
    expect(selected.slice(6, 11).some((item) => item.topic === 'FIL')).toBe(true);
  });

  it('uses a broad category mix for cold-start users without useful stats', () => {
    const selected = selectDailyReviewQuestions({
      bank: [
        ...questionsFor('IRB', 4, 'irab', 'arabic'),
        ...questionsFor('WUD', 4, 'fiqh', 'fiqh'),
        ...questionsFor('ARB40', 4, 'hadith', 'hadith'),
        ...questionsFor('FIL', 4, 'tafsir', 'tafsir'),
      ],
      topicStats: [],
      length: 8,
      shuffle: (items) => items,
    });

    expect(selected).toHaveLength(8);
    expect(new Set(selected.map((item) => item.reviewCategory))).toEqual(
      new Set(['arabic', 'fiqh', 'hadith', 'tafsir'])
    );
    expect(new Set(selected.map((item) => item.id)).size).toBe(selected.length);
  });

  it('normalizes Firestore timestamps, dates, millis, and strings for due checks', () => {
    expect(toMillis(new Date('2026-07-23T00:00:00.000Z'))).toBe(Date.parse('2026-07-23T00:00:00.000Z'));
    expect(toMillis({ toMillis: () => 123 })).toBe(123);
    expect(toMillis({ seconds: 2, nanoseconds: 500000000 })).toBe(2500);
    expect(toMillis('2026-07-23T00:00:00.000Z')).toBe(Date.parse('2026-07-23T00:00:00.000Z'));
    expect(toMillis(null)).toBe(0);
  });
});
