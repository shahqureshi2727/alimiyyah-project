import { describe, expect, it } from 'vitest';
import {
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
});
