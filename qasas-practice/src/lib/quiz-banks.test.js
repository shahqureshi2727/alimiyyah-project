import { describe, expect, it, vi } from 'vitest';
import { getQuestionTarget, loadBank, selectQuestions } from './quiz-banks';

describe('quiz bank selection', () => {
  it('loads a selected fiqh topic without broadening to unrelated topics', async () => {
    const bank = await loadBank('fiqh', 'WUD');

    expect(bank.length).toBeGreaterThan(0);
    expect(new Set(bank.map((question) => question.topic))).toEqual(new Set(['WUD']));
  });

  it('loads the daily review bank with all review categories on demand', async () => {
    const bank = await loadBank('review');
    const categories = new Set(bank.map((question) => question.reviewCategory));
    const modes = new Set(bank.map((question) => question.reviewMode));

    expect(categories).toEqual(new Set(['arabic', 'fiqh', 'hadith', 'tafsir']));
    expect(modes).toEqual(
      new Set(['irab', 'nounFeatures', 'roles', 'vocab', 'morphology', 'fiqh', 'hadith', 'tafsir'])
    );
  });

  it('returns a repeat flag when the requested quiz is longer than the bank', () => {
    const bank = [{ id: 'q1' }, { id: 'q2' }];

    const result = selectQuestions(bank, 5, {
      shuffle: (items) => items,
    });

    expect(result.usedRepeats).toBe(true);
    expect(result.questions).toEqual([
      { id: 'q1' },
      { id: 'q2' },
      { id: 'q1' },
      { id: 'q2' },
      { id: 'q1' },
    ]);
  });

  it('selects unique shuffled questions without the repeat flag for a large enough bank', () => {
    const bank = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];
    const shuffle = vi.fn((items) => [items[2], items[0], items[1]]);

    const result = selectQuestions(bank, 2, { shuffle });

    expect(result.usedRepeats).toBe(false);
    expect(result.questions).toEqual([{ id: 'q3' }, { id: 'q1' }]);
  });

  it('reads result-breakdown targets from the mode registry', () => {
    expect(getQuestionTarget('roles', { words: ['هُوَ', 'قَائِمٌ'], answerIndex: 1 })).toBe(
      'قَائِمٌ'
    );
    expect(getQuestionTarget('vocab', { ar: 'قَرْيَةٌ' })).toBe('قَرْيَةٌ');
  });
});
