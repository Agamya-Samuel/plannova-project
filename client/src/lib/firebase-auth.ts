// Firebase Auth utilities for client-side authentication
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  provider?: string;
}

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
// Add additional config for better debugging
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign-in...');
    console.log('Auth instance:', auth);
    console.log('Google provider config:', googleProvider);
    
    // Check if Firebase is properly initialized
    if (!auth?.app) {
      throw new Error('Firebase not properly initialized');
    }
    
    console.log('Firebase config check:', {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    console.log('Google sign-in successful:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    // Get additional user info
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    return {
      user,
      credential,
      token
    };
  } catch (error) {
    console.error('Detailed Google sign-in error:', {
      error,
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      customData: (error as { customData?: unknown })?.customData,
      stack: (error as Error)?.stack
    });
    
    // Provide specific error messages based on error codes
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = (error as Error)?.message || 'Unknown error';
    
    let userFriendlyMessage = 'Google sign-in failed';
    
    switch (errorCode) {
      case 'auth/popup-closed-by-user':
        userFriendlyMessage = 'Sign-in was cancelled by user';
        break;
      case 'auth/popup-blocked':
        userFriendlyMessage = 'Please allow popups for this site';
        break;
      case 'auth/unauthorized-domain':
        userFriendlyMessage = 'This domain is not authorized. Please contact support.';
        break;
      case 'auth/operation-not-allowed':
        userFriendlyMessage = 'Google sign-in is not enabled. Please contact support.';
        break;
      case 'auth/invalid-api-key':
        userFriendlyMessage = 'Invalid API configuration. Please contact support.';
        break;
      default:
        userFriendlyMessage = `Google sign-in failed: ${errorMessage}`;
    }
    
    throw new Error(userFriendlyMessage);
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Send email verification
    if (userCredential.user) {
      await sendEmailVerification(userCredential.user);
    }
    
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get ID token for API calls
export const getIdToken = async (): Promise<string | null> => {
  const user = getCurrentUser();
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

// Convert Firebase User to AuthUser
export const convertToAuthUser = (user: User | null): AuthUser | null => {
  if (!user) return null;
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL,
    provider: user.providerData[0]?.providerId || 'email',
  };
};