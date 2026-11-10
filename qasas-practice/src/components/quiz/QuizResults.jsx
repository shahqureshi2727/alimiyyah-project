import { formatDuration } from '../../lib/quiz';

export default function QuizResults({
  score,
  totalQuestions,
  totalDuration,
  saveStatus,
  onRetrySave,
  results,
  quizLabel,
  onPracticeMissed,
  onPlayAgain,
  onBack,
}) {
  const scoreRate = totalQuestions > 0 ? score / totalQuestions : 0;
  const isHighScore = scoreRate >= 0.9;
  const isGoodScore = scoreRate >= 0.6;
  const hasMissedTopics = results.some((result) => !result.correct);

  return (
    <div className="quiz-results">
      <div
        className={`results-header ${isHighScore ? 'high-score' : isGoodScore ? 'good-score' : 'low-score'}`}
      >
        <p className="results-context">You completed {quizLabel}</p>
        <h1 className="results-score">
          {score} / {totalQuestions}
        </h1>
        <p className="results-time">{formatDuration(Math.round(totalDuration))}</p>
        {isHighScore && <p className="results-message">Excellent work!</p>}
        {!isHighScore && isGoodScore && <p className="results-message">Good job! Keep practicing.</p>}
        {!isGoodScore && <p className="results-message">Keep going! You'll improve.</p>}
        <div className="save-status">
          {saveStatus === 'saving' && <span className="saving">Saving...</span>}
          {saveStatus === 'pending' && (
            <span className="saving">Sync pending. Keep this tab open.</span>
          )}
          {saveStatus === 'saved' && <span className="saved">Saved</span>}
          {saveStatus === 'error' && (
            <span className="error">
              Couldn't save quiz results.
              <button type="button" onClick={onRetrySave}>
                Retry
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="results-breakdown">
        <h2>Question review</h2>
        <div className="breakdown-list">
          {results.map((result, idx) => (
            <div key={idx} className={`breakdown-row ${result.correct ? 'correct' : 'incorrect'}`}>
              <span className="breakdown-num">Q{idx + 1}</span>
              <span className="breakdown-target" dir="rtl">
                {result.target}
              </span>
              <span className="breakdown-status">
                {result.correct ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </span>
              <span className="breakdown-time">{result.timeTaken.toFixed(1)}s</span>
            </div>
          ))}
        </div>
      </div>

      <div className="results-actions">
        {hasMissedTopics && onPracticeMissed && (
          <button className="play-again-btn" onClick={onPracticeMissed}>
            Practice missed topic
          </button>
        )}
        <button className="play-again-btn" onClick={onPlayAgain}>
          Play {quizLabel} again
        </button>
        <button className="home-btn" onClick={onBack}>
          Home
        </button>
      </div>
    </div>
  );
}
