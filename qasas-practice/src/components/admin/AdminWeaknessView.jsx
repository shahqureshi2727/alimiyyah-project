import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ARABIC_TOPICS,
  FIQH_TOPICS,
  HADITH_TOPICS,
  TAFSIR_TOPICS,
} from '../../config/subjects';
import { getAdminTopicStatsProfiles } from '../../lib/admin-queries';
import { error as logError } from '../../lib/logger';
import { statusFor } from '../../lib/weakness';
import { WeaknessHeatmap } from '../WeaknessDashboard';

export default function AdminWeaknessView() {
  const [profiles, setProfiles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getAdminTopicStatsProfiles();
      setProfiles(rows);
      setSelectedUserId(rows[0]?.userId || rows[0]?.id || null);
    } catch (err) {
      logError('Could not load admin weakness profiles.', err);
      setError("Couldn't load class weakness data. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchProfiles);
  }, [fetchProfiles]);

  const topicMeta = useMemo(
    () => [...FIQH_TOPICS, ...HADITH_TOPICS, ...TAFSIR_TOPICS, ...ARABIC_TOPICS],
    []
  );

  const classProfile = useMemo(() => {
    const topics = {};
    for (const topic of topicMeta) {
      const states = profiles.map((profile) => profile.topics?.[topic.code]).filter(Boolean);
      if (states.length === 0) continue;
      const attempts = states.reduce((sum, state) => sum + (state.attempts || 0), 0);
      const score = states.reduce((sum, state) => sum + (state.score || 0), 0) / states.length;
      topics[topic.code] = { attempts, score, status: statusFor(score, attempts) };
    }
    return { topics };
  }, [profiles, topicMeta]);

  const reteachTopics = useMemo(
    () =>
      topicMeta
        .map((topic) => {
          const states = profiles.map((profile) => profile.topics?.[topic.code]).filter(Boolean);
          const weakCount = states.filter((state) => state.status === 'weak').length;
          return {
            ...topic,
            weakShare: states.length > 0 ? weakCount / states.length : 0,
            studentCount: states.length,
          };
        })
        .filter((topic) => topic.studentCount > 0 && topic.weakShare > 0)
        .sort((a, b) => b.weakShare - a.weakShare)
        .slice(0, 8),
    [profiles, topicMeta]
  );

  const selectedProfile = profiles.find(
    (profile) => (profile.userId || profile.id) === selectedUserId
  );

  if (loading) return <div className="stats-loading">Loading weakness data...</div>;
  if (error) {
    return (
      <div className="stats-error">
        <p>{error}</p>
        <button className="try-quiz-link" onClick={fetchProfiles}>
          Retry
        </button>
      </div>
    );
  }
  if (profiles.length === 0) return <p className="no-students">No weakness profiles yet.</p>;

  return (
    <div className="admin-weakness">
      <section className="stats-overview">
        <h2>Topics To Reteach</h2>
        <div className="reteach-list">
          {reteachTopics.length === 0 ? (
            <p className="no-students">No weak class topics yet.</p>
          ) : (
            reteachTopics.map((topic) => (
              <div key={topic.code} className="reteach-row">
                <span>{topic.label}</span>
                <strong>{Math.round(topic.weakShare * 100)}% weak</strong>
              </div>
            ))
          )}
        </div>
      </section>

      <WeaknessHeatmap profile={classProfile} title="Class Heatmap" />

      <section className="student-drilldown">
        <h2>Student Drill-Down</h2>
        <label className="sr-only" htmlFor="student-drilldown-select">
          Choose a student
        </label>
        <select
          id="student-drilldown-select"
          className="student-select"
          value={selectedUserId || ''}
          onChange={(event) => setSelectedUserId(event.target.value)}
        >
          {profiles.map((profile) => (
            <option key={profile.userId || profile.id} value={profile.userId || profile.id}>
              {profile.username || profile.userId || profile.id}
            </option>
          ))}
        </select>
        {selectedProfile && (
          <WeaknessHeatmap
            profile={selectedProfile}
            title={`${selectedProfile.username || 'Student'} Heatmap`}
          />
        )}
      </section>
    </div>
  );
}
