// src/routes.jsx
import { createBrowserRouter } from 'react-router-dom';
import { RequireRole } from './components/layout/RequireRole';

// Layout
import AppShell from './components/layout/AppShell';

// Member 1: Auth (public, no shell)
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';

// Member 1: Foundation
import Team from './features/auth/Team';

// Member 2: Catalog & Pricing
import Products from './features/catalog/Products';
import Plans from './features/catalog/Plans';
import Discounts from './features/pricing/Discounts';
import Taxes from './features/pricing/Taxes';
import Templates from './features/pricing/Templates';

// Member 3: Subscriptions & Invoicing
import SubscriptionList from './features/subscriptions/SubscriptionList';
import SubscriptionForm from './features/subscriptions/SubscriptionForm';
import SubscriptionDetail from './features/subscriptions/SubscriptionDetail';
import InvoiceList from './features/invoices/InvoiceList';
import InvoiceDetail from './features/invoices/InvoiceDetail';
import RunBilling from './features/invoices/RunBilling';

// Member 4: Payments, Dashboard, Portal, Customers
import Payments from './features/payments/Payments';
import Dashboard from './features/dashboard/Dashboard';
import Portal from './features/portal/Portal';
import Customers from './features/customers/Customers';

const router = createBrowserRouter([
  // ============ Public routes (no app shell) ============
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // ============ App shell (authenticated) ============
  {
    path: '/',
    element: <AppShell />,
    children: [
      // Member 1
      { path: '', element: <RequireRole roles={['admin', 'staff']}><Dashboard /></RequireRole> },
      { path: 'dashboard', element: <RequireRole roles={['admin', 'staff']}><Dashboard /></RequireRole> },
      { path: 'team', element: <RequireRole roles={['admin']}><Team /></RequireRole> },

      // Member 2
      { path: 'catalog/products', element: <RequireRole roles={['admin', 'staff']}><Products /></RequireRole> },
      { path: 'catalog/plans', element: <RequireRole roles={['admin', 'staff']}><Plans /></RequireRole> },
      { path: 'pricing/discounts', element: <RequireRole roles={['admin']}><Discounts /></RequireRole> },
      { path: 'pricing/taxes', element: <RequireRole roles={['admin', 'staff']}><Taxes /></RequireRole> },
      { path: 'pricing/templates', element: <RequireRole roles={['admin', 'staff']}><Templates /></RequireRole> },

      // Member 3
      { path: 'subscriptions', element: <RequireRole roles={['admin', 'staff']}><SubscriptionList /></RequireRole> },
      { path: 'subscriptions/new', element: <RequireRole roles={['admin', 'staff']}><SubscriptionForm /></RequireRole> },
      { path: 'subscriptions/:id', element: <RequireRole roles={['admin', 'staff']}><SubscriptionDetail /></RequireRole> },
      { path: 'invoices', element: <RequireRole roles={['admin', 'staff']}><InvoiceList /></RequireRole> },
      { path: 'invoices/:id', element: <RequireRole roles={['admin', 'staff']}><InvoiceDetail /></RequireRole> },
      { path: 'billing/run', element: <RequireRole roles={['admin', 'staff']}><RunBilling /></RequireRole> },

      // Member 4
      { path: 'payments', element: <RequireRole roles={['admin', 'staff']}><Payments /></RequireRole> },
      { path: 'customers', element: <RequireRole roles={['admin', 'staff']}><Customers /></RequireRole> },
      { path: 'portal', element: <RequireRole roles={['customer']}><Portal /></RequireRole> },
    ],
  },

], {
  future: {
    v7_startTransition: true,
  },
});

export default router;
