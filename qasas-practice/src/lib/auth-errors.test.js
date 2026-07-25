import { describe, expect, it } from 'vitest';
import { firebaseAuthErrorMessage } from './auth-errors';

describe('firebaseAuthErrorMessage', () => {
  it('maps sign-in credential failures without exposing Firebase codes', () => {
    expect(firebaseAuthErrorMessage({ code: 'auth/wrong-password' })).toBe(
      'Incorrect username or password.'
    );
    expect(firebaseAuthErrorMessage({ code: 'auth/user-not-found' })).toBe(
      'Incorrect username or password.'
    );
    expect(firebaseAuthErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      'Incorrect username or password.'
    );
  });

  it('maps account and network failures to plain sentences', () => {
    expect(firebaseAuthErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
      'Username already taken.'
    );
    expect(firebaseAuthErrorMessage({ code: 'auth/network-request-failed' })).toBe(
      'Could not reach Firebase. Check your connection and try again.'
    );
  });

  it('falls back to a stable plain sentence', () => {
    expect(firebaseAuthErrorMessage({ code: 'auth/unexpected-code' })).toBe(
      'Authentication failed. Check the details and try again.'
    );
  });
});
