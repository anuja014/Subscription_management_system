// src/components/layout/Topbar.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Moon, Sun, LogOut, ChevronDown, Menu, UserRound, LayoutDashboard, Users,
} from 'lucide-react';
import logoImg from '../../logo/amber_fly.png';

function getPageTitle(pathname) {
  if (pathname === '/' || pathname === '/dashboard') return 'Overview';
  if (pathname === '/portal') return 'My Portal';
  if (pathname === '/team') return 'Team';
  if (pathname === '/customers') return 'Customers';
  if (pathname === '/payments') return 'Payments';
  if (pathname === '/catalog/products') return 'Products';
  if (pathname === '/catalog/plans') return 'Plans';
  if (pathname === '/pricing/discounts') return 'Discounts';
  if (pathname === '/pricing/taxes') return 'Taxes';
  if (pathname === '/pricing/templates') return 'Templates';
  if (pathname === '/subscriptions/new') return 'New Subscription';
  if (pathname.startsWith('/subscriptions/')) return 'Subscription Details';
  if (pathname === '/subscriptions') return 'Subscriptions';
  if (pathname === '/billing/run') return 'Run Billing';
  if (pathname.startsWith('/invoices/')) return 'Invoice Details';
  if (pathname === '/invoices') return 'Invoices';

  const segment = pathname.split('/').filter(Boolean).pop();
  if (!segment) return 'Dashboard';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function Topbar({
  sidebarOpen,
  setSidebarOpen,
  mobileOpen,
  collapsed = false,
  onToggleSidebar,
  signOut,
  profile,
}) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isPublic = publicRoutes.includes(location.pathname);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  // Click outside and escape key handling for user menu
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else if (setSidebarOpen) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="topbar">
      {/* ── Left: hamburger + brand / page title ── */}
      <div className="topbar-left">
        {!isPublic && (
          <button
            type="button"
            onClick={handleToggle}
            className="topbar-menu-btn"
            aria-label="Toggle navigation"
            aria-expanded={Boolean(mobileOpen || sidebarOpen)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={18} />
          </button>
        )}

        {/* Brand logo: visible on mobile or when desktop sidebar is collapsed */}
        <div className={`topbar-brand ${!collapsed ? 'desktop-hide' : ''}`}>
          <img src={logoImg} alt="Aureon" className="topbar-brand-logo" />
          <div className="topbar-brand-text">
            <span className="topbar-brand-name">Aureon</span>
            <span className="topbar-brand-sub">Billing</span>
          </div>
        </div>

        {/* Current page title breadcrumb: visible on desktop when sidebar is expanded */}
        <div className={`topbar-section-title ${collapsed ? 'desktop-hide' : ''}`}>
          <span className="topbar-crumb-app">Aureon</span>
          <span className="topbar-crumb-sep">/</span>
          <span className="topbar-crumb-page">{pageTitle}</span>
        </div>
      </div>

      {/* ── Right: theme switch + user menu ── */}
      {!isPublic && (
        <div className="topbar-right">
          <button
            type="button"
            onClick={toggleTheme}
            className="topbar-icon-btn"
            aria-label="Toggle colour theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="topbar-divider" />

          <div className="topbar-user-wrap" ref={userMenuRef}>
            <button
              type="button"
              className={`topbar-user ${userMenuOpen ? 'active' : ''}`}
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <div className="topbar-avatar">{initials}</div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{displayName}</span>
                <span className="topbar-user-role">{profile?.role || 'member'}</span>
              </div>
              <ChevronDown size={14} className={`topbar-chevron ${userMenuOpen ? 'open' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="topbar-dropdown" role="menu">
                <div className="topbar-dropdown-header">
                  <div className="topbar-dropdown-avatar">{initials}</div>
                  <div className="topbar-dropdown-user">
                    <div className="topbar-dropdown-name">{displayName}</div>
                    <div className="topbar-dropdown-email">{profile?.email || ''}</div>
                    <span className="topbar-dropdown-badge">{profile?.role || 'member'}</span>
                  </div>
                </div>

                <div className="topbar-dropdown-divider" />

                {profile?.role === 'customer' ? (
                  <button
                    type="button"
                    className="topbar-dropdown-item"
                    onClick={() => {
                      navigate('/portal');
                      setUserMenuOpen(false);
                    }}
                  >
                    <UserRound size={15} />
                    My Portal
                  </button>
                ) : (
                  <button
                    type="button"
                    className="topbar-dropdown-item"
                    onClick={() => {
                      navigate('/dashboard');
                      setUserMenuOpen(false);
                    }}
                  >
                    <LayoutDashboard size={15} />
                    Overview
                  </button>
                )}

                {profile?.role === 'admin' && (
                  <button
                    type="button"
                    className="topbar-dropdown-item"
                    onClick={() => {
                      navigate('/team');
                      setUserMenuOpen(false);
                    }}
                  >
                    <Users size={15} />
                    Team Settings
                  </button>
                )}

                <div className="topbar-dropdown-divider" />

                <button
                  type="button"
                  className="topbar-dropdown-item danger"
                  onClick={handleSignOut}
                >
                  <LogOut size={15} />
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
