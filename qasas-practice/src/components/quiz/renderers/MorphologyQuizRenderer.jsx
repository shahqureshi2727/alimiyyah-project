import { CheckIcon, XIcon } from './icons';

export default function MorphologyQuizRenderer({
  question,
  showFeedback,
  currentAnswer,
  isCorrect,
  onAnswer,
}) {
  return (
    <>
      <h2 className="quiz-question-text">Choose the correct verb meaning</h2>
      <div className="quiz-morphology-card">
        <div className="quiz-word" dir="rtl">
          {question.verb}
        </div>
        <div className="quiz-morphology-base" dir="rtl">
          <span>{question.baseVerb}</span>
          <span dir="ltr">= {question.baseMeaning}</span>
        </div>
        <div className="quiz-morphology-label" dir="rtl">
          {question.arabicLabel}
        </div>
      </div>
      <div className={`quiz-choices ${showFeedback ? 'feedback-shown' : ''}`}>
        {question.options.map((option) => {
          const isTapped = option === currentAnswer;
          const isCorrectAnswer = option === question.answer;
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
              key={option}
              className={className}
              onClick={() => onAnswer(option === question.answer, option)}
              disabled={showFeedback}
            >
              <span className="choice-en">{option}</span>
              {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
              {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
            </button>
          );
        })}
      </div>
      {showFeedback && (
        <p className={`quiz-inline-explanation ${isCorrect ? 'correct' : 'incorrect'}`}>
          Correct: {question.answer}. {question.explanation}
        </p>
      )}
    </>
  );
}
