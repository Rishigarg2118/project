import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize session from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Configure central axios default headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await axios.get('/api/auth/profile');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to load profile on startup:', err);
          // Token expired or invalid
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user: loggedUser } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Please check credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const signup = async (name, email, password, phone, confirmPassword, role) => {
    setError(null);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, phone, confirmPassword, role });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfileLocal = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, updateProfileLocal }}>
      {children}
    </AuthContext.Provider>
  );
}
