import { useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { QUIZ_MODES } from '../config/subjects';
import { useAuth } from '../contexts/AuthContext';
import { useCountdown } from '../hooks/useCountdown';
import { useQuizEngine } from '../hooks/useQuizEngine';
import { STANDARD_QUIZ_LENGTH } from '../lib/quiz-banks';
import ErrorBoundary from './ErrorBoundary';
import ExitDialog from './quiz/ExitDialog';
import QuestionRenderFallback from './quiz/QuestionRenderFallback';
import QuizQuestion from './quiz/QuizQuestion';
import QuizResults from './quiz/QuizResults';
import TimerRing from './quiz/TimerRing';
import './TimedQuiz.css';

export default function TimedQuiz({ mode, topic, onBack, onPlayAgain, onQuizComplete }) {
  const { user, username } = useAuth();
  const engine = useQuizEngine({ mode, topic, user, username, onQuizComplete });
  const [showExitDialog, setShowExitDialog] = useState(false);
  const allowNavigationRef = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowNavigationRef.current &&
      !engine.quizComplete &&
      currentLocation.pathname !== nextLocation.pathname
  );
  const navigationBlocked = blocker.state === 'blocked';
  const exitDialogVisible = showExitDialog || navigationBlocked;
  const timerRunning =
    !engine.quizComplete &&
    !engine.timerPaused &&
    !navigationBlocked &&
    !exitDialogVisible &&
    !engine.questionsLoading &&
    engine.questions.length > 0;
  const timerSeconds = QUIZ_MODES[mode].timerSeconds;
  const { timeLeft } = useCountdown({
    totalSeconds: timerSeconds,
    running: timerRunning,
    resetKey: `${mode}:${engine.currentIndex}:${engine.current?.id || ''}`,
    onTimeout: engine.handleTimeout,
  });

  const handleExitClick = () => {
    setShowExitDialog(true);
    engine.setTimerPaused(true);
  };

  const handleExitCancel = () => {
    setShowExitDialog(false);
    engine.setTimerPaused(false);
    if (navigationBlocked) {
      blocker.reset();
    }
  };

  const handleExitConfirm = () => {
    setShowExitDialog(false);
    allowNavigationRef.current = true;
    if (navigationBlocked) {
      blocker.proceed();
      return;
    }
    onBack();
  };

  if (engine.questionsLoading) return <div className="quiz-loading"><p>Loading quiz...</p></div>;

  if (engine.questions.length === 0) {
    return (
      <div className="quiz-loading quiz-loading-error">
        <p>{engine.loadError || 'No quiz questions are available for this selection.'}</p>
        {engine.loadError ? (
          <button className="quiz-check-btn" onClick={engine.retryLoad}>
            Retry
          </button>
        ) : (
          <button className="quiz-check-btn" onClick={onBack}>
            Back
          </button>
        )}
      </div>
    );
  }

  if (engine.quizComplete) return (
    <QuizResults
      score={engine.score}
      totalQuestions={engine.questions.length || STANDARD_QUIZ_LENGTH}
      totalDuration={engine.totalDuration}
      saveStatus={engine.saveStatus}
      onRetrySave={engine.retrySave}
      results={engine.results}
      onPlayAgain={onPlayAgain}
      onBack={onBack}
    />
  );

  return (
    <div className="timed-quiz">
      <button className="exit-quiz-btn" onClick={handleExitClick}>
        Exit quiz
      </button>

      <header className="quiz-header">
        <div className="quiz-progress">
          <span>Question {engine.currentIndex + 1} of {engine.questions.length}</span>
        </div>
        <TimerRing timeLeft={timeLeft} totalTime={timerSeconds} />
        <div className="quiz-score">
          <span>{engine.score} / {engine.currentIndex + (engine.showFeedback ? 1 : 0)}</span>
        </div>
      </header>

      {engine.loadError && <p className="quiz-load-warning">{engine.loadError}</p>}

      <div className="quiz-content">
        <ErrorBoundary
          name="Timed quiz question"
          resetKey={`${engine.currentIndex}:${engine.current?.id || engine.current?.topic || engine.currentMode}`}
          fallback={({ errorReferenceId, reset }) => (
            <QuestionRenderFallback
              errorReferenceId={errorReferenceId}
              onSkip={() => {
                reset();
                engine.handleSkipQuestion();
              }}
            />
          )}
        >
          <QuizQuestion
            mode={engine.currentMode}
            question={engine.current}
            showFeedback={engine.showFeedback}
            currentAnswer={engine.currentAnswer}
            isCorrect={engine.isCorrect}
            onAnswer={engine.handleAnswer}
          />
        </ErrorBoundary>
      </div>

      {exitDialogVisible && <ExitDialog onCancel={handleExitCancel} onConfirm={handleExitConfirm} />}
    </div>
  );
}
