import { useCallback, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { practicePath, quizPath } from '../lib/app-routes';
import { getUserRecentResults, formatRelativeTime } from '../lib/quiz';
import { getWeakTopics } from '../lib/weakness';
import { getUserTopicProfile } from '../lib/topic-stats-firestore';
import {
  practiceTargetForTopic,
  quizTargetForTopic,
  topicMetaForCode,
} from '../lib/topic-route-targets';
import {
  FIQH_GROUPS,
  FIQH_TOPICS,
  HADITH_TOPICS,
  TAFSIR_TOPICS,
} from '../config/subjects';
import { error as logError } from '../lib/logger';
import AppState from './AppState';
import LeaderboardPreview from './LeaderboardPreview';
import './HomeScreen.css';

const SUBJECTS = [
  { id: 'arabic', titleAr: 'العَرَبِيَّة', label: 'Arabic', desc: 'Grammar, vocabulary, morphology' },
  { id: 'fiqh', titleAr: 'الفِقْه', label: 'Fiqh', desc: 'Tahara and prayer rulings' },
  { id: 'hadith', titleAr: 'الحَدِيث', label: 'Hadith', desc: 'Arabic text and translation recall' },
  { id: 'tafsir', titleAr: 'التَّفْسِير', label: 'Tafsir', desc: 'Short surahs, ayah by ayah' },
];

const ARABIC_MODES = [
  {
    target: { mode: 'irab' },
    titleAr: 'تَحْدِيدُ الإِعْرَاب',
    titleEn: "I'rab Identification",
    description: 'Identify the case of highlighted words',
  },
  {
    target: { mode: 'noun' },
    titleAr: 'صِفَاتُ الاسْم',
    titleEn: 'Noun Features',
    description: 'Tag definiteness, gender, and number',
  },
  {
    target: { mode: 'role' },
    titleAr: 'الدَّوْرُ النَّحْوِي',
    titleEn: 'Grammatical Role',
    description: 'Tap the word that fills the role',
  },
  {
    target: { mode: 'vocab' },
    titleAr: 'المُفْرَدَات',
    titleEn: 'Vocabulary',
    description: 'Flashcard recall from Qasas',
  },
  {
    target: { mode: 'morphology' },
    titleAr: 'تَصْرِيفُ الأَفْعَال',
    titleEn: 'Morphology',
    description: 'Identify verb forms and meanings',
  },
];

const MODE_LABELS = {
  irab: "I'rab",
  nounFeatures: 'Noun Features',
  roles: 'Roles',
  vocab: 'Vocab',
  morphology: 'Morphology',
  fiqh: 'Fiqh',
  hadith: 'Hadith',
  tafsir: 'Tafsir',
  review: "Today's Review",
};

function formatScore(score) {
  if (typeof score !== 'number') return 'No score';
  return `${Math.round(score * 100)}%`;
}

export default function HomeScreen({ onSelectMode, onSelectQuiz }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentResults, setRecentResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [recentResultsError, setRecentResultsError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [subject, setSubject] = useState('arabic');
  const [selectedTafsirSurah, setSelectedTafsirSurah] = useState('');

  const fetchRecentResults = useCallback(async () => {
    if (!user) return;

    setLoadingResults(true);
    setRecentResultsError(null);

    try {
      setRecentResults(await getUserRecentResults(user.uid, 5));
    } catch (err) {
      logError('Could not load recent quiz results.', err, { uid: user.uid });
      setRecentResultsError("Couldn't load recent results.");
    } finally {
      setLoadingResults(false);
    }
  }, [user]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setProfileError(null);

    try {
      setProfile(await getUserTopicProfile(user.uid));
    } catch (err) {
      logError('Could not load home weakness profile.', err, { uid: user.uid });
      setProfileError("Couldn't load weak topics.");
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(fetchRecentResults);
    Promise.resolve().then(fetchProfile);
  }, [fetchProfile, fetchRecentResults]);

  const weakTopics = useMemo(
    () =>
      getWeakTopics(profile, 3)
        .map((code) => ({
          code,
          meta: topicMetaForCode(code),
          state: profile?.topics?.[code],
          practiceTarget: practiceTargetForTopic(code),
          quizTarget: quizTargetForTopic(code),
        }))
        .filter((topic) => topic.meta),
    [profile]
  );

  const openPractice = (target) => {
    if (onSelectMode) {
      onSelectMode(target);
      return;
    }
    navigate(practicePath(target));
  };

  const openQuiz = (target = null) => {
    if (!target) {
      if (onSelectQuiz) onSelectQuiz();
      else navigate('/quiz');
      return;
    }

    navigate(quizPath(target).path);
  };

  const renderPracticeRow = (mode, className = '') => (
    <button
      key={`${mode.target.mode}:${mode.target.topic || 'all'}:${mode.target.variant || 'mcq'}`}
      className={`mode-card ${className}`.trim()}
      onClick={() => openPractice(mode.target)}
      type="button"
    >
      <span className="mode-title-ar" dir="rtl" lang="ar">
        {mode.titleAr}
      </span>
      <span className="mode-card-copy">
        <span className="mode-title-en">{mode.titleEn}</span>
        <span className="mode-desc">{mode.description}</span>
      </span>
    </button>
  );

  const renderWeakTopics = () => {
    if (profileError) {
      return (
        <AppState
          tone="error"
          title="Weak topics unavailable"
          message={profileError}
          actionLabel="Retry"
          onAction={fetchProfile}
        />
      );
    }

    if (!profile) {
      return <AppState tone="loading" title="Reading your strength map" message="Loading weak topics." />;
    }

    if (weakTopics.length === 0) {
      return (
        <AppState
          title="No weak topics yet"
          message="Complete a timed quiz and this area will point you to the next useful drill."
          actionLabel="Start today's review"
          onAction={() => openQuiz({ mode: 'review' })}
        />
      );
    }

    return (
      <div className="weak-topic-list">
        {weakTopics.map(({ code, meta, state, practiceTarget, quizTarget }) => (
          <article className="weak-topic-card" key={code}>
            <div>
              <span className="weak-topic-subject">{meta.subject}</span>
              <h3>{meta.label}</h3>
              <p>
                {state?.status || 'Developing'} · {formatScore(state?.score)} ·{' '}
                {state?.attempts || 0} attempts
              </p>
            </div>
            <div className="weak-topic-actions">
              {practiceTarget && (
                <button type="button" className="secondary-btn" onClick={() => openPractice(practiceTarget)}>
                  Practice
                </button>
              )}
              {quizTarget && (
                <button type="button" className="primary-btn" onClick={() => openQuiz(quizTarget)}>
                  Quiz
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderArabicSubject = () => (
    <div className="subject-panel">
      <div className="subject-panel-header">
        <div>
          <span className="section-title">Arabic</span>
          <h3>Grammar modes</h3>
        </div>
        <button className="secondary-btn" type="button" onClick={() => openQuiz({ mode: 'morphology' })}>
          Timed Arabic
        </button>
      </div>
      {renderPracticeRow(
        {
          target: { mode: 'morphology', topic: 'mixed' },
          titleAr: 'مُرَاجَعَة',
          titleEn: 'Mixed Arabic Review',
          description: 'Start with morphology, then keep drilling',
        },
        'review-card'
      )}
      <div className="mode-grid">{ARABIC_MODES.map((mode) => renderPracticeRow(mode))}</div>
    </div>
  );

  const renderFiqhSubject = () => (
    <div className="subject-panel">
      <div className="subject-panel-header">
        <div>
          <span className="section-title">Fiqh</span>
          <h3>Tahara and prayer</h3>
        </div>
        <button className="secondary-btn" type="button" onClick={() => openQuiz({ mode: 'fiqh', topic: 'all' })}>
          Timed review
        </button>
      </div>
      {renderPracticeRow(
        {
          target: { mode: 'fiqh', topic: 'all' },
          titleAr: 'مُرَاجَعَة',
          titleEn: 'Mixed Fiqh Review',
          description: 'Mixed Tahara and Prayer review',
        },
        'review-card'
      )}
      {FIQH_GROUPS.map((group) => (
        <section className="topic-group" key={group.code}>
          <h4>{group.label}</h4>
          <p>{group.description}</p>
          <div className="mode-grid compact-grid">
            {FIQH_TOPICS.filter((topic) => topic.group === group.code).map((topic) =>
              renderPracticeRow({
                target: { mode: 'fiqh', topic: topic.code },
                titleAr: group.titleAr,
                titleEn: topic.label,
                description: 'Focused review',
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );

  const renderHadithSubject = () => (
    <div className="subject-panel">
      <div className="subject-panel-header">
        <div>
          <span className="section-title">Hadith</span>
          <h3>Text and translation</h3>
        </div>
        <button className="secondary-btn" type="button" onClick={() => openQuiz({ mode: 'hadith', topic: 'all' })}>
          Timed review
        </button>
      </div>
      {renderPracticeRow(
        {
          target: { mode: 'hadith', topic: 'all' },
          titleAr: 'مُرَاجَعَة',
          titleEn: 'Mixed Hadith Review',
          description: 'Mixed Hadith translation review',
        },
        'review-card'
      )}
      <div className="mode-grid">
        {HADITH_TOPICS.map((topic) =>
          renderPracticeRow({
            target: { mode: 'hadith', topic: topic.code },
            titleAr: topic.titleAr,
            titleEn: topic.label,
            description: topic.description,
          })
        )}
      </div>
    </div>
  );

  const renderTafsirSubject = () => (
    <div className="subject-panel">
      <div className="subject-panel-header">
        <div>
          <span className="section-title">Tafsir</span>
          <h3>Surah study</h3>
        </div>
        <button className="secondary-btn" type="button" onClick={() => openQuiz({ mode: 'tafsir', topic: 'all' })}>
          Timed review
        </button>
      </div>
      {renderPracticeRow(
        {
          target: { mode: 'tafsir', topic: 'all' },
          titleAr: 'مُرَاجَعَة',
          titleEn: 'Mixed Tafsir Review',
          description: 'Arabic ayat with English translation choices',
        },
        'review-card'
      )}
      <div className="tafsir-select-panel">
        <label className="tafsir-select-label" htmlFor="tafsir-surah-select">
          Verse-by-verse practice
        </label>
        <select
          id="tafsir-surah-select"
          className="tafsir-surah-select"
          value={selectedTafsirSurah}
          onChange={(event) => setSelectedTafsirSurah(event.target.value)}
        >
          <option value="">Choose a surah...</option>
          {TAFSIR_TOPICS.map((surah) => (
            <option key={surah.code} value={surah.code}>
              {surah.label}
            </option>
          ))}
        </select>
        <button
          className="tafsir-start-btn"
          disabled={!selectedTafsirSurah}
          onClick={() =>
            openPractice({ mode: 'tafsir', topic: selectedTafsirSurah, variant: 'verse' })
          }
          type="button"
        >
          Start verse by verse
        </button>
      </div>
      <div className="mode-grid compact-grid">
        {TAFSIR_TOPICS.map((topic) =>
          renderPracticeRow({
            target: { mode: 'tafsir', topic: topic.code, variant: 'verse' },
            titleAr: topic.titleAr,
            titleEn: topic.label,
            description: topic.description,
          })
        )}
      </div>
    </div>
  );

  const renderSubjectPanel = () => {
    if (subject === 'fiqh') return renderFiqhSubject();
    if (subject === 'hadith') return renderHadithSubject();
    if (subject === 'tafsir') return renderTafsirSubject();
    return renderArabicSubject();
  };

  return (
    <div className="home-screen">
      <header className="home-header">
        <p className="home-kicker">Alimiyyah lesson table</p>
        <h1 className="title-ar" dir="rtl" lang="ar">
          مَجْلِسُ المُرَاجَعَة
        </h1>
        <h2 className="title-en">Alimiyyah Practice</h2>
      </header>

      <main className="study-desk">
        <aside className="subject-rail" aria-label="Subjects">
          <h3 className="section-title">Subjects</h3>
          {SUBJECTS.map((item) => (
            <button
              key={item.id}
              className={`subject-card ${subject === item.id ? 'active' : ''}`}
              onClick={() => setSubject(item.id)}
              type="button"
            >
              <span className="mode-title-ar" dir="rtl" lang="ar">
                {item.titleAr}
              </span>
              <span className="mode-title-en">{item.label}</span>
              <span className="mode-desc">{item.desc}</span>
            </button>
          ))}
        </aside>

        <section className="today-panel" aria-labelledby="today-heading">
          <div className="today-card">
            <div>
              <span className="section-title">Today</span>
              <h3 id="today-heading">Daily review</h3>
              <p>15 timed questions from weak and due topics.</p>
            </div>
            <button className="primary-btn" type="button" onClick={() => openQuiz({ mode: 'review' })}>
              Start review
            </button>
          </div>

          <div className="weak-topics-panel">
            <div className="weak-topics-header">
              <div>
                <span className="section-title">Weak topics</span>
                <h3>Practice what needs attention</h3>
              </div>
              <button className="secondary-btn" type="button" onClick={() => navigate('/weakness')}>
                Strength map
              </button>
            </div>
            {renderWeakTopics()}
          </div>
        </section>

        <section className="subject-detail" aria-live="polite">
          {renderSubjectPanel()}
        </section>
      </main>

      <section className="home-section">
        <LeaderboardPreview />
      </section>

      <section className="home-section">
        <h3 className="section-title">Your Recent Results</h3>
        <div className="recent-results">
          {loadingResults ? (
            <AppState tone="loading" title="Loading recent results" message="Checking your latest quiz rounds." />
          ) : recentResultsError ? (
            <AppState
              tone="error"
              title="Recent results unavailable"
              message={recentResultsError}
              actionLabel="Retry"
              onAction={fetchRecentResults}
            />
          ) : recentResults.length === 0 ? (
            <AppState
              title="No quizzes yet"
              message="Start a timed review and your scores will appear here."
              actionLabel="Try one"
              onAction={() => openQuiz()}
            />
          ) : (
            <div className="results-list">
              {recentResults.map((result) => (
                <div key={result.id} className="result-row">
                  <span className="result-mode">{MODE_LABELS[result.mode] || result.mode}</span>
                  <span className="result-score">
                    {result.score}/{result.total}
                  </span>
                  <span className="result-time">
                    {Math.floor(result.durationSeconds / 60)}:
                    {String(Math.round(result.durationSeconds % 60)).padStart(2, '0')}
                  </span>
                  <span className="result-date">{formatRelativeTime(result.completedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
