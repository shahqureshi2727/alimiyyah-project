import { describe, expect, it } from 'vitest';
import { HADITH_TOPICS } from '../../config/subjects';
import { getHadithQuestions, hadithQuestions } from './index';

describe('hadith question bank', () => {
  it('generates translation MCQs with distractors from other hadith translations', () => {
    const [question] = hadithQuestions;

    expect(question).toMatchObject({
      type: 'mcq',
      topic: 'ARB40',
      answerIndex: 0,
    });
    expect(question.arabicText).toBeTruthy();
    expect(question.options).toHaveLength(4);
    expect(new Set(question.options).size).toBe(4);
    expect(question.options[0]).toBe(question.correctTranslation);
    expect(question.options.slice(1)).not.toContain(question.correctTranslation);
  });

  it('returns all hadith questions or a focused topic bank', () => {
    expect(getHadithQuestions('all')).toHaveLength(hadithQuestions.length);
    expect(getHadithQuestions('ARB40')).toHaveLength(hadithQuestions.length);
    expect(getHadithQuestions('missing')).toEqual([]);
  });

  it('uses unique stable ids for every generated question', () => {
    const ids = hadithQuestions.map((question) => question.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has visible topic metadata for every question topic', () => {
    const topicCodes = new Set(HADITH_TOPICS.map((topic) => topic.code));

    for (const question of hadithQuestions) {
      expect(topicCodes.has(question.topic)).toBe(true);
    }
  });
});
