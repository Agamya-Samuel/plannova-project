'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { signInWithGoogle, logout as firebaseLogout } from '@/lib/firebase-auth';
import { User, AuthContextType, RegisterData, LoginResponse, RoleUpdateResponse, UserRole, ServiceCategory } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUser(user);
          
          // Verify token is still valid by fetching profile
          const response = await apiClient.get('/auth/profile');
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 Current user profile data:', response.data);
          }
          setUser(response.data);
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