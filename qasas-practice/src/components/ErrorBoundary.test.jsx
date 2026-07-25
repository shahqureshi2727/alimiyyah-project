import { describe, expect, it, vi } from 'vitest';
import { act, create } from 'react-test-renderer';
import ErrorBoundary from './ErrorBoundary';
import { createErrorReferenceId } from '../lib/error-reference';

const loggerMocks = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock('../lib/logger', () => ({
  error: loggerMocks.error,
}));

function ThrowingChild() {
  throw new Error('broken child');
}

describe('createErrorReferenceId', () => {
  it('creates a short stable-format reference id for user-facing fallback screens', () => {
    expect(createErrorReferenceId()).toMatch(/^ERR-[A-Z0-9]{8}$/);
  });
});

describe('ErrorBoundary', () => {
  it('shows a fallback reference and logs the component stack when a child render fails', async () => {
    let rendered;
    await act(async () => {
      rendered = create(
        <ErrorBoundary name="Test boundary" title="This screen stopped working." message="Reload.">
          <ThrowingChild />
        </ErrorBoundary>
      );
    });

    expect(rendered.root.findByType('h1').children.join('')).toBe('This screen stopped working.');
    expect(rendered.root.findByProps({ className: 'error-fallback-kicker' }).children.join('')).toMatch(
      /^Reference ERR-[A-Z0-9]{8}$/
    );
    expect(loggerMocks.error).toHaveBeenCalledWith(
      'Test boundary boundary caught a render error.',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.stringContaining('ThrowingChild'),
        errorReferenceId: expect.stringMatching(/^ERR-[A-Z0-9]{8}$/),
      })
    );
  });
});
