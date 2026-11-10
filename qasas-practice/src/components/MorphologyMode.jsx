import { useMemo, useState } from 'react';
import { MORPHOLOGY_SCOPE_LABELS, getMorphologyQuestions } from '../data/morphology';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { useShuffledOptions } from '../hooks/useShuffledOptions';
import PracticeShell from './practice/PracticeShell';

const scopeCards = [
  { id: 'mixed', description: 'All verb forms together' },
  { id: 'past', description: 'Active and passive madhi forms' },
  { id: 'mudari', description: 'Active, passive, and negative mudari forms' },
  { id: 'amrNahi', description: 'Second-person command forms' },
];

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

export default function MorphologyMode({
  initialScope = null,
  onBack,
  onSelectScope,
}) {
  const [scope, setScope] = useState(initialScope);
  const bank = useMemo(() => (scope ? getMorphologyQuestions(scope) : []), [scope]);
  const session = usePracticeSession({
    bank,
    mode: 'morphology',
    checkAnswer: ({ question, answer }) => answer === question.answer,
  });
  const {
    current,
    selected,
    answered,
    score,
    sessionTotal,
    answer,
    next,
  } = session;
  const shuffledOptions = useShuffledOptions(current?.options, current?.id);

  const handleScopeSelect = (nextScope) => {
    if (onSelectScope) {
      onSelectScope(nextScope);
      return;
    }
    setScope(nextScope);
  };

  const handleBack = () => {
    if (scope && !initialScope) {
      setScope(null);
      return;
    }
    onBack();
  };

  if (!scope) {
    return (
      <PracticeShell onBack={onBack} backLabel="Home" score={score} sessionTotal={sessionTotal}>
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
                  <span className="morphology-scope-ar" dir="rtl">
                    {label.ar}
                  </span>
                  <span className="morphology-scope-en">{label.en}</span>
                  <span className="morphology-scope-desc">{card.description}</span>
                </button>
              );
            })}
          </div>
      </PracticeShell>
    );
  }

  const isCorrect = selected === current.answer;

  return (
    <PracticeShell
      onBack={handleBack}
      backLabel={initialScope ? 'Home' : 'Change morphology scope'}
      score={score}
      sessionTotal={sessionTotal}
    >
        <h2 className="mode-title">{MORPHOLOGY_SCOPE_LABELS[scope].en}</h2>

        <div className="morphology-card">
          <div className="morphology-verb" dir="rtl">
            {current.verb}
          </div>
          <div className="morphology-base" dir="rtl">
            <span>{current.baseVerb}</span>
            <span dir="ltr">= {current.baseMeaning}</span>
          </div>
          <div className="morphology-label" dir="rtl">
            {current.arabicLabel}
          </div>
        </div>

        <div className="choices morphology-choices">
          {shuffledOptions.map((option) => {
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
                onClick={() => answer(option)}
                disabled={answered}
              >
                <span className="choice-en">{option}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">{isCorrect ? <CheckIcon /> : <XIcon />}</div>
            <p className="feedback-reason">
              Correct: {current.answer}.<br />
              {current.explanation}
            </p>
            <button className="next-btn" onClick={next}>
              Next
            </button>
          </div>
        )}
    </PracticeShell>
  );
}
