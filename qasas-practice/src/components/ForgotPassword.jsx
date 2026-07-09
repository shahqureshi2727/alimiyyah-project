import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../lib/auth';
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
      const result = await resetPassword(username);
      setMessage(result.message);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
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
          />
        </div>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-success">{message}</p>}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <div className="auth-links">
          <Link to="/login" className="auth-link">
            Back to sign in
          </Link>
        </div>

        <div className="auth-note">
          <strong>Note:</strong> If you didn't provide a recovery email when signing up,
          please ask your teacher to reset your password.
        </div>
      </form>
    </div>
  );
}
