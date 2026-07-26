import '../ModeCommon.css';

export default function PracticeShell({
  onBack,
  score,
  sessionTotal,
  children,
  contentClassName = '',
  nextVisible = false,
  onNext,
}) {
  return (
    <div className="mode-container">
      <header className="mode-header">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <span className="score">
          {score} / {sessionTotal}
        </span>
      </header>

      <div className={`mode-content ${contentClassName}`.trim()}>
        {children}
        {nextVisible && (
          <button className="next-btn" onClick={onNext}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
