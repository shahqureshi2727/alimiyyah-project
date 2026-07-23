import { useMemo } from 'react';
import { shuffleArray } from '../lib/shuffle';

// Shuffles `options` once per question instance (keyed on `questionId`), so
// the order stays stable across re-renders and after the user selects an
// answer — it does not re-shuffle on every render.
export function useShuffledOptions(options, questionId) {
  return useMemo(
    () => shuffleArray(options || []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on questionId only
    [questionId]
  );
}
