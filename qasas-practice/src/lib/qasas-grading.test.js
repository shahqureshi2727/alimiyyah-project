import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  QASAS_TRANSLATION_CHAPTERS,
  qasasTranslationQuestions,
} from '../data/arabic/qasas-translation';
import { parseSource, renderModule } from '../../scripts/build-qasas-translation-bank.mjs';
import { gradeQasasTranslation, normalizeEnglish, WORD_STATUS } from './qasas-grading';

const here = dirname(fileURLToPath(import.meta.url));

function sentence(id) {
  return qasasTranslationQuestions.find((question) => question.id === id);
}

function statusOf(result, ar, occurrence = 0) {
  return result.words.filter((word) => word.ar === ar)[occurrence]?.status;
}

describe('normalizeEnglish', () => {
  it('expands contractions, drops possessive markers and punctuation', () => {
    expect(normalizeEnglish("Don't you see Ibrahim's father?")).toBe(
      'do not you see ibrahim father'
    );
    expect(normalizeEnglish('They cannot hear; the idols’ house')).toBe(
      'they can not hear the idols house'
    );
    expect(normalizeEnglish('Âzar')).toBe('azar');
  });
});

describe('gradeQasasTranslation', () => {
  it('passes the textbook translation of every sentence', () => {
    for (const question of qasasTranslationQuestions) {
      const result = gradeQasasTranslation(question, question.en);
      expect(result.correct, `${question.id}: ${question.en}`).toBe(true);
    }
  });

  it('accepts natural English word order', () => {
    const result = gradeQasasTranslation(
      sentence('QSS-C1-S02'),
      'There was a very famous man in a village'
    );
    expect(result.correct).toBe(true);
  });

  it('marks a wrong "the" on an indefinite noun as an article error', () => {
    const result = gradeQasasTranslation(
      sentence('QSS-C1-S02'),
      'There was in the village a very famous man'
    );
    expect(result.correct).toBe(false);
    expect(statusOf(result, 'قَرْيَةٍ')).toBe(WORD_STATUS.ARTICLE);
    expect(result.words.find((word) => word.ar === 'قَرْيَةٍ').articleError).toBe('needs-a');
  });

  it('marks a missing "a" on an indefinite noun as an article error', () => {
    const result = gradeQasasTranslation(
      sentence('QSS-C2-S01'),
      'And Azar had very intelligent son'
    );
    expect(statusOf(result, 'وَلَدٌ')).toBe(WORD_STATUS.ARTICLE);
  });

  it('rejects "the" in front of an indefinite plural', () => {
    const result = gradeQasasTranslation(
      sentence('QSS-C1-S06'),
      'And there were the idols in this house, very many idols'
    );
    expect(statusOf(result, 'أَصْنَامٌ', 0)).toBe(WORD_STATUS.ARTICLE);
    expect(result.correct).toBe(false);
  });

  it('accepts synonyms but reports the textbook answer', () => {
    const result = gradeQasasTranslation(
      sentence('QSS-C3-S11'),
      'Ibrahim said: I will break the idols when the people leave'
    );
    expect(result.correct).toBe(true);
    const leave = result.words.find((word) => word.ar === 'ذَهَبَ');
    expect(leave).toMatchObject({ status: WORD_STATUS.ACCEPTED, typed: 'leave', expected: 'go out' });
  });

  it('forgives small typos and still shows the textbook spelling', () => {
    const result = gradeQasasTranslation(
      sentence('QSS-C1-S02'),
      'there was in a vilage a very famos man'
    );
    expect(result.correct).toBe(true);
    expect(statusOf(result, 'مَشْهُورٌ')).toBe(WORD_STATUS.TYPO);
  });

  it('never treats an article as a typo of a short word', () => {
    const result = gradeQasasTranslation(sentence('QSS-C2-S08'), 'and the people the idols');
    expect(statusOf(result, 'فَـ')).toBe(WORD_STATUS.MISSING);
  });

  it('flags a word that is not translated', () => {
    const result = gradeQasasTranslation(sentence('QSS-C1-S04'), 'Azar would sell idols');
    expect(statusOf(result, 'وَ')).toBe(WORD_STATUS.MISSING);
    expect(result.correct).toBe(false);
    expect(result.correctCount).toBe(result.totalCount - 1);
  });

  it('does not count optional words against the student', () => {
    const result = gradeQasasTranslation(
      sentence('QSS-C2-S06'),
      'And he would know that the idols do not speak nor hear'
    );
    expect(result.correct).toBe(true);
  });

  it('treats an empty answer as all missing', () => {
    const result = gradeQasasTranslation(sentence('QSS-C7-S16'), '');
    expect(result.correct).toBe(false);
    expect(result.correctCount).toBe(0);
  });
});

describe('Qasas translation bank', () => {
  it('covers chapters 1 to 7 with unique ids and graded words', () => {
    expect(QASAS_TRANSLATION_CHAPTERS.map((chapter) => chapter.chapter)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    const ids = qasasTranslationQuestions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const question of qasasTranslationQuestions) {
      expect(question).toMatchObject({ topic: 'QSS', type: 'qasasTranslation' });
      expect(question.ar.length).toBeGreaterThan(0);
      expect(question.en.length).toBeGreaterThan(0);
      expect(question.words.some((word) => word.en.length > 0 && !word.optional)).toBe(true);
      for (const word of question.words) {
        expect(word.ar.length).toBeGreaterThan(0);
        if (word.en.length === 0) expect(word.note).toBeTruthy();
      }
    }
  });

  it('matches its source file (run npm run build:qasas-bank after editing the source)', () => {
    const source = readFileSync(
      resolve(here, '../../scripts/qasas-translation-source.txt'),
      'utf8'
    );
    const generated = readFileSync(resolve(here, '../data/arabic/qasas-translation.js'), 'utf8');
    expect(renderModule(parseSource(source))).toBe(generated);
  });
});
