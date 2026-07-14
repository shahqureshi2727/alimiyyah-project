import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import HomeScreen from './components/HomeScreen';
import IrabMode from './components/IrabMode';
import NounMode from './components/NounMode';
import RoleMode from './components/RoleMode';
import VocabMode from './components/VocabMode';
import MorphologyMode from './components/MorphologyMode';
import FiqhPracticeMode from './components/FiqhPracticeMode';
import QuizPicker from './components/QuizPicker';
import TimedQuiz from './components/TimedQuiz';
import Leaderboard from './components/Leaderboard';
import AdminPage from './components/AdminPage';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import AuthHeader from './components/AuthHeader';
import './App.css';

// Loading spinner while checking auth state
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <p>Loading...</p>
    </div>
  );
}

// Protected route wrapper - redirects to login if not authenticated
function ProtectedRoute({ children, hideHeader = false }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <AuthHeader hidden={hideHeader} />
      <div className={`app-content ${hideHeader ? 'no-header' : ''}`}>
        {children}
      </div>
    </>
  );
}

// Public route wrapper - redirects to home if already authenticated
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Main app with practice mode navigation
function MainApp() {
  const navigate = useNavigate();
  const [currentMode, setCurrentMode] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [quizMode, setQuizMode] = useState(null);
  const [quizTopic, setQuizTopic] = useState(null);
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [showQuizPicker, setShowQuizPicker] = useState(false);
  const [scores, setScores] = useState({
    irab: 0,
    noun: 0,
    role: 0,
    vocab: 0,
    morphology: 0,
    fiqh: 0,
  });

  const handleSelectMode = (mode) => {
    if (mode.startsWith('fiqh-')) {
      setCurrentMode('fiqh');
      setCurrentTopic(mode.slice('fiqh-'.length));
    } else if (mode.startsWith('morphology-')) {
      setCurrentMode('morphology');
      setCurrentTopic(mode.slice('morphology-'.length));
    } else {
      setCurrentMode(mode);
      setCurrentTopic(null);
    }
    setShowQuizPicker(false);
    setQuizMode(null);
    setQuizInProgress(false);
  };

  const handleBack = () => {
    setCurrentMode(null);
    setCurrentTopic(null);
    setShowQuizPicker(false);
    setQuizMode(null);
    setQuizInProgress(false);
  };

  const handleSelectQuiz = () => {
    setShowQuizPicker(true);
    setCurrentMode(null);
    setQuizMode(null);
    setQuizInProgress(false);
  };

  const handleSelectQuizMode = (mode) => {
    if (mode.startsWith('fiqh-')) {
      const topic = mode.slice('fiqh-'.length);
      // Store last played mode for leaderboard default
      localStorage.setItem('lastQuizMode', 'fiqh');
      setQuizMode('fiqh');
      setQuizTopic(topic);
    } else {
      localStorage.setItem('lastQuizMode', mode);
      setQuizMode(mode);
      setQuizTopic(null);
    }
    setQuizInProgress(true);
    setShowQuizPicker(false);
  };

  const handleQuizBack = () => {
    setQuizMode(null);
    setQuizTopic(null);
    setQuizInProgress(false);
    setShowQuizPicker(false);
    setCurrentMode(null);
  };

  const handlePlayAgain = () => {
    // Restart the same quiz mode with fresh questions
    const mode = quizMode;
    setQuizMode(null);
    setQuizInProgress(false);
    // Small delay to force re-mount
    setTimeout(() => {
      setQuizMode(mode);
      setQuizInProgress(true);
    }, 10);
  };

  const setModeScore = (mode) => (newScore) => {
    setScores((prev) => ({ ...prev, [mode]: newScore }));
  };

  // Show timed quiz (header is hidden during quiz, shown on results)
  if (quizMode) {
    return (
      <ProtectedRoute hideHeader={quizInProgress}>
        <TimedQuiz
          mode={quizMode}
          topic={quizTopic}
          onBack={handleQuizBack}
          onPlayAgain={handlePlayAgain}
          onQuizComplete={() => setQuizInProgress(false)}
        />
      </ProtectedRoute>
    );
  }

  // Show quiz picker
  if (showQuizPicker) {
    return (
      <ProtectedRoute>
        <QuizPicker
          onSelectMode={handleSelectQuizMode}
          onBack={handleBack}
        />
      </ProtectedRoute>
    );
  }

  // Show untimed practice modes
  if (currentMode) {
    const modeComponent = (() => {
      switch (currentMode) {
        case 'irab':
          return (
            <IrabMode
              onBack={handleBack}
              score={scores.irab}
              setScore={setModeScore('irab')}
            />
          );
        case 'noun':
          return (
            <NounMode
              onBack={handleBack}
              score={scores.noun}
              setScore={setModeScore('noun')}
            />
          );
        case 'role':
          return (
            <RoleMode
              onBack={handleBack}
              score={scores.role}
              setScore={setModeScore('role')}
            />
          );
        case 'vocab':
          return (
            <VocabMode
              onBack={handleBack}
              score={scores.vocab}
              setScore={setModeScore('vocab')}
            />
          );
        case 'morphology':
          return (
            <MorphologyMode
              initialScope={currentTopic}
              onBack={handleBack}
              score={scores.morphology}
              setScore={setModeScore('morphology')}
            />
          );
        case 'fiqh':
          return (
            <FiqhPracticeMode
              topic={currentTopic}
              onBack={handleBack}
              score={scores.fiqh}
              setScore={setModeScore('fiqh')}
            />
          );
        default:
          return (
            <HomeScreen
              onSelectMode={handleSelectMode}
              onSelectQuiz={handleSelectQuiz}
            />
          );
      }
    })();

    return <ProtectedRoute>{modeComponent}</ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <HomeScreen
        onSelectMode={handleSelectMode}
        onSelectQuiz={handleSelectQuiz}
      />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<MainApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
