import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token and user exist in localStorage on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('urbanpulse_token');
        if (token) {
          // In a real application, you would fetch profile details using the token
          // Here, we'll parse the user info we saved in local storage or decode token
          const savedUser = localStorage.getItem('urbanpulse_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        console.error('Failed to restore authentication session:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      localStorage.setItem('urbanpulse_token', data.token);
      localStorage.setItem('urbanpulse_user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      setUser(null);
      localStorage.removeItem('urbanpulse_token');
      localStorage.removeItem('urbanpulse_user');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await authService.register({ name, email, password });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('urbanpulse_token');
    localStorage.removeItem('urbanpulse_user');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
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
