import { useCallback, useEffect, useMemo, useState } from 'react';
import { QUIZ_MODES } from '../../config/subjects';
import { getAdminQuizResults } from '../../lib/admin-queries';
import { formatRelativeTime, getWeekStart } from '../../lib/quiz';
import { error as logError } from '../../lib/logger';

const MODE_LABELS = QUIZ_MODES;

export default function ClassStats() {
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('avgScoreWeek');
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await getAdminQuizResults();
      setAllResults(results);
    } catch (err) {
      logError('Could not load admin quiz results.', err);
      setError("Couldn't load class statistics. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  const stats = useMemo(() => {
    const weekStart = getWeekStart();
    const weekResults = allResults.filter((r) => r.completedAt >= weekStart);
    const studentMap = new Map();

    for (const result of allResults) {
      if (!studentMap.has(result.userId)) {
        studentMap.set(result.userId, {
          userId: result.userId,
          username: result.username,
          allResults: [],
          weekResults: [],
          modeScores: {},
        });
      }

      const student = studentMap.get(result.userId);
      student.allResults.push(result);
      if (result.completedAt >= weekStart) student.weekResults.push(result);
      if (!student.modeScores[result.mode]) student.modeScores[result.mode] = [];
      student.modeScores[result.mode].push(result.score);
    }

    const students = Array.from(studentMap.values()).map((student) => {
      const quizzesWeek = student.weekResults.length;
      const avgScoreWeek =
        quizzesWeek > 0
          ? student.weekResults.reduce((sum, r) => sum + r.score, 0) / quizzesWeek
          : null;
      let weakestMode = null;
      const modeAverages = Object.entries(student.modeScores).map(([mode, scores]) => ({
        mode,
        avg: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      }));

      if (modeAverages.length >= 2) {
        const sorted = modeAverages.sort((a, b) => a.avg - b.avg);
        weakestMode = sorted[0].mode;
      }

      const lastResult = student.allResults.sort((a, b) => b.completedAt - a.completedAt)[0];
      return {
        userId: student.userId,
        username: student.username,
        quizzesWeek,
        avgScoreWeek,
        weakestMode,
        lastActive: lastResult?.completedAt || null,
      };
    });

    return {
      totalQuizzesWeek: weekResults.length,
      totalQuizzesAllTime: allResults.length,
      uniqueStudentsWeek: new Set(weekResults.map((r) => r.userId)).size,
      avgScoreWeek:
        weekResults.length > 0
          ? weekResults.reduce((sum, r) => sum + r.score, 0) / weekResults.length
          : 0,
      students,
    };
  }, [allResults]);

  const filteredStudents = useMemo(() => {
    let result = stats.students;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) => s.username.toLowerCase().includes(query));
    }

    return [...result].sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'username':
          aVal = a.username.toLowerCase();
          bVal = b.username.toLowerCase();
          return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'quizzesWeek':
          aVal = a.quizzesWeek;
          bVal = b.quizzesWeek;
          break;
        case 'avgScoreWeek':
          aVal = a.avgScoreWeek ?? (sortDirection === 'asc' ? Infinity : -Infinity);
          bVal = b.avgScoreWeek ?? (sortDirection === 'asc' ? Infinity : -Infinity);
          break;
        case 'lastActive':
          aVal = a.lastActive?.getTime() ?? 0;
          bVal = b.lastActive?.getTime() ?? 0;
          break;
        default:
          return 0;
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [stats.students, searchQuery, sortBy, sortDirection]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection(column === 'avgScoreWeek' ? 'asc' : 'desc');
    }
  };

  const sortIcon = (column) => {
    if (sortBy !== column) return null;
    return <span className="sort-icon">{sortDirection === 'asc' ? ' \u25B2' : ' \u25BC'}</span>;
  };

  if (loading) return <div className="stats-loading">Loading class statistics...</div>;
  if (error) {
    return (
      <div className="stats-error">
        <p>{error}</p>
        <button className="try-quiz-link" onClick={fetchData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="class-stats">
      <section className="stats-overview">
        <h2>Class Overview</h2>
        <div className="overview-grid">
          <div className="overview-card">
            <span className="overview-value">{stats.totalQuizzesWeek}</span>
            <span className="overview-label">Quizzes this week</span>
          </div>
          <div className="overview-card">
            <span className="overview-value">{stats.totalQuizzesAllTime}</span>
            <span className="overview-label">Quizzes all-time</span>
          </div>
          <div className="overview-card">
            <span className="overview-value">{stats.uniqueStudentsWeek}</span>
            <span className="overview-label">Active students this week</span>
          </div>
          <div className="overview-card">
            <span className="overview-value">{stats.avgScoreWeek.toFixed(1)}</span>
            <span className="overview-label">Average score this week</span>
          </div>
        </div>
      </section>

      <section className="stats-students">
        <h2>Per-Student Breakdown</h2>
        <div className="student-search">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {filteredStudents.length === 0 ? (
          <p className="no-students">No students found.</p>
        ) : (
          <div className="student-table-container">
            <table className="student-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('username')}>
                    Username
                    {sortIcon('username')}
                  </th>
                  <th className="sortable col-num" onClick={() => handleSort('quizzesWeek')}>
                    Quizzes (Week)
                    {sortIcon('quizzesWeek')}
                  </th>
                  <th className="sortable col-num" onClick={() => handleSort('avgScoreWeek')}>
                    Avg Score (Week)
                    {sortIcon('avgScoreWeek')}
                  </th>
                  <th className="col-mode">Weakest Mode</th>
                  <th className="sortable col-date" onClick={() => handleSort('lastActive')}>
                    Last Active
                    {sortIcon('lastActive')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.userId}>
                    <td>{student.username}</td>
                    <td className="col-num">{student.quizzesWeek}</td>
                    <td className="col-num">
                      {student.avgScoreWeek !== null ? student.avgScoreWeek.toFixed(1) : '-'}
                    </td>
                    <td className="col-mode">
                      {student.weakestMode ? MODE_LABELS[student.weakestMode]?.label : '-'}
                    </td>
                    <td className="col-date">
                      {student.lastActive ? formatRelativeTime(student.lastActive) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
