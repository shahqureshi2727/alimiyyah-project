const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const USERNAME_KEYS = new Set(['email', 'username', 'userName']);

let sentryEnabled = false;
let sentryReadyPromise = null;

function loadSentry() {
  return import('@sentry/react');
}

function withSentry(callback) {
  if (!sentryEnabled || !sentryReadyPromise) return;
  sentryReadyPromise.then(callback).catch(() => {});
}

function replaceSensitiveText(value) {
  return value.replace(EMAIL_PATTERN, '[email]');
}

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return replaceSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !USERNAME_KEYS.has(key))
      .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
  );
}

export function sanitizeErrorEvent(event) {
  if (!event) return event;
  const sanitized = sanitizeValue(event);

  if (sanitized.user) {
    sanitized.user = sanitized.user.id ? { id: sanitized.user.id } : undefined;
  }

  return sanitized;
}

export function initErrorTracking({ dsn, release, environment } = {}) {
  sentryEnabled = Boolean(dsn);
  if (!sentryEnabled) return false;

  sentryReadyPromise = loadSentry().then((Sentry) => {
    Sentry.init({
      dsn,
      release,
      environment,
      tracesSampleRate: 0.1,
      beforeSend: sanitizeErrorEvent,
    });
    return Sentry;
  });

  return true;
}

export function setLoggerUser(uid) {
  withSentry((Sentry) => Sentry.setUser(uid ? { id: uid } : null));
}

function devConsole(level, args) {
  if (!import.meta.env.DEV) return;
  console[level](...args);
}

export function debug(...args) {
  devConsole('debug', args);
}

export function info(...args) {
  devConsole('info', args);
  withSentry((Sentry) => {
    Sentry.addBreadcrumb({ level: 'info', message: String(args[0] || '') });
  });
}

export function warn(message, details) {
  devConsole('warn', details === undefined ? [message] : [message, details]);
  withSentry((Sentry) =>
    Sentry.captureMessage(String(message), {
      level: 'warning',
      extra: details && typeof details === 'object' ? sanitizeValue(details) : { details },
    })
  );
}

export function error(message, err, details) {
  console.error(...[message, err, details].filter((value) => value !== undefined));
  if (!sentryEnabled) return;

  const extra = sanitizeValue(details || {});
  withSentry((Sentry) => {
    if (err instanceof Error) {
      Sentry.captureException(err, { extra: { message, ...extra } });
    } else {
      Sentry.captureMessage(String(message), {
        level: 'error',
        extra: sanitizeValue({ error: err, ...extra }),
      });
    }
  });
}
