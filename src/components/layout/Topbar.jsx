// src/components/layout/Topbar.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui';
import { Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import logoImg from '../../logo/amber_fly.png';

export default function Topbar({ sidebarOpen, setSidebarOpen, signOut, profile }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isPublic = publicRoutes.includes(location.pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

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

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

  return (
    <header className="topbar">
      {/* ── Left: hamburger + logo ── */}
      <div className="topbar-left">
        {!isPublic && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="topbar-menu-btn"
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        )}
        <div className="topbar-brand">
          <img src={logoImg} alt="Brightloop" className="topbar-logo" />
          <div className="topbar-brand-text">
            <span className="topbar-brand-name">Brightloop</span>
            <span className="topbar-brand-sub">Billing</span>
          </div>
        </div>
      </div>

      {/* ── Right: theme + user ── */}
      {!isPublic && (
        <div className="topbar-right">
          <button
            onClick={toggleTheme}
            className="topbar-icon-btn"
            aria-label="Toggle colour theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="topbar-divider" />

          <div className="topbar-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="topbar-avatar">{initials}</div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{displayName}</span>
              <span className="topbar-user-role">{profile?.role || 'member'}</span>
            </div>
            <ChevronDown size={14} className={`topbar-chevron ${userMenuOpen ? 'open' : ''}`} />

            {userMenuOpen && (
              <div className="topbar-dropdown">
                <button className="topbar-dropdown-item danger" onClick={handleSignOut}>
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
