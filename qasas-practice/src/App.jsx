import { lazy, Suspense, useEffect, useState } from 'react';
import {
  Link,
  Route,
  Routes,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { practicePath, resolvePracticeRoute, resolveQuizRoute, routeTitle } from './lib/app-routes';
import { setLastQuizMode } from './lib/last-quiz-mode';
import AppState from './components/AppState';
import './App.css';
import './styles/components.css';

const HomeScreen = lazy(() => import('./components/HomeScreen'));
const IrabMode = lazy(() => import('./components/IrabMode'));
const NounMode = lazy(() => import('./components/NounMode'));
const RoleMode = lazy(() => import('./components/RoleMode'));
const VocabMode = lazy(() => import('./components/VocabMode'));
const MorphologyMode = lazy(() => import('./components/MorphologyMode'));
const FiqhPracticeMode = lazy(() => import('./components/FiqhPracticeMode'));
const HadithPracticeMode = lazy(() => import('./components/HadithPracticeMode'));
const TafsirPracticeMode = lazy(() => import('./components/TafsirPracticeMode'));
const QuizPicker = lazy(() => import('./components/QuizPicker'));
const TimedQuiz = lazy(() => import('./components/TimedQuiz'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const WeaknessDashboard = lazy(() => import('./components/WeaknessDashboard'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ProtectedLayout = lazy(() => import('./components/ProtectedLayout'));
const AdminRoute = lazy(() =>
  import('./components/ProtectedLayout').then((module) => ({ default: module.AdminRoute }))
);

function LoadingScreen() {
  return (
    <AppState
      className="loading-screen"
      tone="loading"
      title="Preparing your study desk"
      message="Loading the next screen."
      headingLevel={1}
    />
  );
}

function useDocumentTitle(title) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }, [title]);
}

export function PublicRoute({ children }) {
  return children;
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
      <p>This link does not match an Alimiyyah Practice screen.</p>
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
  const goHome = () => navigate('/');
  const selectMorphologyScope = (scope) =>
    navigate(practicePath({ mode: 'morphology', topic: scope }));

  switch (route.mode) {
    case 'irab':
      return <IrabMode onBack={goHome} />;
    case 'noun':
      return <NounMode onBack={goHome} />;
    case 'role':
      return <RoleMode onBack={goHome} />;
    case 'vocab':
      return <VocabMode onBack={goHome} />;
    case 'morphology':
      return (
        <MorphologyMode
          key={route.topic || 'picker'}
          initialScope={route.topic}
          onBack={goHome}
          onSelectScope={selectMorphologyScope}
        />
      );
    case 'fiqh':
      return <FiqhPracticeMode topic={route.topic} onBack={goHome} />;
    case 'hadith':
      return <HadithPracticeMode topic={route.topic} onBack={goHome} />;
    case 'tafsir':
      return (
        <TafsirPracticeMode
          variant={route.variant}
          topic={route.topic}
          onBack={goHome}
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
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
  );
}
