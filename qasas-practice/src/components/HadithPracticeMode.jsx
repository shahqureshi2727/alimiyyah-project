import { useMemo } from 'react';
import { getHadithQuestions } from '../data/hadith';
import { usePracticeSession } from '../hooks/usePracticeSession';
import HadithQuestionCard from './HadithQuestionCard';
import PracticeShell from './practice/PracticeShell';

export default function HadithPracticeMode({ topic, onBack }) {
  const bank = useMemo(() => getHadithQuestions(topic || 'all'), [topic]);
  const session = usePracticeSession({
    bank,
    mode: 'hadith',
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
          <p>No Hadith questions available for this topic yet.</p>
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
      <HadithQuestionCard
        question={current}
        showFeedback={answered}
        currentAnswer={selected?.answer || null}
        onAnswer={(correct, currentAnswer) => answer({ correct, answer: currentAnswer })}
      />
    </PracticeShell>
  );
}
