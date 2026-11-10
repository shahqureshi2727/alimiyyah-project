import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { act, create } from 'react-test-renderer';
import { MemoryRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import App from './App';

const authMocks = vi.hoisted(() => ({
  state: {
    isAuthenticated: true,
    loading: false,
    isAdmin: false,
    user: { uid: 'student-1' },
    username: 'Amina',
  },
}));

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => authMocks.state,
}));

vi.mock('./components/AuthHeader', () => ({
  default: ({ hidden = false }) => <header data-screen="auth-header" data-hidden={hidden} />,
}));

vi.mock('./components/ProtectedLayout', () => {
  function ProtectedLayoutMock() {
    const location = useLocation();
    const [headerHidden, setHeaderHidden] = useState(/^\/quiz\/[^/]+/.test(location.pathname));

    if (authMocks.state.loading) {
      return <div className="loading-screen">Loading...</div>;
    }

    if (!authMocks.state.isAuthenticated) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return (
      <>
        <header data-screen="auth-header" data-hidden={headerHidden} />
        <Outlet context={{ setHeaderHidden }} />
      </>
    );
  }

  function AdminRouteMock({ children }) {
    if (!authMocks.state.isAdmin) {
      return (
        <main className="route-message" data-screen="admin-denied">
          <h1>Admin access required</h1>
        </main>
      );
    }
    return children;
  }

  return {
    default: ProtectedLayoutMock,
    AdminRoute: AdminRouteMock,
  };
});

vi.mock('./components/HomeScreen', () => ({
  default: () => <main data-screen="home">Home</main>,
}));

vi.mock('./components/Login', () => {
  function LoginMock() {
    const location = useLocation();
    const from = location.state?.from;
    return (
      <main
        data-screen="login"
        data-from={from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : ''}
      >
        Login
      </main>
    );
  }

  return {
    default: LoginMock,
  };
});

vi.mock('./components/Signup', () => ({
  default: () => <main data-screen="signup">Signup</main>,
}));

vi.mock('./components/ForgotPassword', () => ({
  default: () => <main data-screen="forgot-password">Forgot Password</main>,
}));

vi.mock('./components/IrabMode', () => ({
  default: () => <main data-screen="irab">Irab</main>,
}));

vi.mock('./components/NounMode', () => ({
  default: () => <main data-screen="noun">Noun</main>,
}));

vi.mock('./components/RoleMode', () => ({
  default: () => <main data-screen="role">Role</main>,
}));

vi.mock('./components/VocabMode', () => ({
  default: () => <main data-screen="vocab">Vocab</main>,
}));

vi.mock('./components/MorphologyMode', () => ({
  default: ({ initialScope }) => <main data-screen="morphology">Morphology:{initialScope}</main>,
}));

vi.mock('./components/FiqhPracticeMode', () => ({
  default: ({ topic }) => <main data-screen="fiqh">Fiqh:{topic}</main>,
}));

vi.mock('./components/HadithPracticeMode', () => ({
  default: ({ topic }) => <main data-screen="hadith">Hadith:{topic}</main>,
}));

vi.mock('./components/TafsirPracticeMode', () => ({
  default: ({ topic, variant }) => (
    <main data-screen="tafsir">
      Tafsir:{topic}:{variant}
    </main>
  ),
}));

vi.mock('./components/QuizPicker', () => ({
  default: () => <main data-screen="quiz-picker">Quiz Picker</main>,
}));

vi.mock('./components/TimedQuiz', () => ({
  default: ({ mode, topic, onQuizComplete }) => (
    <main data-screen="timed-quiz">
      Timed:{mode}:{topic}
      <button type="button" onClick={onQuizComplete}>
        Complete
      </button>
    </main>
  ),
}));

vi.mock('./components/Leaderboard', () => ({
  default: () => <main data-screen="leaderboard">Leaderboard</main>,
}));

vi.mock('./components/WeaknessDashboard', () => ({
  default: () => <main data-screen="weakness">Weakness</main>,
}));

vi.mock('./components/AdminPage', () => ({
  default: () => <main data-screen="admin">Admin</main>,
}));

async function renderAt(path) {
  let rendered;
  await act(async () => {
    rendered = create(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    );
    await Promise.resolve();
  });
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return rendered;
}

function screen(rendered, name) {
  return rendered.root.findByProps({ 'data-screen': name });
}

function screenHeading(rendered, name) {
  return screen(rendered, name).findByType('h1').children.join('');
}

describe('App routes', () => {
  beforeEach(() => {
    authMocks.state = {
      isAuthenticated: true,
      loading: false,
      isAdmin: false,
      user: { uid: 'student-1' },
      username: 'Amina',
    };
  });

  it('renders a topic-scoped practice deep link directly', async () => {
    const rendered = await renderAt('/practice/fiqh/WUD');

    expect(screen(rendered, 'fiqh').children.join('')).toBe('Fiqh:WUD');
  });

  it('sends unauthenticated deep links to login with the original route preserved', async () => {
    authMocks.state = {
      isAuthenticated: false,
      loading: false,
      isAdmin: false,
      user: null,
      username: null,
    };

    const rendered = await renderAt('/practice/tafsir/ASR?variant=verse');

    expect(screen(rendered, 'login').props['data-from']).toBe(
      '/practice/tafsir/ASR?variant=verse'
    );
  });

  it('renders a clear invalid-topic screen for unknown configured params', async () => {
    const rendered = await renderAt('/practice/fiqh/NOPE');

    expect(screenHeading(rendered, 'invalid-route')).toContain("doesn't exist");
  });

  it('renders NotFound for unmatched paths instead of redirecting home', async () => {
    const rendered = await renderAt('/not-a-real-page');

    expect(screenHeading(rendered, 'not-found')).toContain('Page not found');
  });

  it('blocks the admin page for authenticated non-admin users before rendering AdminPage', async () => {
    authMocks.state = {
      isAuthenticated: true,
      loading: false,
      isAdmin: false,
      user: { uid: 'student-1' },
      username: 'Amina',
    };

    const rendered = await renderAt('/admin');

    expect(screenHeading(rendered, 'admin-denied')).toContain('Admin access required');
    expect(() => screen(rendered, 'admin')).toThrow();
  });

  it('hides the authenticated header during an active quiz and shows it after completion', async () => {
    authMocks.state = {
      isAuthenticated: true,
      loading: false,
      isAdmin: true,
      user: { uid: 'admin-1' },
      username: 'Teacher',
    };
    const rendered = await renderAt('/quiz/fiqh/WUD');

    expect(screen(rendered, 'auth-header').props['data-hidden']).toBe(true);

    await act(async () => {
      rendered.root.findByType('button').props.onClick();
      await Promise.resolve();
    });

    expect(screen(rendered, 'auth-header').props['data-hidden']).toBe(false);
  });
});
