import TafsirQuestionCard from '../../TafsirQuestionCard';

export default function TafsirQuizRenderer({ question, showFeedback, currentAnswer, onAnswer }) {
  return (
    <TafsirQuestionCard
      question={question}
      showFeedback={showFeedback}
      currentAnswer={currentAnswer}
      onAnswer={onAnswer}
    />
  );
}
