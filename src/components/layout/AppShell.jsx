// src/components/layout/AppShell.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, profile } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} signOut={signOut} profile={profile} />
        <div className="page">{children || <Outlet />}</div>
      </div>
    </div>
  );
}
