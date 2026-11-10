import { roles } from '../data/arabic';
import { usePracticeSession } from '../hooks/usePracticeSession';
import PracticeShell from './practice/PracticeShell';

export default function RoleMode({ onBack }) {
  const session = usePracticeSession({
    bank: roles,
    mode: 'roles',
    checkAnswer: ({ question, answer }) => answer === question.answerIndex,
  });
  const { current, selected: selectedIndex, answered, score, sessionTotal, answer, next } = session;
  const isCorrect = selectedIndex === current.answerIndex;

  return (
    <PracticeShell onBack={onBack} score={score} sessionTotal={sessionTotal}>
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
              onClick={() => answer(index)}
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
          <button className="next-btn" onClick={next}>
            Next
          </button>
        </div>
      )}
    </PracticeShell>
  );
}
