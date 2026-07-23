import { useMemo, useState } from 'react';
import { getTafsirQuestions, getTafsirVerseRecords } from '../data/tafsir';
import { useWeaknessTracking } from '../hooks/useWeaknessTracking';
import { scoreTafsirAnswer } from '../lib/tafsir-scoring';
import { shuffleArray } from '../lib/shuffle';
import TafsirQuestionCard from './TafsirQuestionCard';
import TafsirVerseCard from './TafsirVerseCard';
import './ModeCommon.css';
import './TafsirQuestionCard.css';
import './TafsirVerseCard.css';

function averageScore(results) {
  if (results.length === 0) return 0;
  const total = results.reduce((sum, result) => sum + result.score, 0);
  return Math.round((total / results.length) * 100);
}

export default function TafsirPracticeMode({
  variant = 'mcq',
  topic,
  onBack,
  score,
  setScore,
}) {
  const trackWeaknessAnswer = useWeaknessTracking();
  const isVerseMode = variant === 'verse';
  const questions = useMemo(
    () => (isVerseMode
      ? getTafsirVerseRecords(topic || 'all')
      : shuffleArray(getTafsirQuestions(topic || 'all'))),
    [isVerseMode, topic]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [verseAnswer, setVerseAnswer] = useState('');
  const [verseFeedback, setVerseFeedback] = useState(null);
  const [verseResults, setVerseResults] = useState([]);
  const [complete, setComplete] = useState(false);

  const current = questions[currentIndex];

  const handleMcqAnswer = (correct, answer) => {
    if (answered) return;
    setCurrentAnswer(answer);
    setAnswered(true);
    setSessionTotal((prev) => prev + 1);
    void trackWeaknessAnswer({ question: current, correct, mode: 'tafsir', index: currentIndex });
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleMcqNext = () => {
    setCurrentAnswer(null);
    setAnswered(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handleVerseSubmit = (event) => {
    event.preventDefault();
    if (verseFeedback || !verseAnswer.trim()) return;

    const feedback = scoreTafsirAnswer(
      current.referenceTranslation,
      verseAnswer,
      current.acceptableVariants
    );
    const correct = feedback.status === 'correct';
    const trackedQuestion = {
      ...current,
      id: `${current.id}-VERSE`,
      type: 'free-response',
    };

    setVerseFeedback(feedback);
    setSessionTotal((prev) => prev + 1);
    setVerseResults((prev) => [...prev, { verse: current, ...feedback }]);
    void trackWeaknessAnswer({ question: trackedQuestion, correct, mode: 'tafsir', index: currentIndex });

    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleVerseNext = () => {
    if (currentIndex >= questions.length - 1) {
      setComplete(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setVerseAnswer('');
    setVerseFeedback(null);
  };

  const handleReviewAgain = () => {
    setCurrentIndex(0);
    setVerseAnswer('');
    setVerseFeedback(null);
    setVerseResults([]);
    setSessionTotal(0);
    setComplete(false);
  };

  if (!current && !complete) {
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>Back</button>
        </header>
        <div className="mode-content">
          <p>No Tafsir questions available for this selection yet.</p>
        </div>
      </div>
    );
  }

  if (complete) {
    const correctCount = verseResults.filter((result) => result.status === 'correct').length;
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>Back</button>
          <span className="score">{correctCount} / {verseResults.length}</span>
        </header>
        <div className="mode-content">
          <div className="tafsir-summary">
            <span className="tafsir-summary-kicker">Surah complete</span>
            <h2>{questions[0]?.surahName || 'Tafsir'}</h2>
            <p>{averageScore(verseResults)}% average recall</p>
            <div className="tafsir-summary-list">
              {verseResults.map((result) => (
                <div key={result.verse.id} className={`tafsir-summary-row status-${result.status}`}>
                  <span>Ayah {result.verse.ayah}</span>
                  <span>{Math.round(result.score * 100)}%</span>
                </div>
              ))}
            </div>
            <div className="tafsir-summary-actions">
              <button className="next-btn" onClick={handleReviewAgain}>
                Review again
              </button>
              <button className="back-btn" onClick={onBack}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="mode-content">
        {isVerseMode ? (
          <TafsirVerseCard
            verse={current}
            answer={verseAnswer}
            setAnswer={setVerseAnswer}
            feedback={verseFeedback}
            onSubmit={handleVerseSubmit}
            onNext={handleVerseNext}
            isLastVerse={currentIndex >= questions.length - 1}
          />
        ) : (
          <>
            <TafsirQuestionCard
              question={current}
              showFeedback={answered}
              currentAnswer={currentAnswer}
              onAnswer={handleMcqAnswer}
            />

            {answered && (
              <button className="next-btn" onClick={handleMcqNext}>
                Next
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
