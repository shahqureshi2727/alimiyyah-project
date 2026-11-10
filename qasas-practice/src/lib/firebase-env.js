const FIREBASE_ENV_FIELDS = [
  ['VITE_FIREBASE_API_KEY', 'apiKey'],
  ['VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'],
  ['VITE_FIREBASE_PROJECT_ID', 'projectId'],
  ['VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'],
  ['VITE_FIREBASE_APP_ID', 'appId'],
];

export function validateFirebaseEnv(env) {
  const missing = FIREBASE_ENV_FIELDS.filter(([envName]) => !env[envName]).map(
    ([envName]) => envName
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(
        ', '
      )}. Add them to .env.local using .env.example as the template.`
    );
  }

  return Object.fromEntries(
    FIREBASE_ENV_FIELDS.map(([envName, configName]) => [configName, env[envName]])
  );
}
