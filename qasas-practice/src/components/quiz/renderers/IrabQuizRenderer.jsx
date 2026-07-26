import { CheckIcon, XIcon } from './icons';

const irabChoices = [
  { id: 'raf', ar: 'رَفْع', en: "raf'" },
  { id: 'nasb', ar: 'نَصْب', en: 'nasb' },
  { id: 'jarr', ar: 'جَرّ', en: 'jarr' },
];

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

export default function IrabQuizRenderer({ question, showFeedback, currentAnswer, onAnswer }) {
  return (
    <>
      <h2 className="quiz-question-text">What is the i'rab of the highlighted word?</h2>
      <div className="quiz-sentence" dir="rtl">
        {highlightTarget(question.sentence, question.target)}
      </div>
      <div className={`quiz-choices ${showFeedback ? 'feedback-shown' : ''}`}>
        {irabChoices.map((choice) => {
          const isTapped = choice.id === currentAnswer;
          const isCorrectAnswer = choice.id === question.answer;
          let className = 'quiz-choice-btn';

          if (showFeedback) {
            if (isTapped && isCorrectAnswer) {
              className += ' correct-tapped';
            } else if (isTapped && !isCorrectAnswer) {
              className += ' incorrect-tapped';
            } else if (isCorrectAnswer) {
              className += ' correct-outline';
            } else {
              className += ' dimmed';
            }
          }

          return (
            <button
              key={choice.id}
              className={className}
              onClick={() => onAnswer(choice.id === question.answer, choice.id)}
              disabled={showFeedback}
            >
              <span className="choice-ar">{choice.ar}</span>
              <span className="choice-en">({choice.en})</span>
              {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
              {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
            </button>
          );
        })}
      </div>
    </>
  );
}
