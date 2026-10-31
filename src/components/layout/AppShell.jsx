// src/components/layout/AppShell.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const { signOut, profile } = useAuth();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Responsive sidebar toggle:
  // On mobile (<= 960px): toggle mobile drawer open/close
  // On desktop (> 960px): toggle collapsed/expanded
  const handleToggleSidebar = () => {
    if (window.innerWidth <= 960) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        open={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onToggle={(val) => setMobileOpen(typeof val === 'boolean' ? val : !mobileOpen)}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className="main-content">
        <Topbar
          mobileOpen={mobileOpen}
          collapsed={collapsed}
          onToggleSidebar={handleToggleSidebar}
          sidebarOpen={mobileOpen}
          setSidebarOpen={setMobileOpen}
          signOut={signOut}
          profile={profile}
        />
        <main className="page">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
