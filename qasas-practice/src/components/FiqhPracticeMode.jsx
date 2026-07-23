import { useState, useMemo } from 'react';
import { getFiqhQuestions } from '../data/fiqh';
import { useWeaknessTracking } from '../hooks/useWeaknessTracking';
import { shuffleArray } from '../lib/shuffle';
import FiqhQuestionCard from './FiqhQuestionCard';
import './ModeCommon.css';

export default function FiqhPracticeMode({ topic, onBack, score, setScore }) {
  const trackWeaknessAnswer = useWeaknessTracking();
  const questions = useMemo(() => shuffleArray(getFiqhQuestions(topic)), [topic]);
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
    void trackWeaknessAnswer({ question: current, correct, mode: 'fiqh', index: currentIndex });
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
          <p>No questions available for this topic yet.</p>
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
        <FiqhQuestionCard
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
