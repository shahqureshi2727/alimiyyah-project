import { useState } from 'react';
import { CheckIcon, XIcon } from './icons';

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

export default function NounFeaturesQuizRenderer({ question, showFeedback, onAnswer }) {
  const [selectedDef, setSelectedDef] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const allSelected = selectedDef && selectedGender && selectedNumber;

  const checkAnswer = () => {
    const correct =
      selectedDef === question.def &&
      selectedGender === question.gender &&
      selectedNumber === question.number;
    onAnswer(correct, { selectedDef, selectedGender, selectedNumber });
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
      <div className="quiz-word" dir="rtl">
        {question.word}
      </div>
      <div className="quiz-feature-groups">
        {renderNounOptionGroup('Definiteness', defOptions, selectedDef, setSelectedDef, question.def)}
        {renderNounOptionGroup('Gender', genderOptions, selectedGender, setSelectedGender, question.gender)}
        {renderNounOptionGroup('Number', numberOptions, selectedNumber, setSelectedNumber, question.number)}
      </div>
      {!showFeedback && (
        <button className="quiz-check-btn" onClick={checkAnswer} disabled={!allSelected}>
          Check
        </button>
      )}
    </>
  );
}
