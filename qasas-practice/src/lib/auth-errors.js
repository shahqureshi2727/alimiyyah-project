const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Username already taken.',
  'auth/invalid-credential': 'Incorrect username or password.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Could not reach Firebase. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
  'auth/user-disabled': 'This account is disabled. Ask your teacher for help.',
  'auth/user-not-found': 'Incorrect username or password.',
  'auth/weak-password': 'Password is too weak. Please use at least 8 characters.',
  'auth/wrong-password': 'Incorrect username or password.',
};

export function firebaseAuthErrorMessage(error) {
  if (error?.code?.startsWith('auth/')) {
    return AUTH_ERROR_MESSAGES[error.code] || 'Authentication failed. Check the details and try again.';
  }
  return error?.message || 'Authentication failed. Check the details and try again.';
}

export function safeFirebaseAuthErrorMessage(error) {
  if (error?.code?.startsWith('auth/')) {
    return AUTH_ERROR_MESSAGES[error.code] || 'Authentication failed. Check the details and try again.';
  }
  return error?.message || 'Authentication failed. Check the details and try again.';
}
