import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { routeTitle } from '../lib/app-routes';
import AuthHeader from './AuthHeader';
import ErrorBoundary from './ErrorBoundary';

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

function isQuizAttemptPath(pathname) {
  return /^\/quiz\/[^/]+/.test(pathname);
}

function ProtectedOutlet() {
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

export function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  useDocumentTitle(routeTitle('admin'));

  if (!isAdmin) {
    return <AdminDenied />;
  }

  return children;
}

export default function ProtectedLayout() {
  return (
    <AuthProvider>
      <ProtectedOutlet />
    </AuthProvider>
  );
}
