import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { app } from './firebase-app';
import { firebaseEmulatorSettings } from './firebase-emulators';

export const db = getFirestore(app);

const settings = firebaseEmulatorSettings(import.meta.env);
const firestoreEmulatorKey = '__qasasPracticeFirestoreEmulatorConnected';

if (settings && !globalThis[firestoreEmulatorKey]) {
  connectFirestoreEmulator(db, settings.firestore.host, settings.firestore.port);
  globalThis[firestoreEmulatorKey] = true;
}
