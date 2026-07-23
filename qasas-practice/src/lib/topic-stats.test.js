import { describe, expect, it } from 'vitest';
import {
  aggregateTopicStatsFromEvents,
  categoryForTopic,
  nextTopicStat,
  profileFromTopicStats,
  topicStatDocId,
} from './topic-stats';

describe('topic stats', () => {
  it('keys stats by category and subtopic', () => {
    expect(topicStatDocId('fiqh', 'WUD')).toBe('fiqh_WUD');
    expect(topicStatDocId('arabic', 'MOR_PST_ACT')).toBe('arabic_MOR_PST_ACT');
  });

  it('derives category from topic code when review mode mixes banks', () => {
    expect(categoryForTopic('WUD', 'review', 'mixed')).toBe('fiqh');
    expect(categoryForTopic('ARB40', 'review', 'mixed')).toBe('hadith');
    expect(categoryForTopic('MOR_PST_ACT', 'review', 'mixed')).toBe('arabic');
    expect(categoryForTopic('IRB', 'irab', 'qasas')).toBe('arabic');
  });

  it('updates counts and ewma score with a 0.3 recent-result weight', () => {
    const firstMiss = nextTopicStat({
      userId: 'u1',
      category: 'fiqh',
      subtopic: 'WUD',
      existing: null,
      wasCorrect: false,
      lastAttempted: 'now',
    });

    expect(firstMiss).toMatchObject({
      userId: 'u1',
      category: 'fiqh',
      subtopic: 'WUD',
      attempts: 1,
      correct: 0,
      ewmaScore: 0.7,
      lastAttempted: 'now',
    });

    const recovery = nextTopicStat({
      userId: 'u1',
      category: 'fiqh',
      subtopic: 'WUD',
      existing: firstMiss,
      wasCorrect: true,
      lastAttempted: 'later',
    });

    expect(recovery.attempts).toBe(2);
    expect(recovery.correct).toBe(1);
    expect(recovery.ewmaScore).toBeCloseTo(0.79);
  });

  it('adapts flat topic stat docs into the existing heatmap profile shape', () => {
    const profile = profileFromTopicStats([
      { subtopic: 'WUD', attempts: 3, ewmaScore: 0.4, lastAttempted: 'a' },
      { subtopic: 'IRB', attempts: 2, ewmaScore: 0.8, lastAttempted: 'b' },
    ]);

    expect(profile.topics.WUD).toEqual({
      attempts: 3,
      score: 0.4,
      lastSeen: 'a',
      status: 'weak',
      });
      expect(profile.topics.IRB.status).toBe('strong');
    });

  it('aggregates historical answer events in chronological order by user category and topic', () => {
    const stats = aggregateTopicStatsFromEvents([
      { userId: 'u1', topic: 'WUD', correct: true, answeredAt: { toMillis: () => 3000 } },
      { userId: 'u1', topic: 'WUD', correct: false, answeredAt: { toMillis: () => 1000 } },
      { userId: 'u2', topic: 'IRB', correct: true, answeredAt: { toMillis: () => 2000 } },
    ]);

    expect(stats).toHaveLength(2);
    expect(stats[0]).toMatchObject({
      id: 'u1_fiqh_WUD',
      docId: 'fiqh_WUD',
      path: 'users/u1/topicStats/fiqh_WUD',
      userId: 'u1',
      category: 'fiqh',
      subtopic: 'WUD',
      attempts: 2,
      correct: 1,
    });
    expect(stats[0].ewmaScore).toBeCloseTo(0.79);
    expect(stats[1]).toMatchObject({
      path: 'users/u2/topicStats/arabic_IRB',
      attempts: 1,
      correct: 1,
      ewmaScore: 1,
    });
  });
  });
