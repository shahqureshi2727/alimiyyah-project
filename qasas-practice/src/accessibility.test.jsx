/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const authState = vi.hoisted(() => ({
  current: {
    isAuthenticated: true,
    loading: false,
    isAdmin: true,
    user: { uid: 'student-1' },
    username: 'Amina',
  },
}));

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => authState.current,
}));

vi.mock('./lib/quiz', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getUserRecentResults: vi.fn(() => Promise.resolve([])),
    getLeaderboard: vi.fn(() =>
      Promise.resolve([
        {
          id: 'result-1',
          userId: 'student-1',
          username: 'Amina',
          score: 9,
          total: 10,
          durationSeconds: 75,
        },
      ])
    ),
    getUserBestResult: vi.fn(() => Promise.resolve(null)),
  };
});

vi.mock('./lib/topic-stats-firestore', () => ({
  getUserTopicProfile: vi.fn(() =>
    Promise.resolve({
      topics: {
        WUD: { status: 'weak', score: 0.4, attempts: 3 },
      },
    })
  ),
  getUserTopicStats: vi.fn(() => Promise.resolve({})),
}));

vi.mock('./lib/admin-queries', () => ({
  getAdminUserDoc: vi.fn(() => Promise.resolve({ role: 'admin' })),
  getAdminQuizResults: vi.fn(() =>
    Promise.resolve([
      {
        id: 'admin-result-1',
        userId: 'student-1',
        username: 'Amina',
        mode: 'irab',
        score: 8,
        total: 10,
        completedAt: new Date(),
      },
    ])
  ),
  getAdminTopicStatsProfiles: vi.fn(() =>
    Promise.resolve([
      {
        userId: 'student-1',
        username: 'Amina',
        topics: {
          WUD: { status: 'weak', score: 0.4, attempts: 3 },
        },
      },
    ])
  ),
}));

vi.mock('./hooks/useQuizEngine', () => ({
  useQuizEngine: () => {
    const question = {
      id: 'axe-irab-1',
      sentence: 'جَاءَ زَيْدٌ',
      target: 'زَيْدٌ',
      answer: 'raf',
    };

    return {
      questions: [question],
      questionsLoading: false,
      loadError: null,
      retryLoad: vi.fn(),
      current: question,
      currentMode: 'irab',
      currentIndex: 0,
      score: 0,
      results: [],
      showFeedback: false,
      currentAnswer: null,
      isCorrect: false,
      quizComplete: false,
      totalDuration: 0,
      saveStatus: null,
      retrySave: vi.fn(),
      timerPaused: false,
      setTimerPaused: vi.fn(),
      handleAnswer: vi.fn(),
      handleTimeout: vi.fn(),
      handleSkipQuestion: vi.fn(),
    };
  },
}));

let root;
let container;

async function flushEffects() {
  for (let i = 0; i < 8; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderRoute(path) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </MemoryRouter>
    );
  });
  await flushEffects();
}

async function expectNoAxeViolations(path) {
  await renderRoute(path);
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
    },
  });
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

describe('route accessibility', () => {
  beforeEach(() => {
    authState.current = {
      isAuthenticated: true,
      loading: false,
      isAdmin: true,
      user: { uid: 'student-1' },
      username: 'Amina',
    };
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-arabic-script', 'madina');
  });

  afterEach(() => {
    root?.unmount();
    container?.remove();
    root = null;
    container = null;
  });

  it.each([
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/practice/irab',
    '/practice/vocab',
    '/quiz',
    '/quiz/irab',
    '/leaderboard',
    '/weakness',
    '/admin',
  ])('has no automated axe violations on %s', async (path) => {
    if (path === '/login' || path === '/signup' || path === '/forgot-password') {
      authState.current = {
        isAuthenticated: false,
        loading: false,
        isAdmin: false,
        user: null,
        username: null,
      };
    }

    await expectNoAxeViolations(path);
  });
});
