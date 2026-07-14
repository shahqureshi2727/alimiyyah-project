import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserDoc, signOut as authSignOut } from '../lib/auth';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch the user's Firestore document
        try {
          const doc = await getUserDoc(firebaseUser.uid);
          setUserDoc(doc);
        } catch (err) {
          console.error('Error fetching user doc:', err);
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setUserDoc(null);
  };

  const refreshUserDoc = async () => {
    if (user) {
      const doc = await getUserDoc(user.uid);
      setUserDoc(doc);
      return doc;
    }
    return null;
  };

  const value = {
    user,
    userDoc,
    loading,
    signOut,
    refreshUserDoc,
    isAuthenticated: !!user,
    isAdmin: userDoc?.role === 'admin',
    username: userDoc?.username || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
