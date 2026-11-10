import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PublicRoute } from '../App';
import ProtectedLayout, { AdminRoute } from './ProtectedLayout';

const authState = vi.hoisted(() => ({
  current: {
    isAuthenticated: false,
    isAdmin: false,
    loading: false,
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => authState.current,
}));

vi.mock('./AuthHeader', () => ({
  default: () => <nav aria-label="Account">Account menu</nav>,
}));

function renderProtectedRoute(initialPath = '/weakness') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedLayout />}>
          <Route path="/weakness" element={<h1>Strength Map</h1>} />
        </Route>
        <Route path="/login" element={<h1>Sign In</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('route guards', () => {
  beforeEach(() => {
    authState.current = {
      isAuthenticated: false,
      isAdmin: false,
      loading: false,
    };
  });

  it('keeps protected content behind the loading screen while auth is resolving', () => {
    authState.current = {
      isAuthenticated: false,
      isAdmin: false,
      loading: true,
    };

    renderProtectedRoute();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Strength Map' })).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated student away from protected routes', async () => {
    renderProtectedRoute();

    expect(await screen.findByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Strength Map' })).not.toBeInTheDocument();
  });

  it('renders protected content for a signed-in student', () => {
    authState.current = {
      isAuthenticated: true,
      isAdmin: false,
      loading: false,
    };

    renderProtectedRoute();

    expect(screen.getByRole('navigation', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Strength Map' })).toBeInTheDocument();
  });

  it('shows the admin denial screen to signed-in non-admin students', () => {
    authState.current = {
      isAuthenticated: true,
      isAdmin: false,
      loading: false,
    };

    render(
      <MemoryRouter>
        <AdminRoute>
          <h1>Admin Results</h1>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Admin access required' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin Results' })).not.toBeInTheDocument();
  });

  it('renders admin content for admins', () => {
    authState.current = {
      isAuthenticated: true,
      isAdmin: true,
      loading: false,
    };

    render(
      <MemoryRouter>
        <AdminRoute>
          <h1>Admin Results</h1>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Admin Results' })).toBeInTheDocument();
  });

  it('allows public screens to render without an auth gate', () => {
    render(
      <PublicRoute>
        <h1>Public Sign In</h1>
      </PublicRoute>
    );

    expect(screen.getByRole('heading', { name: 'Public Sign In' })).toBeInTheDocument();
  });
});
