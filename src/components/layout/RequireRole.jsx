// src/components/layout/RequireRole.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireRole({ roles, children }) {
  const { profile, loading } = useAuth();

  if (loading) return null;

  if (!profile) return <Navigate to="/login" replace />;

  if (!roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
