// src/components/layout/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Repeat2, FileText, CreditCard,
  Users, Package, Tags, ReceiptText, FileStack, UserRound,
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
      { key: 'taxes', label: 'Taxes', to: '/pricing/taxes', roles: ['admin'], icon: ReceiptText },
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

export default function Sidebar({ open, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const role = profile?.role;

  const isActive = (to) =>
    location.pathname === to ||
    (to !== '/dashboard' && to !== '/portal' && location.pathname.startsWith(`${to}/`));

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${open ? 'open' : ''}`}
        onClick={() => onToggle(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap">
            <img src={logoImg} alt="Brightloop" className="sidebar-logo" />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Brightloop</span>
            <span className="sidebar-brand-badge">Billing</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav-wrap">
          {navGroups.map((group, gi) => {
            const visible = group.items.filter((i) => i.roles.includes(role || 'customer'));
            if (!visible.length) return null;
            return (
              <div key={gi} className="sidebar-group">
                {group.label && (
                  <div className="sidebar-group-label">{group.label}</div>
                )}
                <ul className="sidebar-nav">
                  {visible.map((item) => (
                    <li key={item.key}>
                      <a
                        href={item.to}
                        onClick={(e) => { e.preventDefault(); navigate(item.to); onToggle(false); }}
                        className={isActive(item.to) ? 'active' : ''}
                      >
                        <item.icon size={16} strokeWidth={1.8} aria-hidden="true" />
                        <span>{item.label}</span>
                        {isActive(item.to) && <span className="nav-active-dot" aria-hidden="true" />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-role">{role || 'member'}</div>
          <div className="sidebar-footer-copy">© 2025 Brightloop</div>
        </div>
      </aside>
    </>
  );
}
