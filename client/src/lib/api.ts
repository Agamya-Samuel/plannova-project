import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Debug: Log the API URL
if (process.env.NODE_ENV === 'development') {
  console.log('API URL configured:', API_URL);
}

if (!API_URL) {
  if (process.env.NODE_ENV === 'development') {
    console.error('NEXT_PUBLIC_API_URL is not defined! Backend requests will fail.');
    console.error('Make sure you have a .env.local file with NEXT_PUBLIC_API_URL=http://localhost:5000/api');
  }
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (process.env.NODE_ENV === 'development') {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      hasToken: !!token
    });
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        status: response.status,
        url: response.config?.url,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    // Get the request URL to check if this is an expected 404
    const requestUrl = error?.config?.url || error?.request?.responseURL || '';
    const isPageSettings404 = error?.response?.status === 404 && 
                               requestUrl.includes('/page-settings/');
    
    // Skip detailed error logging for expected 404s on page-settings
    // These are normal when page settings haven't been created yet
    if (isPageSettings404) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Page settings not found (404) - this is expected if settings haven\'t been created yet:', requestUrl);
      }
    } else if (process.env.NODE_ENV === 'development') {
      // Log the full error object first to see what we're dealing with
      console.error('API Error - Full error object:', error);
      
      // Extract error details with fallbacks for missing properties
      // This handles both Axios errors and other error types
      const errorDetails: Record<string, unknown> = {
        // Basic error info
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        // Axios-specific properties (may not exist for non-Axios errors)
        status: error?.response?.status || 'N/A',
        statusText: error?.response?.statusText || 'N/A',
        data: error?.response?.data || null,
        // Request config info
        url: requestUrl,
        method: error?.config?.method?.toUpperCase() || 'UNKNOWN',
        baseURL: error?.config?.baseURL || 'N/A',
        // Network error info
        code: error?.code || null,
        request: error?.request ? 'Request object exists' : null,
        // Stack trace for debugging
        stack: error?.stack || null
      };
      
      // Remove null/undefined values for cleaner output
      const cleanedDetails = Object.fromEntries(
        Object.entries(errorDetails).filter(([, v]) => v !== null && v !== undefined)
      );
      
      console.error('API Error - Extracted details:', cleanedDetails);
    }
    
    if (error.response?.status === 401) {
      if (process.env.NODE_ENV === 'development') {
        console.log('401 Unauthorized error detected, clearing auth data');
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    } else if (error.response?.status === 403) {
      if (process.env.NODE_ENV === 'development') {
        console.log('403 Forbidden error detected');
        console.log('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
      }
    } else if (error.response?.status === 429) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Rate limit exceeded. Please wait a moment before trying again.');
        console.log('Rate limit details:', {
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