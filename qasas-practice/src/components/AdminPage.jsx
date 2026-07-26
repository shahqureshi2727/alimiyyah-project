// Admin access is gated by the users/{uid}.role field in Firestore. There is
// intentionally NO client-side code path that promotes a user to admin. To make
// someone an admin: open the Firebase Console, navigate to the users collection,
// find their document, and change role from "student" to "admin". This is the
// only way, by design.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAdminUserDoc } from '../lib/admin-queries';
import { irab, nounFeatures, roles, vocab } from '../data/arabic';
import { getFiqhQuestions } from '../data/fiqh';
import { getHadithQuestions } from '../data/hadith';
import { getTafsirQuestions } from '../data/tafsir';
import { FIQH_TOPICS, HADITH_TOPICS, TAFSIR_TOPICS } from '../config/subjects';
import { error as logError } from '../lib/logger';
import ClassStats from './admin/ClassStats';
import AdminWeaknessView from './admin/AdminWeaknessView';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    irab: false,
    noun: false,
    role: false,
    vocab: false,
    fiqh: false,
    hadith: false,
    tafsir: false,
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
    return item.sentence.includes(searchQuery) || item.target.includes(searchQuery);
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
      item.ar.includes(searchQuery) || item.en.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filterFiqh = (item) => {
    if (!searchQuery) return true;
    return (
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filterHadith = (item) => {
    if (!searchQuery) return true;
    return (
      item.arabicText.includes(searchQuery) ||
      item.correctTranslation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filterTafsir = (item) => {
    if (!searchQuery) return true;
    return (
      item.arabicText.includes(searchQuery) ||
      item.surahName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.correctTranslation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredIrab = irab.filter(filterIrab);
  const filteredNoun = nounFeatures.filter(filterNoun);
  const filteredRole = roles.filter(filterRole);
  const filteredVocab = vocab.filter(filterVocab);
  const allFiqhQuestions = getFiqhQuestions('all');
  const filteredFiqh = allFiqhQuestions.filter(filterFiqh);
  const allHadithQuestions = getHadithQuestions('all');
  const filteredHadith = allHadithQuestions.filter(filterHadith);
  const allTafsirQuestions = getTafsirQuestions('all');
  const filteredTafsir = allTafsirQuestions.filter(filterTafsir);

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
        I'rab: {irab.length} &middot; Noun features: {nounFeatures.length} &middot; Roles:{' '}
        {roles.length} &middot; Vocab: {vocab.length} &middot; Fiqh: {allFiqhQuestions.length}{' '}
        &middot; Hadith: {allHadithQuestions.length} &middot; Tafsir: {allTafsirQuestions.length}
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
          <button className="section-header" onClick={() => toggleSection('irab')}>
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
                        {i < arr.length - 1 && <span className="irab-target">{item.target}</span>}
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
          <button className="section-header" onClick={() => toggleSection('noun')}>
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
                  <span className="noun-word" dir="rtl">
                    {item.word}
                  </span>
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
          <button className="section-header" onClick={() => toggleSection('role')}>
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
                      <span key={i} className={i === item.answerIndex ? 'role-answer' : ''}>
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
          <button className="section-header" onClick={() => toggleSection('vocab')}>
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
                  <span className="vocab-ar" dir="rtl">
                    {item.ar}
                  </span>
                  <span className="vocab-en">{item.en}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Fiqh Section */}
        <section className="bank-section">
          <button className="section-header" onClick={() => toggleSection('fiqh')}>
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
                    <h4 className="fiqh-topic-heading">
                      {topicMeta.label} ({topicQuestions.length})
                    </h4>
                    {topicQuestions.map((item) => (
                      <div key={item.id} className="fiqh-row">
                        <div className="fiqh-row-prompt">
                          {item.prompt}
                          {item.madhhab && (
                            <span className="fiqh-row-madhhab"> [{item.madhhab}]</span>
                          )}
                        </div>
                        <div className="fiqh-row-details">
                          <span className="fiqh-row-type">{item.type.toUpperCase()}</span>
                          <span className="fiqh-row-answer">
                            {item.type === 'mcq'
                              ? item.options[item.answerIndex]
                              : String(item.answer)}
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

        {/* Hadith Section */}
        <section className="bank-section">
          <button className="section-header" onClick={() => toggleSection('hadith')}>
            <span className="section-title">Hadith</span>
            <span className="section-count">{filteredHadith.length}</span>
            <span className={`section-arrow ${expandedSections.hadith ? 'expanded' : ''}`}>
              &#9662;
            </span>
          </button>
          {expandedSections.hadith && (
            <div className="section-content">
              {HADITH_TOPICS.map((topicMeta) => {
                const topicQuestions = filteredHadith.filter((q) => q.topic === topicMeta.code);
                if (topicQuestions.length === 0) return null;
                return (
                  <div key={topicMeta.code} className="fiqh-topic-group">
                    <h4 className="fiqh-topic-heading">
                      {topicMeta.label} ({topicQuestions.length})
                    </h4>
                    {topicQuestions.map((item) => (
                      <div key={item.id} className="fiqh-row">
                        <div className="fiqh-row-prompt" dir="rtl">
                          {item.arabicText}
                        </div>
                        <div className="fiqh-row-details">
                          <span className="fiqh-row-type">MCQ</span>
                          <span className="fiqh-row-answer">{item.correctTranslation}</span>
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

        {/* Tafsir Section */}
        <section className="bank-section">
          <button className="section-header" onClick={() => toggleSection('tafsir')}>
            <span className="section-title">Tafsir</span>
            <span className="section-count">{filteredTafsir.length}</span>
            <span className={`section-arrow ${expandedSections.tafsir ? 'expanded' : ''}`}>
              &#9662;
            </span>
          </button>
          {expandedSections.tafsir && (
            <div className="section-content">
              {TAFSIR_TOPICS.map((topicMeta) => {
                const topicQuestions = filteredTafsir.filter((q) => q.topic === topicMeta.code);
                if (topicQuestions.length === 0) return null;
                return (
                  <div key={topicMeta.code} className="fiqh-topic-group">
                    <h4 className="fiqh-topic-heading">
                      {topicMeta.label} ({topicQuestions.length})
                    </h4>
                    {topicQuestions.map((item) => (
                      <div key={item.id} className="fiqh-row">
                        <div className="fiqh-row-prompt" dir="rtl">
                          {item.arabicText}
                        </div>
                        <div className="fiqh-row-details">
                          <span className="fiqh-row-type">MCQ</span>
                          <span className="fiqh-row-answer">{item.correctTranslation}</span>
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

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminError, setAdminError] = useState(null);
  const [activeTab, setActiveTab] = useState('bank');

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setAdminError(null);
    try {
      // Always fetch fresh from Firestore - don't trust cached values
      const userDoc = await getAdminUserDoc(user.uid);
      setIsAdmin(userDoc?.role === 'admin');
    } catch (err) {
      logError('Could not check admin status.', err, { uid: user.uid });
      setIsAdmin(false);
      setAdminError("Couldn't check admin access. Retry.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(checkAdminStatus);
  }, [checkAdminStatus]);

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (adminError) {
    return (
      <div className="admin-loading">
        <p>{adminError}</p>
        <button className="try-quiz-link" onClick={checkAdminStatus}>
          Retry
        </button>
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
        <button
          className={`admin-tab ${activeTab === 'weakness' ? 'active' : ''}`}
          onClick={() => setActiveTab('weakness')}
        >
          Weakness
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'bank' && <BankViewer />}
        {activeTab === 'stats' && <ClassStats />}
        {activeTab === 'weakness' && <AdminWeaknessView />}
      </div>
    </div>
  );
}
