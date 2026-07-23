import { describe, expect, it } from 'vitest';
import { normalizeTranslation, scoreTafsirAnswer } from './tafsir-scoring';

describe('tafsir free-response scoring', () => {
  it('normalizes punctuation, case, and spacing', () => {
    expect(normalizeTranslation('  Surely, HUMANITY is in loss!  ')).toBe(
      'surely humanity is in loss'
    );
  });

  it('scores exact translation recall as correct', () => {
    const result = scoreTafsirAnswer(
      'Have you not seen how your Lord dealt with the Army of the Elephant?',
      'have you not seen how your lord dealt with the army of the elephant'
    );

    expect(result.status).toBe('correct');
    expect(result.score).toBe(1);
    expect(result.missingWords).toEqual([]);
    expect(result.extraWords).toEqual([]);
  });

  it('allows small spelling slips without marking the verse wrong', () => {
    const result = scoreTafsirAnswer(
      'Indeed, We have granted you abundant goodness',
      'Indeed we have granted you abundant goodnes'
    );

    expect(result.status).toBe('correct');
    expect(result.matchedWords).toContain('goodness');
    expect(result.missingWords).not.toContain('goodness');
  });

  it('reports missing content words', () => {
    const result = scoreTafsirAnswer(
      'leaving them like chewed up straw',
      'leaving them like straw'
    );

    expect(result.status).toBe('close');
    expect(result.missingWords).toEqual(['chewed', 'up']);
  });

  it('reports extra student words separately', () => {
    const result = scoreTafsirAnswer(
      'By the passage of time',
      'By the long passage of time today'
    );

    expect(result.status).toBe('correct');
    expect(result.extraWords).toEqual(['long', 'today']);
  });

  it('uses acceptable variants as additional reference phrases', () => {
    const result = scoreTafsirAnswer(
      'Have you seen the one who denies the Judgment?',
      'Have you seen the one who denies the day of qiyamah',
      ['Have you seen the one who denies the Day of Qiyamah?']
    );

    expect(result.status).toBe('correct');
    expect(result.missingWords).toEqual([]);
  });
});
