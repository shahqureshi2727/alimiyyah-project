import './QuizPicker.css';

const quizModes = [
  {
    id: 'irab',
    titleAr: 'تَحْدِيدُ الإِعْرَاب',
    titleEn: "I'rab",
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    id: 'nounFeatures',
    titleAr: 'صِفَاتُ الاسْم',
    titleEn: 'Noun Features',
    format: '10 questions',
    timer: '10 sec per question',
  },
  {
    id: 'roles',
    titleAr: 'الدَّوْرُ النَّحْوِي',
    titleEn: 'Grammatical Role',
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    id: 'vocab',
    titleAr: 'المُفْرَدَات',
    titleEn: 'Vocabulary',
    format: '10 cards',
    timer: '10 sec per card',
  },
];

export default function QuizPicker({ onSelectMode, onBack }) {
  return (
    <div className="quiz-picker">
      <header className="quiz-picker-header">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <h1 className="quiz-picker-title">Choose a Quiz</h1>
        <div className="spacer"></div>
      </header>

      <div className="quiz-mode-list">
        {quizModes.map((mode) => (
          <div key={mode.id} className="quiz-mode-item">
            <div className="quiz-mode-info">
              <span className="quiz-mode-title-ar">{mode.titleAr}</span>
              <span className="quiz-mode-title-en">{mode.titleEn}</span>
              <span className="quiz-mode-details">
                {mode.format} &middot; {mode.timer}
              </span>
            </div>
            <button
              className="quiz-start-btn"
              onClick={() => onSelectMode(mode.id)}
            >
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
