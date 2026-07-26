import { describe, expect, it } from 'vitest';
import {
  practicePath,
  quizPath,
  resolvePracticeRoute,
  resolveQuizRoute,
  routeTitle,
} from './app-routes';

describe('app route helpers', () => {
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

  it('validates practice params from configured topics with real question banks', () => {
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
    expect(routeTitle('home')).toBe('Qasas Practice');
    expect(routeTitle('practice', { label: 'Wudhu' })).toBe('Practice: Wudhu | Qasas Practice');
    expect(routeTitle('quiz', { label: 'Fiqh' })).toBe('Quiz: Fiqh | Qasas Practice');
    expect(routeTitle('notFound')).toBe('Page Not Found | Qasas Practice');
  });
});
