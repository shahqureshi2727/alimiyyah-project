import { useAsyncQuestionBank } from '../hooks/useAsyncQuestionBank';
import { usePracticeSession } from '../hooks/usePracticeSession';
import HadithQuestionCard from './HadithQuestionCard';
import PracticeShell from './practice/PracticeShell';

export default function HadithPracticeMode({ topic, onBack }) {
  const { bank, loading, loadError, retryLoad } = useAsyncQuestionBank({
    mode: 'hadith',
    topic: topic || 'all',
  });
  const session = usePracticeSession({
    bank,
    mode: 'hadith',
    checkAnswer: ({ answer }) => answer.correct,
  });
  const { current, selected, answered, score, sessionTotal, answer, next } = session;

  if (loading) {
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
        </header>
        <div className="mode-content">
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
        </header>
        <div className="mode-content">
          <p>{loadError || 'No Hadith questions available for this topic yet.'}</p>
          {loadError && (
            <button className="next-btn" onClick={retryLoad}>
              Retry
            </button>
          )}
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
