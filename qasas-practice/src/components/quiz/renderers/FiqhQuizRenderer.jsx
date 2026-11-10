import FiqhQuestionCard from '../../FiqhQuestionCard';

export default function FiqhQuizRenderer({ question, headingId, showFeedback, currentAnswer, onAnswer }) {
  return (
    <FiqhQuestionCard
      question={question}
      headingId={headingId}
      showFeedback={showFeedback}
      currentAnswer={currentAnswer}
      onAnswer={onAnswer}
    />
  );
}
