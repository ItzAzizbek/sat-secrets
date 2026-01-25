import axios from 'axios';
import { getAuthEmail } from './authStore';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API+"/api",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    // Send logged-in user email so server can block banned emails on ALL endpoints
    const email = getAuthEmail();
    if (email) {
      config.headers['X-User-Email'] = email;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle blacklist redirects globally
    if (error.response?.status === 403 && error.response.data?.redirect) {
      window.location.href = error.response.data.redirect;
      return Promise.reject(error); // Still reject so component knows
    }
    
    return Promise.reject(error);
  }
);

export default api;
