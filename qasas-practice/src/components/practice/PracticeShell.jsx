import '../ModeCommon.css';

export default function PracticeShell({
  onBack,
  backLabel = 'Home',
  score,
  sessionTotal,
  children,
  contentClassName = '',
  nextVisible = false,
  onNext,
  title = 'Practice session',
}) {
  return (
    <main className="mode-container" aria-labelledby="practice-title">
      <h1 id="practice-title" className="sr-only">
        {title}
      </h1>
      <header className="mode-header">
        <button className="back-btn" onClick={onBack}>
          {backLabel}
        </button>
        <span className="score">
          {score} / {sessionTotal}
        </span>
      </header>

      <section className={`mode-content ${contentClassName}`.trim()}>
        {children}
        {nextVisible && (
          <button className="next-btn" onClick={onNext}>
            Next
          </button>
        )}
      </section>
    </main>
  );
}
