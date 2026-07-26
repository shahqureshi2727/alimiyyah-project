import { CheckIcon, XIcon } from './icons';

export default function RolesQuizRenderer({ question, showFeedback, currentAnswer, onAnswer }) {
  return (
    <>
      <h2 className="quiz-question-text">
        Tap the <span className="role-name">{question.role}</span>
      </h2>
      <div className={`quiz-words-container ${showFeedback ? 'feedback-shown' : ''}`} dir="rtl">
        {question.words.map((word, index) => {
          const isTapped = index === currentAnswer;
          const isCorrectAnswer = index === question.answerIndex;
          let className = 'quiz-tappable-word';

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
              key={index}
              className={className}
              onClick={() => onAnswer(index === question.answerIndex, index)}
              disabled={showFeedback}
            >
              {word}
              {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
              {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
            </button>
          );
        })}
      </div>
    </>
  );
}
