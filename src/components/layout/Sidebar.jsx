// src/components/layout/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Repeat2, FileText, CreditCard, Users, Package, Tags, ReceiptText, FileStack, UserRound } from 'lucide-react';

const navItems = [
  { key: 'portal', label: 'My Portal', to: '/portal', roles: ['customer'], icon: UserRound },
  { key: 'dashboard', label: 'Overview', to: '/dashboard', roles: ['admin', 'staff'], icon: LayoutDashboard },
  { key: 'subscriptions', label: 'Subscriptions', to: '/subscriptions', roles: ['admin', 'staff'], icon: Repeat2 },
  { key: 'invoices', label: 'Invoices', to: '/invoices', roles: ['admin', 'staff'], icon: FileText },
  { key: 'payments', label: 'Payments', to: '/payments', roles: ['admin', 'staff'], icon: CreditCard },
  { key: 'customers', label: 'Customers', to: '/customers', roles: ['admin', 'staff'], icon: Users },
  { key: 'products', label: 'Products', to: '/catalog/products', roles: ['admin', 'staff'], icon: Package },
  { key: 'plans', label: 'Plans', to: '/catalog/plans', roles: ['admin', 'staff'], icon: Tags },
  { key: 'discounts', label: 'Discounts', to: '/pricing/discounts', roles: ['admin'], icon: ReceiptText },
  { key: 'taxes', label: 'Taxes', to: '/pricing/taxes', roles: ['admin'], icon: ReceiptText },
  { key: 'templates', label: 'Templates', to: '/pricing/templates', roles: ['admin', 'staff'], icon: FileStack },
  { key: 'team', label: 'Team', to: '/team', roles: ['admin'], icon: Users },
];

export default function Sidebar({ open, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const role = profile?.role;

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-brand">
        <span className="mono">BL</span> Billing
      </div>
      <ul className="sidebar-nav">
        {navItems.filter((i) => i.roles.includes(role || 'customer')).map((item) => (
          <li key={item.key}>
            <a
              href={item.to}
              onClick={(e) => { e.preventDefault(); navigate(item.to); onToggle(false); }}
              className={location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(`${item.to}/`)) ? 'active' : ''}
            >
              <item.icon size={16} strokeWidth={1.8} aria-hidden="true" />
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <div className="sidebar-role">{role || 'member'}</div>
        <div>Brightloop Billing</div>
      </div>
    </aside>
  );
}
