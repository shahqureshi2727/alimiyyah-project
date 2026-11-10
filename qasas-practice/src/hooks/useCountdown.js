import { useCallback, useEffect, useRef, useState } from 'react';

function secondsRemaining(deadlineMs) {
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

export function useCountdown({ totalSeconds, running, resetKey, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const deadlineRef = useRef(null);
  const firedRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    firedRef.current = false;
    deadlineRef.current = Date.now() + totalSeconds * 1000;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new question resets the visible countdown.
    setTimeLeft(totalSeconds);
  }, [resetKey, totalSeconds]);

  useEffect(() => {
    if (!running) {
      deadlineRef.current = Date.now() + timeLeft * 1000;
      return undefined;
    }
    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + timeLeft * 1000;
    }

    const tick = () => {
      const next = secondsRemaining(deadlineRef.current);
      setTimeLeft(next);
      if (next === 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeoutRef.current?.();
      }
    };

    tick();
    const timerId = globalThis.setInterval(tick, 250);
    return () => globalThis.clearInterval(timerId);
  }, [running, timeLeft]);

  const reset = useCallback(() => {
    firedRef.current = false;
    deadlineRef.current = Date.now() + totalSeconds * 1000;
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  return { timeLeft, reset };
}
