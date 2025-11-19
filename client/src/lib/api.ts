import axios from 'axios';
import { getCurrentUser } from './firebase-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Debug: Log the API URL
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 API URL configured:', API_URL);
}

if (!API_URL) {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ NEXT_PUBLIC_API_URL is not defined! Backend requests will fail.');
    console.error('❌ Make sure you have a .env.local file with NEXT_PUBLIC_API_URL=http://localhost:5000/api');
  }
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to check if user is using Firebase authentication
// Checks if there's an active Firebase user session
const isFirebaseUser = (): boolean => {
  try {
    const firebaseUser = getCurrentUser();
    return !!firebaseUser;
  } catch {
    return false;
  }
};

// Request interceptor to add auth token and refresh Firebase tokens if needed
apiClient.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('token');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📡 API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      hasToken: !!token
    });
  }
  
  if (token) {
    // Check if user is authenticated with Firebase (Google Sign-In)
    // Firebase tokens expire after 1 hour, so we refresh them proactively
    // This ensures sessions last longer than 1 hour
    if (isFirebaseUser()) {
      try {
        const firebaseUser = getCurrentUser();
        if (firebaseUser) {
          // Firebase automatically refreshes expired tokens when getIdToken() is called
          // This ensures we always have a valid token before making API requests
          const freshToken = await firebaseUser.getIdToken(false);
          
          // Update localStorage with the fresh token
          if (freshToken !== token) {
            localStorage.setItem('token', freshToken);
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Firebase token refreshed automatically');
            }
            token = freshToken;
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Failed to refresh Firebase token:', error);
        }
        // Continue with existing token - if it's expired, the server will return 401
        // and we'll handle it in the response interceptor
      }
    }
    
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📡 API Response:', {
        status: response.status,
        url: response.config?.url,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('📡 API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        config: error.config
      });
    }
    
    if (error.response?.status === 401) {
      // Try to refresh Firebase token before logging out
      // This handles cases where Firebase token expired but user is still authenticated
      // Firebase sessions can last much longer than 1 hour if we refresh tokens properly
      if (isFirebaseUser()) {
        try {
          const firebaseUser = getCurrentUser();
          if (firebaseUser) {
            // Try to get a fresh token - Firebase will refresh if needed
            // Force refresh to ensure we get a valid token
            const freshToken = await firebaseUser.getIdToken(true);
            localStorage.setItem('token', freshToken);
            
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Firebase token refreshed after 401, retrying request');
            }
            
            // Retry the original request with the new token
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${freshToken}`;
              return apiClient.request(error.config);
            }
          }
        } catch (refreshError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Failed to refresh Firebase token after 401:', refreshError);
          }
          // If refresh fails, Firebase session might be invalid - proceed to logout
        }
      }
      
      // If token refresh failed or user is not using Firebase, log out
      // For JWT tokens (email/password), if we get 401, the token is truly expired
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 401 Unauthorized error detected, clearing auth data');
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    } else if (error.response?.status === 403) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 403 Forbidden error detected');
        console.log('🔍 Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
      }
    } else if (error.response?.status === 429) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Rate limit exceeded. Please wait a moment before trying again.');
        console.log('🔍 Rate limit details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          retryAfter: error.response?.headers['retry-after']
        });
      }
      // Don't redirect or clear auth on rate limit
      // Just let the component handle the error
    }
    return Promise.reject(error);
  }
);

export default apiClient;