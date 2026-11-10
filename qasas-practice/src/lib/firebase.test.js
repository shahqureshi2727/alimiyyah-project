import { describe, expect, it } from 'vitest';
import { validateFirebaseEnv } from './firebase-env';

describe('validateFirebaseEnv', () => {
  const completeEnv = {
    VITE_FIREBASE_API_KEY: 'api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'example.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'project-id',
    VITE_FIREBASE_STORAGE_BUCKET: 'project.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'sender-id',
    VITE_FIREBASE_APP_ID: 'app-id',
  };

  it('returns the Firebase config when every VITE_FIREBASE variable is present', () => {
    expect(validateFirebaseEnv(completeEnv)).toEqual({
      apiKey: 'api-key',
      authDomain: 'example.firebaseapp.com',
      projectId: 'project-id',
      storageBucket: 'project.appspot.com',
      messagingSenderId: 'sender-id',
      appId: 'app-id',
    });
  });

  it('throws one clear message naming every missing Firebase env variable', () => {
    expect(() =>
      validateFirebaseEnv({
        ...completeEnv,
        VITE_FIREBASE_API_KEY: '',
        VITE_FIREBASE_PROJECT_ID: undefined,
      })
    ).toThrow(
      'Missing Firebase environment variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID. Add them to .env.local using .env.example as the template.'
    );
  });
});
