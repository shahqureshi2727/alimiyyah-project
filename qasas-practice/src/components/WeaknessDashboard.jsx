import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ARABIC_TOPICS, FIQH_GROUPS, FIQH_TOPICS, HADITH_TOPICS } from '../config/subjects';
import { getUserTopicProfile } from '../lib/topic-stats-firestore';
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

  const fiqhGroups = useMemo(() => FIQH_GROUPS.map((group) => ({
    ...group,
    topics: FIQH_TOPICS.filter((topic) => topic.group === group.code),
  })), []);

  if (!hasData) {
    return (
      <div className="weakness-empty">
        <h2>No weakness data yet</h2>
        <p>Complete a timed quiz and this page will start tracking topic strength.</p>
      </div>
    );
  }

  const renderTopic = (topic) => {
    const state = topics[topic.code];
    const status = state?.status || 'empty';
    return (
      <div key={topic.code} className={`heatmap-cell status-${status}`}>
        <div className="heatmap-cell-title">{topic.label}</div>
        <div className="heatmap-cell-meta">
          <span>{state ? STATUS_LABELS[state.status] : 'No data'}</span>
          <span>{formatScore(state?.score)}</span>
          <span>{state?.attempts || 0} attempts</span>
        </div>
      </div>
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
            <div className="heatmap-grid">
              {group.topics.map(renderTopic)}
            </div>
          </div>
        ))}
      </section>
      <section className="heatmap-section">
        <h3>Hadith</h3>
        <div className="heatmap-grid">
          {HADITH_TOPICS.map(renderTopic)}
        </div>
      </section>
      <section className="heatmap-section">
        <h3>Arabic</h3>
        <div className="heatmap-grid">
          {ARABIC_TOPICS.map(renderTopic)}
        </div>
      </section>
    </div>
  );
}

export default function WeaknessDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        setProfile(await getUserTopicProfile(user.uid));
      } catch (err) {
        console.error('Error loading weakness profile:', err);
        setError('Could not load weakness data.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  if (loading) {
    return <div className="weakness-dashboard weakness-state">Loading weakness data...</div>;
  }

  if (error) {
    return <div className="weakness-dashboard weakness-state error">{error}</div>;
  }

  return (
    <main className="weakness-dashboard">
      <header className="weakness-header">
        <h1>Strength Map</h1>
        <p>Recent answers carry the most weight, so improvement shows up quickly.</p>
      </header>
      <WeaknessHeatmap profile={profile} />
    </main>
  );
}
