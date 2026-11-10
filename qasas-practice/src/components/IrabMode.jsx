import { irab } from '../data/arabic';
import { usePracticeSession } from '../hooks/usePracticeSession';
import PracticeShell from './practice/PracticeShell';

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

export default function IrabMode({ onBack }) {
  const session = usePracticeSession({
    bank: irab,
    mode: 'irab',
    checkAnswer: ({ question, answer }) => answer === question.answer,
  });
  const { current, selected, answered, score, sessionTotal, answer, next } = session;

  return (
    <PracticeShell onBack={onBack} score={score} sessionTotal={sessionTotal}>
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
              onClick={() => answer(choice.id)}
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
          <button className="next-btn" onClick={next}>
            Next
          </button>
        </div>
      )}
    </PracticeShell>
  );
}
