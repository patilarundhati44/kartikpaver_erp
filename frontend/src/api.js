import axios from 'axios';

// API Base URL - points to the Django backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Access Token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch auth errors (401 Unauthorized) and logout user
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't retried yet, we can try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Attempt to refresh the token using raw axios to avoid interceptor loop
          const response = await axios.post(`${API_URL}auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          // Re-run original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token failed, clear everything and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?session_expired=true';
          }
        }
      } else {
        // No refresh token, clear and go to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
