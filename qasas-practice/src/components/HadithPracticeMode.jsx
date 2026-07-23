import { useMemo, useState } from 'react';
import { getHadithQuestions } from '../data/hadith';
import { useWeaknessTracking } from '../hooks/useWeaknessTracking';
import { shuffleArray } from '../lib/shuffle';
import HadithQuestionCard from './HadithQuestionCard';
import './ModeCommon.css';

export default function HadithPracticeMode({ topic, onBack, score, setScore }) {
  const trackWeaknessAnswer = useWeaknessTracking();
  const questions = useMemo(() => shuffleArray(getHadithQuestions(topic || 'all')), [topic]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);

  const current = questions[currentIndex];

  const handleAnswer = (correct, answer) => {
    if (answered) return;
    setCurrentAnswer(answer);
    setAnswered(true);
    setSessionTotal((prev) => prev + 1);
    void trackWeaknessAnswer({ question: current, correct, mode: 'hadith', index: currentIndex });
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setCurrentAnswer(null);
    setAnswered(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  if (!current) {
    return (
      <div className="mode-container">
        <header className="mode-header">
          <button className="back-btn" onClick={onBack}>Back</button>
        </header>
        <div className="mode-content">
          <p>No Hadith questions available for this topic yet.</p>
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
        <HadithQuestionCard
          question={current}
          showFeedback={answered}
          currentAnswer={currentAnswer}
          onAnswer={handleAnswer}
        />

        {answered && (
          <button className="next-btn" onClick={handleNext}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
