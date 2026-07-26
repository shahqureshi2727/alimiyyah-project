import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { app } from './firebase-app';
import { firebaseEmulatorSettings } from './firebase-emulators';

export const auth = getAuth(app);

const settings = firebaseEmulatorSettings(import.meta.env);
const authEmulatorKey = '__qasasPracticeAuthEmulatorConnected';

if (settings && !globalThis[authEmulatorKey]) {
  connectAuthEmulator(auth, `http://${settings.auth.host}:${settings.auth.port}`, {
    disableWarnings: true,
  });
  globalThis[authEmulatorKey] = true;
}
