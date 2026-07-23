import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { QUIZ_MODES, TAFSIR_TOPICS } from '../config/subjects';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(here, '..');

function source(path) {
  return readFileSync(resolve(srcRoot, path), 'utf8');
}

describe('tafsir app integration', () => {
  it('registers Tafsir as a timed quiz mode with visible topics', () => {
    expect(QUIZ_MODES.tafsir).toEqual({
      label: 'Tafsir',
      bankSource: 'tafsir',
      timerSeconds: 25,
    });
    expect(TAFSIR_TOPICS.map((topic) => topic.code)).toEqual([
      'ASR',
      'FIL',
      'QUR',
      'MAU',
      'KAW',
      'KAF',
    ]);
  });

  it('wires Tafsir into home navigation, timed quizzes, admin, and strength map', () => {
    expect(source('components/HomeScreen.jsx')).toContain('getTafsirSurahOptions');
    expect(source('components/HomeScreen.jsx')).toContain('Surah Selection');
    expect(source('App.jsx')).toContain('TafsirPracticeMode');
    expect(source('components/QuizPicker.jsx')).toContain('tafsir');
    expect(source('components/TimedQuiz.jsx')).toContain('getTafsirQuestions');
    expect(source('components/TimedQuiz.jsx')).toContain('TafsirQuestionCard');
    expect(source('components/AdminPage.jsx')).toContain('getTafsirQuestions');
    expect(source('components/WeaknessDashboard.jsx')).toContain('TAFSIR_TOPICS');
  });
});
