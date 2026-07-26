import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { signIn } = await import('../lib/auth');
      await signIn(username, password);
      const from = location.state?.from;
      const target = from ? `${from.pathname || '/'}${from.search || ''}${from.hash || ''}` : '/';
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">Welcome back to Qasas Practice</p>

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
            aria-describedby={error ? 'login-error' : undefined}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
            required
            aria-describedby={error ? 'login-error' : undefined}
          />
        </div>

        {error && (
          <p id="login-error" className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="auth-links">
          <Link to="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
          <span className="auth-link-separator">|</span>
          <Link to="/signup" className="auth-link">
            Create account
          </Link>
        </div>
      </form>
    </main>
  );
}
