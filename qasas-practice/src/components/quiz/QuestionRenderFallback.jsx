export default function QuestionRenderFallback({ errorReferenceId, onSkip }) {
  return (
    <section className="quiz-render-error" role="alert">
      <p className="quiz-render-error-ref">Reference {errorReferenceId}</p>
      <h2>This question could not be shown.</h2>
      <p>Skip this question and keep going. The attempt will stay open.</p>
      <button type="button" className="quiz-check-btn" onClick={onSkip}>
        Skip this question
      </button>
    </section>
  );
}
