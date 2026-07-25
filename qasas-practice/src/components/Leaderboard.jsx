import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, getUserBestResult } from '../lib/quiz';
import { QUIZ_MODES } from '../config/subjects';
import { error as logError } from '../lib/logger';
import LeaderboardTable from './LeaderboardTable';
import './Leaderboard.css';

const MODES = Object.entries(QUIZ_MODES).map(([id, config]) => ({
  id,
  label: config.label,
}));

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState(() => {
    const lastMode = localStorage.getItem('lastQuizMode');
    return lastMode && MODES.find((m) => m.id === lastMode) ? lastMode : 'irab';
  });
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

  return (
    <div className="leaderboard">
      <header className="leaderboard-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          Back
        </button>
        <h1 className="leaderboard-title">Speed & Accuracy</h1>
        <div className="spacer"></div>
      </header>

      {/* Mode tabs */}
      <div className="mode-tabs">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className={`mode-tab ${activeMode === mode.id ? 'active' : ''}`}
            onClick={() => setActiveMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Time window toggle */}
      <div className="time-toggle">
        <button
          className={`time-btn ${timeWindow === 'week' ? 'active' : ''}`}
          onClick={() => setTimeWindow('week')}
        >
          This Week
        </button>
        <button
          className={`time-btn ${timeWindow === 'allTime' ? 'active' : ''}`}
          onClick={() => setTimeWindow('allTime')}
        >
          All Time
        </button>
      </div>

      {/* Content */}
      <div className="leaderboard-content">
        {loading ? (
          <div className="leaderboard-loading">Loading...</div>
        ) : error ? (
          <div className="leaderboard-error">
            <p>{error}</p>
            <button className="try-quiz-link" onClick={fetchData}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {!isUserInTop20 && !userResult && (
              <div className="no-result-banner">
                Take a quiz in this mode to appear on the leaderboard.
              </div>
            )}

            {leaderboardData.length === 0 ? (
              <div className="leaderboard-empty">
                No results yet for this {timeWindow === 'week' ? 'week' : 'mode'}. Be the first!
              </div>
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
    </div>
  );
}
