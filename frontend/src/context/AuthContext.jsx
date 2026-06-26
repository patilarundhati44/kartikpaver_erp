import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize auth state from local storage on load
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user_info');

      if (accessToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
          
          // Verify/refresh auth by calling current user endpoint
          const res = await api.get('users/me/');
          setUser(res.data);
          localStorage.setItem('user_info', JSON.stringify(res.data));
        } catch (err) {
          console.error("Token verification failed, clearing auth:", err);
          // If we fail verification, axios interceptor will try to refresh.
          // If refresh fails too, it logs out.
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.post('auth/login/', { username, password });
      
      const { access, refresh, email, is_staff } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const userInfo = { username, email, is_staff };
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      
      setUser(userInfo);
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.detail || err.message || "Invalid username or password. Please try again.";
      setAuthError(`Error: ${errMsg}`);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
