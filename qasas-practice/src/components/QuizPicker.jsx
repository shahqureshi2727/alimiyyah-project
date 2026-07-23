import { FIQH_GROUPS, HADITH_TOPICS } from '../config/subjects';
import './QuizPicker.css';

const quizModes = [
  {
    id: 'review',
    titleAr: 'مُرَاجَعَةُ الضَّعْف',
    titleEn: 'Review Your Weak Spots',
    format: '10 targeted questions',
    timer: 'adaptive topic mix',
  },
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
  {
    id: 'morphology',
    titleAr: 'تَصْرِيفُ الأَفْعَال',
    titleEn: 'Morphology: Mixed Review',
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    id: 'tafsir',
    titleAr: 'التَّفْسِير',
    titleEn: 'Tafsir: Mixed Review',
    format: '10 questions',
    timer: '25 sec per question',
  },
  {
    id: 'fiqh-all',
    titleAr: 'الفِقْه',
    titleEn: 'Fiqh: Review',
    format: '10 questions',
    timer: '25 sec per question',
  },
  ...FIQH_GROUPS.map((group) => ({
    id: `fiqh-${group.code}`,
    titleAr: 'الفِقْه',
    titleEn: `Fiqh: ${group.label}`,
    format: '10 questions',
    timer: '25 sec per question',
  })),
  ...HADITH_TOPICS.map((topic) => ({
    id: `hadith-${topic.code}`,
    titleAr: topic.titleAr,
    titleEn: `Hadith: ${topic.label}`,
    format: '10 questions',
    timer: '25 sec per question',
  })),
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
