// src/features/dashboard/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui';
import { StatCard } from '../../components/ui';
import { Badge } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const [toasts, setToasts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('dashboard_summary', { p_from: null, p_to: null }).then(({ data, error }) => {
      if (error) setToasts((t) => [...t, { id: Date.now(), msg: error.message, type: 'error' }]);
      else setSummary(data);
      setLoading(false);
    });
  }, []);

  const addToast = (msg, type = 'info') => {
    const n = Date.now();
    setToasts((t) => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n)), 4000);
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Finance dashboard" subtitle="Active subscriptions, revenue, outstanding and overdue" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Active subscriptions" value={summary?.active_subscriptions ?? 0} />
        <StatCard label="Revenue collected" value={summary ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.revenue_collected) : '$0'} />
        <StatCard label="Outstanding amount" value={summary ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.outstanding_amount) : '$0'} delta="unpaid" deltaType="down" />
        <StatCard label="Overdue invoices" value={summary?.overdue_count ?? 0} delta={`$${(summary?.overdue_amount || 0).toFixed(2)}`} deltaType="down" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card>
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Overdue invoices</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Configure dashboard_summary() to return overdue list, or fetch invoices with status=confirmed and due_date &lt; today.</div>
        </Card>
        <Card>
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Recent activity</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Charts render via Recharts. Connect to dashboard_summary() for revenue by month, subscriptions by status, payments by method.</div>
        </Card>
      </div>
    </div>
  );
}
