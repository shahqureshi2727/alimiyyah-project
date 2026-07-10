import { useState, useMemo } from 'react';
import { roles } from '../data/bank';
import './ModeCommon.css';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function RoleMode({ onBack, score, setScore }) {
  const questions = useMemo(() => shuffleArray(roles), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);

  const current = questions[currentIndex];

  const handleWordTap = (index) => {
    if (answered) return;
    setSelectedIndex(index);
    setAnswered(true);
    setSessionTotal((prev) => prev + 1);
    if (index === current.answerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedIndex(null);
    setAnswered(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const isCorrect = selectedIndex === current.answerIndex;

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

      <div className="mode-content">
        <h2 className="mode-title">
          Tap the <span className="role-name">{current.role}</span>
        </h2>

        <div className="words-container" dir="rtl">
          {current.words.map((word, index) => {
            let className = 'tappable-word';
            if (answered) {
              if (index === current.answerIndex) {
                className += ' correct';
              } else if (index === selectedIndex) {
                className += ' incorrect';
              }
            }

            return (
              <button
                key={index}
                className={className}
                onClick={() => handleWordTap(index)}
                disabled={answered}
              >
                {word}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              {isCorrect ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <p className="feedback-reason">{current.reason}</p>
            <button className="next-btn" onClick={handleNext}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
