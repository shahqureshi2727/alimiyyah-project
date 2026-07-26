import TafsirQuestionCard from '../../TafsirQuestionCard';

export default function TafsirQuizRenderer({ question, headingId, showFeedback, currentAnswer, onAnswer }) {
  return (
    <TafsirQuestionCard
      question={question}
      headingId={headingId}
      showFeedback={showFeedback}
      currentAnswer={currentAnswer}
      onAnswer={onAnswer}
    />
  );
}
