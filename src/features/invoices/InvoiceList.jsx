// src/features/invoices/InvoiceList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { Select } from '../../components/ui';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { statusBadgeClass, statusLabel } from '../../lib/format';
import { MoneyText } from '../../components/ui';

export default function InvoiceList() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const addToast = (msg, type = 'info') => {
    const n = Date.now();
    setToasts((t) => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n)), 4000);
  };

  async function load() {
    setLoading(true);
    try {
      const [iRes, cRes] = await Promise.all([
        supabase.from('invoices').select('*, subscriptions(number), customers(name)').order('created_at', { ascending: false }).limit(100),
        supabase.from('customers').select('id, name'),
      ]);
      if (iRes.error) addToast(iRes.error.message, 'error');
      else setInvoices(iRes.data || []);
      if (cRes.error) addToast(cRes.error.message, 'error');
      else setCustomers(cRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  const filtered = invoices.filter((i) => !filterStatus || i.status === filterStatus);

  const columns = [
    { key: 'number', label: 'Number', render: (r) => <span className="mono">{r.number}</span> },
    { key: 'subscriptions', label: 'Subscription', render: (r) => r.subscriptions?.number || '-' },
    { key: 'customers', label: 'Customer', render: (r) => r.customers?.name || '-' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={statusBadgeClass(r.status)}>{statusLabel(r.status)}</Badge> },
    { key: 'total', label: 'Total', render: (r) => <MoneyText amount={r.total} /> },
    { key: 'amount_paid', label: 'Paid', render: (r) => <MoneyText amount={r.amount_paid} /> },
    { key: 'due_date', label: 'Due', render: (r) => r.due_date || '-' },
    { key: 'actions', label: '', render: (r) => (
      <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${r.id}`)}>View</Button>
    ) },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Invoices" subtitle="Draft, confirmed, paid and cancelled invoices" />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Select value={filterStatus} onChange={(v) => setFilterStatus(v)} options={[
          { value: '', label: 'All status' },
          { value: 'draft', label: 'Draft' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'paid', label: 'Paid' },
          { value: 'cancelled', label: 'Cancelled' },
        ]} placeholder="Status" />
        <Button variant="primary" onClick={() => navigate('/billing/run')}>Run billing</Button>
      </div>
      <Card>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </Card>
    </div>
  );
}
