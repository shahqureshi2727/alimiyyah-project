import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { submitQuizResult, formatDuration } from '../lib/quiz';
import { irab, nounFeatures, roles, vocab } from '../data/bank';
import { getFiqhQuestions } from '../data/fiqh';
import { QUIZ_MODES } from '../config/subjects';
import FiqhQuestionCard from './FiqhQuestionCard';
import './TimedQuiz.css';

const QUIZ_LENGTH = 10;

const BANKS = {
  irab,
  nounFeatures,
  roles,
  vocab,
  // 'fiqh' is intentionally absent here — its bank depends on the selected
  // topic, so it's resolved dynamically in getBank() below instead of a
  // static import.
};

function getBank(mode, topic) {
  if (mode === 'fiqh') return getFiqhQuestions(topic || 'all');
  return BANKS[mode];
}

// Shuffle array using Fisher-Yates
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Select 10 unique questions, with wraparound if bank is too small
function selectQuestions(bank) {
  if (bank.length < QUIZ_LENGTH) {
    console.warn(`Bank has only ${bank.length} items, less than ${QUIZ_LENGTH}. Allowing repeats.`);
    const shuffled = shuffleArray(bank);
    const questions = [];
    for (let i = 0; i < QUIZ_LENGTH; i++) {
      questions.push(shuffled[i % shuffled.length]);
    }
    return questions;
  }
  return shuffleArray(bank).slice(0, QUIZ_LENGTH);
}

// I'rab question choices
const irabChoices = [
  { id: 'raf', ar: 'رَفْع', en: "raf'" },
  { id: 'nasb', ar: 'نَصْب', en: 'nasb' },
  { id: 'jarr', ar: 'جَرّ', en: 'jarr' },
];

// Noun feature options
const defOptions = [
  { id: 'marifa', ar: 'مَعْرِفَة', en: 'definite' },
  { id: 'nakirah', ar: 'نَكِرَة', en: 'indefinite' },
];

const genderOptions = [
  { id: 'm', ar: 'مُذَكَّر', en: 'masculine' },
  { id: 'f', ar: 'مُؤَنَّث', en: 'feminine' },
];

const numberOptions = [
  { id: 'sing', ar: 'مُفْرَد', en: 'singular' },
  { id: 'dual', ar: 'مُثَنَّى', en: 'dual' },
  { id: 'plural', ar: 'جَمْع', en: 'plural' },
];

function highlightTarget(sentence, target) {
  const index = sentence.indexOf(target);
  if (index === -1) return <span>{sentence}</span>;

  const before = sentence.slice(0, index);
  const after = sentence.slice(index + target.length);

  return (
    <>
      {before}
      <span className="highlight">{target}</span>
      {after}
    </>
  );
}

// Timer ring component
function TimerRing({ timeLeft, totalTime }) {
  const progress = timeLeft / totalTime;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  let colorClass = 'timer-green';
  if (progress <= 0.25) {
    colorClass = 'timer-red';
  } else if (progress <= 0.5) {
    colorClass = 'timer-amber';
  }

  return (
    <div className="timer-ring-container">
      <svg className="timer-ring" viewBox="0 0 100 100">
        <circle
          className="timer-ring-bg"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
        />
        <circle
          className={`timer-ring-progress ${colorClass}`}
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className={`timer-text ${colorClass}`}>{timeLeft}</span>
    </div>
  );
}

// Confetti component for high scores
function Confetti() {
  return (
    <div className="confetti-container">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            backgroundColor: ['#1a6b6d', '#22863a', '#ea580c', '#7c3aed', '#db2777'][i % 5],
          }}
        />
      ))}
    </div>
  );
}

