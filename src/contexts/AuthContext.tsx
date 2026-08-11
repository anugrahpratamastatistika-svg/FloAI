import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { User } from '../types';
import { syncUserProfileToFirestore } from '../services/firestoreService';

interface AuthContextType {
  user: User;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const GUEST_USER: User = {
  uid: 'guest_user',
  displayName: 'Guest User',
  email: null,
  photoURL: null,
  isGuest: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(GUEST_USER);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isFirebaseConfigured() && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const authenticatedUser: User = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'FloAI User',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            isGuest: false,
          };
          setUser(authenticatedUser);
          await syncUserProfileToFirestore(authenticatedUser);
        } else {
          setUser(GUEST_USER);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setUser(GUEST_USER);
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    if (!isFirebaseConfigured() || !auth || !googleProvider) {
      setAuthError(
        'Firebase Authentication is currently initializing or unavailable. You can continue in Guest Mode!'
      );
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        // User closed popup, no error message necessary
        return;
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `This domain (${window.location.hostname}) is not yet added to Firebase Authorized Domains. To authorize it, go to Firebase Console > Authentication > Settings > Authorized Domains and add ${window.location.hostname}.`
        );
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In is not enabled in the Firebase Console. Please enable Google Sign-In under Firebase Authentication > Sign-in method.');
      } else {
        setAuthError(err.message || 'Google Sign-In could not be completed. Please try again.');
      }
    }
  };

  const signOutUser = async () => {
    if (isFirebaseConfigured() && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error('Error signing out:', err);
      }
    }
    setUser(GUEST_USER);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOutUser,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
