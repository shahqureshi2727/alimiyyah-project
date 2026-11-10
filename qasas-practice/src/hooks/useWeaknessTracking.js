import { useCallback } from 'react';
import { QUIZ_MODES } from '../config/subjects';
import { useAuth } from '../contexts/AuthContext';
import { submitAnswerEvents } from '../lib/quiz';
import { questionResultFromAnswer } from '../lib/question-results';
import { error as logError } from '../lib/logger';

export function useWeaknessTracking() {
  const { user, username } = useAuth();

  return useCallback(
    async ({ question, correct, mode, index = 0 }) => {
      if (!user) return;

      try {
        await submitAnswerEvents({
          userId: user.uid,
          username,
          mode,
          bankSource: QUIZ_MODES[mode]?.bankSource || 'qasas',
          results: [
            questionResultFromAnswer({
              question,
              correct,
              mode,
              index,
            }),
          ],
          quizResultId: null,
        });
      } catch (err) {
        logError('Could not track weakness answer.', err, { mode, questionId: question?.id });
      }
    },
    [user, username]
  );
}
