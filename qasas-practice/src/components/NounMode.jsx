import { useState, useMemo } from 'react';
import { nounFeatures } from '../data/arabic';
import { useWeaknessTracking } from '../hooks/useWeaknessTracking';
import { shuffleArray } from '../lib/shuffle';
import './ModeCommon.css';

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

export default function NounMode({ onBack, score, setScore }) {
  const trackWeaknessAnswer = useWeaknessTracking();
  const questions = useMemo(() => shuffleArray(nounFeatures), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDef, setSelectedDef] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState({ def: null, gender: null, number: null });
  const [sessionTotal, setSessionTotal] = useState(0);

  const current = questions[currentIndex];

  const canCheck = selectedDef && selectedGender && selectedNumber && !checked;

  const handleCheck = () => {
    const defCorrect = selectedDef === current.def;
    const genderCorrect = selectedGender === current.gender;
    const numberCorrect = selectedNumber === current.number;

    setResults({
      def: defCorrect,
      gender: genderCorrect,
      number: numberCorrect,
    });
    setChecked(true);
    setSessionTotal((prev) => prev + 1);

    const correct = defCorrect && genderCorrect && numberCorrect;
    void trackWeaknessAnswer({ question: current, correct, mode: 'nounFeatures', index: currentIndex });

    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedDef(null);
    setSelectedGender(null);
    setSelectedNumber(null);
    setChecked(false);
    setResults({ def: null, gender: null, number: null });
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const renderOptionGroup = (label, options, selected, setSelected, resultKey) => {
    return (
      <div className="option-group">
        <span className="option-label">{label}</span>
        <div className="option-buttons">
          {options.map((opt) => {
            let className = 'option-btn';
            if (checked) {
              const isCorrect = current[resultKey === 'def' ? 'def' : resultKey] === opt.id;
              if (isCorrect) {
                className += ' correct';
              } else if (opt.id === selected) {
                className += ' incorrect';
              }
            } else if (opt.id === selected) {
              className += ' selected';
            }

            return (
              <button
                key={opt.id}
                className={className}
                onClick={() => !checked && setSelected(opt.id)}
                disabled={checked}
              >
                <span className="opt-ar">{opt.ar}</span>
                <span className="opt-en">{opt.en}</span>
              </button>
            );
          })}
        </div>
        {checked && (
          <span className={`result-indicator ${results[resultKey] ? 'correct' : 'incorrect'}`}>
            {results[resultKey] ? (
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
        )}
      </div>
    );
  };

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
        <h2 className="mode-title">Tag the noun features</h2>

        <div className="word-display" dir="rtl">
          {current.word}
        </div>

        <div className="feature-groups">
          {renderOptionGroup('Definiteness', defOptions, selectedDef, setSelectedDef, 'def')}
          {renderOptionGroup('Gender', genderOptions, selectedGender, setSelectedGender, 'gender')}
          {renderOptionGroup('Number', numberOptions, selectedNumber, setSelectedNumber, 'number')}
        </div>

        {!checked ? (
          <button className="check-btn" onClick={handleCheck} disabled={!canCheck}>
            Check
          </button>
        ) : (
          <button className="next-btn" onClick={handleNext}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
