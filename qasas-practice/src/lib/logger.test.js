import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sanitizeErrorEvent } from './logger';

const loggerSource = readFileSync(fileURLToPath(import.meta.resolve('./logger.js')), 'utf8');

describe('sanitizeErrorEvent', () => {
  it('does not statically import Sentry into the startup bundle', () => {
    expect(loggerSource).not.toContain("from '@sentry/react'");
  });

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
