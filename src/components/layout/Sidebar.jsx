// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Repeat2, FileText, CreditCard,
  Users, Package, Tags, ReceiptText, FileStack, UserRound,
  X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import logoImg from '../../logo/amber_fly.png';

const navGroups = [
  {
    label: null,
    items: [
      { key: 'portal', label: 'My Portal', to: '/portal', roles: ['customer'], icon: UserRound },
      { key: 'dashboard', label: 'Overview', to: '/dashboard', roles: ['admin', 'staff'], icon: LayoutDashboard },
      { key: 'subscriptions', label: 'Subscriptions', to: '/subscriptions', roles: ['admin', 'staff'], icon: Repeat2 },
      { key: 'invoices', label: 'Invoices', to: '/invoices', roles: ['admin', 'staff'], icon: FileText },
      { key: 'payments', label: 'Payments', to: '/payments', roles: ['admin', 'staff'], icon: CreditCard },
      { key: 'customers', label: 'Customers', to: '/customers', roles: ['admin', 'staff'], icon: Users },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { key: 'products', label: 'Products', to: '/catalog/products', roles: ['admin', 'staff'], icon: Package },
      { key: 'plans', label: 'Plans', to: '/catalog/plans', roles: ['admin', 'staff'], icon: Tags },
    ],
  },
  {
    label: 'Pricing',
    items: [
      { key: 'discounts', label: 'Discounts', to: '/pricing/discounts', roles: ['admin'], icon: ReceiptText },
      { key: 'taxes', label: 'Taxes', to: '/pricing/taxes', roles: ['admin', 'staff'], icon: ReceiptText },
      { key: 'templates', label: 'Templates', to: '/pricing/templates', roles: ['admin', 'staff'], icon: FileStack },
    ],
  },
  {
    label: 'Admin',
    items: [
      { key: 'team', label: 'Team', to: '/team', roles: ['admin'], icon: Users },
    ],
  },
];

export default function Sidebar({
  open = false,
  collapsed = false,
  onClose,
  onToggle,
  onToggleCollapse,
}) {
  const location = useLocation();
  const { profile } = useAuth();
  const role = profile?.role;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onToggle) {
      onToggle(false);
    }
  };

  const isActive = (to) => {
    if (to === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (to === '/portal') {
      return location.pathname === '/portal';
    }
    if (to === '/invoices') {
      return (
        location.pathname === '/invoices' ||
        location.pathname.startsWith('/invoices/') ||
        location.pathname.startsWith('/billing/')
      );
    }
    return (
      location.pathname === to ||
      (to !== '/' && location.pathname.startsWith(`${to}/`))
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${open ? 'open' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <img src={logoImg} alt="Aureon" className="sidebar-brand-logo" title="Aureon Billing" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Aureon</span>
            <span className="sidebar-brand-badge">Billing</span>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={handleClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav-wrap">
          {navGroups.map((group, gi) => {
            const visible = group.items.filter((i) =>
              i.roles.includes(role || 'customer')
            );
            if (!visible.length) return null;
            return (
              <div key={gi} className="sidebar-group">
                {group.label && (
                  <div className="sidebar-group-label">{group.label}</div>
                )}
                <ul className="sidebar-nav">
                  {visible.map((item) => {
                    const active = isActive(item.to);
                    return (
                      <li key={item.key}>
                        <NavLink
                          to={item.to}
                          title={item.label}
                          className={`sidebar-nav-item ${active ? 'active' : ''}`}
                          onClick={() => {
                            if (window.innerWidth <= 960) {
                              handleClose();
                            }
                          }}
                        >
                          <item.icon className="nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" />
                          <span className="nav-label">{item.label}</span>
                          {active && <span className="nav-active-dot" aria-hidden="true" />}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-info">
            <div className="sidebar-footer-role">{role || 'member'}</div>
            <div className="sidebar-footer-copy">© 2025 Aureon</div>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
