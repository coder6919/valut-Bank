import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically injects JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('vaultbank-auth');
    if (authData) {
      const { state } = JSON.parse(authData);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catches 401 Unauthorized errors and logs out the user
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear localStorage and force a page reload to login route
      localStorage.removeItem('vaultbank-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;