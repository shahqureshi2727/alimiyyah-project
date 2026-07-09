import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, validateUsername, validatePassword } from '../lib/auth';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');
    setLoading(true);

    // Client-side validation
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      setError(usernameValidation.error);
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { recoveryEmailLinked } = await signUp({
        username,
        password,
        recoveryEmail: recoveryEmail.trim() || null,
      });

      if (recoveryEmail && !recoveryEmailLinked) {
        setWarning(
          'Your account was created, but the recovery email couldn\'t be linked. You can add it later.'
        );
        // Still navigate after a brief delay to show the warning
        setTimeout(() => navigate('/'), 2000);
      } else {
        navigate('/');
      }
    } catch (err) {
      // Translate Firebase errors to user-friendly messages
      if (err.code === 'auth/email-already-in-use') {
        setError('Username already taken.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 8 characters.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Qasas Practice</p>

        <div className="auth-field">
          <label htmlFor="username">Username *</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={loading}
            placeholder="3-20 characters, letters/numbers/underscore"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password *</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="recoveryEmail">
            Email for password recovery <span className="optional-label">(optional)</span>
          </label>
          <input
            id="recoveryEmail"
            type="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
          />
          <p className="auth-helper">
            If you forget your password, we can email you a reset link. Leave blank
            if you don't want to provide one — but then your teacher will need to
            reset it for you manually.
          </p>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {warning && <p className="auth-warning">{warning}</p>}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <div className="auth-links">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
