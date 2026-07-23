import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRecentResults, formatRelativeTime } from '../lib/quiz';
import { FIQH_GROUPS, FIQH_TOPICS } from '../config/subjects';
import LeaderboardPreview from './LeaderboardPreview';
import './HomeScreen.css';

const modes = [
  {
    id: 'irab',
    titleAr: 'تَحْدِيدُ الإِعْرَاب',
    titleEn: "I'rab Identification",
    description: 'Identify the case of highlighted words',
  },
  {
    id: 'noun',
    titleAr: 'صِفَاتُ الاسْم',
    titleEn: 'Noun Features',
    description: 'Tag definiteness, gender, and number',
  },
  {
    id: 'role',
    titleAr: 'الدَّوْرُ النَّحْوِي',
    titleEn: 'Grammatical Role',
    description: 'Tap the word that fills the role',
  },
  {
    id: 'vocab',
    titleAr: 'المُفْرَدَات',
    titleEn: 'Vocabulary',
    description: 'Flashcard recall from Qasas',
  },
  {
    id: 'morphology',
    titleAr: 'تَصْرِيفُ الأَفْعَال',
    titleEn: 'Morphology',
    description: 'Identify verb forms and meanings',
  },
];

const arabicReviewMode = {
  id: 'morphology-mixed',
  titleAr: 'مُرَاجَعَة',
  titleEn: 'Review',
  description: 'Mixed Arabic practice, starting with morphology review',
};

const MODE_LABELS = {
  irab: "I'rab",
  nounFeatures: 'Noun Features',
  roles: 'Roles',
  vocab: 'Vocab',
  morphology: 'Morphology',
  fiqh: 'Fiqh',
};

