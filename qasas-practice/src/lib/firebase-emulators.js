const TRUE_VALUES = new Set(['1', 'true', 'yes']);

export function shouldUseFirebaseEmulators(env) {
  return TRUE_VALUES.has(String(env.VITE_USE_FIREBASE_EMULATORS || '').toLowerCase());
}

export function parseEmulatorHost(value, fallbackHost, fallbackPort) {
  if (!value) {
    return { host: fallbackHost, port: fallbackPort };
  }

  const separatorIndex = value.lastIndexOf(':');
  if (separatorIndex === -1) {
    return { host: value, port: fallbackPort };
  }

  const host = value.slice(0, separatorIndex) || fallbackHost;
  const parsedPort = Number(value.slice(separatorIndex + 1));
  const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : fallbackPort;

  return { host, port };
}

export function firebaseEmulatorSettings(env) {
  if (!shouldUseFirebaseEmulators(env)) return null;

  return {
    auth: parseEmulatorHost(env.VITE_FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1', 9099),
    firestore: parseEmulatorHost(
      env.VITE_FIRESTORE_EMULATOR_HOST,
      '127.0.0.1',
      8080
    ),
  };
}
