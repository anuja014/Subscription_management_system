// src/features/pricing/Taxes.jsx
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Select } from '../../components/ui';
import { Checkbox } from '../../components/ui';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { Modal } from '../../components/ui';
import { FormField } from '../../components/ui/FormField';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { taxSchema } from '../../lib/validators';

export default function Taxes() {
  const [toasts, setToasts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'percentage', rate: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4000);
  };

  async function load() {
    const { data, error } = await supabase.from('taxes').select('*').order('created_at', { ascending: false });
    if (error) addToast(error.message, 'error');
    else setTaxes(data || []);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      taxSchema.parse(form);
      const payload = { ...form, rate: Number(form.rate) };
      if (editing) {
        const { error } = await supabase.from('taxes').update(payload).eq('id', editing.id);
        if (error) throw error;
        addToast('Tax updated', 'success');
      } else {
        const { error } = await supabase.from('taxes').insert(payload);
        if (error) throw error;
        addToast('Tax created', 'success');
      }
      setOpen(false);
      setEditing(null);
      setForm({ name: '', type: 'percentage', rate: '', is_active: true });
      load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (t) => {
    const { error } = await supabase.from('taxes').update({ is_active: !t.is_active }).eq('id', t.id);
    if (error) addToast(error.message, 'error');
    else load();
  };

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Taxes" subtitle="Tax rules applied to products and invoices" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button variant="primary" onClick={() => { setEditing(null); setForm({ name: '', type: 'percentage', rate: '', is_active: true }); setOpen(true); }}>
          Add tax
        </Button>
      </div>
      <Card>
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
            { key: 'rate', label: 'Rate', render: (r) => r.type === 'percentage' ? r.rate + '%' : '$' + r.rate },
            { key: 'is_active', label: 'Status', render: (r) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'actions', label: '', render: (r) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setForm({ ...r }); setOpen(true); }}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(r)}>{r.is_active ? 'Deactivate' : 'Activate'}</Button>
              </div>
            ) },
          ]}
          data={taxes}
        />
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit tax' : 'New tax'}>
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
          <FormField label="Rate">
            <Input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required />
          </FormField>
          <FormField label="Active">
            <Checkbox label="Active" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save tax'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
