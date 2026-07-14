import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, getUserBestResult } from '../lib/quiz';
import { QUIZ_MODES } from '../config/subjects';
import LeaderboardTable from './LeaderboardTable';
import './LeaderboardPreview.css';

const MODES = Object.entries(QUIZ_MODES).map(([id, config]) => ({
  id,
  label: config.label,
}));

export default function LeaderboardPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState(() => {
    const lastMode = localStorage.getItem('lastQuizMode');
    return lastMode && MODES.find((m) => m.id === lastMode) ? lastMode : 'irab';
  });
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userResult, setUserResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch top 5 for this week
        const data = await getLeaderboard({
          mode: activeMode,
          allTime: false,
          bankSource: QUIZ_MODES[activeMode].bankSource,
          maxResults: 5,
        });

        setLeaderboardData(data);

        // Check if user is in top 5
        const userInTop5 = data.some((r) => r.userId === user.uid);

        if (!userInTop5) {
          // Fetch user's best result for this mode this week
          const userBest = await getUserBestResult({
            userId: user.uid,
            mode: activeMode,
            allTime: false,
            bankSource: QUIZ_MODES[activeMode].bankSource,
          });

          setUserResult(userBest);
        } else {
          setUserResult(null);
        }
      } catch (err) {
        console.error('Error fetching leaderboard preview:', err);
        setError('Could not load leaderboard.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [activeMode, user]);

  const isUserInTop5 = leaderboardData.some((r) => r.userId === user?.uid);
  const hasNoResult = !isUserInTop5 && !userResult;

  return (
    <div className="leaderboard-preview">
      <div className="preview-header">
        <div className="preview-title-group">
          <h3 className="section-title">Leaderboard</h3>
          <span className="preview-subtitle">This week</span>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="preview-mode-tabs">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className={`preview-mode-tab ${activeMode === mode.id ? 'active' : ''}`}
            onClick={() => setActiveMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="preview-content">
        {loading ? (
          <div className="preview-loading">Loading...</div>
        ) : error ? (
          <div className="preview-error">{error}</div>
        ) : (
          <>
            {hasNoResult && (
              <div className="preview-no-result-banner">
                Take a quiz in this mode to appear on the leaderboard.
              </div>
            )}

            {leaderboardData.length === 0 ? (
              <div className="preview-empty">
                No results yet this week. Be the first!
              </div>
            ) : (
              <LeaderboardTable
                data={leaderboardData}
                userResult={userResult}
                userRank={userResult ? '>5' : null}
                limit={5}
                showUserOutsideLimit={false}
                compact={true}
              />
            )}
          </>
        )}
      </div>

      {/* View full leaderboard link */}
      <button
        className="preview-view-full"
        onClick={() => navigate('/leaderboard')}
      >
        View full leaderboard
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
