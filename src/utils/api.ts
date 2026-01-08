import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // Ensure Authorization header is always set
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // For FormData, don't set Content-Type manually - let axios set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Handle 401 errors - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and user data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?error=' + encodeURIComponent('Your session has expired. Please log in again.');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

