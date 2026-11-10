import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import Login from './Login';
import Signup from './Signup';

const signIn = vi.fn();
const signUp = vi.fn();
const resetPassword = vi.fn();

vi.mock('../lib/auth', () => ({
  signIn: (...args) => signIn(...args),
  signUp: (...args) => signUp(...args),
  resetPassword: (...args) => resetPassword(...args),
  validateUsername: (username) =>
    username.trim().length >= 3
      ? { valid: true, error: null }
      : { valid: false, error: 'Username must be at least 3 characters.' },
  validatePassword: (password) =>
    password.length >= 8
      ? { valid: true, error: null }
      : { valid: false, error: 'Password must be at least 8 characters.' },
}));

function renderAuthRoute(route, element) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={route} element={element} />
        <Route path="/" element={<h1>Study Home</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('auth flows', () => {
  beforeEach(() => {
    signIn.mockReset();
    signUp.mockReset();
    resetPassword.mockReset();
  });

  it('signs in and returns the student to the app', async () => {
    signIn.mockResolvedValue({ uid: 'student-1' });
    const user = userEvent.setup();
    renderAuthRoute('/login', <Login />);

    await user.type(screen.getByLabelText('Username'), 'student');
    await user.type(screen.getByLabelText('Password'), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Study Home' })).toBeInTheDocument();
    expect(signIn).toHaveBeenCalledWith('student', 'correct horse battery staple');
  });

  it('shows the safe sign-in error when credentials are rejected', async () => {
    signIn.mockRejectedValue(new Error('Incorrect username or password.'));
    const user = userEvent.setup();
    renderAuthRoute('/login', <Login />);

    await user.type(screen.getByLabelText('Username'), 'student');
    await user.type(screen.getByLabelText('Password'), 'wrong password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect username or password.');
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('creates an account with an optional recovery email', async () => {
    signUp.mockResolvedValue({ user: { uid: 'student-2' }, recoveryEmailLinked: true });
    const user = userEvent.setup();
    renderAuthRoute('/signup', <Signup />);

    await user.type(screen.getByLabelText('Username *'), 'newstudent');
    await user.type(screen.getByLabelText('Password *'), 'longenough');
    await user.type(screen.getByLabelText('Confirm Password *'), 'longenough');
    await user.type(screen.getByLabelText(/Email for password recovery/), 'student@example.com');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Study Home' })).toBeInTheDocument();
    expect(signUp).toHaveBeenCalledWith({
      username: 'newstudent',
      password: 'longenough',
      recoveryEmail: 'student@example.com',
    });
  });

  it('keeps signup on the form when the passwords do not match', async () => {
    const user = userEvent.setup();
    renderAuthRoute('/signup', <Signup />);

    await user.type(screen.getByLabelText('Username *'), 'newstudent');
    await user.type(screen.getByLabelText('Password *'), 'longenough');
    await user.type(screen.getByLabelText('Confirm Password *'), 'different');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match.');
    expect(signUp).not.toHaveBeenCalled();
  });

  it('sends a password reset message and keeps user enumeration private', async () => {
    resetPassword.mockResolvedValue({
      success: true,
      message: 'If this account exists and has a recovery email, a reset link has been sent.',
    });
    const user = userEvent.setup();
    renderAuthRoute('/forgot-password', <ForgotPassword />);

    await user.type(screen.getByLabelText('Username'), 'maybe_student');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'If this account exists and has a recovery email, a reset link has been sent.'
    );
    expect(resetPassword).toHaveBeenCalledWith('maybe_student');
  });

  it('shows reset errors without navigating away', async () => {
    resetPassword.mockRejectedValue(new Error('Could not reach Firebase. Check your connection and try again.'));
    const user = userEvent.setup();
    renderAuthRoute('/forgot-password', <ForgotPassword />);

    await user.type(screen.getByLabelText('Username'), 'student');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach Firebase. Check your connection and try again.'
    );
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
  });
});
