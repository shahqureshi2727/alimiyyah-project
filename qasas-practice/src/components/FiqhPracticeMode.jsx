import { useMemo } from 'react';
import { getFiqhQuestions } from '../data/fiqh';
import { usePracticeSession } from '../hooks/usePracticeSession';
import FiqhQuestionCard from './FiqhQuestionCard';
import PracticeShell from './practice/PracticeShell';

export default function FiqhPracticeMode({ topic, onBack }) {
  const bank = useMemo(() => getFiqhQuestions(topic), [topic]);
  const session = usePracticeSession({
    bank,
    mode: 'fiqh',
    checkAnswer: ({ answer }) => answer.correct,
  });
  const { current, selected, answered, score, sessionTotal, answer, next } = session;

  if (!current) {
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
        </header>
        <div className="mode-content">
          <p>No questions available for this topic yet.</p>
        </div>
      </div>
    );
  }

  return (
    <PracticeShell
      onBack={onBack}
      score={score}
      sessionTotal={sessionTotal}
      nextVisible={answered}
      onNext={next}
    >
      <FiqhQuestionCard
        question={current}
        showFeedback={answered}
        currentAnswer={selected?.answer || null}
        onAnswer={(correct, currentAnswer) => answer({ correct, answer: currentAnswer })}
      />
    </PracticeShell>
  );
}
