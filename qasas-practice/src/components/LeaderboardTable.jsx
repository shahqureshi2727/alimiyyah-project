import { useAuth } from '../contexts/AuthContext';
import { formatLeaderboardTime } from '../lib/quiz';
import './LeaderboardTable.css';

/**
 * Reusable leaderboard table component.
 * Used both on the full /leaderboard page and the home page preview.
 */
export default function LeaderboardTable({
  data,
  userResult,
  userRank,
  limit = 20,
  showUserOutsideLimit = true,
  compact = false,
}) {
  const { user } = useAuth();

  // Limit the data to the specified limit
  const displayData = data.slice(0, limit);
  const isUserInDisplay = displayData.some((r) => r.userId === user?.uid);

  if (displayData.length === 0) {
    return null;
  }

  return (
    <table className={`leaderboard-table ${compact ? 'compact' : ''}`}>
      <thead>
        <tr>
          <th className="col-rank">#</th>
          <th className="col-name">Name</th>
          <th className="col-score">Score</th>
          <th className="col-time">Time</th>
        </tr>
      </thead>
      <tbody>
        {displayData.map((result, index) => {
          const isCurrentUser = result.userId === user?.uid;
          return (
            <tr key={result.id} className={isCurrentUser ? 'current-user' : ''}>
              <td className="col-rank">{index + 1}</td>
              <td className="col-name">{result.username}</td>
              <td className="col-score">{result.score}/10</td>
              <td className="col-time">
                {formatLeaderboardTime(result.durationSeconds)}
              </td>
            </tr>
          );
        })}

        {/* User's result if outside the displayed limit */}
        {showUserOutsideLimit && userResult && !isUserInDisplay && (
          <>
            <tr className="separator-row">
              <td colSpan="4">...</td>
            </tr>
            <tr className="current-user outside-top">
              <td className="col-rank">{userRank}</td>
              <td className="col-name">You: {userResult.username}</td>
              <td className="col-score">{userResult.score}/10</td>
              <td className="col-time">
                {formatLeaderboardTime(userResult.durationSeconds)}
              </td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}
