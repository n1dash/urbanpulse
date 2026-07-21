import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user and token from localStorage on initialization
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('urbanpulse_token');
      const storedUser = localStorage.getItem('urbanpulse_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Optionally verify token validity with backend
        try {
          // authService.getCurrentUser() could verify the token
          // const userData = await authService.getCurrentUser();
          // setUser(userData);
          // localStorage.setItem('urbanpulse_user', JSON.stringify(userData));
        } catch (err) {
          console.warn("Failed to verify session token, using cached session", err);
          // If token is invalid, clear credentials
          // logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.login({ username, password });
      
      // Expected response structure: { token, user: { id, username, email, role } }
      const userToken = data.token;
      const userData = data.user;

      localStorage.setItem('urbanpulse_token', userToken);
      localStorage.setItem('urbanpulse_user', JSON.stringify(userData));

      setToken(userToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.register({ username, email, password });

      // Registration doesn't auto-login (no token returned) - the user logs
      // in separately after signing up.
      return data;
    } catch (err) {
      const errMsg = err.message || 'Registration failed.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('urbanpulse_token');
    localStorage.removeItem('urbanpulse_user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    role: user?.role || null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
