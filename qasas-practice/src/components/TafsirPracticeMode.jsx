import { useCallback, useState } from 'react';
import { useAsyncQuestionBank } from '../hooks/useAsyncQuestionBank';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { useWeaknessTracking } from '../hooks/useWeaknessTracking';
import { scoreTafsirAnswer } from '../lib/tafsir-scoring';
import { loadTafsirVerseBank } from '../lib/quiz-banks';
import TafsirQuestionCard from './TafsirQuestionCard';
import TafsirVerseCard from './TafsirVerseCard';
import PracticeShell from './practice/PracticeShell';
import './ModeCommon.css';
import './TafsirQuestionCard.css';
import './TafsirVerseCard.css';

function averageScore(results) {
  if (results.length === 0) return 0;
  const total = results.reduce((sum, result) => sum + result.score, 0);
  return Math.round((total / results.length) * 100);
}

export default function TafsirPracticeMode({ variant = 'mcq', topic, onBack }) {
  const trackWeaknessAnswer = useWeaknessTracking();
  const isVerseMode = variant === 'verse';
  const loadVerseBank = useCallback(
    (_mode, nextTopic) => loadTafsirVerseBank(nextTopic),
    []
  );
  const {
    bank: mcqBank,
    loading: mcqLoading,
    loadError: mcqLoadError,
    retryLoad: retryMcqLoad,
  } = useAsyncQuestionBank({
    mode: isVerseMode ? null : 'tafsir',
    topic: topic || 'all',
  });
  const {
    bank: verseQuestions,
    loading: verseLoading,
    loadError: verseLoadError,
    retryLoad: retryVerseLoad,
  } = useAsyncQuestionBank({
    mode: isVerseMode ? 'tafsirVerse' : null,
    topic: topic || 'all',
    loader: loadVerseBank,
  });
  const mcqSession = usePracticeSession({
    bank: mcqBank,
    mode: 'tafsir',
    checkAnswer: ({ answer }) => answer.correct,
  });
  const [verseIndex, setVerseIndex] = useState(0);
  const [verseScore, setVerseScore] = useState(0);
  const [verseSessionTotal, setVerseSessionTotal] = useState(0);
  const [verseAnswer, setVerseAnswer] = useState('');
  const [verseFeedback, setVerseFeedback] = useState(null);
  const [verseResults, setVerseResults] = useState([]);
  const [complete, setComplete] = useState(false);
  const loading = isVerseMode ? verseLoading : mcqLoading;
  const loadError = isVerseMode ? verseLoadError : mcqLoadError;
  const retryLoad = isVerseMode ? retryVerseLoad : retryMcqLoad;

  const current = isVerseMode ? verseQuestions[verseIndex] : mcqSession.current;

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
    setVerseSessionTotal((prev) => prev + 1);
    setVerseResults((prev) => [...prev, { verse: current, ...feedback }]);
    void trackWeaknessAnswer({
      question: trackedQuestion,
      correct,
      mode: 'tafsir',
      index: verseIndex,
    });

    if (correct) {
      setVerseScore((prev) => prev + 1);
    }
  };

  const handleVerseNext = () => {
    if (verseIndex >= verseQuestions.length - 1) {
      setComplete(true);
      return;
    }

    setVerseIndex((prev) => prev + 1);
    setVerseAnswer('');
    setVerseFeedback(null);
  };

  const handleReviewAgain = () => {
    setVerseIndex(0);
    setVerseScore(0);
    setVerseAnswer('');
    setVerseFeedback(null);
    setVerseResults([]);
    setVerseSessionTotal(0);
    setComplete(false);
  };

  if (loading) {
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
        </header>
        <div className="mode-content">
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!current && !complete) {
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
        </header>
        <div className="mode-content">
          <p>{loadError || 'No Tafsir questions available for this selection yet.'}</p>
          {loadError && (
            <button className="next-btn" onClick={retryLoad}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (complete) {
    const correctCount = verseResults.filter((result) => result.status === 'correct').length;
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
          <span className="score">
            {correctCount} / {verseResults.length}
          </span>
        </header>
        <div className="mode-content">
          <div className="tafsir-summary">
            <span className="tafsir-summary-kicker">Surah complete</span>
            <h2>{verseQuestions[0]?.surahName || 'Tafsir'}</h2>
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
    <PracticeShell
      onBack={onBack}
      score={isVerseMode ? verseScore : mcqSession.score}
      sessionTotal={isVerseMode ? verseSessionTotal : mcqSession.sessionTotal}
      nextVisible={!isVerseMode && mcqSession.answered}
      onNext={mcqSession.next}
    >
      {isVerseMode ? (
        <TafsirVerseCard
          verse={current}
          answer={verseAnswer}
          setAnswer={setVerseAnswer}
          feedback={verseFeedback}
          onSubmit={handleVerseSubmit}
          onNext={handleVerseNext}
          isLastVerse={verseIndex >= verseQuestions.length - 1}
        />
      ) : (
        <TafsirQuestionCard
          question={current}
          showFeedback={mcqSession.answered}
          currentAnswer={mcqSession.selected?.answer || null}
          onAnswer={(correct, currentAnswer) =>
            mcqSession.answer({ correct, answer: currentAnswer })
          }
        />
      )}
    </PracticeShell>
  );
}
