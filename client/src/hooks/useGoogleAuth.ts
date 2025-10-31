'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, signInWithGoogle, convertToAuthUser, logout, AuthUser } from '@/lib/firebase-auth';

interface UseGoogleAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser: User | null) => {
      const authUser = convertToAuthUser(firebaseUser);
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithGoogle();
      const user = result.user;
      
      // Get the ID token and send to backend
      const idToken = await user.getIdToken();
      
      // Send to backend for user creation/verification
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('Google sign-in successful:', data);
      }
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Google sign-in error:', err);
      }
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logout();
      setUser(null);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign out error:', err);
      }
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
  };
};