import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeaknessTracking } from './useWeaknessTracking';

const authState = vi.hoisted(() => ({
  current: {
    user: { uid: 'student-1' },
    username: 'student',
  },
}));
const submitAnswerEvents = vi.hoisted(() => vi.fn());
const logError = vi.hoisted(() => vi.fn());

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authState.current,
}));

vi.mock('../lib/quiz', () => ({
  submitAnswerEvents: (...args) => submitAnswerEvents(...args),
}));

vi.mock('../lib/logger', () => ({
  error: (...args) => logError(...args),
}));

describe('useWeaknessTracking', () => {
  beforeEach(() => {
    submitAnswerEvents.mockReset();
    logError.mockReset();
    authState.current = {
      user: { uid: 'student-1' },
      username: 'student',
    };
  });

  it('records the answered question as weakness telemetry for the signed-in student', async () => {
    submitAnswerEvents.mockResolvedValue(undefined);
    const { result } = renderHook(() => useWeaknessTracking());

    await act(async () => {
      await result.current({
        question: { id: 'FQH-WUD-Q1', topic: 'WUD' },
        correct: false,
        mode: 'fiqh',
        index: 0,
      });
    });

    expect(submitAnswerEvents).toHaveBeenCalledWith({
      userId: 'student-1',
      username: 'student',
      mode: 'fiqh',
      bankSource: 'fiqh',
      results: [
        {
          questionId: 'FQH-WUD-Q1',
          topic: 'WUD',
          group: 'tahara',
          correct: false,
        },
      ],
      quizResultId: null,
    });
  });

  it('does not write weakness telemetry for a signed-out visitor', async () => {
    authState.current = {
      user: null,
      username: null,
    };
    const { result } = renderHook(() => useWeaknessTracking());

    await act(async () => {
      await result.current({
        question: { id: 'FQH-WUD-Q1', topic: 'WUD' },
        correct: true,
        mode: 'fiqh',
      });
    });

    expect(submitAnswerEvents).not.toHaveBeenCalled();
  });

  it('logs write failures without interrupting practice', async () => {
    submitAnswerEvents.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useWeaknessTracking());

    await act(async () => {
      await result.current({
        question: { id: 'FQH-WUD-Q1', topic: 'WUD' },
        correct: true,
        mode: 'fiqh',
      });
    });

    expect(logError).toHaveBeenCalledWith(
      'Could not track weakness answer.',
      expect.any(Error),
      { mode: 'fiqh', questionId: 'FQH-WUD-Q1' }
    );
  });
});
