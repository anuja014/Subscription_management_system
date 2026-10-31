// src/components/layout/Topbar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

export default function Topbar({ sidebarOpen, setSidebarOpen, signOut, profile }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const navigate = useNavigate();
  const location = useLocation();

  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

  useEffectCheckTheme();

  function useEffectCheckTheme() {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }

  // Apply theme on mount
  (() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  })();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="topbar">
      <div className="topbar-left row gap-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn--ghost btn--sm" style={{ border: 'none', background: 'none', padding: 4 }}>
          ☰
        </button>
        {!publicRoutes.includes(location.pathname) && (
          <span style={{ fontWeight: 700, color: '#E6EAF0', fontSize: 14, letterSpacing: '-0.02em' }}>Brightloop</span>
        )}
      </div>
      <div className="topbar-right row gap-3">
        {!publicRoutes.includes(location.pathname) && (
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        )}
        <div className="user-menu row gap-2">
          <div style={{ fontSize: 12, color: '#8A97A8', display: 'none' }}>{profile?.email}</div>
          <div className="user-avatar">{initials}</div>
          <button onClick={handleSignOut} className="btn btn--ghost btn--sm" style={{ border: 'none', padding: 0, minWidth: 'auto' }}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
