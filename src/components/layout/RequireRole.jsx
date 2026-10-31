// src/components/layout/RequireRole.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogoSpinner } from '../ui/LogoSpinner';

export function RequireRole({ roles, children }) {
  const { profile, profileError, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <LogoSpinner size="lg" label="Checking permissions…" />
      </div>
    );
  }

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
