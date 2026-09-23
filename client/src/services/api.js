import axios from 'axios';

// VITE_API_URL lets production point at the deployed API (e.g. https://api.example.com/api).
// Falls back to same-origin '/api' so Docker/nginx single-origin deploys work with zero config.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 20000
});

// Request interceptor to attach Authorization header if token exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ef_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling and 410/401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout if unauthorized/invalid token
      localStorage.removeItem('ef_token');
      localStorage.removeItem('ef_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=true';
      }
    }

    const formattedError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors || []
    };
    return Promise.reject(formattedError);
  }
);

export default api;
