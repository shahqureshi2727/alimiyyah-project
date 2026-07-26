export default function AppState({
  className = '',
  tone = 'empty',
  title,
  message,
  actionLabel,
  onAction,
  children,
  headingLevel = 2,
}) {
  const classes = ['app-state', `app-state-${tone}`, className].filter(Boolean).join(' ');
  const Heading = `h${Math.min(Math.max(headingLevel, 1), 6)}`;

  return (
    <div
      className={classes}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      aria-busy={tone === 'loading' ? 'true' : undefined}
    >
      <div className="app-state-mark" aria-hidden="true" />
      <div className="app-state-copy">
        {title && <Heading>{title}</Heading>}
        {message && <p>{message}</p>}
        {children}
      </div>
      {actionLabel && onAction && (
        <button className="primary-btn app-state-action" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
