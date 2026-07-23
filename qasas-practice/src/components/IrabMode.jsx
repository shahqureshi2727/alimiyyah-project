import { useState, useMemo } from 'react';
import { irab } from '../data/arabic';
import { useWeaknessTracking } from '../hooks/useWeaknessTracking';
import { shuffleArray } from '../lib/shuffle';
import './ModeCommon.css';

function highlightTarget(sentence, target) {
  const index = sentence.indexOf(target);
  if (index === -1) return <span>{sentence}</span>;

  const before = sentence.slice(0, index);
  const after = sentence.slice(index + target.length);

  return (
    <>
      {before}
      <span className="highlight">{target}</span>
      {after}
    </>
  );
}

const choices = [
  { id: 'raf', ar: 'رَفْع', en: "raf'" },
  { id: 'nasb', ar: 'نَصْب', en: 'nasb' },
  { id: 'jarr', ar: 'جَرّ', en: 'jarr' },
];

export default function IrabMode({ onBack, score, setScore }) {
  const trackWeaknessAnswer = useWeaknessTracking();
  const questions = useMemo(() => shuffleArray(irab), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);

  const current = questions[currentIndex];

  const handleChoice = (choiceId) => {
    if (answered) return;
    setSelected(choiceId);
    setAnswered(true);
    setSessionTotal((prev) => prev + 1);
    const correct = choiceId === current.answer;
    void trackWeaknessAnswer({ question: current, correct, mode: 'irab', index: currentIndex });
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setAnswered(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
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

      <div className="mode-content">
        <h2 className="mode-title">What is the i'rab of the highlighted word?</h2>

        <div className="sentence-box" dir="rtl">
          {highlightTarget(current.sentence, current.target)}
        </div>

        <div className="choices">
          {choices.map((choice) => {
            let className = 'choice-btn';
            if (answered) {
              if (choice.id === current.answer) {
                className += ' correct';
              } else if (choice.id === selected) {
                className += ' incorrect';
              }
            } else if (choice.id === selected) {
              className += ' selected';
            }

            return (
              <button
                key={choice.id}
                className={className}
                onClick={() => handleChoice(choice.id)}
                disabled={answered}
              >
                <span className="choice-ar">{choice.ar}</span>
                <span className="choice-en">({choice.en})</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`feedback ${selected === current.answer ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              {selected === current.answer ? (
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
