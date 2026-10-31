// src/features/subscriptions/SubscriptionForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Checkbox } from '../../components/ui';
import { Select } from '../../components/ui';
import { DateInput } from '../../components/ui';
import { Card } from '../../components/ui';
import { FormField } from '../../components/ui/FormField';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';

export default function SubscriptionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [toasts, setToasts] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [lines, setLines] = useState([]);
  const [form, setForm] = useState({ customer_id: '', plan_id: '', start_date: '', next_billing_date: '', payment_terms: 'Net 15', status: 'draft' });
  const [submitting, setSubmitting] = useState(false);

  const addToast = (msg, type = 'info') => {
    const n = Date.now();
    setToasts((t) => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n)), 4000);
  };

  useEffect(() => {
    Promise.all([
      supabase.from('customers').select('id, name'),
      supabase.from('plans').select('id, name').eq('is_active', true),
    ]).then(([cRes, pRes]) => {
      if (!cRes.error) setCustomers(cRes.data || []);
      if (!pRes.error) setPlans(pRes.data || []);
    });
  }, []);

  useEffect(() => {
    // If coming from a template, prefill
    if (templateId) {
      supabase.from('quotation_templates').select('*, quotation_template_lines(*)').eq('id', templateId).single().then((res) => {
        if (!res.error) {
          const t = res.data;
          setForm({ ...form, plan_id: t.plan_id });
          setLines((t.quotation_template_lines || []).map((l) => ({ product_id: l.product_id, variant_id: l.variant_id, quantity: l.quantity })));
        }
      });
    }
  }, [templateId]);

  const addLine = () => setLines([...lines, { product_id: '', variant_id: '', quantity: 1 }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: sub, error } = await supabase.from('subscriptions').insert({
        customer_id: form.customer_id,
        plan_id: form.plan_id,
        status: form.status,
        start_date: form.start_date,
        next_billing_date: form.next_billing_date || form.start_date,
        payment_terms: form.payment_terms,
      }).select().single();
      if (error) throw error;
      if (lines.length > 0) {
        const rows = lines.map((l) => ({ subscription_id: sub.id, product_id: l.product_id, variant_id: l.variant_id || null, quantity: l.quantity, unit_price: 0, amount: 0 }));
        const { error: lerr } = await supabase.from('subscription_lines').insert(rows);
        if (lerr) throw lerr;
      }
      addToast('Subscription created', 'success');
      navigate(`/subscriptions/${sub.id}`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="New subscription" subtitle="Create from scratch or from a quotation template" />
      <Card>
        <FormField label="Start from template">
          <Select value={templateId} onChange={(v) => setTemplateId(v)} options={[]} placeholder="Select a template" />
        </FormField>
        <p style={{ fontSize: 12, color: '#8A97A8', marginBottom: 16 }}>Templates come from the Pricing section (Member 2). Pick one to pre-fill plan and lines.</p>
        <FormField label="Customer">
          <Select value={form.customer_id} onChange={(v) => setForm({ ...form, customer_id: v })} options={customers.map((c) => ({ value: c.id, label: c.name }))} required />
        </FormField>
        <FormField label="Plan">
          <Select value={form.plan_id} onChange={(v) => setForm({ ...form, plan_id: v })} options={plans.map((p) => ({ value: p.id, label: p.name }))} required />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[
            { value: 'draft', label: 'Draft' },
            { value: 'quotation', label: 'Quotation' },
          ]} />
        </FormField>
        <FormField label="Start date">
          <DateInput value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} required />
        </FormField>
        <FormField label="Next billing date">
          <DateInput value={form.next_billing_date} onChange={(v) => setForm({ ...form, next_billing_date: v })} />
        </FormField>
        <FormField label="Payment terms">
          <Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} />
        </FormField>
        <div style={{ fontWeight: 600, fontSize: 12, color: '#8A97A8', margin: '16px 0 8px' }}>Lines</div>
        {lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <Select value={l.product_id} onChange={(v) => { const n = [...lines]; n[i] = { ...n[i], product_id: v }; setLines(n); }} options={[]} style={{ flex: 1 }} placeholder="Product" />
            <Input type="number" value={l.quantity || 1} onChange={(e) => { const n = [...lines]; n[i] = { ...n[i], quantity: Number(e.target.value) || 1 }; setLines(n); }} style={{ width: 70 }} />
            <Button variant="ghost" size="sm" onClick={() => setLines(lines.filter((_, idx) => idx !== i))}>×</Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={addLine} style={{ width: 'fit-content' }}>+ Add line</Button>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={() => navigate('/subscriptions')}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create subscription'}</Button>
        </div>
      </Card>
    </div>
  );
}
