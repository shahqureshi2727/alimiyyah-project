import { describe, expect, it } from 'vitest';
import { TAFSIR_TOPICS } from '../../config/subjects';
import {
  getTafsirQuestions,
  getTafsirVerseRecords,
  tafsirMcqQuestions,
  tafsirVerseRecords,
} from './index';

describe('tafsir source verse bank', () => {
  it('exports verse-by-verse records for the extracted short surahs', () => {
    expect(tafsirVerseRecords).toHaveLength(28);

    const countsBySurah = tafsirVerseRecords.reduce((counts, record) => {
      counts[record.surahName] = (counts[record.surahName] || 0) + 1;
      return counts;
    }, {});

    expect(countsBySurah['Al-Fil']).toBe(5);
    expect(countsBySurah['Al-Asr']).toBe(3);
    expect(countsBySurah['Al-Maun']).toBe(7);
    expect(countsBySurah['Al-Kawthar']).toBe(3);
    expect(countsBySurah.Quraysh).toBe(4);
    expect(countsBySurah['Al-Kafirun']).toBe(6);
  });

  it('uses stable app-ready fields for fuzzy free-response scoring', () => {
    const record = tafsirVerseRecords.find((item) => item.id === 'TFS-FIL-001');

    expect(record).toMatchObject({
      id: 'TFS-FIL-001',
      sourceIds: ['TFS-FIL-01'],
      topic: 'FIL',
      surahNumber: 105,
      surahName: 'Al-Fil',
      ayah: 1,
    });
    expect(record.arabicText).toBeTruthy();
    expect(record.arabicText).toBe(record.arabicTextUthmani);
    expect(record.arabicTextIndopak).toBeTruthy();
    expect(record.referenceTranslation).toBeTruthy();
    expect(record.acceptableVariants).toEqual([]);
    expect(record.commentary.length).toBeGreaterThan(0);
  });

  it('uses clean Unicode Arabic instead of PDF extraction artifacts', () => {
    const extractionArtifacts = /[\u200e\u200f\u202a-\u202e\ue000-\uf8ff\ufb50-\ufdff\ufe70-\ufeff]/;

    for (const record of tafsirVerseRecords) {
      expect(record.arabicText).not.toMatch(extractionArtifacts);
      expect(record.arabicTextUthmani).not.toMatch(extractionArtifacts);
      expect(record.arabicTextIndopak).not.toMatch(extractionArtifacts);
      expect(record.arabicText).not.toMatch(/\s{2,}/);
      expect(record.arabicTextUthmani).not.toMatch(/\s{2,}/);
      expect(record.arabicTextIndopak).not.toMatch(/\s{2,}/);
    }
  });

  it('generates translation MCQs with unique distractors', () => {
    const question = tafsirMcqQuestions.find((item) => item.id === 'TFS-FIL-001-MCQ');

    expect(question).toMatchObject({
      type: 'mcq',
      topic: 'FIL',
      answerIndex: 0,
    });
    expect(question.options).toHaveLength(4);
    expect(new Set(question.options).size).toBe(4);
    expect(question.options[0]).toBe(question.correctTranslation);
    expect(question.options.slice(1)).not.toContain(question.correctTranslation);
  });

  it('can filter records and questions by topic', () => {
    expect(getTafsirVerseRecords('all')).toHaveLength(tafsirVerseRecords.length);
    expect(getTafsirVerseRecords('FIL')).toHaveLength(5);
    expect(getTafsirVerseRecords('missing')).toEqual([]);

    expect(getTafsirQuestions('all')).toHaveLength(tafsirMcqQuestions.length);
    expect(getTafsirQuestions('FIL')).toHaveLength(5);
    expect(getTafsirQuestions('missing')).toEqual([]);
  });

  it('has visible topic metadata for every extracted surah', () => {
    const topicCodes = new Set(TAFSIR_TOPICS.map((topic) => topic.code));

    for (const record of tafsirVerseRecords) {
      expect(topicCodes.has(record.topic)).toBe(true);
    }
  });
});
