import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  practicePath,
  quizPath,
  resolvePracticeRoute,
  resolveQuizRoute,
  routeTitle,
} from './app-routes';
import {
  practiceTargetForTopic,
  quizTargetForTopic,
  topicMetaForCode,
} from './topic-route-targets';

const appRoutesSource = readFileSync(fileURLToPath(import.meta.resolve('./app-routes.js')), 'utf8');

describe('app route helpers', () => {
  it('does not import question data while resolving URLs', () => {
    expect(appRoutesSource).not.toContain('../data/');
  });

  it('maps structured practice targets to URL params without encoded mode prefixes', () => {
    expect(practicePath({ mode: 'irab' })).toBe('/practice/irab');
    expect(practicePath({ mode: 'fiqh', topic: 'WUD' })).toBe('/practice/fiqh/WUD');
    expect(practicePath({ mode: 'hadith', topic: 'ARB40' })).toBe('/practice/hadith/ARB40');
    expect(practicePath({ mode: 'morphology', topic: 'mixed' })).toBe(
      '/practice/morphology/mixed'
    );
    expect(practicePath({ mode: 'tafsir', topic: 'ASR', variant: 'verse' })).toBe(
      '/practice/tafsir/ASR?variant=verse'
    );
  });

  it('maps quiz selections to canonical quiz URLs and leaderboard modes', () => {
    expect(quizPath({ mode: 'review' })).toEqual({
      path: '/quiz/review',
      leaderboardMode: 'review',
    });
    expect(quizPath({ mode: 'fiqh', topic: 'tahara' })).toEqual({
      path: '/quiz/fiqh/tahara',
      leaderboardMode: 'fiqh',
    });
    expect(quizPath({ mode: 'hadith', topic: 'ARB40' })).toEqual({
      path: '/quiz/hadith/ARB40',
      leaderboardMode: 'hadith',
    });
  });

  it('validates practice params from configured topics', () => {
    expect(resolvePracticeRoute({ mode: 'fiqh', topic: 'WUD' })).toMatchObject({
      status: 'ok',
      mode: 'fiqh',
      topic: 'WUD',
    });
    expect(resolvePracticeRoute({ mode: 'morphology', topic: 'mixed' })).toMatchObject({
      status: 'ok',
      mode: 'morphology',
      topic: 'mixed',
    });
    expect(resolvePracticeRoute({ mode: 'tafsir', topic: 'ASR', variant: 'verse' })).toMatchObject({
      status: 'ok',
      mode: 'tafsir',
      topic: 'ASR',
      variant: 'verse',
    });
    expect(resolvePracticeRoute({ mode: 'fiqh', topic: 'NOPE' })).toMatchObject({
      status: 'invalid',
    });
  });

  it('validates quiz params and rejects unknown modes before TimedQuiz renders', () => {
    expect(resolveQuizRoute({ mode: 'review' })).toMatchObject({ status: 'ok', mode: 'review' });
    expect(resolveQuizRoute({ mode: 'fiqh', topic: 'prayer' })).toMatchObject({
      status: 'ok',
      mode: 'fiqh',
      topic: 'prayer',
    });
    expect(resolveQuizRoute({ mode: 'fiqh', topic: 'NOPE' })).toMatchObject({ status: 'invalid' });
    expect(resolveQuizRoute({ mode: 'missing' })).toMatchObject({ status: 'invalid' });
  });

  it('returns legible titles for route metadata', () => {
    expect(routeTitle('home')).toBe('Alimiyyah Practice');
    expect(routeTitle('practice', { label: 'Wudhu' })).toBe(
      'Practice: Wudhu | Alimiyyah Practice'
    );
    expect(routeTitle('quiz', { label: 'Fiqh' })).toBe('Quiz: Fiqh | Alimiyyah Practice');
    expect(routeTitle('notFound')).toBe('Page Not Found | Alimiyyah Practice');
  });

  it('maps weakness topic codes to safe practice and quiz targets', () => {
    expect(topicMetaForCode('WUD')).toMatchObject({ label: 'Wudhu', subject: 'fiqh' });
    expect(practiceTargetForTopic('WUD')).toEqual({ mode: 'fiqh', topic: 'WUD' });
    expect(quizTargetForTopic('WUD')).toEqual({ mode: 'fiqh', topic: 'WUD' });

    expect(practiceTargetForTopic('ASR')).toEqual({ mode: 'tafsir', topic: 'ASR' });
    expect(quizTargetForTopic('ASR')).toEqual({ mode: 'tafsir', topic: 'ASR' });

    expect(practiceTargetForTopic('MOR_CMD_AMR')).toEqual({
      mode: 'morphology',
      topic: 'amrNahi',
    });
    expect(quizTargetForTopic('MOR_CMD_AMR')).toEqual({ mode: 'morphology' });

    expect(practiceTargetForTopic('NOPE')).toBe(null);
    expect(quizTargetForTopic('NOPE')).toBe(null);
  });
});
