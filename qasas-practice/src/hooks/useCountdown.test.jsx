import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './useCountdown';

function CountdownProbe({ totalSeconds, running, resetKey, onTimeout }) {
  const countdown = useCountdown({ totalSeconds, running, resetKey, onTimeout });
  return <output>{countdown.timeLeft}</output>;
}

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('derives remaining time from the wall clock so delayed ticks catch up', () => {
    const onTimeout = vi.fn();
    let rendered;

    act(() => {
      rendered = create(
        <CountdownProbe totalSeconds={10} running={true} resetKey="q1" onTimeout={onTimeout} />
      );
    });

    act(() => {
      vi.setSystemTime(new Date('2026-07-25T12:00:04Z'));
      vi.advanceTimersByTime(250);
    });

    expect(rendered.root.findByType('output').children.join('')).toBe('6');
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('stops timers after timeout and never fires again after completion', () => {
    const onTimeout = vi.fn();

    act(() => {
      create(
        <CountdownProbe totalSeconds={2} running={true} resetKey="q1" onTimeout={onTimeout} />
      );
    });

    act(() => {
      vi.setSystemTime(new Date('2026-07-25T12:00:02Z'));
      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(5000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('resets to the full duration when the reset key changes', () => {
    const onTimeout = vi.fn();
    let rendered;

    act(() => {
      rendered = create(
        <CountdownProbe totalSeconds={10} running={true} resetKey="q1" onTimeout={onTimeout} />
      );
    });

    act(() => {
      vi.setSystemTime(new Date('2026-07-25T12:00:03Z'));
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      rendered.update(
        <CountdownProbe totalSeconds={10} running={true} resetKey="q2" onTimeout={onTimeout} />
      );
    });

    expect(rendered.root.findByType('output').children.join('')).toBe('10');
  });
});
