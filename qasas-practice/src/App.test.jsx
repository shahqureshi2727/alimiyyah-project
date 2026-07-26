import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, create } from 'react-test-renderer';
import { MemoryRouter } from 'react-router-dom';
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
  useAuth: () => authMocks.state,
}));

vi.mock('./components/AuthHeader', () => ({
  default: ({ hidden = false }) => <header data-screen="auth-header" data-hidden={hidden} />,
}));

vi.mock('./components/HomeScreen', () => ({
  default: () => <main data-screen="home">Home</main>,
}));

vi.mock('./components/Login', async () => {
  const { useLocation } = await vi.importActual('react-router-dom');
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

function renderAt(path) {
  let rendered;
  act(() => {
    rendered = create(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    );
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

  it('renders a topic-scoped practice deep link directly', () => {
    const rendered = renderAt('/practice/fiqh/WUD');

    expect(screen(rendered, 'fiqh').children.join('')).toBe('Fiqh:WUD');
  });

  it('sends unauthenticated deep links to login with the original route preserved', () => {
    authMocks.state = {
      isAuthenticated: false,
      loading: false,
      isAdmin: false,
      user: null,
      username: null,
    };

    const rendered = renderAt('/practice/tafsir/ASR?variant=verse');

    expect(screen(rendered, 'login').props['data-from']).toBe(
      '/practice/tafsir/ASR?variant=verse'
    );
  });

  it('renders a clear invalid-topic screen for unknown configured params', () => {
    const rendered = renderAt('/practice/fiqh/NOPE');

    expect(screenHeading(rendered, 'invalid-route')).toContain("doesn't exist");
  });

  it('renders NotFound for unmatched paths instead of redirecting home', () => {
    const rendered = renderAt('/not-a-real-page');

    expect(screenHeading(rendered, 'not-found')).toContain('Page not found');
  });

  it('blocks the admin page for authenticated non-admin users before rendering AdminPage', () => {
    authMocks.state = {
      isAuthenticated: true,
      loading: false,
      isAdmin: false,
      user: { uid: 'student-1' },
      username: 'Amina',
    };

    const rendered = renderAt('/admin');

    expect(screenHeading(rendered, 'admin-denied')).toContain('Admin access required');
    expect(() => screen(rendered, 'admin')).toThrow();
  });

  it('hides the authenticated header during an active quiz and shows it after completion', () => {
    authMocks.state = {
      isAuthenticated: true,
      loading: false,
      isAdmin: true,
      user: { uid: 'admin-1' },
      username: 'Teacher',
    };
    const rendered = renderAt('/quiz/fiqh/WUD');

    expect(screen(rendered, 'auth-header').props['data-hidden']).toBe(true);

    act(() => {
      rendered.root.findByType('button').props.onClick();
    });

    expect(screen(rendered, 'auth-header').props['data-hidden']).toBe(false);
  });
});
