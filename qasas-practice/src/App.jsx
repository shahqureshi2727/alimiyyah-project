import { useCallback, useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import HomeScreen from './components/HomeScreen';
import IrabMode from './components/IrabMode';
import NounMode from './components/NounMode';
import RoleMode from './components/RoleMode';
import VocabMode from './components/VocabMode';
import MorphologyMode from './components/MorphologyMode';
import FiqhPracticeMode from './components/FiqhPracticeMode';
import HadithPracticeMode from './components/HadithPracticeMode';
import TafsirPracticeMode from './components/TafsirPracticeMode';
import QuizPicker from './components/QuizPicker';
import TimedQuiz from './components/TimedQuiz';
import Leaderboard from './components/Leaderboard';
import AdminPage from './components/AdminPage';
import WeaknessDashboard from './components/WeaknessDashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import AuthHeader from './components/AuthHeader';
import ErrorBoundary from './components/ErrorBoundary';
import { practicePath, resolvePracticeRoute, resolveQuizRoute, routeTitle } from './lib/app-routes';
import { setLastQuizMode } from './lib/last-quiz-mode';
import './App.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <p>Loading...</p>
    </div>
  );
}

function useDocumentTitle(title) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }, [title]);
}

function redirectTarget(location) {
  const from = location.state?.from;
  if (!from) return '/';
  return `${from.pathname || '/'}${from.search || ''}${from.hash || ''}`;
}

function isQuizAttemptPath(pathname) {
  return /^\/quiz\/[^/]+/.test(pathname);
}

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [headerOverride, setHeaderOverride] = useState(null);
  const headerHidden =
    headerOverride?.pathname === location.pathname
      ? headerOverride.hidden
      : isQuizAttemptPath(location.pathname);
  const setHeaderHidden = useCallback(
    (hidden) => setHeaderOverride({ pathname: location.pathname, hidden }),
    [location.pathname]
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <>
      <AuthHeader hidden={headerHidden} />
      <div className={`app-content ${headerHidden ? 'no-header' : ''}`}>
        <ErrorBoundary
          key={location.pathname}
          name="Route"
          resetKey={location.key}
          title="This screen stopped working."
          message="Go back or reload the page. If it happens again, send the reference ID to your teacher."
        >
          <Outlet context={{ setHeaderHidden }} />
        </ErrorBoundary>
      </div>
    </>
  );
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTarget(location)} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  useDocumentTitle(routeTitle('admin'));

  if (!isAdmin) {
    return <AdminDenied />;
  }

  return children;
}

function AdminDenied() {
  return (
    <main className="route-message" data-screen="admin-denied">
      <h1>Admin access required</h1>
      <p>This area is only available to teachers and admins.</p>
      <Link className="route-message-link" to="/">
        Go home
      </Link>
    </main>
  );
}

function InvalidRoute({ message }) {
  useDocumentTitle(routeTitle('notFound'));

  return (
    <main className="route-message" data-screen="invalid-route">
      <h1>That topic doesn't exist</h1>
      <p>{message}</p>
      <Link className="route-message-link" to="/">
        Go home
      </Link>
    </main>
  );
}

function NotFound() {
  useDocumentTitle(routeTitle('notFound'));

  return (
    <main className="route-message" data-screen="not-found">
      <h1>Page not found</h1>
      <p>This link does not match a Qasas Practice screen.</p>
      <Link className="route-message-link" to="/">
        Go home
      </Link>
    </main>
  );
}

function HomeRoute() {
  useDocumentTitle(routeTitle('home'));
  return <HomeScreen />;
}

function PracticeRoute() {
  const navigate = useNavigate();
  const { mode, topic = null } = useParams();
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('variant') || 'mcq';
  const route = resolvePracticeRoute({ mode, topic, variant });

  useDocumentTitle(
    route.status === 'ok'
      ? routeTitle('practice', { label: route.label })
      : routeTitle('notFound')
  );

  if (route.status !== 'ok') {
    return <InvalidRoute message={route.message} />;
  }

  return (
    <PracticeSession
      key={`${route.mode}:${route.topic || 'all'}:${route.variant}`}
      route={route}
      navigate={navigate}
    />
  );
}