export default function HomeScreen({ onSelectMode, onSelectQuiz }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentResults, setRecentResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [subject, setSubject] = useState(null);

  useEffect(() => {
    async function fetchRecentResults() {
      if (!user) return;

      try {
        const results = await getUserRecentResults(user.uid, 5);
        setRecentResults(results);
      } catch (err) {
        console.error('Error fetching recent results:', err);
      } finally {
        setLoadingResults(false);
      }
    }

    fetchRecentResults();
  }, [user]);

  const renderCard = (mode, className = 'mode-card') => (
    <button
      key={mode.id}
      className={className}
      onClick={() => onSelectMode(mode.id)}
    >
      <span className="mode-title-ar">{mode.titleAr}</span>
      <span className="mode-title-en">{mode.titleEn}</span>
      <span className="mode-desc">{mode.description}</span>
    </button>
  );

  const renderSubjectDoorways = () => (
    <section className="home-section">
      <h3 className="section-title">Choose a Subject</h3>
      <div className="subject-grid">
        <button className="subject-card" onClick={() => setSubject('arabic')}>
          <span className="mode-title-ar">العَرَبِيَّة</span>
          <span className="mode-title-en">Arabic Questions</span>
          <span className="mode-desc">Grammar, vocabulary, and morphology practice</span>
        </button>
        <button className="subject-card" onClick={() => setSubject('fiqh')}>
          <span className="mode-title-ar">الفِقْه</span>
          <span className="mode-title-en">Fiqh Questions</span>
          <span className="mode-desc">Tahara and prayer rulings</span>
        </button>
      </div>
    </section>
  );

  const renderArabicSubject = () => (
    <>
      <section className="home-section">
        <button className="back-btn subject-back" onClick={() => setSubject(null)}>
          Back
        </button>
        <h3 className="section-title">Arabic Questions</h3>
        {renderCard(arabicReviewMode, 'mode-card review-card')}
      </section>

      <section className="home-section detail-section">
        <h3 className="section-title">Extra Review</h3>
        <div className="mode-grid">
          {modes.map((mode) => renderCard(mode))}
        </div>
      </section>
    </>
  );

  const renderFiqhSubject = () => (
    <>
      <section className="home-section">
        <button className="back-btn subject-back" onClick={() => setSubject(null)}>
          Back
        </button>
        <h3 className="section-title">Fiqh Questions</h3>
        {renderCard(
          {
            id: 'fiqh-all',
            titleAr: 'مُرَاجَعَة',
            titleEn: 'Review',
            description: 'Mixed Tahara and Prayer review',
          },
          'mode-card review-card'
        )}
      </section>

      <section className="home-section detail-section">
        <h3 className="section-title">Tahara And Prayer</h3>
        <div className="mode-grid">
          {FIQH_GROUPS.map((group) =>
            renderCard({
              id: `fiqh-${group.code}`,
              titleAr: group.titleAr,
              titleEn: group.label,
              description: group.description,
            })
          )}
        </div>
      </section>

      <section className="home-section detail-section">
        <h3 className="section-title">Focused Fiqh Review</h3>
        {FIQH_GROUPS.map((group) => (
          <div className="topic-group" key={group.code}>
            <h4 className="topic-group-title">{group.label}</h4>
            <div className="mode-grid compact-grid">
              {FIQH_TOPICS.filter((topic) => topic.group === group.code).map((topic) =>
                renderCard({
                  id: `fiqh-${topic.code}`,
                  titleAr: group.titleAr,
                  titleEn: topic.label,
                  description: 'Focused review',
                })
              )}
            </div>
          </div>
        ))}
      </section>
    </>
  );

  return (
    <div className="home-screen">
      <header className="home-header">
        <h1 className="title-ar">تَدْرِيبُ قَصَصِ النَّبِيِّين</h1>
        <h2 className="title-en">Qasas Practice</h2>
      </header>

      {!subject && renderSubjectDoorways()}
      {subject === 'arabic' && renderArabicSubject()}
      {subject === 'fiqh' && renderFiqhSubject()}

      {/* Quizzes section */}
      <section className="home-section">
        <h3 className="section-title">Quizzes</h3>
        <div className="quiz-entry-list">
          <button className="quiz-entry-card" onClick={onSelectQuiz}>
            <div className="quiz-entry-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="quiz-entry-content">
              <span className="quiz-entry-title">Timed Quizzes</span>
              <span className="quiz-entry-desc">
                10 questions per round with a countdown timer
              </span>
            </div>
            <div className="quiz-entry-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
          <button className="quiz-entry-card strength-card" onClick={() => navigate('/weakness')}>
            <div className="quiz-entry-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="4" height="9" />
                <rect x="10" y="5" width="4" height="15" />
                <rect x="17" y="8" width="4" height="12" />
              </svg>
            </div>
            <div className="quiz-entry-content">
              <span className="quiz-entry-title">Strength Map</span>
              <span className="quiz-entry-desc">
                See weak, developing, and strong topics
              </span>
            </div>
            <div className="quiz-entry-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        </div>
      </section>

      {/* Leaderboard preview section */}
      <section className="home-section">
        <LeaderboardPreview />
      </section>

      {/* Recent results section */}
      <section className="home-section">
        <h3 className="section-title">Your Recent Results</h3>
        <div className="recent-results">
          {loadingResults ? (
            <p className="results-loading">Loading...</p>
          ) : recentResults.length === 0 ? (
            <div className="no-results">
              <p>No quizzes yet.</p>
              <button className="try-quiz-link" onClick={onSelectQuiz}>
                Try one!
              </button>
            </div>
          ) : (
            <div className="results-list">
              {recentResults.map((result) => (
                <div key={result.id} className="result-row">
                  <span className="result-mode">{MODE_LABELS[result.mode]}</span>
                  <span className="result-score">{result.score}/10</span>
                  <span className="result-time">
                    {Math.floor(result.durationSeconds / 60)}:{String(Math.round(result.durationSeconds % 60)).padStart(2, '0')}
                  </span>
                  <span className="result-date">
                    {formatRelativeTime(result.completedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
