import { useState, useMemo } from 'react';
import { vocab } from '../data/arabic';
import './ModeCommon.css';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function VocabMode({ onBack, score, setScore }) {
  const cards = useMemo(() => shuffleArray(vocab), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);

  const current = cards[currentIndex];

  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
    }
  };

  const handleGrade = (knew) => {
    setSessionTotal((prev) => prev + 1);
    if (knew) {
      setScore((prev) => prev + 1);
    }
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  return (
    <div className="mode-container">
      <header className="mode-header">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <span className="score">
          {score} / {sessionTotal}
        </span>
      </header>

      <div className="mode-content vocab-content">
        <h2 className="mode-title">Tap to reveal meaning</h2>

        <div
          className={`flashcard ${flipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front" dir="rtl">
              {current.ar}
            </div>
            <div className="flashcard-back">
              {current.en}
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}
