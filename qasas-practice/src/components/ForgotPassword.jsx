import { useState } from 'react';
import { Link } from 'react-router-dom';
import { safeFirebaseAuthErrorMessage } from '../lib/auth-errors';
import './Auth.css';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!username.trim()) {
      setError('Please enter your username.');
      setLoading(false);
      return;
    }

    try {
      const { resetPassword } = await import('../lib/auth');
      const result = await resetPassword(username);
      setMessage(result.message);
    } catch (err) {
      setError(safeFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          Enter your username and we'll send a reset link to your recovery email.
        </p>

        <div className="auth-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={loading}
            required
            aria-describedby={error ? 'reset-error' : message ? 'reset-message' : undefined}
          />
        </div>

        {error && (
          <p id="reset-error" className="auth-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p id="reset-message" className="auth-success" role="status">
            {message}
          </p>
        )}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <div className="auth-links">
          <Link to="/login" className="auth-link">
            Back to sign in
          </Link>
        </div>

        <div className="auth-note">
          <strong>Note:</strong> If you didn't provide a recovery email when signing up, please ask
          your teacher to reset your password.
        </div>
      </form>
    </main>
  );
}
