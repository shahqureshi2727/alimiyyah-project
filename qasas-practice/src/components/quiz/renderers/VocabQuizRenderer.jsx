import { useEffect, useState } from 'react';

export default function VocabQuizRenderer({ question, showFeedback, currentAnswer, onAnswer }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (showFeedback || flipped) return undefined;

    const timer = setTimeout(() => {
      setFlipped(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [showFeedback, flipped]);

  return (
    <>
      <h2 className="quiz-question-text">
        {!flipped ? 'Tap to reveal meaning' : 'Did you know it?'}
      </h2>
      <div
        className={`quiz-flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front" dir="rtl">
            {question.ar}
          </div>
          <div className="flashcard-back">{question.en}</div>
        </div>
      </div>
      {flipped && (
        <div className={`quiz-grade-buttons ${showFeedback ? 'feedback-shown' : ''}`}>
          <button
            className={`grade-btn knew ${showFeedback && currentAnswer === 'knew' ? 'selected-knew' : ''} ${showFeedback && currentAnswer !== 'knew' ? 'dimmed' : ''}`}
            onClick={() => !showFeedback && onAnswer(true, 'knew')}
            disabled={showFeedback}
          >
            Knew it
          </button>
          <button
            className={`grade-btn didnt ${showFeedback && currentAnswer === 'didnt' ? 'selected-didnt' : ''} ${showFeedback && currentAnswer !== 'didnt' ? 'dimmed' : ''}`}
            onClick={() => !showFeedback && onAnswer(false, 'didnt')}
            disabled={showFeedback}
          >
            Didn't know
          </button>
        </div>
      )}
    </>
  );
}
