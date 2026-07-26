import HadithQuestionCard from '../../HadithQuestionCard';

export default function HadithQuizRenderer({ question, headingId, showFeedback, currentAnswer, onAnswer }) {
  return (
    <HadithQuestionCard
      question={question}
      headingId={headingId}
      showFeedback={showFeedback}
      currentAnswer={currentAnswer}
      onAnswer={onAnswer}
    />
  );
}
