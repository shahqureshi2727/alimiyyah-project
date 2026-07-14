import { useMemo, useState } from 'react';
import {
  MORPHOLOGY_SCOPE_LABELS,
  getMorphologyQuestions,
} from '../data/bank';
import './ModeCommon.css';

const scopeCards = [
  { id: 'mixed', description: 'All verb forms together' },
  { id: 'past', description: 'Active and passive madhi forms' },
  { id: 'mudari', description: 'Active, passive, and negative mudari forms' },
  { id: 'amrNahi', description: 'Second-person command forms' },
];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleOptions(question) {
  return {
    ...question,
    options: shuffleArray(question.options),
  };
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function MorphologyMode({ initialScope = null, onBack, score, setScore }) {
  const [scope, setScope] = useState(initialScope);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);

  const questions = useMemo(
    () => (scope ? shuffleArray(getMorphologyQuestions(scope)).map(shuffleOptions) : []),
    [scope]
  );

  const current = questions[currentIndex];

  const handleScopeSelect = (nextScope) => {
    setScope(nextScope);
    setCurrentIndex(0);
    setSelected(null);
    setAnswered(false);
  };

  const handleChoice = (option) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    setSessionTotal((prev) => prev + 1);
    if (option === current.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setAnswered(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handleBack = () => {
    if (scope && !initialScope) {
      setScope(null);
      setCurrentIndex(0);
      setSelected(null);
      setAnswered(false);
      return;
    }
    onBack();
  };

  if (!scope) {
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
          <span className="score">{score} / {sessionTotal}</span>
        </header>

        <div className="mode-content">
          <h2 className="mode-title">Choose a morphology practice</h2>
          <div className="morphology-scope-grid">
            {scopeCards.map((card) => {
              const label = MORPHOLOGY_SCOPE_LABELS[card.id];
              return (
                <button
                  key={card.id}
                  className="morphology-scope-card"
                  onClick={() => handleScopeSelect(card.id)}
                >
                  <span className="morphology-scope-ar" dir="rtl">{label.ar}</span>
                  <span className="morphology-scope-en">{label.en}</span>
                  <span className="morphology-scope-desc">{card.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const isCorrect = selected === current.answer;

  return (
    <div className="mode-container">
      <header className="mode-header">
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
        <span className="score">
          {score} / {sessionTotal}
        </span>
      </header>

      <div className="mode-content">
        <h2 className="mode-title">{MORPHOLOGY_SCOPE_LABELS[scope].en}</h2>

        <div className="morphology-card">
          <div className="morphology-verb" dir="rtl">{current.verb}</div>
          <div className="morphology-base" dir="rtl">
            <span>{current.baseVerb}</span>
            <span dir="ltr">= {current.baseMeaning}</span>
          </div>
          <div className="morphology-label" dir="rtl">{current.arabicLabel}</div>
        </div>

        <div className="choices morphology-choices">
          {current.options.map((option) => {
            let className = 'choice-btn morphology-choice-btn';
            if (answered) {
              if (option === current.answer) {
                className += ' correct';
              } else if (option === selected) {
                className += ' incorrect';
              }
            } else if (option === selected) {
              className += ' selected';
            }

            return (
              <button
                key={option}
                className={className}
                onClick={() => handleChoice(option)}
                disabled={answered}
              >
                <span className="choice-en">{option}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              {isCorrect ? <CheckIcon /> : <XIcon />}
            </div>
            <p className="feedback-reason">
              Correct: {current.answer}.<br />
              {current.explanation}
            </p>
            <button className="next-btn" onClick={handleNext}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
