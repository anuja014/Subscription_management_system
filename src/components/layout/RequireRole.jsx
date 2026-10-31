// src/components/layout/RequireRole.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RequireRole({ roles, children }) {
  const { profile, profileError, loading } = useAuth();

  if (loading) return null;

  if (profileError) {
    return (
      <div style={{ padding: 32 }}>
        <h2>Unable to load your profile</h2>
        <p>Please check your Supabase connection and try again.</p>
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  if (!roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
