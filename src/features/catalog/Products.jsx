// src/features/catalog/Products.jsx
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Checkbox } from '../../components/ui';
import { Select } from '../../components/ui';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { Modal } from '../../components/ui';
import { MoneyText } from '../../components/ui';
import { FormField } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { productSchema } from '../../lib/validators';

export default function Products() {
  const [toasts, setToasts] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'service', sales_price: '', cost_price: '', notes: '', is_active: true });
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
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) addToast(error.message, 'error');
      else setProducts(data || []);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      productSchema.parse(form);
      if (editing) {
        const { error } = await supabase.from('products').update(form).eq('id', editing.id);
        if (error) throw error;
        addToast('Product updated', 'success');
      } else {
        const { error } = await supabase.from('products').insert(form);
        if (error) throw error;
        addToast('Product created', 'success');
      }
      setOpen(false);
      setEditing(null);
      setForm({ name: '', type: 'service', sales_price: '', cost_price: '', notes: '', is_active: true });
      load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (p) => {
    const { error } = await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) addToast(error.message, 'error');
    else load();
  };

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Products" subtitle="Manage your product catalog" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button variant="primary" onClick={() => { setEditing(null); setForm({ name: '', type: 'service', sales_price: '', cost_price: '', notes: '', is_active: true }); setOpen(true); }}>
          Add product
        </Button>
      </div>
      <Card>
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
            { key: 'sales_price', label: 'Price', render: (r) => <MoneyText amount={r.sales_price} /> },
            { key: 'is_active', label: 'Status', render: (r) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'actions', label: '', render: (r) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setForm({ ...r }); setOpen(true); }}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(r)}>{r.is_active ? 'Deactivate' : 'Activate'}</Button>
              </div>
            ) },
          ]}
          data={products}
          loading={loading}
        />
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit product' : 'New product'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={[
              { value: 'service', label: 'Service' },
              { value: 'software', label: 'Software' },
              { value: 'addon', label: 'Add-on' },
              { value: 'physical', label: 'Physical' },
            ]} />
          </FormField>
          <FormField label="Sales price">
            <Input type="number" value={form.sales_price} onChange={(e) => setForm({ ...form, sales_price: e.target.value })} required />
          </FormField>
          <FormField label="Cost price">
            <Input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
          </FormField>
          <FormField label="Notes">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <FormField label="Active">
            <Checkbox label="Active product" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save product'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
