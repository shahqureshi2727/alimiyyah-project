import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatLeaderboardTime, getLeaderboard, getUserBestResult } from '../lib/quiz';
import { QUIZ_MODES } from '../config/subjects';
import { getLastQuizMode } from '../lib/last-quiz-mode';
import { error as logError } from '../lib/logger';
import LeaderboardTable from './LeaderboardTable';
import AppState from './AppState';
import './Leaderboard.css';

const MODE_GROUPS = [
  { id: 'review', label: 'Review', modes: ['review'] },
  { id: 'arabic', label: 'Arabic', modes: ['irab', 'nounFeatures', 'roles', 'vocab', 'morphology'] },
  { id: 'fiqh', label: 'Fiqh', modes: ['fiqh'] },
  { id: 'hadith', label: 'Hadith', modes: ['hadith'] },
  { id: 'tafsir', label: 'Tafsir', modes: ['tafsir'] },
];

function groupForMode(mode) {
  return MODE_GROUPS.find((group) => group.modes.includes(mode)) || MODE_GROUPS[0];
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState(() => getLastQuizMode());
  const [activeGroup, setActiveGroup] = useState(() => groupForMode(getLastQuizMode()).id);
  const [timeWindow, setTimeWindow] = useState('week'); // 'week' or 'allTime'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userResult, setUserResult] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const allTime = timeWindow === 'allTime';

      // Fetch leaderboard (top 20)
      const data = await getLeaderboard({
        mode: activeMode,
        allTime,
        bankSource: QUIZ_MODES[activeMode].bankSource,
        maxResults: 20,
      });

      setLeaderboardData(data);

      // Check if user is in top 20
      const userInTop20 = data.findIndex((r) => r.userId === user.uid);

      if (userInTop20 !== -1) {
        setUserResult(null);
        setUserRank(userInTop20 + 1);
      } else {
        // Fetch user's best result for this mode
        const userBest = await getUserBestResult({
          userId: user.uid,
          mode: activeMode,
          allTime,
          bankSource: QUIZ_MODES[activeMode].bankSource,
        });

        if (userBest) {
          // Calculate user's rank by counting how many are better
          // This is approximate since we only have top 20
          let estimatedRank = 21;

          for (const result of data) {
            if (
              result.score > userBest.score ||
              (result.score === userBest.score &&
                result.durationSeconds < userBest.durationSeconds)
            ) {
              estimatedRank++;
            }
          }

          setUserResult(userBest);
          setUserRank(estimatedRank > 20 ? `>${20}` : estimatedRank);
        } else {
          setUserResult(null);
          setUserRank(null);
        }
      }
    } catch (err) {
      logError('Could not load leaderboard.', err, { activeMode, timeWindow });
      setError("Couldn't load the leaderboard. Retry.");
    } finally {
      setLoading(false);
    }
  }, [activeMode, timeWindow, user]);

  // Fetch leaderboard data
  useEffect(() => {
    if (user) {
      Promise.resolve().then(fetchData);
    }
  }, [fetchData, user]);

  const isUserInTop20 = leaderboardData.some((r) => r.userId === user?.uid);
  const selectedGroup = MODE_GROUPS.find((group) => group.id === activeGroup) || MODE_GROUPS[0];
  const groupModes = selectedGroup.modes.map((id) => ({ id, label: QUIZ_MODES[id].label }));
  const activeModeLabel = QUIZ_MODES[activeMode].label;

  const selectGroup = (group) => {
    setActiveGroup(group.id);
    if (!group.modes.includes(activeMode)) setActiveMode(group.modes[0]);
  };

  return (
    <main className="leaderboard">
      <header className="leaderboard-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          Back to home
        </button>
        <div>
          <p className="leaderboard-kicker">Leaderboard</p>
          <h1 className="leaderboard-title">Speed & Accuracy</h1>
        </div>
      </header>

      <div className="leaderboard-controls">
        <div className="mode-tabs" aria-label="Leaderboard subjects">
          {MODE_GROUPS.map((group) => (
            <button
              key={group.id}
              className={`mode-tab ${activeGroup === group.id ? 'active' : ''}`}
              onClick={() => selectGroup(group)}
              type="button"
            >
              {group.label}
            </button>
          ))}
        </div>

        {groupModes.length > 1 && (
          <div className="mode-subtabs" aria-label={`${selectedGroup.label} modes`}>
            {groupModes.map((mode) => (
              <button
                key={mode.id}
                className={`mode-subtab ${activeMode === mode.id ? 'active' : ''}`}
                onClick={() => setActiveMode(mode.id)}
                type="button"
              >
                {mode.label}
              </button>
            ))}
          </div>
        )}

        <div className="time-toggle">
          <button
            className={`time-btn ${timeWindow === 'week' ? 'active' : ''}`}
            onClick={() => setTimeWindow('week')}
            type="button"
          >
            This week
          </button>
          <button
            className={`time-btn ${timeWindow === 'allTime' ? 'active' : ''}`}
            onClick={() => setTimeWindow('allTime')}
            type="button"
          >
            All time
          </button>
        </div>
      </div>

      <div className="leaderboard-content">
        {loading ? (
          <AppState
            tone="loading"
            title="Loading leaderboard"
            message={`Checking ${activeModeLabel} results.`}
          />
        ) : error ? (
          <AppState tone="error" title="Leaderboard unavailable" message={error} actionLabel="Retry" onAction={fetchData} />
        ) : (
          <>
            <section className="your-best">
              <span className="section-title">Your best</span>
              {isUserInTop20 ? (
                <p>
                  Rank {userRank} in {activeModeLabel}
                </p>
              ) : userResult ? (
                <p>
                  Rank {userRank} · {userResult.score}/{userResult.total} ·{' '}
                  {formatLeaderboardTime(userResult.durationSeconds)}
                </p>
              ) : (
                <p>Take a quiz in {activeModeLabel} to appear on this board.</p>
              )}
            </section>

            {leaderboardData.length === 0 ? (
              <AppState
                title="No results yet"
                message={`No ${activeModeLabel} results for this ${
                  timeWindow === 'week' ? 'week' : 'mode'
                }.`}
              />
            ) : (
              <LeaderboardTable
                data={leaderboardData}
                userResult={userResult}
                userRank={userRank}
                limit={20}
                showUserOutsideLimit={true}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
