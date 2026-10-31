// src/features/catalog/Plans.jsx
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Checkbox } from '../../components/ui';
import { Select } from '../../components/ui';
import { DateInput } from '../../components/ui';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { Modal } from '../../components/ui';
import { MoneyText } from '../../components/ui';
import { FormField } from '../../components/ui/FormField';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { planSchema } from '../../lib/validators';

export default function Plans() {
  const [toasts, setToasts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', billing_period: 'monthly', min_quantity: '1', available_from: '', available_to: '', auto_close: false, allow_early_close: true, allow_pause: true, allow_renew: true, is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4000);
  };

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('plans').select('*').order('created_at', { ascending: false });
      if (error) addToast(error.message, 'error');
      else setPlans(data || []);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      planSchema.parse(form);
      const payload = { ...form, price: Number(form.price), min_quantity: Number(form.min_quantity) };
      if (editing) {
        const { error } = await supabase.from('plans').update(payload).eq('id', editing.id);
        if (error) throw error;
        addToast('Plan updated', 'success');
      } else {
        const { error } = await supabase.from('plans').insert(payload);
        if (error) throw error;
        addToast('Plan created', 'success');
      }
      setOpen(false);
      setEditing(null);
      setForm({ name: '', price: '', billing_period: 'monthly', min_quantity: '1', available_from: '', available_to: '', auto_close: false, allow_early_close: true, allow_pause: true, allow_renew: true, is_active: true });
      load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (p) => {
    const { error } = await supabase.from('plans').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) addToast(error.message, 'error');
    else load();
  };

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Plans" subtitle="Subscription billing plans" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button variant="primary" onClick={() => { setEditing(null); setForm({ name: '', price: '', billing_period: 'monthly', min_quantity: '1', available_from: '', available_to: '', auto_close: false, allow_early_close: true, allow_pause: true, allow_renew: true, is_active: true }); setOpen(true); }}>
          Add plan
        </Button>
      </div>
      <Card>
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'price', label: 'Price', render: (r) => <MoneyText amount={r.price} /> },
            { key: 'billing_period', label: 'Period' },
            { key: 'auto_close', label: 'Auto-close', render: (r) => <Badge variant={r.auto_close ? 'warning' : 'info'}>{r.auto_close ? 'Yes' : 'No'}</Badge> },
            { key: 'is_active', label: 'Status', render: (r) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'actions', label: '', render: (r) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setForm({ ...r }); setOpen(true); }}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(r)}>{r.is_active ? 'Deactivate' : 'Activate'}</Button>
              </div>
            ) },
          ]}
          data={plans}
          loading={loading}
        />
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit plan' : 'New plan'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Price">
            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </FormField>
          <FormField label="Billing period">
            <Select value={form.billing_period} onChange={(v) => setForm({ ...form, billing_period: v })} options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]} />
          </FormField>
          <FormField label="Min quantity">
            <Input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} required />
          </FormField>
          <FormField label="Available from">
            <DateInput value={form.available_from} onChange={(v) => setForm({ ...form, available_from: v })} />
          </FormField>
          <FormField label="Available to">
            <DateInput value={form.available_to} onChange={(v) => setForm({ ...form, available_to: v })} />
          </FormField>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Checkbox label="Auto close" checked={form.auto_close} onChange={(v) => setForm({ ...form, auto_close: v })} />
            <Checkbox label="Allow early close" checked={form.allow_early_close} onChange={(v) => setForm({ ...form, allow_early_close: v })} />
            <Checkbox label="Allow pause" checked={form.allow_pause} onChange={(v) => setForm({ ...form, allow_pause: v })} />
            <Checkbox label="Allow renew" checked={form.allow_renew} onChange={(v) => setForm({ ...form, allow_renew: v })} />
            <Checkbox label="Active plan" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save plan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
