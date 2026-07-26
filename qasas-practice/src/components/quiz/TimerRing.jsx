export default function TimerRing({ timeLeft, totalTime }) {
  const progress = timeLeft / totalTime;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  let colorClass = 'timer-green';
  if (progress <= 0.25) {
    colorClass = 'timer-red';
  } else if (progress <= 0.5) {
    colorClass = 'timer-amber';
  }

  return (
    <div
      className="timer-ring-container"
      role="timer"
      aria-label={`${timeLeft} seconds remaining`}
    >
      <svg className="timer-ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="timer-ring-bg" cx="50" cy="50" r="45" fill="none" strokeWidth="8" />
        <circle
          className={`timer-ring-progress ${colorClass}`}
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className={`timer-text ${colorClass}`}>{timeLeft}</span>
    </div>
  );
}