function PracticeSession({ route, navigate }) {
  const [score, setScore] = useState(0);
  const goHome = () => navigate('/');
  const selectMorphologyScope = (scope) =>
    navigate(practicePath({ mode: 'morphology', topic: scope }));

  switch (route.mode) {
    case 'irab':
      return <IrabMode onBack={goHome} score={score} setScore={setScore} />;
    case 'noun':
      return <NounMode onBack={goHome} score={score} setScore={setScore} />;
    case 'role':
      return <RoleMode onBack={goHome} score={score} setScore={setScore} />;
    case 'vocab':
      return <VocabMode onBack={goHome} score={score} setScore={setScore} />;
    case 'morphology':
      return (
        <MorphologyMode
          key={route.topic || 'picker'}
          initialScope={route.topic}
          onBack={goHome}
          onSelectScope={selectMorphologyScope}
          score={score}
          setScore={setScore}
        />
      );
    case 'fiqh':
      return (
        <FiqhPracticeMode topic={route.topic} onBack={goHome} score={score} setScore={setScore} />
      );
    case 'hadith':
      return (
        <HadithPracticeMode topic={route.topic} onBack={goHome} score={score} setScore={setScore} />
      );
    case 'tafsir':
      return (
        <TafsirPracticeMode
          variant={route.variant}
          topic={route.topic}
          onBack={goHome}
          score={score}
          setScore={setScore}
        />
      );
    default:
      return <InvalidRoute message="That practice mode doesn't exist." />;
  }
}

function QuizPickerRoute() {
  const navigate = useNavigate();
  useDocumentTitle(routeTitle('quiz', { label: 'Choose a Quiz' }));

  return <QuizPicker onBack={() => navigate('/')} />;
}

function QuizRoute() {
  const navigate = useNavigate();
  const { setHeaderHidden } = useOutletContext();
  const { mode, topic = null } = useParams();
  const route = resolveQuizRoute({ mode, topic });
  const [quizKey, setQuizKey] = useState(0);

  useEffect(() => {
    if (route.status === 'ok') {
      setHeaderHidden(true);
      setLastQuizMode(route.mode);
    } else {
      setHeaderHidden(false);
    }

    return () => setHeaderHidden(false);
  }, [route.mode, route.status, setHeaderHidden]);

  useDocumentTitle(
    route.status === 'ok' ? routeTitle('quiz', { label: route.label }) : routeTitle('notFound')
  );

  if (route.status !== 'ok') {
    return <InvalidRoute message={route.message} />;
  }

  const goHome = () => navigate('/');
  const playAgain = () => {
    setHeaderHidden(true);
    setQuizKey((current) => current + 1);
  };

  return (
    <TimedQuiz
      key={`${route.mode}:${route.topic || 'all'}:${quizKey}`}
      mode={route.mode}
      topic={route.topic}
      onBack={goHome}
      onPlayAgain={playAgain}
      onQuizComplete={() => setHeaderHidden(false)}
    />
  );
}

function LeaderboardRoute() {
  useDocumentTitle(routeTitle('leaderboard'));
  return <Leaderboard />;
}

function WeaknessRoute() {
  useDocumentTitle(routeTitle('weakness'));
  return <WeaknessDashboard />;
}

function LoginRoute() {
  useDocumentTitle(routeTitle('login'));
  return (
    <PublicRoute>
      <Login />
    </PublicRoute>
  );
}

function SignupRoute() {
  useDocumentTitle(routeTitle('signup'));
  return (
    <PublicRoute>
      <Signup />
    </PublicRoute>
  );
}

function ForgotPasswordRoute() {
  useDocumentTitle(routeTitle('forgotPassword'));
  return (
    <PublicRoute>
      <ForgotPassword />
    </PublicRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<SignupRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<HomeRoute />} />
        <Route path="/practice/:mode" element={<PracticeRoute />} />
        <Route path="/practice/:mode/:topic" element={<PracticeRoute />} />
        <Route path="/quiz" element={<QuizPickerRoute />} />
        <Route path="/quiz/:mode" element={<QuizRoute />} />
        <Route path="/quiz/:mode/:topic" element={<QuizRoute />} />
        <Route path="/leaderboard" element={<LeaderboardRoute />} />
        <Route path="/weakness" element={<WeaknessRoute />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
