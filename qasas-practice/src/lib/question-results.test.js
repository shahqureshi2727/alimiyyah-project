import { describe, expect, it, vi } from 'vitest';
import { questionResultFromAnswer } from './question-results';

describe('questionResultFromAnswer', () => {
  it('uses stable id, topic, and group from tagged fiqh questions', () => {
    const result = questionResultFromAnswer({
      question: { id: 'FQH-WUD-Q01', topic: 'WUD' },
      correct: true,
      mode: 'fiqh',
      index: 0,
    });

    expect(result).toEqual({
      questionId: 'FQH-WUD-Q01',
      topic: 'WUD',
      group: 'tahara',
      correct: true,
    });
  });

  it('uses the hadith topic as the tracking group for tagged hadith questions', () => {
    const result = questionResultFromAnswer({
      question: { id: 'HDT-ARB40-Q01', topic: 'ARB40' },
      correct: true,
      mode: 'hadith',
      index: 0,
    });

    expect(result).toEqual({
      questionId: 'HDT-ARB40-Q01',
      topic: 'ARB40',
      group: 'ARB40',
      correct: true,
    });
  });

  it('falls back to mode and session id when metadata is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(questionResultFromAnswer({
      question: {},
      correct: false,
      mode: 'irab',
      index: 2,
    })).toEqual({
      questionId: 'irab-3',
      topic: 'irab',
      group: 'irab',
      correct: false,
    });

    warn.mockRestore();
  });
});
