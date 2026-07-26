import HadithQuestionCard from '../../HadithQuestionCard';

export default function HadithQuizRenderer({ question, showFeedback, currentAnswer, onAnswer }) {
  return (
    <HadithQuestionCard
      question={question}
      showFeedback={showFeedback}
      currentAnswer={currentAnswer}
      onAnswer={onAnswer}
    />
  );
}
