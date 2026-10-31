// src/features/portal/Portal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { MoneyText } from '../../components/ui';
import { statusLabel } from '../../lib/format';

export default function Portal() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const addToast = (msg, type = 'info') => {
    const n = Date.now();
    setToasts((t) => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n)), 4000);
  };

  async function load() {
    setLoading(true);
    const [sRes, iRes] = await Promise.all([
      supabase.from('subscriptions').select('*, plans(name)').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*, subscriptions(number)').order('created_at', { ascending: false }),
    ]);
    if (!sRes.error) setSubs(sRes.data || []);
    if (!iRes.error) setInvoices(iRes.data || []);
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading your portal...</div>;

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Customer portal" subtitle="Your subscriptions and invoices" />
      <Card>
        <h3 style={{ marginBottom: 12, fontSize: 16 }}>My subscriptions</h3>
        <DataTable
          columns={[
            { key: 'number', label: 'Number', render: (r) => <span className="mono">{r.number}</span> },
            { key: 'plans', label: 'Plan', render: (r) => r.plans?.name || '-' },
            { key: 'status', label: 'Status', render: (r) => <Badge variant="info">{statusLabel(r.status)}</Badge> },
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
            { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'paid' ? 'success' : 'warning'}>{r.status}</Badge> },
            { key: 'total', label: 'Total', render: (r) => <MoneyText amount={r.total} /> },
            { key: 'amount_paid', label: 'Paid', render: (r) => <MoneyText amount={r.amount_paid} /> },
            { key: 'due_date', label: 'Due', render: (r) => r.due_date || '-' },
          ]}
          data={invoices}
        />
      </Card>
    </div>
  );
}
