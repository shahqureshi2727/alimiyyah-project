import { useCallback, useEffect, useRef, useState } from 'react';
import { QUIZ_MODES } from '../config/subjects';
import {
  DAILY_REVIEW_LENGTH,
  selectDailyReviewQuestions,
} from '../lib/daily-review';
import { questionResultFromAnswer } from '../lib/question-results';
import { submitAnswerEvents, submitQuizResult } from '../lib/quiz';
import { getBank, getQuestionTarget, selectQuestions } from '../lib/quiz-banks';
import { shuffleArray } from '../lib/shuffle';
import { getUserTopicStats } from '../lib/topic-stats-firestore';
import { error as logError } from '../lib/logger';
import { listMissedQuestionIds } from '../lib/repositories/answer-events';

const MISSED_QUESTIONS_LIMIT = 200;
const SAVE_PENDING_MS = 8000;

function currentTime() {
  return Date.now();
}

function shuffleMorphologyOptions(question) {
  return {
    ...question,
    options: shuffleArray(question.options),
  };
}

function prepareQuestions(questions, fallbackMode) {
  return questions.map((question) =>
    (question.reviewMode || fallbackMode) === 'morphology'
      ? shuffleMorphologyOptions(question)
      : question
  );
}

export function useQuizEngine({ mode, topic, user, username, onQuizComplete }) {
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loadRetryKey, setLoadRetryKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null);
  const startTimeRef = useRef(currentTime());
  const questionStartTimeRef = useRef(currentTime());
  const advanceTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setQuestionsLoading(true);
      setLoadError(null);
      setCurrentIndex(0);
      setScore(0);
      setResults([]);
      setShowFeedback(false);
      setCurrentAnswer(null);
      setIsCorrect(false);
      setQuizComplete(false);
      setSaveStatus(null);
      startTimeRef.current = currentTime();

      const bank = getBank(mode, topic);
      let selected;

      if (mode === 'review' && user) {
        const topicStats = await getUserTopicStats(user.uid);
        const missedIds = await listMissedQuestionIds({
          userId: user.uid,
          maxEvents: MISSED_QUESTIONS_LIMIT,
        });
        selected = selectDailyReviewQuestions({
          bank,
          topicStats,
          missedQuestionIds: missedIds,
          length: DAILY_REVIEW_LENGTH,
        });
      } else {
        selected = selectQuestions(bank).questions;
      }

      if (!cancelled) {
        setQuestions(prepareQuestions(selected, mode));
        questionStartTimeRef.current = currentTime();
        setQuestionsLoading(false);
      }
    }

    loadQuestions().catch((err) => {
      logError('Could not load quiz questions.', err, { mode, topic, uid: user?.uid });
      if (cancelled) return;

      try {
        const fallbackBank = getBank(mode, topic);
        const fallback =
          mode === 'review'
            ? selectDailyReviewQuestions({ bank: fallbackBank, length: DAILY_REVIEW_LENGTH })
            : selectQuestions(fallbackBank).questions;
        setQuestions(prepareQuestions(fallback, mode));
        setLoadError(
          mode === 'review'
            ? "Couldn't load daily review data. Using a regular review set."
            : "Couldn't load quiz data. Retry."
        );
      } catch (fallbackErr) {
        logError('Could not load fallback quiz questions.', fallbackErr, { mode, topic });
        setQuestions([]);
        setLoadError("Couldn't load quiz questions. Retry.");
      } finally {
        questionStartTimeRef.current = currentTime();
        setQuestionsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mode, topic, user, loadRetryKey]);

  const current = questions[currentIndex];
  const currentMode = current?.reviewMode || mode;

  const advanceQuestion = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    if (currentIndex >= questions.length - 1) {
      const duration = (currentTime() - startTimeRef.current) / 1000;
      setTotalDuration(duration);
      setQuizComplete(true);
      onQuizComplete?.();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setShowFeedback(false);
    setCurrentAnswer(null);
    setIsCorrect(false);
    setTimerPaused(false);
    questionStartTimeRef.current = currentTime();
  }, [currentIndex, onQuizComplete, questions.length]);

  const scheduleAdvance = useCallback(() => {
    advanceTimerRef.current = setTimeout(() => advanceQuestion(), 1000);
  }, [advanceQuestion]);

  const recordResult = useCallback(
    ({ question, correct, answerEvent, target, timeTaken }) => {
      setResults((prev) => [
        ...prev,
        {
          question,
          correct,
          timeTaken,
          target,
          answerEvent,
        },
      ]);
    },
    []
  );

  const handleTimeout = useCallback(() => {
    if (quizComplete || showFeedback || !current) return;

    const questionTime = (currentTime() - questionStartTimeRef.current) / 1000;
    setIsCorrect(false);
    setCurrentAnswer('timeout');
    setShowFeedback(true);
    setTimerPaused(true);
    recordResult({
      question: current,
      correct: false,
      timeTaken: questionTime,
      target: getQuestionTarget(currentMode, current),
      answerEvent: questionResultFromAnswer({
        question: current,
        correct: false,
        mode: currentMode,
        index: currentIndex,
      }),
    });
    scheduleAdvance();
  }, [current, currentIndex, currentMode, quizComplete, recordResult, scheduleAdvance, showFeedback]);

  const handleAnswer = useCallback(
    (correct, answer) => {
      if (showFeedback || quizComplete || !current) return;

      const questionTime = (currentTime() - questionStartTimeRef.current) / 1000;
      setIsCorrect(correct);
      setCurrentAnswer(answer);
      setShowFeedback(true);
      setTimerPaused(true);

      if (correct) {
        setScore((prev) => prev + 1);
      }

      recordResult({
        question: current,
        correct,
        timeTaken: questionTime,
        target: getQuestionTarget(currentMode, current),
        answerEvent: questionResultFromAnswer({
          question: current,
          correct,
          mode: currentMode,
          index: currentIndex,
        }),
      });
      scheduleAdvance();
    },
    [current, currentIndex, currentMode, quizComplete, recordResult, scheduleAdvance, showFeedback]
  );

  const handleSkipQuestion = useCallback(() => {
    if (quizComplete) return;

    const questionTime = (currentTime() - questionStartTimeRef.current) / 1000;
    let targetDisplay = `Question ${currentIndex + 1}`;

    try {
      targetDisplay = getQuestionTarget(currentMode, current) || targetDisplay;
    } catch (err) {
      logError('Could not read skipped question target.', err, { mode: currentMode });
    }

    recordResult({
      question: current,
      correct: false,
      timeTaken: questionTime,
      target: targetDisplay,
      answerEvent: current
        ? questionResultFromAnswer({
            question: current,
            correct: false,
            mode: currentMode,
            index: currentIndex,
          })
        : null,
    });
    advanceQuestion();
  }, [advanceQuestion, current, currentIndex, currentMode, quizComplete, recordResult]);

  useEffect(() => {
    if (!quizComplete || saveStatus) return;
    let cancelled = false;
    let pendingTimer = null;

    const saveResult = async () => {
      setSaveStatus('saving');
      pendingTimer = setTimeout(() => {
        if (!cancelled) setSaveStatus('pending');
      }, SAVE_PENDING_MS);

      try {
        const quizResultId = await submitQuizResult({
          userId: user.uid,
          username,
          mode,
          bankSource: QUIZ_MODES[mode].bankSource,
          score,
          total: questions.length,
          durationSeconds: Math.round(totalDuration),
        });
        await submitAnswerEvents({
          userId: user.uid,
          username,
          mode,
          bankSource: QUIZ_MODES[mode].bankSource,
          results: results.map((result) => result.answerEvent).filter(Boolean),
          quizResultId,
        });
        if (cancelled) return;
        clearTimeout(pendingTimer);
        setSaveStatus('saved');
      } catch (err) {
        if (cancelled) return;
        clearTimeout(pendingTimer);
        logError('Could not save quiz result.', err, {
          mode,
          uid: user?.uid,
          score,
          total: questions.length,
        });
        setSaveStatus('error');
      }
    };

    saveResult();

    return () => {
      cancelled = true;
      if (pendingTimer) clearTimeout(pendingTimer);
    };
  }, [
    quizComplete,
    user,
    username,
    mode,
    score,
    totalDuration,
    saveStatus,
    results,
    questions.length,
  ]);

  return {
    questions,
    questionsLoading,
    loadError,
    retryLoad: () => setLoadRetryKey((key) => key + 1),
    current,
    currentMode,
    currentIndex,
    score,
    results,
    showFeedback,
    currentAnswer,
    isCorrect,
    quizComplete,
    totalDuration,
    saveStatus,
    retrySave: () => setSaveStatus(null),
    timerPaused,
    setTimerPaused,
    handleAnswer,
    handleTimeout,
    handleSkipQuestion,
  };
}
