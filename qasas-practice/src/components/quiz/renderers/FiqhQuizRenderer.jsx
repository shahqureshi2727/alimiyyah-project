import FiqhQuestionCard from '../../FiqhQuestionCard';

export default function FiqhQuizRenderer({ question, showFeedback, currentAnswer, onAnswer }) {
  return (
    <FiqhQuestionCard
      question={question}
      showFeedback={showFeedback}
      currentAnswer={currentAnswer}
      onAnswer={onAnswer}
    />
  );
}