// Exit confirmation dialog
function ExitDialog({ onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    // Focus cancel button by default (safer)
    cancelRef.current?.focus();

    // Handle Escape
    function handleEscape(e) {
      if (e.key === 'Escape') {
        onCancel();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="exit-dialog-overlay">
      <div className="exit-dialog" role="alertdialog" aria-modal="true">
        <h2>Exit quiz?</h2>
        <p>Your progress won't be saved.</p>
        <div className="exit-dialog-buttons">
          <button
            ref={cancelRef}
            className="exit-dialog-btn cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="exit-dialog-btn confirm"
            onClick={onConfirm}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline check icon
function CheckIcon() {
  return (
    <svg className="inline-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Inline X icon
function XIcon() {
  return (
    <svg className="inline-icon x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function TimedQuiz({ mode, topic, onBack, onPlayAgain, onExitRequest }) {
  const { user, username } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_MODES[mode].timerSeconds);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [totalDuration, setTotalDuration] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null); // null, 'saving', 'saved', 'error'
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Noun feature specific state
  const [selectedDef, setSelectedDef] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);

  // Vocab specific state
  const [flipped, setFlipped] = useState(false);
  const [vocabChoice, setVocabChoice] = useState(null); // 'knew' or 'didnt'

  const timerRef = useRef(null);

  // Initialize questions on mount
  useEffect(() => {
    const bank = getBank(mode, topic);
    const selected = selectQuestions(bank);
    setQuestions(selected);
    setQuestionStartTime(Date.now());
  }, [mode, topic]);

  // Timer effect
  useEffect(() => {
    if (quizComplete || isTimerPaused || questions.length === 0 || showExitDialog) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return QUIZ_MODES[mode].timerSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, quizComplete, isTimerPaused, questions.length, mode, showExitDialog]);

  // Vocab auto-flip after 4 seconds
  useEffect(() => {
    if (mode !== 'vocab' || quizComplete || showFeedback || flipped) return;

    const timer = setTimeout(() => {
      setFlipped(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentIndex, mode, quizComplete, showFeedback, flipped]);

  // Handle browser back button
  useEffect(() => {
    if (quizComplete) return;

    const handlePopState = (e) => {
      e.preventDefault();
      // Push state back to prevent navigation
      window.history.pushState(null, '', window.location.pathname);
      setShowExitDialog(true);
      setIsTimerPaused(true);
    };

    // Push initial state
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [quizComplete]);

  const handleTimeout = useCallback(() => {
    if (quizComplete || showFeedback) return;

    const questionTime = (Date.now() - questionStartTime) / 1000;
    const current = questions[currentIndex];

    setIsCorrect(false);
    setCurrentAnswer('timeout');
    setShowFeedback(true);
    setIsTimerPaused(true);

    // Record result
    const targetDisplay = getQuestionTarget(mode, current);
    setResults(prev => [...prev, {
      question: current,
      correct: false,
      timeTaken: questionTime,
      target: targetDisplay,
    }]);

    setTimeout(() => advanceQuestion(), 1000);
  }, [currentIndex, questions, questionStartTime, quizComplete, showFeedback, mode]);

  const advanceQuestion = () => {
    if (currentIndex >= QUIZ_LENGTH - 1) {
      // Quiz complete
      const duration = (Date.now() - startTime) / 1000;
      setTotalDuration(duration);
      setQuizComplete(true);
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setTimeLeft(QUIZ_MODES[mode].timerSeconds);
    setShowFeedback(false);
    setCurrentAnswer(null);
    setIsCorrect(false);
    setIsTimerPaused(false);
    setQuestionStartTime(Date.now());

    // Reset mode-specific state
    setSelectedDef(null);
    setSelectedGender(null);
    setSelectedNumber(null);
    setFlipped(false);
    setVocabChoice(null);
  };

  const getQuestionTarget = (mode, question) => {
    switch (mode) {
      case 'irab':
        return question.target;
      case 'nounFeatures':
        return question.word;
      case 'roles':
        return question.words[question.answerIndex];
      case 'vocab':
        return question.ar;
      case 'fiqh':
        return question.prompt;
      default:
        return '';
    }
  };

  const handleAnswer = (correct, answer) => {
    if (showFeedback || quizComplete) return;

    const questionTime = (Date.now() - questionStartTime) / 1000;
    const current = questions[currentIndex];

    setIsCorrect(correct);
    setCurrentAnswer(answer);
    setShowFeedback(true);
    setIsTimerPaused(true);

    if (correct) {
      setScore(prev => prev + 1);
    }

    // For vocab, track the choice
    if (mode === 'vocab') {
      setVocabChoice(answer);
    }

    // Record result
    const targetDisplay = getQuestionTarget(mode, current);
    setResults(prev => [...prev, {
      question: current,
      correct,
      timeTaken: questionTime,
      target: targetDisplay,
    }]);

    setTimeout(() => advanceQuestion(), 1000);
  };

  const handleExitClick = () => {
    setShowExitDialog(true);
    setIsTimerPaused(true);
  };

  const handleExitCancel = () => {
    setShowExitDialog(false);
    setIsTimerPaused(false);
  };

  const handleExitConfirm = () => {
    // Discard quiz without saving
    setShowExitDialog(false);
    onBack();
  };

  // Submit quiz result when complete
  useEffect(() => {
    if (!quizComplete || saveStatus) return;

    const saveResult = async () => {
      setSaveStatus('saving');
      try {
        await submitQuizResult({
          userId: user.uid,
          username,
          mode,
          bankSource: QUIZ_MODES[mode].bankSource,
          score,
          durationSeconds: Math.round(totalDuration),
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Error saving quiz result:', err);
        setSaveStatus('error');
      }
    };

    saveResult();
  }, [quizComplete, user, username, mode, score, totalDuration, saveStatus]);

  if (questions.length === 0) {
    return (
      <div className="quiz-loading">
        <p>Loading quiz...</p>
      </div>
    );
  }

  // Results screen
  if (quizComplete) {
    const isHighScore = score >= 9;

    return (
      <div className="quiz-results">
        {isHighScore && <Confetti />}
        <div className={`results-header ${isHighScore ? 'high-score' : score >= 6 ? 'good-score' : 'low-score'}`}>
          <h1 className="results-score">{score} / {QUIZ_LENGTH}</h1>
          <p className="results-time">{formatDuration(Math.round(totalDuration))}</p>
          {isHighScore && <p className="results-message">Excellent work!</p>}
          {!isHighScore && score >= 6 && <p className="results-message">Good job! Keep practicing.</p>}
          {score < 6 && <p className="results-message">Keep going! You'll improve.</p>}
          <div className="save-status">
            {saveStatus === 'saving' && <span className="saving">Saving...</span>}
            {saveStatus === 'saved' && <span className="saved">Saved</span>}
            {saveStatus === 'error' && <span className="error">Could not save (offline?)</span>}
          </div>
        </div>

        <div className="results-breakdown">
          <h2>Question Breakdown</h2>
          <div className="breakdown-list">
            {results.map((result, idx) => (
              <div key={idx} className={`breakdown-row ${result.correct ? 'correct' : 'incorrect'}`}>
                <span className="breakdown-num">Q{idx + 1}</span>
                <span className="breakdown-target" dir="rtl">{result.target}</span>
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
          <button className="play-again-btn" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="home-btn" onClick={onBack}>
            Home
          </button>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];

  // Render question based on mode
  const renderQuestion = () => {
    switch (mode) {
      case 'irab':
        return (
          <>
            <h2 className="quiz-question-text">What is the i'rab of the highlighted word?</h2>
            <div className="quiz-sentence" dir="rtl">
              {highlightTarget(current.sentence, current.target)}
            </div>
            <div className={`quiz-choices ${showFeedback ? 'feedback-shown' : ''}`}>
              {irabChoices.map((choice) => {
                const isTapped = choice.id === currentAnswer;
                const isCorrectAnswer = choice.id === current.answer;
                let className = 'quiz-choice-btn';

                if (showFeedback) {
                  if (isTapped && isCorrectAnswer) {
                    className += ' correct-tapped';
                  } else if (isTapped && !isCorrectAnswer) {
                    className += ' incorrect-tapped';
                  } else if (isCorrectAnswer) {
                    className += ' correct-outline';
                  } else {
                    className += ' dimmed';
                  }
                }

                return (
                  <button
                    key={choice.id}
                    className={className}
                    onClick={() => handleAnswer(choice.id === current.answer, choice.id)}
                    disabled={showFeedback}
                  >
                    <span className="choice-ar">{choice.ar}</span>
                    <span className="choice-en">({choice.en})</span>
                    {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
                    {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
                  </button>
                );
              })}
            </div>
          </>
        );

      case 'nounFeatures':
        const allSelected = selectedDef && selectedGender && selectedNumber;
        const checkAnswer = () => {
          const correct = selectedDef === current.def &&
                         selectedGender === current.gender &&
                         selectedNumber === current.number;
          handleAnswer(correct, { selectedDef, selectedGender, selectedNumber });
        };

        const renderNounOptionGroup = (label, options, selected, setSelected, correctValue) => (
          <div className="quiz-option-group">
            <span className="quiz-option-label">{label}</span>
            <div className={`quiz-option-buttons ${showFeedback ? 'feedback-shown' : ''}`}>
              {options.map((opt) => {
                const isTapped = opt.id === selected;
                const isCorrectAnswer = opt.id === correctValue;
                let className = 'quiz-option-btn';

                if (showFeedback) {
                  if (isTapped && isCorrectAnswer) {
                    className += ' correct-tapped';
                  } else if (isTapped && !isCorrectAnswer) {
                    className += ' incorrect-tapped';
                  } else if (isCorrectAnswer) {
                    className += ' correct-outline';
                  } else {
                    className += ' dimmed';
                  }
                } else if (opt.id === selected) {
                  className += ' selected';
                }

                return (
                  <button
                    key={opt.id}
                    className={className}
                    onClick={() => !showFeedback && setSelected(opt.id)}
                    disabled={showFeedback}
                  >
                    <span className="opt-ar">{opt.ar}</span>
                    <span className="opt-en">{opt.en}</span>
                    {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
                    {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
                  </button>
                );
              })}
            </div>
          </div>
        );

        return (
          <>
            <h2 className="quiz-question-text">Tag the noun features</h2>
            <div className="quiz-word" dir="rtl">{current.word}</div>
            <div className="quiz-feature-groups">
              {renderNounOptionGroup('Definiteness', defOptions, selectedDef, setSelectedDef, current.def)}
              {renderNounOptionGroup('Gender', genderOptions, selectedGender, setSelectedGender, current.gender)}
              {renderNounOptionGroup('Number', numberOptions, selectedNumber, setSelectedNumber, current.number)}
            </div>
            {!showFeedback && (
              <button
                className="quiz-check-btn"
                onClick={checkAnswer}
                disabled={!allSelected}
              >
                Check
              </button>
            )}
          </>
        );

      case 'roles':
        return (
          <>
            <h2 className="quiz-question-text">
              Tap the <span className="role-name">{current.role}</span>
            </h2>
            <div className={`quiz-words-container ${showFeedback ? 'feedback-shown' : ''}`} dir="rtl">
              {current.words.map((word, index) => {
                const isTapped = index === currentAnswer;
                const isCorrectAnswer = index === current.answerIndex;
                let className = 'quiz-tappable-word';

                if (showFeedback) {
                  if (isTapped && isCorrectAnswer) {
                    className += ' correct-tapped';
                  } else if (isTapped && !isCorrectAnswer) {
                    className += ' incorrect-tapped';
                  } else if (isCorrectAnswer) {
                    className += ' correct-outline';
                  } else {
                    className += ' dimmed';
                  }
                }

                return (
                  <button
                    key={index}
                    className={className}
                    onClick={() => handleAnswer(index === current.answerIndex, index)}
                    disabled={showFeedback}
                  >
                    {word}
                    {showFeedback && isTapped && isCorrectAnswer && <CheckIcon />}
                    {showFeedback && isTapped && !isCorrectAnswer && <XIcon />}
                  </button>
                );
              })}
            </div>
          </>
        );

      case 'vocab':
        return (
          <>
            <h2 className="quiz-question-text">
              {!flipped ? 'Tap to reveal meaning' : 'Did you know it?'}
            </h2>
            <div
              className={`quiz-flashcard ${flipped ? 'flipped' : ''}`}
              onClick={() => !flipped && setFlipped(true)}
            >
              <div className="flashcard-inner">
                <div className="flashcard-front" dir="rtl">
                  {current.ar}
                </div>
                <div className="flashcard-back">
                  {current.en}
                </div>
              </div>
            </div>
            {flipped && (
              <div className={`quiz-grade-buttons ${showFeedback ? 'feedback-shown' : ''}`}>
                <button
                  className={`grade-btn knew ${showFeedback && vocabChoice === 'knew' ? 'selected-knew' : ''} ${showFeedback && vocabChoice !== 'knew' ? 'dimmed' : ''}`}
                  onClick={() => !showFeedback && handleAnswer(true, 'knew')}
                  disabled={showFeedback}
                >
                  Knew it
                </button>
                <button
                  className={`grade-btn didnt ${showFeedback && vocabChoice === 'didnt' ? 'selected-didnt' : ''} ${showFeedback && vocabChoice !== 'didnt' ? 'dimmed' : ''}`}
                  onClick={() => !showFeedback && handleAnswer(false, 'didnt')}
                  disabled={showFeedback}
                >
                  Didn't know
                </button>
              </div>
            )}
          </>
        );

      case 'fiqh':
        return (
          <FiqhQuestionCard
            question={current}
            showFeedback={showFeedback}
            currentAnswer={currentAnswer}
            onAnswer={handleAnswer}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="timed-quiz">
      {/* Exit quiz button */}
      <button className="exit-quiz-btn" onClick={handleExitClick}>
        Exit quiz
      </button>

      <header className="quiz-header">
        <div className="quiz-progress">
          <span>Question {currentIndex + 1} of {QUIZ_LENGTH}</span>
        </div>
        <TimerRing timeLeft={timeLeft} totalTime={QUIZ_MODES[mode].timerSeconds} />
        <div className="quiz-score">
          <span>{score} / {currentIndex + (showFeedback ? 1 : 0)}</span>
        </div>
      </header>

      <div className="quiz-content">
        {renderQuestion()}
      </div>

      {/* Exit confirmation dialog */}
      {showExitDialog && (
        <ExitDialog
          onCancel={handleExitCancel}
          onConfirm={handleExitConfirm}
        />
      )}
    </div>
  );
}
