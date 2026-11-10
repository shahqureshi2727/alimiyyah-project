import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuizEngine } from './useQuizEngine';

const { loadBank, submitQuizResult, submitAnswerEvents } = vi.hoisted(() => ({
  loadBank: vi.fn(),
  submitQuizResult: vi.fn(),
  submitAnswerEvents: vi.fn(),
}));

vi.mock('../lib/shuffle', () => ({
  shuffleArray: (items) => [...items],
}));

vi.mock('../lib/quiz-banks', async () => {
  const actual = await vi.importActual('../lib/quiz-banks');
  return {
    ...actual,
    loadBank: (...args) => loadBank(...args),
  };
});

vi.mock('../lib/quiz', () => ({
  submitQuizResult: (...args) => submitQuizResult(...args),
  submitAnswerEvents: (...args) => submitAnswerEvents(...args),
}));

vi.mock('../lib/topic-stats-firestore', () => ({
  getUserTopicStats: vi.fn(),
}));

vi.mock('../lib/repositories/answer-events', () => ({
  listMissedQuestionIds: vi.fn(),
}));

vi.mock('../lib/logger', () => ({
  error: vi.fn(),
  warn: vi.fn(),
}));

function fiqhQuestion(id, prompt, answerIndex = 0) {
  return {
    id,
    topic: 'WUD',
    type: 'mcq',
    prompt,
    options: [`${prompt} correct`, `${prompt} distractor`],
    answerIndex,
    explanation: `${prompt} explanation`,
  };
}

async function renderLoadedEngine(bank) {
  loadBank.mockResolvedValue(bank);
  const onQuizComplete = vi.fn();
  const user = { uid: 'student-1' };
  const rendered = renderHook(() =>
    useQuizEngine({
      mode: 'fiqh',
      topic: 'WUD',
      user,
      username: 'student',
      onQuizComplete,
    })
  );

  await waitFor(() => expect(rendered.result.current.questionsLoading).toBe(false));
  return { ...rendered, onQuizComplete };
}

describe('useQuizEngine', () => {
  beforeEach(() => {
    loadBank.mockReset();
    submitQuizResult.mockReset();
    submitAnswerEvents.mockReset();
    submitQuizResult.mockResolvedValue('quiz-1');
    submitAnswerEvents.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fills a standard quiz by repeating a small bank without changing value-based scoring', async () => {
    const { result } = await renderLoadedEngine([
      fiqhQuestion('FQH-WUD-Q1', 'first', 0),
      fiqhQuestion('FQH-WUD-Q2', 'second', 1),
    ]);

    expect(result.current.questions).toHaveLength(10);
    expect(result.current.questions.map((question) => question.id)).toEqual([
      'FQH-WUD-Q1',
      'FQH-WUD-Q2',
      'FQH-WUD-Q1',
      'FQH-WUD-Q2',
      'FQH-WUD-Q1',
      'FQH-WUD-Q2',
      'FQH-WUD-Q1',
      'FQH-WUD-Q2',
      'FQH-WUD-Q1',
      'FQH-WUD-Q2',
    ]);

    act(() => {
      result.current.handleAnswer(true, 'second correct');
    });

    expect(result.current.score).toBe(1);
    expect(result.current.results[0]).toMatchObject({
      correct: true,
      answerEvent: {
        questionId: 'FQH-WUD-Q1',
        topic: 'WUD',
        group: 'tahara',
        correct: true,
      },
    });
  });

  it('records an expired timer as an incorrect answer and advances to the next question', async () => {
    const { result } = await renderLoadedEngine([
      fiqhQuestion('FQH-WUD-Q1', 'first'),
      fiqhQuestion('FQH-WUD-Q2', 'second'),
    ]);
    vi.useFakeTimers();

    act(() => {
      result.current.handleTimeout();
    });

    expect(result.current.score).toBe(0);
    expect(result.current.currentAnswer).toBe('timeout');
    expect(result.current.results[0]).toMatchObject({
      correct: false,
      answerEvent: {
        questionId: 'FQH-WUD-Q1',
        correct: false,
      },
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.showFeedback).toBe(false);
  });

  it('surfaces quiz loading errors and retries the bank load', async () => {
    loadBank
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce([fiqhQuestion('FQH-WUD-Q1', 'first')]);
    const user = { uid: 'student-1' };
    const { result } = renderHook(() =>
      useQuizEngine({
        mode: 'fiqh',
        topic: 'WUD',
        user,
        username: 'student',
      })
    );

    await waitFor(() => expect(result.current.questionsLoading).toBe(false));
    expect(result.current.loadError).toBe("Couldn't load quiz questions. Retry.");
    expect(result.current.questions).toEqual([]);

    act(() => {
      result.current.retryLoad();
    });

    await waitFor(() => expect(result.current.questions).toHaveLength(10));
    expect(result.current.loadError).toBe(null);
  });

  it('shows a save error after the final answer when Firestore rejects the quiz result', async () => {
    submitQuizResult.mockRejectedValue(new Error('Firestore unavailable'));
    const { result, onQuizComplete } = await renderLoadedEngine([fiqhQuestion('FQH-WUD-Q1', 'first')]);
    vi.useFakeTimers();

    for (let index = 0; index < 10; index += 1) {
      act(() => {
        result.current.handleAnswer(index % 2 === 0, result.current.current.options[0]);
      });
      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });
    }

    expect(submitQuizResult).toHaveBeenCalledTimes(1);
    vi.useRealTimers();

    expect(result.current.quizComplete).toBe(true);
    await waitFor(() => expect(result.current.saveStatus).toBe('error'));
    expect(onQuizComplete).toHaveBeenCalledTimes(1);
    expect(result.current.score).toBe(5);
    expect(submitAnswerEvents).not.toHaveBeenCalled();
  });
});
