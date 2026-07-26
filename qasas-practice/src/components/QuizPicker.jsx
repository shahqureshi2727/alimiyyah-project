import { useNavigate } from 'react-router-dom';
import { FIQH_GROUPS, HADITH_TOPICS } from '../config/subjects';
import { quizPath } from '../lib/app-routes';
import './QuizPicker.css';

const quizModes = [
  {
    target: { mode: 'review' },
    titleAr: 'مُرَاجَعَةُ اليَوْم',
    titleEn: "Today's Review",
    format: '15 questions',
    timer: 'weak + due topic mix',
  },
  {
    target: { mode: 'irab' },
    titleAr: 'تَحْدِيدُ الإِعْرَاب',
    titleEn: "I'rab",
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    target: { mode: 'nounFeatures' },
    titleAr: 'صِفَاتُ الاسْم',
    titleEn: 'Noun Features',
    format: '10 questions',
    timer: '10 sec per question',
  },
  {
    target: { mode: 'roles' },
    titleAr: 'الدَّوْرُ النَّحْوِي',
    titleEn: 'Grammatical Role',
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    target: { mode: 'vocab' },
    titleAr: 'المُفْرَدَات',
    titleEn: 'Vocabulary',
    format: '10 cards',
    timer: '10 sec per card',
  },
  {
    target: { mode: 'morphology' },
    titleAr: 'تَصْرِيفُ الأَفْعَال',
    titleEn: 'Morphology: Mixed Review',
    format: '10 questions',
    timer: '20 sec per question',
  },
  {
    target: { mode: 'tafsir', topic: 'all' },
    titleAr: 'التَّفْسِير',
    titleEn: 'Tafsir: Mixed Review',
    format: '10 questions',
    timer: '25 sec per question',
  },
  {
    target: { mode: 'fiqh', topic: 'all' },
    titleAr: 'الفِقْه',
    titleEn: 'Fiqh: Review',
    format: '10 questions',
    timer: '25 sec per question',
  },
  ...FIQH_GROUPS.map((group) => ({
    target: { mode: 'fiqh', topic: group.code },
    titleAr: 'الفِقْه',
    titleEn: `Fiqh: ${group.label}`,
    format: '10 questions',
    timer: '25 sec per question',
  })),
  ...HADITH_TOPICS.map((topic) => ({
    target: { mode: 'hadith', topic: topic.code },
    titleAr: topic.titleAr,
    titleEn: `Hadith: ${topic.label}`,
    format: '10 questions',
    timer: '25 sec per question',
  })),
];

export default function QuizPicker({ onSelectMode, onBack }) {
  const navigate = useNavigate();

  const startQuiz = (target) => {
    if (onSelectMode) {
      onSelectMode(target);
      return;
    }
    navigate(quizPath(target).path);
  };

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
          <div key={`${mode.target.mode}:${mode.target.topic || 'all'}`} className="quiz-mode-item">
            <div className="quiz-mode-info">
              <span className="quiz-mode-title-ar">{mode.titleAr}</span>
              <span className="quiz-mode-title-en">{mode.titleEn}</span>
              <span className="quiz-mode-details">
                {mode.format} &middot; {mode.timer}
              </span>
            </div>
            <button className="quiz-start-btn" onClick={() => startQuiz(mode.target)}>
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
