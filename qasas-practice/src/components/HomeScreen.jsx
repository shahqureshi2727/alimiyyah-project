import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRecentResults, formatRelativeTime } from '../lib/quiz';
import { FIQH_TOPICS } from '../config/subjects';
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
];

const MODE_LABELS = {
  irab: "I'rab",
  nounFeatures: 'Noun Features',
  roles: 'Roles',
  vocab: 'Vocab',
  fiqh: 'Fiqh',
};

export default function HomeScreen({ onSelectMode, onSelectQuiz }) {
  const { user } = useAuth();
  const [recentResults, setRecentResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);

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

  return (
    <div className="home-screen">
      <header className="home-header">
        <h1 className="title-ar">تَدْرِيبُ قَصَصِ النَّبِيِّين</h1>
        <h2 className="title-en">Qasas Practice</h2>
      </header>

      {/* Practice modes section */}
      <section className="home-section">
        <h3 className="section-title">Practice</h3>
        <div className="mode-grid">
          {modes.map((mode) => (
            <button
              key={mode.id}
              className="mode-card"
              onClick={() => onSelectMode(mode.id)}
            >
              <span className="mode-title-ar">{mode.titleAr}</span>
              <span className="mode-title-en">{mode.titleEn}</span>
              <span className="mode-desc">{mode.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Fiqh practice section */}
      <section className="home-section">
        <h3 className="section-title">Fiqh</h3>
        <div className="mode-grid">
          {FIQH_TOPICS.map((topic) => (
            <button
              key={topic.code}
              className="mode-card"
              onClick={() => onSelectMode(`fiqh-${topic.code}`)}
            >
              <span className="mode-title-ar">الفِقْه</span>
              <span className="mode-title-en">{topic.label}</span>
              <span className="mode-desc">Practice rulings from this topic</span>
            </button>
          ))}
        </div>
      </section>

      {/* Quizzes section */}
      <section className="home-section">
        <h3 className="section-title">Quizzes</h3>
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
