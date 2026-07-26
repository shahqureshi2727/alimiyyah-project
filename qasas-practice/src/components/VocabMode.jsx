import { useState } from 'react';
import { vocab } from '../data/arabic';
import { usePracticeSession } from '../hooks/usePracticeSession';
import PracticeShell from './practice/PracticeShell';

export default function VocabMode({ onBack }) {
  const session = usePracticeSession({
    bank: vocab,
    mode: 'vocab',
    checkAnswer: ({ answer }) => answer,
  });
  const { current, score, sessionTotal, answer, next } = session;
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
    }
  };

  const handleGrade = (knew) => {
    answer(knew);
    setFlipped(false);
    next();
  };

  return (
    <PracticeShell
      onBack={onBack}
      score={score}
      sessionTotal={sessionTotal}
      contentClassName="vocab-content"
    >
      <h2 className="mode-title">Tap to reveal meaning</h2>

      <button
        type="button"
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={handleFlip}
        aria-disabled={flipped}
        aria-label={flipped ? 'Meaning revealed' : 'Reveal vocabulary meaning'}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front" dir="rtl" lang="ar">
            {current.ar}
          </div>
          <div className="flashcard-back">{current.en}</div>
        </div>
      </button>

      {flipped && (
        <div className="grade-buttons">
          <button className="grade-btn knew" onClick={() => handleGrade(true)}>
            Knew it
          </button>
          <button className="grade-btn didnt" onClick={() => handleGrade(false)}>
            Didn't know
          </button>
        </div>
      )}
    </PracticeShell>
  );
}
