'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { signInWithGoogle, logout as firebaseLogout, getCurrentUser } from '@/lib/firebase-auth';
import { auth } from '@/lib/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import { User, AuthContextType, RegisterData, LoginResponse, RoleUpdateResponse, UserRole, ServiceCategory } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // In-memory throttle for /auth/profile to avoid 429s when many components mount
  const lastProfileFetchRef = React.useRef<number>(0);
  const inflightProfileRef = React.useRef<Promise<unknown> | null>(null);

  const fetchProfileWithRetryThrottled = async (): Promise<User | null> => {
    const now = Date.now();
    // 20s throttle window
    if (inflightProfileRef.current) {
      return inflightProfileRef.current as Promise<User | null>;
    }
    if (now - lastProfileFetchRef.current < 20_000) {
      // Too soon; just reuse last successful value from localStorage
      const cached = localStorage.getItem('user');
      return cached ? (JSON.parse(cached) as User) : null;
    }

    const runner = (async () => {
      let attempt = 0;
      const maxAttempts = 3;
      const baseDelay = 300; // ms
      while (attempt < maxAttempts) {
        try {
          const response = await apiClient.get('/auth/profile');
          lastProfileFetchRef.current = Date.now();
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 Profile fetched successfully:', response.data);
          }
          return response.data as User;
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (process.env.NODE_ENV === 'development') {
            console.error('👤 Profile fetch error:', {
              attempt,
              status,
              error: err,
              message: (err as Error)?.message
            });
          }
          if (status === 429 || status === 503) {
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(r => setTimeout(r, delay));
            attempt += 1;
            continue;
          }
          throw err;
        }
      }
      return null;
    })();

    inflightProfileRef.current = runner.finally(() => {
      inflightProfileRef.current = null;
    });

    return inflightProfileRef.current as Promise<User | null>;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 Initializing auth...');
      }
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (process.env.NODE_ENV === 'development') {
        console.log('👤 Auth data from localStorage:', { token: !!token, storedUser: !!storedUser });
      }

      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUser(user);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 Setting user from localStorage:', user);
          }
          
          // Verify token is still valid by fetching profile (with retry + throttle)
          const responseData = await fetchProfileWithRetryThrottled();
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 Current user profile data:', responseData);
          }
          
          // If user signed in with Google, also check Firebase for the latest photoURL
          // This ensures we have the most up-to-date profile photo
          if (responseData && (responseData as { provider?: string }).provider === 'google.com') {
            const firebaseUser = getCurrentUser();
            if (firebaseUser?.photoURL && !(responseData as { photoURL?: string }).photoURL) {
              // Use Firebase photoURL as fallback if database doesn't have it
              (responseData as { photoURL?: string }).photoURL = firebaseUser.photoURL;
            } else if (firebaseUser?.photoURL && firebaseUser.photoURL !== (responseData as { photoURL?: string }).photoURL) {
              // Firebase photoURL is newer, use it
              (responseData as { photoURL?: string }).photoURL = firebaseUser.photoURL;
            }
          }
          
          if (responseData) {
            setUser(responseData);
          }
          // Update localStorage with the latest user data including photoURL
          if (responseData) {
            localStorage.setItem('user', JSON.stringify(responseData));
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Auth initialization error:', error);
          }
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Set up Firebase token refresh listener
  // This ensures Firebase tokens are automatically refreshed and stored in localStorage
  // Firebase tokens expire after 1 hour, but Firebase automatically refreshes them
  // This listener updates localStorage whenever the token is refreshed
  useEffect(() => {
    // Only set up listener if we're in the browser
    if (typeof window === 'undefined') return;

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the latest token (Firebase automatically refreshes if needed)
          const token = await firebaseUser.getIdToken(false);
          
          // Update localStorage with the fresh token
          // This ensures sessions persist longer than 1 hour
          const currentToken = localStorage.getItem('token');
          if (currentToken !== token) {
            localStorage.setItem('token', token);
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Firebase token refreshed via listener');
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Failed to refresh Firebase token in listener:', error);
          }
        }
      } else {
        // User signed out, clear token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: unknown) {
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed');
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', userData);

      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: unknown) {
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Sign out from Firebase
      await firebaseLogout();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Firebase logout error:', error);
      }
    }
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const googleSignIn = async (): Promise<{ needsRoleSelection?: boolean }> => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Starting Google sign-in process...');
      }
      const result = await signInWithGoogle();
      const user = result.user;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Firebase Google sign-in successful:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      }
      
      // Get the ID token and send to backend
      const idToken = await user.getIdToken();
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 Got Firebase ID token, sending to backend...');
        console.log('🌐 API URL:', apiClient.defaults.baseURL);
        console.log('🔗 Full endpoint:', `${apiClient.defaults.baseURL}/auth/google`);
        console.log('🔐 ID Token length:', idToken?.length);
      }
      
      // Test API connectivity first
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Testing API connectivity...');
        }
        const healthCheck = await apiClient.get('/health/db');
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ API connectivity test passed:', healthCheck.data);
        }
      } catch (connectivityError: unknown) {
        if (connectivityError instanceof Error && 'response' in connectivityError) {
          const response = (connectivityError as { response?: { status?: number; statusText?: string; data?: unknown } }).response;
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ API connectivity test failed:', {
              message: connectivityError.message,
              status: response?.status,
              statusText: response?.statusText,
              data: response?.data
            });
          }

          // More specific error messages based on the type of error
          if (response?.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          } else if (!response) {
            throw new Error('Unable to connect to authentication server. Please check if the server is running and accessible.');
          } else {
            throw new Error(`Server error (${response?.status}). Please try again later.`);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ API connectivity test failed:', connectivityError);
          }
          throw new Error('An unknown error occurred during the connectivity test.');
        }
      }
      
      // Send to backend for user creation/verification
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Sending request to backend /auth/google endpoint...');
      }
      const response = await apiClient.post<LoginResponse>('/auth/google', {
        idToken,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Backend response successful:', response.data);
      }
      const { user: userData, token, needsRoleSelection } = response.data;
      
      // If user signed in with Google, ensure we have the photoURL from Firebase
      // This is a fallback in case the database doesn't have it yet
      // Firebase user from signInWithGoogle() has the latest photoURL
      if (user.photoURL && (!userData.photoURL || user.photoURL !== userData.photoURL)) {
        userData.photoURL = user.photoURL;
        if (process.env.NODE_ENV === 'development') {
          console.log('🖼️ Using Firebase photoURL as fallback/update:', user.photoURL);
        }
      }
      
      // Debug: Log the photoURL we received
      if (process.env.NODE_ENV === 'development') {
        console.log('🖼️ User photoURL received:', userData.photoURL);
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Google sign-in completed successfully');
      }
      return { needsRoleSelection };
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Google sign-in error details:', {
          error,
          message: (error as Error)?.message,
          response: (error as { response?: { data?: unknown } })?.response?.data,
          status: (error as { response?: { status?: number } })?.response?.status,
          code: (error as { code?: string })?.code
        });
      }
      
      let errorMessage = 'Google sign-in failed';
      
      if ((error as { code?: string })?.code) {
        // Firebase-specific errors
        switch ((error as { code?: string })?.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign-in was cancelled by user';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Please allow popups for this site';
            break;
          case 'auth/unauthorized-domain':
            errorMessage = 'This domain is not authorized for Google sign-in';
            break;
          default:
            errorMessage = (error as Error)?.message || 'Google sign-in failed';
        }
      } else if ((error as { response?: { status?: number } })?.response?.status) {
        // API errors
        const status = (error as { response?: { status?: number } })?.response?.status;
        const apiError = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      
        switch (status) {
          case 401:
            errorMessage = 'Authentication failed. Please try again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. Your account may not have the required permissions.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = apiError || 'Server error. Please try again later.';
            break;
          case 404:
            errorMessage = 'Authentication service not found. Please contact support.';
            break;
          default:
            errorMessage = apiError || `Request failed with status ${status}`;
        }
      } else if ((error as Error)?.message?.includes('Network Error')) {
        // Network errors
        errorMessage = 'Network error. Please check your connection and ensure the server is running.';
      } else {
        // Network or other errors
        errorMessage = (error as Error)?.message || 'Network error. Please check your connection and try again.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const updateRole = async (role: UserRole): Promise<void> => {
    try {
      const response = await apiClient.post<RoleUpdateResponse>('/auth/update-role', {
        role,
      });

      const { user: updatedUser } = response.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: unknown) {
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Role update failed');
    }
  };

  const updateServiceCategories = async (serviceCategories: ServiceCategory[]): Promise<void> => {
    try {
      // Validate that at least one service category is selected
      if (serviceCategories.length < 1) {
        throw new Error('Providers must select at least one service category');
      }

      const response = await apiClient.post('/auth/update-service-categories', {
        serviceCategories,
      });

      const { user: updatedUser } = response.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: unknown) {
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Service categories update failed');
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const response = await apiClient.put('/auth/profile', data);
      const updatedUser = response.data.user;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: unknown) {
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Profile update failed');
    }
  };

  const updateMobileNumber = async (mobile: string): Promise<void> => {
    try {
      const response = await apiClient.put('/auth/profile', { phone: mobile });
      const updatedUser = response.data.user;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Mobile number updated, new user data:', updatedUser);
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Mobile number update failed:', error);
      }
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Mobile number update failed');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    googleSignIn,
    updateRole,
    updateServiceCategories,
    updateProfile,
    updateMobileNumber,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};