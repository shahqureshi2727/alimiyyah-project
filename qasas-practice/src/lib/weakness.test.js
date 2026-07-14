import { describe, expect, it } from 'vitest';
import { applyAnswer, getWeakTopics, reviewWeights, statusFor, updateProfile } from './weakness';

describe('weakness scoring', () => {
  it('weights recent answers more heavily than previous score', () => {
    const firstMiss = applyAnswer(undefined, false, '2026-07-14T10:00:00.000Z');
    expect(firstMiss.score).toBeCloseTo(0.3);
    expect(firstMiss.attempts).toBe(1);

    const recovery = applyAnswer(firstMiss, true, '2026-07-14T10:01:00.000Z');
    expect(recovery.score).toBeCloseTo(0.79);
    expect(recovery.streak).toBe(1);
  });

  it('gates weak status until the minimum attempts is reached', () => {
    expect(statusFor(0.2, 1)).toBe('developing');
    expect(statusFor(0.2, 3)).toBe('weak');
    expect(statusFor(0.75, 3)).toBe('strong');
  });

  it('folds events into a profile without mutating the original', () => {
    const original = {
      userId: 'u1',
      topics: {
        WUD: { attempts: 1, score: 0.3, streak: 0, status: 'developing', lastSeen: 'old' },
      },
    };

    const next = updateProfile(original, [
      { topic: 'WUD', correct: true, answeredAt: 'new' },
      { topic: 'NJS', correct: false, answeredAt: 'newer' },
    ]);

    expect(next).not.toBe(original);
    expect(next.topics.WUD.attempts).toBe(2);
    expect(next.topics.NJS.score).toBeCloseTo(0.3);
    expect(original.topics.WUD.attempts).toBe(1);
  });

  it('sorts weak topics by lowest score then least recent seen', () => {
    const profile = {
      topics: {
        A: { score: 0.7, attempts: 4, status: 'developing', lastSeen: '2026-07-14T10:00:00.000Z' },
        B: { score: 0.4, attempts: 4, status: 'weak', lastSeen: '2026-07-14T11:00:00.000Z' },
        C: { score: 0.7, attempts: 4, status: 'developing', lastSeen: '2026-07-14T09:00:00.000Z' },
        D: { score: 0.9, attempts: 4, status: 'strong', lastSeen: '2026-07-14T08:00:00.000Z' },
      },
    };

    expect(getWeakTopics(profile, 3)).toEqual(['B', 'C', 'A']);
  });

  it('builds review weights from weak and developing scores', () => {
    const profile = {
      topics: {
        A: { score: 0.3, status: 'weak' },
        B: { score: 0.6, status: 'developing' },
        C: { score: 0.9, status: 'strong' },
      },
    };

    expect(reviewWeights(profile)).toEqual({ A: 0.7, B: 0.4 });
  });
});

