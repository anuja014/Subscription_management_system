// src/features/payments/Payments.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Select } from '../../components/ui';
import { DateInput } from '../../components/ui';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Modal } from '../../components/ui';
import { FormField } from '../../components/ui/FormField';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { MoneyText } from '../../components/ui';

export default function Payments() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [open, setOpen] = useState(false);
  const [invId, setInvId] = useState('');
  const [form, setForm] = useState({ invoice_id: '', method: 'card', amount: '', payment_date: new Date().toISOString().slice(0, 10), note: '' });
  const [submitting, setSubmitting] = useState(false);
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
      const [pRes, iRes] = await Promise.all([
        supabase.from('payments').select('*, invoices(number)').order('payment_date', { ascending: false }).limit(100),
        supabase.from('invoices').select('id, number, total, amount_paid, status').eq('status', 'confirmed').limit(200),
      ]);
      if (pRes.error) addToast(pRes.error.message, 'error');
      else setPayments(pRes.data || []);
      if (iRes.error) addToast(iRes.error.message, 'error');
      else setInvoices(iRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('payments').insert({
        invoice_id: form.invoice_id,
        method: form.method,
        amount: Number(form.amount),
        payment_date: form.payment_date,
        note: form.note,
      });
      if (error) throw error;
      addToast('Payment recorded', 'success');
      setOpen(false);
      setForm({ invoice_id: '', method: 'card', amount: '', payment_date: new Date().toISOString().slice(0, 10), note: '' });
      load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const recordFromInvoice = (invoiceId) => {
    setInvId(invoiceId);
    const inv = invoices.find((i) => i.id === invoiceId);
    setForm({ invoice_id: invoiceId, method: 'card', amount: String(Math.max(0, Number(inv.total) - Number(inv.amount_paid))), payment_date: new Date().toISOString().slice(0, 10), note: '' });
    setOpen(true);
  };

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Payments" subtitle="Record payments against invoices" />
      <Button variant="primary" onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>Record payment</Button>
      <Card>
        <DataTable
          columns={[
            { key: 'invoices', label: 'Invoice', render: (r) => r.invoices?.number || '-' },
            { key: 'method', label: 'Method' },
            { key: 'amount', label: 'Amount', render: (r) => <MoneyText amount={r.amount} /> },
            { key: 'payment_date', label: 'Date', render: (r) => r.payment_date || '-' },
            { key: 'note', label: 'Note' },
          ]}
          data={payments}
          loading={loading}
        />
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Record payment">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Invoice">
            <Select value={form.invoice_id} onChange={(v) => {
              setForm({ ...form, invoice_id: v });
              const inv = invoices.find((i) => i.id === v);
              if (inv) setForm((f) => ({ ...f, invoice_id: v, amount: String(Math.max(0, Number(inv.total) - Number(inv.amount_paid))) }));
            }} options={invoices.map((i) => ({ value: i.id, label: `${i.number} ($${Number(i.total) - Number(i.amount_paid)} due)` }))} placeholder="Select unpaid invoice" required />
          </FormField>
          <FormField label="Method">
            <Select value={form.method} onChange={(v) => setForm({ ...form, method: v })} options={[
              { value: 'card', label: 'Credit card' },
              { value: 'bank_transfer', label: 'Bank transfer' },
              { value: 'cash', label: 'Cash' },
              { value: 'other', label: 'Other' },
            ]} />
          </FormField>
          <FormField label="Amount">
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </FormField>
          <FormField label="Payment date">
            <DateInput value={form.payment_date} onChange={(v) => setForm({ ...form, payment_date: v })} required />
          </FormField>
          <FormField label="Note">
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Recording...' : 'Record payment'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
