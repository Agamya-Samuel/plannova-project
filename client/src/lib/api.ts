import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Debug: Log the API URL
console.log('🔍 API URL configured:', API_URL);

if (!API_URL) {
  console.error('❌ NEXT_PUBLIC_API_URL is not defined! Backend requests will fail.');
  console.error('❌ Make sure you have a .env.local file with NEXT_PUBLIC_API_URL=http://localhost:5000/api');
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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🔍 401 Unauthorized error detected, clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    } else if (error.response?.status === 403) {
      console.log('🔍 403 Forbidden error detected');
      console.log('🔍 Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
    } else if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit exceeded. Please wait a moment before trying again.');
      console.log('🔍 Rate limit details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        retryAfter: error.response?.headers['retry-after']
      });
      // Don't redirect or clear auth on rate limit
      // Just let the component handle the error
    }
    return Promise.reject(error);
  }
);

export default apiClient;