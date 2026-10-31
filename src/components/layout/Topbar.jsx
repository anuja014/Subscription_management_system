// src/components/layout/Topbar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';
import { Menu, Moon, Sun } from 'lucide-react';

export default function Topbar({ sidebarOpen, setSidebarOpen, signOut, profile }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
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
      <div className="topbar-left">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="icon-button" aria-label="Toggle navigation">
          <Menu size={19} />
        </button>
        {!publicRoutes.includes(location.pathname) && (
          <span className="topbar-product">Brightloop</span>
        )}
      </div>
      <div className="topbar-right row gap-3">
        {!publicRoutes.includes(location.pathname) && (
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="theme-switch" aria-label="Toggle colour theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        )}
        <div className="user-menu row gap-2">
          <div className="user-avatar">{initials}</div>
          <button onClick={handleSignOut} className="sign-out">Sign out</button>
        </div>
      </div>
    </header>
  );
}
