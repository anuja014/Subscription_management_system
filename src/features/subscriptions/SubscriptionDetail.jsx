// src/features/subscriptions/SubscriptionDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { Stepper } from '../../components/ui';
import { MoneyText } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { LogoSpinner } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { statusBadgeClass, statusLabel } from '../../lib/format';

export default function SubscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [sub, setSub] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const addToast = (msg, type = 'info') => {
    const n = Date.now();
    setToasts((t) => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n)), 4000);
  };

  async function load() {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([
        supabase.from('subscriptions').select('*, customers(name, email), plans(name, billing_period)').eq('id', id).single(),
        supabase.from('subscription_lines').select('*, products(name), product_variants(value)').eq('subscription_id', id),
      ]);
      if (sRes.error) addToast(sRes.error.message, 'error');
      else setSub(sRes.data);
      if (lRes.error) addToast(lRes.error.message, 'error');
      else setLines(lRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  const total = lines.reduce((sum, l) => sum + Number(l.amount || 0), 0);

  const updateStatus = async (newStatus) => {
    if (!confirm(`Move subscription to ${statusLabel(newStatus)}?`)) return;
    const { error } = await supabase.from('subscriptions').update({ status: newStatus }).eq('id', id);
    if (error) addToast(error.message, 'error');
    else { addToast('Status updated', 'success'); load(); }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <LogoSpinner size="lg" label="Loading subscription details…" />
      </div>
    );
  }

  if (!sub) return <div style={{ padding: 24, textAlign: 'center' }}>Not found</div>;

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title={`Subscription ${sub.number}`} subtitle={sub.customers?.name || 'Customer'}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge variant={statusBadgeClass(sub.status)}>{statusLabel(sub.status)}</Badge>
          <Button variant="ghost" size="sm" onClick={() => navigate('/subscriptions')}>Back</Button>
        </div>
      </PageHeader>
      <Stepper status={sub.status} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <Card>
          <h3 style={{ marginBottom: 12 }}>Details</h3>
          <p><strong>Customer:</strong> {sub.customers?.name}</p>
          <p><strong>Email:</strong> {sub.customers?.email}</p>
          <p><strong>Plan:</strong> {sub.plans?.name} ({sub.plans?.billing_period})</p>
          <p><strong>Status:</strong> {statusLabel(sub.status)}</p>
          <p><strong>Start date:</strong> {sub.start_date || '-'}</p>
          <p><strong>Next billing:</strong> {sub.next_billing_date || '-'}</p>
          <p><strong>Payment terms:</strong> {sub.payment_terms || '-'}</p>
        </Card>
        <Card>
          <h3 style={{ marginBottom: 12 }}>Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sub.status === 'draft' && <Button variant="primary" onClick={() => updateStatus('quotation')}>Send quotation</Button>}
            {sub.status === 'quotation' && <Button variant="primary" onClick={() => updateStatus('confirmed')}>Confirm</Button>}
            {sub.status === 'confirmed' && <Button variant="primary" onClick={() => updateStatus('active')}>Activate</Button>}
            {sub.status === 'active' && <Button variant="danger" onClick={() => updateStatus('closed')}>Close</Button>}
            {sub.status === 'closed' && <Button variant="ghost" onClick={() => updateStatus('active')}>Renew</Button>}
          </div>
        </Card>
      </div>
      <Card>
        <h3 style={{ marginBottom: 12 }}>Lines</h3>
        <DataTable
          columns={[
            { key: 'products', label: 'Product', render: (r) => r.products?.name || '-' },
            { key: 'product_variants', label: 'Variant', render: (r) => r.product_variants?.value || '-' },
            { key: 'quantity', label: 'Qty' },
            { key: 'unit_price', label: 'Unit price', render: (r) => <MoneyText amount={r.unit_price} /> },
            { key: 'amount', label: 'Amount', render: (r) => <MoneyText amount={r.amount} /> },
          ]}
          data={lines}
          loading={loading}
        />
        <div style={{ marginTop: 12, textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
          Total: <MoneyText amount={total} />
        </div>
      </Card>
    </div>
  );
}
