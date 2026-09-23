import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ef_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('ef_token');
      if (token) {
        try {
          const data = await getCurrentUser();
          setUser(data.data.user);
          localStorage.setItem('ef_user', JSON.stringify(data.data.user));
        } catch (err) {
          console.warn('Session verification failed:', err);
          setUser(null);
          localStorage.removeItem('ef_token');
          localStorage.removeItem('ef_user');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const data = await loginUser(email, password);
      const { user: userData, token } = data.data;
      localStorage.setItem('ef_token', token);
      localStorage.setItem('ef_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const data = await registerUser(userData);
      const { user: newUser, token } = data.data;
      localStorage.setItem('ef_token', token);
      localStorage.setItem('ef_user', JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    await logoutUser();
    localStorage.removeItem('ef_token');
    localStorage.removeItem('ef_user');
    setUser(null);
  };

  // Show a full-screen boot loader while verifying the session
  if (loading) {
    return <LoadingSpinner fullScreen message="Initializing session..." />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
