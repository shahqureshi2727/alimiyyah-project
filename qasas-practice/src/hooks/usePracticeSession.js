import { useCallback, useMemo, useState } from 'react';
import { shuffleArray } from '../lib/shuffle';
import { useWeaknessTracking } from './useWeaknessTracking';

export function usePracticeSession({ bank, mode, checkAnswer, shuffle = shuffleArray }) {
  const trackWeaknessAnswer = useWeaknessTracking();
  const questions = useMemo(() => shuffle(bank || []), [bank, shuffle]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);

  const current = questions[currentIndex];

  const answer = useCallback(
    (answerValue) => {
      if (answered || !current) return false;

      const correct = checkAnswer({ question: current, answer: answerValue });
      setSelected(answerValue);
      setAnswered(true);
      setSessionTotal((prev) => prev + 1);
      void trackWeaknessAnswer({ question: current, correct, mode, index: currentIndex });

      if (correct) {
        setScore((prev) => prev + 1);
      }

      return correct;
    },
    [answered, checkAnswer, current, currentIndex, mode, trackWeaknessAnswer]
  );

  const next = useCallback(() => {
    setSelected(null);
    setAnswered(false);
    setCurrentIndex((prev) => (questions.length > 0 ? (prev + 1) % questions.length : 0));
  }, [questions.length]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setSessionTotal(0);
  }, []);

  return {
    questions,
    current,
    currentIndex,
    selected,
    answered,
    score,
    sessionTotal,
    answer,
    next,
    reset,
  };
}
