import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Bootstrap from './Bootstrap.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary
      name="Root"
      title="Qasas Practice stopped working."
      message="Reload the app. If it happens again, send the reference ID to your teacher."
      showErrorMessage={true}
    >
      <Bootstrap />
    </ErrorBoundary>
  </StrictMode>
);

if (import.meta.env.VITE_SENTRY_DSN) {
  import('./lib/logger').then(({ initErrorTracking }) => {
    initErrorTracking({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      release: import.meta.env.VITE_GIT_SHA,
      environment: import.meta.env.MODE,
    });
  });
}
