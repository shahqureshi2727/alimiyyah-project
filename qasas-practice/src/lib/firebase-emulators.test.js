import { describe, expect, it } from 'vitest';
import {
  firebaseEmulatorSettings,
  parseEmulatorHost,
  shouldUseFirebaseEmulators,
} from './firebase-emulators';

describe('firebase emulator env', () => {
  it('requires an explicit emulator switch', () => {
    expect(shouldUseFirebaseEmulators({})).toBe(false);
    expect(shouldUseFirebaseEmulators({ VITE_USE_FIREBASE_EMULATORS: 'true' })).toBe(true);
    expect(shouldUseFirebaseEmulators({ VITE_USE_FIREBASE_EMULATORS: '1' })).toBe(true);
  });

  it('parses host and port while preserving safe defaults', () => {
    expect(parseEmulatorHost('localhost:9099', '127.0.0.1', 8080)).toEqual({
      host: 'localhost',
      port: 9099,
    });
    expect(parseEmulatorHost('localhost', '127.0.0.1', 8080)).toEqual({
      host: 'localhost',
      port: 8080,
    });
    expect(parseEmulatorHost('', '127.0.0.1', 8080)).toEqual({
      host: '127.0.0.1',
      port: 8080,
    });
  });

  it('builds auth and firestore settings for local e2e runs', () => {
    expect(
      firebaseEmulatorSettings({
        VITE_USE_FIREBASE_EMULATORS: 'true',
        VITE_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
        VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      })
    ).toEqual({
      auth: { host: '127.0.0.1', port: 9099 },
      firestore: { host: '127.0.0.1', port: 8080 },
    });
  });
});
