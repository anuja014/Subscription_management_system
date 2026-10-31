// src/components/layout/Sidebar.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', roles: ['admin', 'staff'] },
  { key: 'subscriptions', label: 'Subscriptions', to: '/subscriptions', roles: ['admin', 'staff'] },
  { key: 'invoices', label: 'Invoices', to: '/invoices', roles: ['admin', 'staff'] },
  { key: 'payments', label: 'Payments', to: '/payments', roles: ['admin', 'staff'] },
  { key: 'customers', label: 'Customers', to: '/customers', roles: ['admin', 'staff'] },
  { key: 'products', label: 'Products', to: '/catalog/products', roles: ['admin', 'staff'] },
  { key: 'plans', label: 'Plans', to: '/catalog/plans', roles: ['admin', 'staff'] },
  { key: 'discounts', label: 'Discounts', to: '/pricing/discounts', roles: ['admin'] },
  { key: 'taxes', label: 'Taxes', to: '/pricing/taxes', roles: ['admin'] },
  { key: 'templates', label: 'Templates', to: '/pricing/templates', roles: ['admin', 'staff'] },
  { key: 'team', label: 'Team', to: '/team', roles: ['admin'] },
];

export default function Sidebar({ open, onToggle }) {
  const navigate = useNavigate();
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
              className={''}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, fontSize: 12, color: '#E6EAF0' }}>{role}</div>
        <div style={{ fontSize: 11, color: '#8A97A8', marginTop: 2 }}>Brightloop Billing</div>
      </div>
    </aside>
  );
}
