import { useState, useMemo } from 'react';
import { getFiqhQuestions } from '../data/fiqh';
import FiqhQuestionCard from './FiqhQuestionCard';
import './ModeCommon.css';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function FiqhPracticeMode({ topic, onBack, score, setScore }) {
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
