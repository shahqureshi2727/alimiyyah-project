import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ARABIC_TOPICS,
  FIQH_GROUPS,
  FIQH_TOPICS,
  HADITH_TOPICS,
  TAFSIR_TOPICS,
} from '../config/subjects';
import { getUserTopicProfile } from '../lib/topic-stats-firestore';
import { getWeakTopics } from '../lib/weakness';
import { practicePath, quizPath } from '../lib/app-routes';
import {
  practiceTargetForTopic,
  quizTargetForTopic,
  topicMetaForCode,
} from '../lib/topic-route-targets';
import { error as logError } from '../lib/logger';
import AppState from './AppState';
import './WeaknessDashboard.css';

const STATUS_LABELS = {
  weak: 'Weak',
  developing: 'Developing',
  strong: 'Strong',
};

function formatScore(score) {
  if (typeof score !== 'number') return 'No data';
  return `${Math.round(score * 100)}%`;
}

export function WeaknessHeatmap({ profile, title = 'Topic Strength' }) {
  const topics = profile?.topics || {};
  const hasData = Object.keys(topics).length > 0;
  const navigate = useNavigate();

  const fiqhGroups = useMemo(
    () =>
      FIQH_GROUPS.map((group) => ({
        ...group,
        topics: FIQH_TOPICS.filter((topic) => topic.group === group.code),
      })),
    []
  );

  if (!hasData) return null;

  const renderTopic = (topic) => {
    const state = topics[topic.code];
    const status = state?.status || 'empty';
    const practiceTarget = practiceTargetForTopic(topic.code);
    const quizTarget = quizTargetForTopic(topic.code);
    return (
      <article key={topic.code} className={`heatmap-cell status-${status}`}>
        <div className="heatmap-cell-title">{topic.label}</div>
        <div className="heatmap-cell-meta">
          <span>{state ? STATUS_LABELS[state.status] : 'No data'}</span>
          <span>{formatScore(state?.score)}</span>
          <span>{state?.attempts || 0} attempts</span>
        </div>
        {(practiceTarget || quizTarget) && (
          <div className="heatmap-cell-actions">
            {practiceTarget && (
              <button
                className="secondary-btn"
                type="button"
                onClick={() => navigate(practicePath(practiceTarget))}
              >
                Practice
              </button>
            )}
            {quizTarget && (
              <button
                className="primary-btn"
                type="button"
                onClick={() => navigate(quizPath(quizTarget).path)}
              >
                Quiz
              </button>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="weakness-heatmap">
      <h2>{title}</h2>
      <section className="heatmap-section">
        <h3>Fiqh</h3>
        {fiqhGroups.map((group) => (
          <div key={group.code} className="heatmap-group">
            <h4>{group.label}</h4>
            <div className="heatmap-grid">{group.topics.map(renderTopic)}</div>
          </div>
        ))}
      </section>
      <section className="heatmap-section">
        <h3>Hadith</h3>
        <div className="heatmap-grid">{HADITH_TOPICS.map(renderTopic)}</div>
      </section>
      <section className="heatmap-section">
        <h3>Tafsir</h3>
        <div className="heatmap-grid">{TAFSIR_TOPICS.map(renderTopic)}</div>
      </section>
      <section className="heatmap-section">
        <h3>Arabic</h3>
        <div className="heatmap-grid">{ARABIC_TOPICS.map(renderTopic)}</div>
      </section>
    </div>
  );
}

export default function WeaknessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setProfile(await getUserTopicProfile(user.uid));
    } catch (err) {
      logError('Could not load weakness profile.', err, { uid: user.uid });
      setError("Couldn't load the strength map. Retry.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(fetchProfile);
  }, [fetchProfile]);

  const dueTopics = useMemo(
    () =>
      getWeakTopics(profile, 5)
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

  if (loading) {
    return (
      <main className="weakness-dashboard">
        <AppState
          tone="loading"
          title="Loading strength map"
          message="Reading your recent topic history."
        />
      </main>
    );
  }

  if (error) {
    return (
      <main className="weakness-dashboard">
        <AppState tone="error" title="Strength map unavailable" message={error} actionLabel="Retry" onAction={fetchProfile} />
      </main>
    );
  }

  const hasData = Object.keys(profile?.topics || {}).length > 0;

  return (
    <main className="weakness-dashboard">
      <header className="weakness-header">
        <h1>Strength Map</h1>
        <p>Recent answers carry the most weight, so improvement shows up quickly.</p>
      </header>
      {!hasData ? (
        <AppState
          title="No weakness data yet"
          message="Complete a timed quiz and this page will start tracking topic strength."
          actionLabel="Start today's review"
          onAction={() => navigate('/quiz/review')}
        />
      ) : (
        <>
          <section className="due-topics" aria-labelledby="due-topics-heading">
            <div className="due-topics-header">
              <span className="section-title">Due / weak</span>
              <h2 id="due-topics-heading">Drill these next</h2>
            </div>
            <div className="due-topic-list">
              {dueTopics.map(({ code, meta, state, practiceTarget, quizTarget }) => (
                <article className="due-topic-card" key={code}>
                  <div>
                    <span className="due-topic-subject">{meta.subject}</span>
                    <h3>{meta.label}</h3>
                    <p>
                      {state?.status || 'Developing'} · {formatScore(state?.score)} ·{' '}
                      {state?.attempts || 0} attempts
                    </p>
                  </div>
                  <div className="due-topic-actions">
                    {practiceTarget && (
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => navigate(practicePath(practiceTarget))}
                      >
                        Practice exact topic
                      </button>
                    )}
                    {quizTarget && (
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={() => navigate(quizPath(quizTarget).path)}
                      >
                        Timed quiz
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <WeaknessHeatmap profile={profile} />
        </>
      )}
    </main>
  );
}
