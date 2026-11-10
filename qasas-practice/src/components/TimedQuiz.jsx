import { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';
import { QUIZ_MODES } from '../config/subjects';
import { useAuth } from '../contexts/AuthContext';
import { useCountdown } from '../hooks/useCountdown';
import { useQuizEngine } from '../hooks/useQuizEngine';
import { practicePath, resolveQuizRoute } from '../lib/app-routes';
import { STANDARD_QUIZ_LENGTH } from '../lib/quiz-banks';
import { practiceTargetForTopic } from '../lib/topic-route-targets';
import AppState from './AppState';
import ErrorBoundary from './ErrorBoundary';
import ExitDialog from './quiz/ExitDialog';
import QuestionRenderFallback from './quiz/QuestionRenderFallback';
import QuizQuestion from './quiz/QuizQuestion';
import QuizResults from './quiz/QuizResults';
import TimerRing from './quiz/TimerRing';
import './TimedQuiz.css';

export default function TimedQuiz({ mode, topic, onBack, onPlayAgain, onQuizComplete }) {
  const { user, username } = useAuth();
  const navigate = useNavigate();
  const engine = useQuizEngine({ mode, topic, user, username, onQuizComplete });
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [timerAnnouncement, setTimerAnnouncement] = useState('');
  const [expiryAnnouncement, setExpiryAnnouncement] = useState('');
  const allowNavigationRef = useRef(false);
  const exitButtonRef = useRef(null);
  const questionRegionRef = useRef(null);
  const announcedThresholdsRef = useRef(new Set());
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
  const quizRoute = resolveQuizRoute({ mode, topic });
  const quizLabel = quizRoute.status === 'ok' ? quizRoute.label : QUIZ_MODES[mode].label;
  const { timeLeft } = useCountdown({
    totalSeconds: timerSeconds,
    running: timerRunning,
    resetKey: `${mode}:${engine.currentIndex}:${engine.current?.id || ''}`,
    onTimeout: engine.handleTimeout,
  });
  const questionsLoading = engine.questionsLoading;
  const quizComplete = engine.quizComplete;
  const currentQuestion = engine.current;
  const currentIndex = engine.currentIndex;

  useEffect(() => {
    if (questionsLoading || quizComplete || !currentQuestion) return undefined;
    announcedThresholdsRef.current = new Set();

    const focusTimer = setTimeout(() => {
      questionRegionRef.current?.focus();
    }, 0);

    return () => clearTimeout(focusTimer);
  }, [currentQuestion, currentIndex, questionsLoading, quizComplete]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const thresholds = [60, 30, 10];
    if (thresholds.includes(timeLeft) && !announcedThresholdsRef.current.has(timeLeft)) {
      announcedThresholdsRef.current.add(timeLeft);
      const announceTimer = setTimeout(() => {
        setTimerAnnouncement(`Question ${currentIndex + 1}: ${timeLeft} seconds remaining.`);
      }, 0);
      return () => clearTimeout(announceTimer);
    }
    return undefined;
  }, [currentIndex, timeLeft, timerRunning]);

  useEffect(() => {
    if (timeLeft === 0 && !quizComplete) {
      const announceTimer = setTimeout(() => {
        setExpiryAnnouncement(`Question ${currentIndex + 1}: time expired. Moving to the next question.`);
      }, 0);
      return () => clearTimeout(announceTimer);
    }
    return undefined;
  }, [currentIndex, quizComplete, timeLeft]);

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

  const missedPracticeTarget = engine.results
    .map((result) => result.answerEvent?.topic)
    .filter(Boolean)
    .find((topicCode, index, topics) => topics.indexOf(topicCode) === index && practiceTargetForTopic(topicCode));

  const handlePracticeMissed = missedPracticeTarget
    ? () => navigate(practicePath(practiceTargetForTopic(missedPracticeTarget)))
    : null;

  if (engine.questionsLoading)
    return (
      <AppState
        className="quiz-loading"
        tone="loading"
        title="Loading quiz"
        message={`Preparing ${quizLabel}.`}
      />
    );

  if (engine.questions.length === 0) {
    return (
      <AppState
        className="quiz-loading"
        tone={engine.loadError ? 'error' : 'empty'}
        title={engine.loadError ? 'Quiz unavailable' : 'No questions yet'}
        message={engine.loadError || 'No quiz questions are available for this selection.'}
        actionLabel={engine.loadError ? 'Retry' : 'Back to home'}
        onAction={engine.loadError ? engine.retryLoad : onBack}
      />
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
      quizLabel={quizLabel}
      onPracticeMissed={handlePracticeMissed}
      onPlayAgain={onPlayAgain}
      onBack={onBack}
    />
  );

  const answeredCount = engine.currentIndex + (engine.showFeedback ? 1 : 0);
  const feedbackMessage = engine.showFeedback
    ? engine.currentAnswer === 'timeout'
      ? `Time expired. Incorrect. Score ${engine.score} out of ${answeredCount}.`
      : `${engine.isCorrect ? 'Correct' : 'Incorrect'}. Score ${engine.score} out of ${answeredCount}.`
    : '';

  return (
    <main className="timed-quiz" aria-labelledby="quiz-title">
      <h1 id="quiz-title" className="sr-only">
        {quizLabel}
      </h1>
      <header className="quiz-header">
        <button ref={exitButtonRef} className="exit-quiz-btn" onClick={handleExitClick}>
          Exit quiz
        </button>
        <div className="quiz-progress" aria-live="polite">
          <span>Question {engine.currentIndex + 1} of {engine.questions.length}</span>
        </div>
        <TimerRing timeLeft={timeLeft} totalTime={timerSeconds} />
        <div className="quiz-score" aria-live="polite" aria-label={`Score ${engine.score} out of ${answeredCount}`}>
          <span>{engine.score} / {answeredCount}</span>
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        {timerAnnouncement}
      </p>
      <p className="sr-only" aria-live="assertive">
        {expiryAnnouncement}
      </p>
      <p className="sr-only" aria-live="polite">
        {feedbackMessage}
      </p>

      {engine.loadError && (
        <p className="quiz-load-warning" role="status">
          {engine.loadError}
        </p>
      )}

      <section
        ref={questionRegionRef}
        className="quiz-content"
        tabIndex="-1"
        aria-labelledby="quiz-question-heading"
        aria-describedby="quiz-progress-text"
      >
        <p id="quiz-progress-text" className="sr-only">
          Question {engine.currentIndex + 1} of {engine.questions.length}
        </p>
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
            headingId="quiz-question-heading"
            showFeedback={engine.showFeedback}
            currentAnswer={engine.currentAnswer}
            isCorrect={engine.isCorrect}
            onAnswer={engine.handleAnswer}
          />
        </ErrorBoundary>
      </section>

      {exitDialogVisible && (
        <ExitDialog
          onCancel={handleExitCancel}
          onConfirm={handleExitConfirm}
          restoreFocusTo={exitButtonRef}
        />
      )}
    </main>
  );
}
