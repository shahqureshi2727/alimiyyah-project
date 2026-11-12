import { useMemo, useState } from 'react';
import { gradeQasasTranslation } from '../../../lib/qasas-grading';
import QasasTranslationCard from '../../QasasTranslationCard';

export default function QasasTranslationQuizRenderer({
  question,
  headingId,
  showFeedback,
  currentAnswer,
  onAnswer,
}) {
  const [typed, setTyped] = useState('');
  const timedOut = showFeedback && currentAnswer === 'timeout';

  // When time runs out we still grade whatever was typed so the student sees
  // the breakdown, but the engine has already recorded the sentence as missed.
  const result = useMemo(() => {
    if (!showFeedback) return null;
    if (currentAnswer && typeof currentAnswer === 'object') return currentAnswer;
    return gradeQasasTranslation(question, typed);
  }, [currentAnswer, question, showFeedback, typed]);

  const handleSubmit = () => {
    const graded = gradeQasasTranslation(question, typed);
    onAnswer(graded.correct, graded);
  };

  return (
    <QasasTranslationCard
      question={question}
      headingId={headingId}
      answer={typed}
      onAnswerChange={setTyped}
      onSubmit={handleSubmit}
      result={result}
      timedOut={timedOut}
    />
  );
}
