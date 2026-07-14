// Admin access is gated by the users/{uid}.role field in Firestore. There is
// intentionally NO client-side code path that promotes a user to admin. To make
// someone an admin: open the Firebase Console, navigate to the users collection,
// find their document, and change role from "student" to "admin". This is the
// only way, by design.

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserDoc } from '../lib/auth';
import { getAllQuizResults, getWeekStart, formatRelativeTime } from '../lib/quiz';
import { irab, nounFeatures, roles, vocab } from '../data/arabic';
import { getFiqhQuestions } from '../data/fiqh';
import { FIQH_TOPICS, QUIZ_MODES } from '../config/subjects';
import './AdminPage.css';

function NotFoundPage() {
  return (
    <div className="not-found-container">
      <h1 className="not-found-title">404</h1>
      <p className="not-found-message">This page does not exist.</p>
    </div>
  );
}

function BankViewer() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    irab: false,
    noun: false,
    role: false,
    vocab: false,
    fiqh: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Filter functions
  const filterIrab = (item) => {
    if (!searchQuery) return true;
    return (
      item.sentence.includes(searchQuery) ||
      item.target.includes(searchQuery)
    );
  };

  const filterNoun = (item) => {
    if (!searchQuery) return true;
    return item.word.includes(searchQuery);
  };

  const filterRole = (item) => {
    if (!searchQuery) return true;
    return item.words.some((word) => word.includes(searchQuery));
  };

  const filterVocab = (item) => {
    if (!searchQuery) return true;
    return (
      item.ar.includes(searchQuery) ||
      item.en.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filterFiqh = (item) => {
    if (!searchQuery) return true;
    return (
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredIrab = irab.filter(filterIrab);
  const filteredNoun = nounFeatures.filter(filterNoun);
  const filteredRole = roles.filter(filterRole);
  const filteredVocab = vocab.filter(filterVocab);
  const allFiqhQuestions = getFiqhQuestions('all');
  const filteredFiqh = allFiqhQuestions.filter(filterFiqh);

  const caseColors = {
    raf: 'case-raf',
    nasb: 'case-nasb',
    jarr: 'case-jarr',
  };

  const caseLabels = {
    raf: "Raf'",
    nasb: 'Nasb',
    jarr: 'Jarr',
  };

  const defLabels = {
    marifa: "Ma'rifa",
    nakirah: 'Nakirah',
  };

  const genderLabels = {
    m: 'Masc.',
    f: 'Fem.',
  };

  const numberLabels = {
    sing: 'Sing.',
    dual: 'Dual',
    plural: 'Plural',
  };

  return (
    <div className="bank-viewer">
      <div className="bank-summary">
        I'rab: {irab.length} &middot; Noun features: {nounFeatures.length} &middot; Roles: {roles.length} &middot; Vocab: {vocab.length} &middot; Fiqh: {allFiqhQuestions.length}
      </div>

      <div className="bank-search">
        <input
          type="text"
          placeholder="Search Arabic text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          dir="auto"
        />
      </div>

      <div className="bank-sections">
        {/* I'rab Section */}
        <section className="bank-section">
          <button
            className="section-header"
            onClick={() => toggleSection('irab')}
          >
            <span className="section-title">I'rab</span>
            <span className="section-count">{filteredIrab.length}</span>
            <span className={`section-arrow ${expandedSections.irab ? 'expanded' : ''}`}>
              &#9662;
            </span>
          </button>
          {expandedSections.irab && (
            <div className="section-content">
              {filteredIrab.map((item, idx) => (
                <div key={idx} className="irab-row">
                  <div className="irab-sentence" dir="rtl">
                    {item.sentence.split(item.target).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="irab-target">{item.target}</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="irab-details">
                    <span className={`case-badge ${caseColors[item.answer]}`}>
                      {caseLabels[item.answer]}
                    </span>
                    <span className="irab-reason">{item.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Noun Features Section */}
        <section className="bank-section">
          <button
            className="section-header"
            onClick={() => toggleSection('noun')}
          >
            <span className="section-title">Noun Features</span>
            <span className="section-count">{filteredNoun.length}</span>
            <span className={`section-arrow ${expandedSections.noun ? 'expanded' : ''}`}>
              &#9662;
            </span>
          </button>
          {expandedSections.noun && (
            <div className="section-content">
              {filteredNoun.map((item, idx) => (
                <div key={idx} className="noun-row">
                  <span className="noun-word" dir="rtl">{item.word}</span>
                  <div className="noun-tags">
                    <span className="noun-tag tag-def">{defLabels[item.def]}</span>
                    <span className="noun-tag tag-gender">{genderLabels[item.gender]}</span>
                    <span className="noun-tag tag-number">{numberLabels[item.number]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Roles Section */}
        <section className="bank-section">
          <button
            className="section-header"
            onClick={() => toggleSection('role')}
          >
            <span className="section-title">Roles</span>
            <span className="section-count">{filteredRole.length}</span>
            <span className={`section-arrow ${expandedSections.role ? 'expanded' : ''}`}>
              &#9662;
            </span>
          </button>
          {expandedSections.role && (
            <div className="section-content">
              {filteredRole.map((item, idx) => (
                <div key={idx} className="role-row">
                  <div className="role-sentence" dir="rtl">
                    {item.words.map((word, i) => (
                      <span
                        key={i}
                        className={i === item.answerIndex ? 'role-answer' : ''}
                      >
                        {word}
                        {i < item.words.length - 1 && ' '}
                      </span>
                    ))}
                  </div>
                  <div className="role-details">
                    <span className="role-label">{item.role}</span>
                    <span className="role-reason">{item.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Vocab Section */}
        <section className="bank-section">
          <button
            className="section-header"
            onClick={() => toggleSection('vocab')}
          >
            <span className="section-title">Vocab</span>
            <span className="section-count">{filteredVocab.length}</span>
            <span className={`section-arrow ${expandedSections.vocab ? 'expanded' : ''}`}>
              &#9662;
            </span>
          </button>
          {expandedSections.vocab && (
            <div className="section-content">
              {filteredVocab.map((item, idx) => (
                <div key={idx} className="vocab-row">
                  <span className="vocab-ar" dir="rtl">{item.ar}</span>
                  <span className="vocab-en">{item.en}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Fiqh Section */}
        <section className="bank-section">
          <button
            className="section-header"
            onClick={() => toggleSection('fiqh')}
          >
            <span className="section-title">Fiqh</span>
            <span className="section-count">{filteredFiqh.length}</span>
            <span className={`section-arrow ${expandedSections.fiqh ? 'expanded' : ''}`}>
              &#9662;
            </span>
          </button>
          {expandedSections.fiqh && (
            <div className="section-content">
              {FIQH_TOPICS.map((topicMeta) => {
                const topicQuestions = filteredFiqh.filter((q) => q.topic === topicMeta.code);
                if (topicQuestions.length === 0) return null;
                return (
                  <div key={topicMeta.code} className="fiqh-topic-group">
                    <h4 className="fiqh-topic-heading">{topicMeta.label} ({topicQuestions.length})</h4>
                    {topicQuestions.map((item) => (
                      <div key={item.id} className="fiqh-row">
                        <div className="fiqh-row-prompt">
                          {item.prompt}
                          {item.madhhab && <span className="fiqh-row-madhhab"> [{item.madhhab}]</span>}
                        </div>
                        <div className="fiqh-row-details">
                          <span className="fiqh-row-type">{item.type.toUpperCase()}</span>
                          <span className="fiqh-row-answer">
                            {item.type === 'mcq' ? item.options[item.answerIndex] : String(item.answer)}
                          </span>
                          <span className="fiqh-row-sources">{item.sourceIds.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const MODE_LABELS = QUIZ_MODES;

function ClassStats() {
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('avgScoreWeek');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    async function fetchData() {
      try {
        const results = await getAllQuizResults();
        setAllResults(results);
      } catch (err) {
        console.error('Error fetching quiz results:', err);
        setError('Failed to load quiz results.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Compute statistics
  const stats = useMemo(() => {
    const weekStart = getWeekStart();

    // Filter results for this week
    const weekResults = allResults.filter(
      (r) => r.completedAt >= weekStart
    );

    // Class overview
    const totalQuizzesWeek = weekResults.length;
    const totalQuizzesAllTime = allResults.length;
    const uniqueStudentsWeek = new Set(weekResults.map((r) => r.userId)).size;
    const avgScoreWeek =
      weekResults.length > 0
        ? weekResults.reduce((sum, r) => sum + r.score, 0) / weekResults.length
        : 0;

    // Per-student stats
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

      if (result.completedAt >= weekStart) {
        student.weekResults.push(result);
      }

      // Track scores by mode
      if (!student.modeScores[result.mode]) {
        student.modeScores[result.mode] = [];
      }
      student.modeScores[result.mode].push(result.score);
    }

    // Compute per-student aggregates
    const students = Array.from(studentMap.values()).map((student) => {
      const quizzesWeek = student.weekResults.length;
      const avgScoreWeek =
        quizzesWeek > 0
          ? student.weekResults.reduce((sum, r) => sum + r.score, 0) / quizzesWeek
          : null;

      // Find weakest mode (mode with lowest average, must have at least 2 different modes)
      let weakestMode = null;
      const modeAverages = Object.entries(student.modeScores).map(([mode, scores]) => ({
        mode,
        avg: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      }));

      if (modeAverages.length >= 2) {
        const sorted = modeAverages.sort((a, b) => a.avg - b.avg);
        weakestMode = sorted[0].mode;
      }

      // Last active
      const lastResult = student.allResults.sort(
        (a, b) => b.completedAt - a.completedAt
      )[0];

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
      totalQuizzesWeek,
      totalQuizzesAllTime,
      uniqueStudentsWeek,
      avgScoreWeek,
      students,
    };
  }, [allResults]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = stats.students;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.username.toLowerCase().includes(query)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'username':
          aVal = a.username.toLowerCase();
          bVal = b.username.toLowerCase();
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);

        case 'quizzesWeek':
          aVal = a.quizzesWeek;
          bVal = b.quizzesWeek;
          break;

        case 'avgScoreWeek':
          // Null values should go last
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

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [stats.students, searchQuery, sortBy, sortDirection]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      // Default to ascending for avgScoreWeek (to show struggling students first)
      // and descending for others
      setSortDirection(column === 'avgScoreWeek' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return <span className="sort-icon">{sortDirection === 'asc' ? ' \u25B2' : ' \u25BC'}</span>;
  };

  if (loading) {
    return <div className="stats-loading">Loading class statistics...</div>;
  }

  if (error) {
    return <div className="stats-error">{error}</div>;
  }

  return (
    <div className="class-stats">
      {/* Class overview */}
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
            <span className="overview-value">
              {stats.avgScoreWeek.toFixed(1)}
            </span>
            <span className="overview-label">Average score this week</span>
          </div>
        </div>
      </section>

      {/* Per-student table */}
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
                  <th
                    className="sortable"
                    onClick={() => handleSort('username')}
                  >
                    Username
                    <SortIcon column="username" />
                  </th>
                  <th
                    className="sortable col-num"
                    onClick={() => handleSort('quizzesWeek')}
                  >
                    Quizzes (Week)
                    <SortIcon column="quizzesWeek" />
                  </th>
                  <th
                    className="sortable col-num"
                    onClick={() => handleSort('avgScoreWeek')}
                  >
                    Avg Score (Week)
                    <SortIcon column="avgScoreWeek" />
                  </th>
                  <th className="col-mode">Weakest Mode</th>
                  <th
                    className="sortable col-date"
                    onClick={() => handleSort('lastActive')}
                  >
                    Last Active
                    <SortIcon column="lastActive" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.userId}>
                    <td>{student.username}</td>
                    <td className="col-num">{student.quizzesWeek}</td>
                    <td className="col-num">
                      {student.avgScoreWeek !== null
                        ? student.avgScoreWeek.toFixed(1)
                        : '-'}
                    </td>
                    <td className="col-mode">
                      {student.weakestMode
                        ? MODE_LABELS[student.weakestMode]?.label
                        : '-'}
                    </td>
                    <td className="col-date">
                      {student.lastActive
                        ? formatRelativeTime(student.lastActive)
                        : '-'}
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

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bank');

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Always fetch fresh from Firestore - don't trust cached values
        const userDoc = await getUserDoc(user.uid);
        setIsAdmin(userDoc?.role === 'admin');
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <NotFoundPage />;
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button className="back-to-home-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </header>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          Bank
        </button>
        <button
          className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Class Stats
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'bank' && <BankViewer />}
        {activeTab === 'stats' && <ClassStats />}
      </div>
    </div>
  );
}
