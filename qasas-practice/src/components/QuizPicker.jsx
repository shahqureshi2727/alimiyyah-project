import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FIQH_GROUPS, HADITH_TOPICS, TAFSIR_TOPICS } from '../config/subjects';
import { quizPath } from '../lib/app-routes';
import './QuizPicker.css';

const GROUPS = [
  { id: 'today', label: 'Today', title: "Today's review" },
  { id: 'arabic', label: 'Arabic', title: 'Arabic timed modes' },
  { id: 'fiqh', label: 'Fiqh', title: 'Fiqh timed review' },
  { id: 'hadith', label: 'Hadith', title: 'Hadith timed review' },
  { id: 'tafsir', label: 'Tafsir', title: 'Tafsir timed review' },
];

const QUIZ_GROUPS = {
  today: [
    {
      target: { mode: 'review' },
      titleAr: 'مُرَاجَعَةُ اليَوْم',
      titleEn: "Today's Review",
      format: '15 questions',
      timer: 'weak + due topic mix',
    },
  ],
  arabic: [
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
  ],
  fiqh: [
    {
      target: { mode: 'fiqh', topic: 'all' },
      titleAr: 'الفِقْه',
      titleEn: 'Fiqh: Review',
      format: '10 questions',
      timer: '25 sec per question',
    },
    ...FIQH_GROUPS.map((group) => ({
      target: { mode: 'fiqh', topic: group.code },
      titleAr: group.titleAr,
      titleEn: `Fiqh: ${group.label}`,
      format: '10 questions',
      timer: '25 sec per question',
    })),
  ],
  hadith: [
    {
      target: { mode: 'hadith', topic: 'all' },
      titleAr: 'الحَدِيث',
      titleEn: 'Hadith: Review',
      format: '10 questions',
      timer: '25 sec per question',
    },
    ...HADITH_TOPICS.map((topic) => ({
      target: { mode: 'hadith', topic: topic.code },
      titleAr: topic.titleAr,
      titleEn: `Hadith: ${topic.label}`,
      format: '10 questions',
      timer: '25 sec per question',
    })),
  ],
  tafsir: [
    {
      target: { mode: 'tafsir', topic: 'all' },
      titleAr: 'التَّفْسِير',
      titleEn: 'Tafsir: Mixed Review',
      format: '10 questions',
      timer: '25 sec per question',
    },
    ...TAFSIR_TOPICS.map((topic) => ({
      target: { mode: 'tafsir', topic: topic.code },
      titleAr: topic.titleAr,
      titleEn: `Tafsir: ${topic.label}`,
      format: '10 questions',
      timer: '25 sec per question',
    })),
  ],
};

export default function QuizPicker({ onSelectMode, onBack }) {
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState('today');
  const currentGroup = GROUPS.find((group) => group.id === activeGroup);

  const startQuiz = (target) => {
    if (onSelectMode) {
      onSelectMode(target);
      return;
    }
    navigate(quizPath(target).path);
  };

  const goBack = () => {
    if (onBack) onBack();
    else navigate('/');
  };

  return (
    <main className="quiz-picker">
      <header className="quiz-picker-header">
        <button className="back-btn" onClick={goBack} type="button">
          Back to home
        </button>
        <div>
          <p className="quiz-picker-kicker">Timed study</p>
          <h1 className="quiz-picker-title">Choose a timed quiz</h1>
        </div>
      </header>

      <div className="quiz-picker-layout">
        <nav className="quiz-picker-rail" aria-label="Quiz groups">
          {GROUPS.map((group) => (
            <button
              key={group.id}
              className={`quiz-group-tab ${activeGroup === group.id ? 'active' : ''}`}
              onClick={() => setActiveGroup(group.id)}
              type="button"
            >
              <span>{group.label}</span>
            </button>
          ))}
        </nav>

        <section className="quiz-picker-detail" aria-live="polite">
          <div className="quiz-picker-detail-header">
            <span className="section-title">{currentGroup.label}</span>
            <h2>{currentGroup.title}</h2>
          </div>
          <div className="quiz-mode-list">
            {QUIZ_GROUPS[activeGroup].map((mode) => (
              <article
                key={`${mode.target.mode}:${mode.target.topic || 'all'}`}
                className="quiz-mode-item"
              >
                <div className="quiz-mode-info">
                  <span className="quiz-mode-title-ar" dir="rtl" lang="ar">
                    {mode.titleAr}
                  </span>
                  <span className="quiz-mode-copy">
                    <span className="quiz-mode-title-en">{mode.titleEn}</span>
                    <span className="quiz-mode-details">
                      {mode.format} · {mode.timer}
                    </span>
                  </span>
                </div>
                <button className="quiz-start-btn" onClick={() => startQuiz(mode.target)} type="button">
                  Start
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
