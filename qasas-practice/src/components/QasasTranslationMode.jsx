import { useEffect, useState } from 'react';
import { qasasTranslation } from '../data/arabic';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { gradeQasasTranslation } from '../lib/qasas-grading';
import PracticeShell from './practice/PracticeShell';
import QasasTranslationCard from './QasasTranslationCard';

export default function QasasTranslationMode({ onBack }) {
  const session = usePracticeSession({
    bank: qasasTranslation,
    mode: 'qasasTranslation',
    checkAnswer: ({ answer }) => answer.correct,
  });
  const { current, score, sessionTotal, answered, selected, answer, next } = session;
  const [typed, setTyped] = useState('');

  const handleSubmit = () => {
    answer(gradeQasasTranslation(current, typed));
  };

  const handleNext = () => {
    setTyped('');
    next();
  };

  // After checking, Enter moves to the next sentence (the input is disabled).
  useEffect(() => {
    if (!answered) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Enter' || event.defaultPrevented) return;
      if (event.target instanceof HTMLElement && event.target.closest('button, a')) return;
      event.preventDefault();
      setTyped('');
      next();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answered, next]);

  return (
    <PracticeShell
      onBack={onBack}
      score={score}
      sessionTotal={sessionTotal}
      contentClassName="qasas-translation-content"
      nextVisible={answered}
      onNext={handleNext}
      title="Qasas translation practice"
    >
      <QasasTranslationCard
        key={current.id}
        question={current}
        headingId="qasas-practice-heading"
        answer={typed}
        onAnswerChange={setTyped}
        onSubmit={handleSubmit}
        result={answered ? selected : null}
      />
    </PracticeShell>
  );
}
