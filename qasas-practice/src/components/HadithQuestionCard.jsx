import { useShuffledOptions } from '../hooks/useShuffledOptions';
import './HadithQuestionCard.css';

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

export default function HadithQuestionCard({ question, showFeedback, currentAnswer, onAnswer }) {
  const shuffledOptions = useShuffledOptions(question.options, question.id);
  const correctAnswer = question.options[question.answerIndex];

  return (
    <div className="hadith-question-card">
      <div className="hadith-source-row">
        <span className="hadith-source-badge">{question.collection}</span>
        <span className="hadith-number">Hadith {question.hadithNumber}</span>
      </div>
      <h2 className="hadith-question-prompt">{question.prompt}</h2>
      <div className="hadith-arabic-text" dir="rtl" lang="ar">
        {question.arabicText}
      </div>
      <div className={`hadith-mcq-choices ${showFeedback ? 'feedback-shown' : ''}`}>
        {shuffledOptions.map((option) => {
          const isTapped = currentAnswer === option;
          const isCorrectAnswer = option === correctAnswer;
          let className = 'hadith-choice-btn';

          if (showFeedback) {
            if (isTapped && isCorrectAnswer) className += ' correct-tapped';
            else if (isTapped && !isCorrectAnswer) className += ' incorrect-tapped';
            else if (isCorrectAnswer) className += ' correct-outline';
            else className += ' dimmed';
          }

          return (
            <button
              key={option}
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
      {showFeedback && (
        <p className="hadith-explanation">
          Correct: {question.correctTranslation}.
        </p>
      )}
    </div>
  );
}
