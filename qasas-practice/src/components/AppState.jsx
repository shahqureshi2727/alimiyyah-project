export default function AppState({
  className = '',
  tone = 'empty',
  title,
  message,
  actionLabel,
  onAction,
  children,
}) {
  const classes = ['app-state', `app-state-${tone}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="app-state-mark" aria-hidden="true" />
      <div className="app-state-copy">
        {title && <h2>{title}</h2>}
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
