// Admin access is gated by the users/{uid}.role field in Firestore. There is
// intentionally NO client-side code path that promotes a user to admin. To make
// someone an admin: open the Firebase Console, navigate to the users collection,
// find their document, and change role from "student" to "admin". This is the
// only way, by design.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateEmail,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Synthesize a fake email from username for Firebase Auth
export const usernameToAuthEmail = (username) =>
  `${username.toLowerCase().trim()}@qasas.local`;

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = ['admin', 'administrator', 'root', 'teacher', 'moderator'];

// Username validation: 3-20 chars, letters/numbers/underscore, starts with letter
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

export function validateUsername(username) {
  const trimmed = username.trim();

  if (!trimmed) {
    return { valid: false, error: 'Username is required.' };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less.' };
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Username must start with a letter and contain only letters, numbers, and underscores.'
    };
  }

  if (RESERVED_USERNAMES.includes(trimmed.toLowerCase())) {
    return { valid: false, error: 'This username is reserved.' };
  }

  return { valid: true, error: null };
}

export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required.' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters.' };
  }

  return { valid: true, error: null };
}

export async function signUp({ username, password, recoveryEmail }) {
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    throw new Error(usernameValidation.error);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.error);
  }

  const authEmail = usernameToAuthEmail(username);

  // Create the Firebase Auth account
  const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
  const user = userCredential.user;

  let recoveryEmailLinked = true;

  // If recovery email provided, try to update the auth email to the real one
  if (recoveryEmail && recoveryEmail.trim()) {
    try {
      await updateEmail(user, recoveryEmail.trim());
    } catch (err) {
      // Recovery email couldn't be linked (e.g., already in use)
      recoveryEmailLinked = false;
      console.warn('Could not link recovery email:', err.message);
    }
  }

  // Create the Firestore user document
  // Every new signup is a student. NEVER write role: "admin" from the client.
  await setDoc(doc(db, 'users', user.uid), {
    username: username.trim(),
    role: 'student',
    createdAt: serverTimestamp(),
    recoveryEmail: recoveryEmail?.trim() || null,
  });

  return { user, recoveryEmailLinked };
}

export async function signIn(username, password) {
  const authEmail = usernameToAuthEmail(username);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
    return userCredential.user;
  } catch (err) {
    // Don't distinguish between "no such user" and "wrong password"
    throw new Error('Incorrect username or password.', { cause: err });
  }
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function getUserDoc(uid) {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }

  return null;
}

export async function resetPassword(username) {
  // First, get the user's recovery email from Firestore
  // We need to find the user by username, but we don't have a direct query
  // Instead, we'll try to get the auth email and check if the account exists
  const authEmail = usernameToAuthEmail(username);

  // Try signing in with a dummy password to check if user exists
  // Actually, we can't do that. We need to look up the user doc.
  // The problem is we don't know the uid from just the username.

  // For now, we'll just try to send the reset email to the synthesized email
  // If the user has a recovery email linked to their auth account, Firebase will
  // send to that. If not, it'll fail or go to the fake email (which doesn't work).

  // A better approach: we need the user to be able to look up their recovery email status
  // But without being signed in, we can't query Firestore with our current rules.

  // For this implementation, we'll just try to send the password reset email.
  // If the account has a real recovery email linked via updateEmail, it will work.
  // If not, Firebase will try to send to @qasas.local which won't work.

  try {
    await sendPasswordResetEmail(auth, authEmail);
    return {
      success: true,
      message: 'If this account has a recovery email, a reset link has been sent.'
    };
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      // Don't reveal if user exists
      return {
        success: true,
        message: 'If this account exists and has a recovery email, a reset link has been sent.'
      };
    }
    throw err;
  }
}
