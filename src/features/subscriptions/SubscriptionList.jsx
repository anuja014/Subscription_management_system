// src/features/subscriptions/SubscriptionList.jsx
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

export default function SubscriptionList() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [subs, setSubs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  useEffect(() => { load(); }, []);

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4000);
  };

  async function load() {
    const [sRes, cRes, pRes] = await Promise.all([
      supabase.from('subscriptions').select('*, customers(name), plans(name)').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name'),
      supabase.from('plans').select('id, name'),
    ]);
    if (sRes.error) addToast(sRes.error.message, 'error');
    else setSubs(sRes.data || []);
    if (cRes.error) addToast(cRes.error.message, 'error');
    else setCustomers(cRes.data || []);
    if (pRes.error) addToast(pRes.error.message, 'error');
    else setPlans(pRes.data || []);
  }

  const filtered = subs.filter((s) => (!filterStatus || s.status === filterStatus) && (!filterCustomer || s.customer_id === filterCustomer));

  const columns = [
    { key: 'number', label: 'Number', render: (r) => <span className="mono">{r.number}</span> },
    { key: 'customers', label: 'Customer', render: (r) => r.customers?.name || '-' },
    { key: 'plans', label: 'Plan', render: (r) => r.plans?.name || '-' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={statusBadgeClass(r.status)}>{statusLabel(r.status)}</Badge> },
    { key: 'next_billing_date', label: 'Next billing', render: (r) => r.next_billing_date || '-' },
    { key: 'actions', label: '', render: (r) => (
      <Button variant="ghost" size="sm" onClick={() => navigate(`/subscriptions/${r.id}`)}>View</Button>
    ) },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Subscriptions" subtitle="All subscriptions across customers" />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Select value={filterStatus} onChange={(v) => setFilterStatus(v)} options={[
          { value: '', label: 'All status' },
          { value: 'draft', label: 'Draft' },
          { value: 'quotation', label: 'Quotation' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'active', label: 'Active' },
          { value: 'closed', label: 'Closed' },
        ]} placeholder="Status" />
        <Select value={filterCustomer} onChange={(v) => setFilterCustomer(v)} options={customers.map((c) => ({ value: c.id, label: c.name }))} placeholder="Customer" />
        <Button variant="primary" onClick={() => navigate('/subscriptions/new')}>New subscription</Button>
      </div>
      <Card>
        <DataTable columns={columns} data={filtered} />
      </Card>
    </div>
  );
}
