// src/features/pricing/Templates.jsx
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Select } from '../../components/ui';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { Modal } from '../../components/ui';
import { FormField } from '../../components/ui/FormField';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';

export default function Templates() {
  const [toasts, setToasts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', plan_id: '', validity_days: '30' });
  const [lines, setLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4000);
  };

  async function load() {
    const [tRes, pRes, prRes] = await Promise.all([
      supabase.from('quotation_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('plans').select('id, name').eq('is_active', true),
      supabase.from('products').select('id, name').eq('is_active', true),
    ]);
    if (tRes.error) addToast(tRes.error.message, 'error');
    else setTemplates(tRes.data || []);
    if (pRes.error) addToast(pRes.error.message, 'error');
    else setPlans(pRes.data || []);
    if (prRes.error) addToast(prRes.error.message, 'error');
    else setProducts(prRes.data || []);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name: form.name, plan_id: form.plan_id, validity_days: Number(form.validity_days) };
      if (editing) {
        const { error } = await supabase.from('quotation_templates').update(payload).eq('id', editing.id);
        if (error) throw error;
        addToast('Template updated', 'success');
      } else {
        const { data: tpl, error } = await supabase.from('quotation_templates').insert(payload).select().single();
        if (error) throw error;
        // Insert lines
        if (lines.length > 0) {
          const lineRows = lines.map((l) => ({ template_id: tpl.id, product_id: l.product_id, variant_id: l.variant_id || null, quantity: l.quantity }));
          const { error: lerr } = await supabase.from('quotation_template_lines').insert(lineRows);
          if (lerr) throw lerr;
        }
        addToast('Template created', 'success');
      }
      setOpen(false);
      setEditing(null);
      setLines([]);
      setForm({ name: '', plan_id: '', validity_days: '30' });
      load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addLine = () => {
    setLines([...lines, { product_id: '', variant_id: '', quantity: 1 }]);
  };

  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));

  const toggleActive = async (t) => {
    const { error } = await supabase.from('quotation_templates').update({ is_active: !t.is_active }).eq('id', t.id);
    if (error) addToast(error.message, 'error');
    else load();
  };

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Quotation templates" subtitle="Templates pre-fill plan, lines and validity for subscriptions" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button variant="primary" onClick={() => { setEditing(null); setForm({ name: '', plan_id: '', validity_days: '30' }); setLines([]); setOpen(true); }}>
          Add template
        </Button>
      </div>
      <Card>
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'plan_id', label: 'Plan', render: (r) => plans.find((p) => p.id === r.plan_id)?.name || '-' },
            { key: 'validity_days', label: 'Validity (days)' },
            { key: 'actions', label: '', render: (r) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="ghost" size="sm" onClick={() => {
                  const t = templates.find((x) => x.id === r.id);
                  setEditing(t);
                  setForm({ name: t.name, plan_id: t.plan_id, validity_days: String(t.validity_days) });
                  supabase.from('quotation_template_lines').select('*').eq('template_id', t.id).then((res) => setLines(res.data || []));
                  setOpen(true);
                }}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(r)}>{r.is_active ? 'Deactivate' : 'Activate'}</Button>
              </div>
            ) },
          ]}
          data={templates}
        />
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit template' : 'New template'} style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Plan">
            <Select value={form.plan_id} onChange={(v) => setForm({ ...form, plan_id: v })} options={plans.map((p) => ({ value: p.id, label: p.name }))} required />
          </FormField>
          <FormField label="Validity days">
            <Input type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })} required />
          </FormField>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Template lines</div>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <Select value={l.product_id} onChange={(v) => { const n = [...lines]; n[i] = { ...n[i], product_id: v }; setLines(n); }} options={products.map((p) => ({ value: p.id, label: p.name }))} style={{ flex: 1 }} />
              <Input type="number" value={l.quantity || 1} onChange={(e) => { const n = [...lines]; n[i] = { ...n[i], quantity: Number(e.target.value) || 1 }; setLines(n); }} style={{ width: 80 }} />
              <Button variant="ghost" size="sm" onClick={() => removeLine(i)}>Remove</Button>
            </div>
          ))}
          <Button type="button" variant="ghost" onClick={addLine} style={{ width: 'fit-content', alignSelf: 'flex-start' }}>+ Add line</Button>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save template'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
