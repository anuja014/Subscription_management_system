// src/features/portal/Portal.jsx
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { StatCard } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { MoneyText } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { statusBadgeClass, statusLabel } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

export default function Portal() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) load(user.id);
  }, [user?.id]);

  const addToast = (msg, type = 'info') => {
    const n = Date.now();
    setToasts((t) => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n)), 4000);
  };

  async function load(profileId) {
    setLoading(true);
    setError('');

    const { data: custRows, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true });

    if (customerError) {
      setError(customerError.message);
      setLoading(false);
      return;
    }

    const customers = custRows || [];
    const customerIds = customers.map((c) => c.id);
    setCustomer(customers[0] || null);

    if (customerIds.length === 0) {
      setSubs([]);
      setInvoices([]);
      setLoading(false);
      return;
    }

    const [sRes, iRes] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('*, plans(name)')
        .in('customer_id', customerIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('*, subscriptions(number)')
        .in('customer_id', customerIds)
        .order('created_at', { ascending: false }),
    ]);

    const queryError = sRes.error || iRes.error;
    if (queryError) {
      setError(queryError.message);
    } else {
      setSubs(sRes.data || []);
      setInvoices(iRes.data || []);
    }
    setLoading(false);
  }

  const activeSubs = subs.filter((s) => s.status === 'active').length;
  const outstanding = invoices.reduce(
    (sum, i) => sum + Math.max(0, Number(i.total || 0) - Number(i.amount_paid || 0)),
    0
  );

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading your portal...</div>;

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader
        title="Customer portal"
        subtitle={
          customer
            ? `${customer.name}${customer.company ? ' — ' + customer.company : ''}`
            : 'Your subscriptions and invoices'
        }
      />

      {error && (
        <div style={{ color: 'var(--danger)', padding: 16, marginBottom: 24, background: 'var(--danger-soft)', borderRadius: 6 }}>
          Unable to load your customer records: {error}
        </div>
      )}

      {!customer && !error && (
        <Card>
          <h3 style={{ marginBottom: 8 }}>Your account is not linked yet</h3>
          <p className="text-muted" style={{ margin: 0 }}>
            No billing record is linked to your login yet. Ask an administrator to link your profile to a customer record.
          </p>
        </Card>
      )}

      {customer && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Active subscriptions" value={activeSubs} />
            <StatCard label="Total invoices" value={invoices.length} />
            <StatCard label="Outstanding" value={<MoneyText amount={outstanding} />} />
          </div>

          <Card>
            <h3 style={{ marginBottom: 12, fontSize: 16 }}>My subscriptions</h3>
            <DataTable
              columns={[
                { key: 'number', label: 'Number', render: (r) => <span className="mono">{r.number}</span> },
                { key: 'plans', label: 'Plan', render: (r) => r.plans?.name || '-' },
                { key: 'status', label: 'Status', render: (r) => <Badge variant={statusBadgeClass(r.status)}>{statusLabel(r.status)}</Badge> },
                { key: 'next_billing_date', label: 'Next billing', render: (r) => r.next_billing_date || '-' },
              ]}
              data={subs}
            />
          </Card>

          <Card style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16 }}>My invoices</h3>
            <DataTable
              columns={[
                { key: 'number', label: 'Number', render: (r) => <span className="mono">{r.number}</span> },
                { key: 'status', label: 'Status', render: (r) => <Badge variant={statusBadgeClass(r.status)}>{statusLabel(r.status)}</Badge> },
                { key: 'total', label: 'Total', render: (r) => <MoneyText amount={r.total} /> },
                { key: 'amount_paid', label: 'Paid', render: (r) => <MoneyText amount={r.amount_paid} /> },
                { key: 'due_date', label: 'Due', render: (r) => r.due_date || '-' },
              ]}
              data={invoices}
            />
          </Card>
        </>
      )}
    </div>
  );
}
