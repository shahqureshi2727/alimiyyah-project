import { describe, expect, it } from 'vitest';
import { sanitizeErrorEvent } from './logger';

describe('sanitizeErrorEvent', () => {
  it('removes email addresses and username fields before an event leaves the app', () => {
    const sanitized = sanitizeErrorEvent({
      message: 'Login failed for student@example.com',
      user: {
        id: 'uid-123',
        email: 'student@example.com',
        username: 'student_name',
      },
      extra: {
        username: 'student_name',
        note: 'Ask student@example.com to retry',
      },
      contexts: {
        profile: {
          username: 'student_name',
        },
      },
    });

    expect(sanitized).toEqual({
      message: 'Login failed for [email]',
      user: {
        id: 'uid-123',
      },
      extra: {
        note: 'Ask [email] to retry',
      },
      contexts: {
        profile: {},
      },
    });
  });
});
