import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loader from './Loader';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullPage message="Authenticating session..." />;
  }

  if (!user) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard if user has insufficient role permissions
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
