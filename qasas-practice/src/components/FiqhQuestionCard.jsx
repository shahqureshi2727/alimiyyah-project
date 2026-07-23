import { useShuffledOptions } from '../hooks/useShuffledOptions';
import './FiqhQuestionCard.css';

const MADHHAB_LABELS = {
  Hanafi: 'Ḥanafī',
};

// Inline check/x icons matching the style used elsewhere in the app (TimedQuiz.jsx, IrabMode.jsx)
function CheckIcon() {
  return (
    <svg className="inline-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="inline-icon x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Renders one Fiqh question (MCQ or True/False) with feedback + explanation.
 * Used by both TimedQuiz (scored, timed) and FiqhPracticeMode (self-paced).
 *
 * @param {Object} props
 * @param {Object} props.question - a question object from src/data/fiqh
 * @param {boolean} props.showFeedback - whether to reveal correct/incorrect state
 * @param {*} props.currentAnswer - the answer the learner picked (option value for mcq, boolean for tf)
 * @param {(correct: boolean, answer: *) => void} props.onAnswer - called when the learner answers
 */
export default function FiqhQuestionCard({ question, showFeedback, currentAnswer, onAnswer }) {
  const shuffledOptions = useShuffledOptions(question.options, question.id);
  const madhhabBadge = question.madhhab && (
    <span className="fiqh-madhhab-badge">{MADHHAB_LABELS[question.madhhab] || question.madhhab}</span>
  );

  if (question.type === 'tf') {
    const tfOptions = [
      { value: true, label: 'True' },
      { value: false, label: 'False' },
    ];

    return (
      <div className="fiqh-question-card">
        {madhhabBadge}
        <h2 className="fiqh-question-prompt">{question.prompt}</h2>
        <div className={`fiqh-tf-choices ${showFeedback ? 'feedback-shown' : ''}`}>
          {tfOptions.map((opt) => {
            const isTapped = currentAnswer === opt.value;
            const isCorrectAnswer = opt.value === question.answer;
            let className = 'fiqh-choice-btn fiqh-tf-btn';

            if (showFeedback) {
              if (isTapped && isCorrectAnswer) className += ' correct-tapped';
              else if (isTapped && !isCorrectAnswer) className += ' incorrect-tapped';
              else if (isCorrectAnswer) className += ' correct-outline';
              else className += ' dimmed';
            }

            return (
              <button
                key={String(opt.value)}
                className={className}
                onClick={() => onAnswer(opt.value === question.answer, opt.value)}
                disabled={showFeedback}
              >
                {opt.label}
                {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
                {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
              </button>
            );
          })}
        </div>
        {showFeedback && <p className="fiqh-explanation">{question.explanation}</p>}
      </div>
    );
  }

  // mcq
  const correctAnswer = question.options[question.answerIndex];

  return (
    <div className="fiqh-question-card">
      {madhhabBadge}
      <h2 className="fiqh-question-prompt">{question.prompt}</h2>
      <div className={`fiqh-mcq-choices ${showFeedback ? 'feedback-shown' : ''}`}>
        {shuffledOptions.map((option, index) => {
          const isTapped = currentAnswer === option;
          const isCorrectAnswer = option === correctAnswer;
          let className = 'fiqh-choice-btn fiqh-mcq-btn';

          if (showFeedback) {
            if (isTapped && isCorrectAnswer) className += ' correct-tapped';
            else if (isTapped && !isCorrectAnswer) className += ' incorrect-tapped';
            else if (isCorrectAnswer) className += ' correct-outline';
            else className += ' dimmed';
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => onAnswer(option === correctAnswer, option)}
              disabled={showFeedback}
            >
              {option}
              {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
              {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
            </button>
          );
        })}
      </div>
      {showFeedback && <p className="fiqh-explanation">{question.explanation}</p>}
    </div>
  );
}
