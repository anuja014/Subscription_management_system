// src/features/pricing/Discounts.jsx
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Select } from '../../components/ui';
import { Checkbox } from '../../components/ui';
import { DateInput } from '../../components/ui';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { Modal } from '../../components/ui';
import { FormField } from '../../components/ui/FormField';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { MoneyText } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { discountSchema } from '../../lib/validators';

export default function Discounts() {
  const [toasts, setToasts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'percentage', value: '', min_purchase: '', min_quantity: '1', start_date: '', end_date: '', usage_limit: '', applies_to: 'subscription', is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useAuth();

  useEffect(() => { load(); }, []);

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4000);
  };

  async function load() {
    const { data, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
    if (error) addToast(error.message, 'error');
    else setDiscounts(data || []);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      discountSchema.parse(form);
      const payload = { ...form, value: Number(form.value), min_purchase: form.min_purchase ? Number(form.min_purchase) : 0, min_quantity: Number(form.min_quantity || 1), usage_limit: form.usage_limit ? Number(form.usage_limit) : null };
      if (editing) {
        const { error } = await supabase.from('discounts').update(payload).eq('id', editing.id);
        if (error) throw error;
        addToast('Discount updated', 'success');
      } else {
        const { error } = await supabase.from('discounts').insert(payload);
        if (error) throw error;
        addToast('Discount created', 'success');
      }
      setOpen(false);
      setEditing(null);
      setForm({ name: '', type: 'percentage', value: '', min_purchase: '', min_quantity: '1', start_date: '', end_date: '', usage_limit: '', applies_to: 'subscription', is_active: true });
      load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Discounts" subtitle="Admin only. Discounts apply automatically on the next invoice." />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button variant="primary" onClick={() => { setEditing(null); setForm({ name: '', type: 'percentage', value: '', min_purchase: '', min_quantity: '1', start_date: '', end_date: '', usage_limit: '', applies_to: 'subscription', is_active: true }); setOpen(true); }}>
          Add discount
        </Button>
      </div>
      <Card>
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
            { key: 'value', label: 'Value', render: (r) => r.type === 'percentage' ? r.value + '%' : '$' + r.value },
            { key: 'applies_to', label: 'Applies to' },
            { key: 'times_used', label: 'Used', render: (r) => r.times_used + (r.usage_limit ? ' / ' + r.usage_limit : '') },
            { key: 'is_active', label: 'Status', render: (r) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'actions', label: '', render: (r) => (
              <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setForm({ ...r }); setOpen(true); }}>Edit</Button>
            ) },
          ]}
          data={discounts}
        />
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit discount' : 'New discount'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={[
              { value: 'percentage', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed amount' },
            ]} />
          </FormField>
          <FormField label="Value">
            <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
          </FormField>
          <FormField label="Min purchase">
            <Input type="number" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: e.target.value })} />
          </FormField>
          <FormField label="Min quantity">
            <Input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
          </FormField>
          <FormField label="Start date">
            <DateInput value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} required />
          </FormField>
          <FormField label="End date">
            <DateInput value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} required />
          </FormField>
          <FormField label="Usage limit (optional)">
            <Input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
          </FormField>
          <FormField label="Applies to">
            <Select value={form.applies_to} onChange={(v) => setForm({ ...form, applies_to: v })} options={[
              { value: 'subscription', label: 'Subscription' },
              { value: 'product', label: 'Product' },
            ]} />
          </FormField>
          <FormField label="Active">
            <Checkbox label="Active" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save discount'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
