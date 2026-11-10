import { initializeApp } from 'firebase/app';
import { validateFirebaseEnv } from './firebase-env';

const firebaseConfig = validateFirebaseEnv(import.meta.env);

export const app = initializeApp(firebaseConfig);
