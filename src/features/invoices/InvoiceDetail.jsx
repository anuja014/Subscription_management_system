// src/features/invoices/InvoiceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { Card } from '../../components/ui';
import { Badge } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { MoneyText } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { LogoSpinner } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { statusBadgeClass, statusLabel } from '../../lib/format';
import '../../styles/pages/invoice-print.css';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [inv, setInv] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => { load(); }, [id]);

  const addToast = (msg, type = 'info') => {
    const n = Date.now();
    setToasts((t) => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n)), 4000);
  };

  async function load() {
    setLoading(true);
    try {
      const [iRes, lRes] = await Promise.all([
        supabase.from('invoices').select('*, subscriptions(number), customers(name, email)').eq('id', id).single(),
        supabase.from('invoice_lines').select('*').eq('invoice_id', id),
      ]);
      if (iRes.error) addToast(iRes.error.message, 'error');
      else setInv(iRes.data);
      if (lRes.error) addToast(lRes.error.message, 'error');
      else setLines(lRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  const outstanding = inv ? Math.max(0, Number(inv.total) - Number(inv.amount_paid)) : 0;

  const updateStatus = async (newStatus) => {
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', id);
    if (error) addToast(error.message, 'error');
    else { addToast(`Invoice ${statusLabel(newStatus)}`, 'success'); load(); }
  };

  const sendInvoice = async () => {
    addToast('Invoice sent (simulated)', 'info');
  };

  const printInvoice = () => {
    setPrintMode(true);
    window.print();
    setPrintMode(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <LogoSpinner size="lg" label="Loading invoice details…" />
      </div>
    );
  }

  if (!inv) return <div style={{ padding: 24, textAlign: 'center' }}>Not found</div>;

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      {printMode && (
        <div className="invoice-print no-print">
          <div className="invoice-header">
            <div className="invoice-brand">Aureon Billing</div>
            <div className="invoice-meta">
              <div><strong>Invoice:</strong> {inv.number}</div>
              <div><strong>Date:</strong> {inv.invoice_date}</div>
              <div><strong>Due:</strong> {inv.due_date}</div>
            </div>
          </div>
          <div className="invoice-parties">
            <div>
              <strong>Billed to:</strong>
              <div>{inv.customers?.name}</div>
              <div>{inv.customers?.email}</div>
            </div>
            <div>
              <strong>Subscription:</strong> {inv.subscriptions?.number || '-'}
            </div>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit price</th>
                <th style={{ textAlign: 'right' }}>Tax</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.description}</td>
                  <td style={{ textAlign: 'right' }}>{l.quantity}</td>
                  <td style={{ textAlign: 'right' }}>${Number(l.unit_price).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>${Number(l.tax_amount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>${Number(l.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="print-totals">
            <div>Untaxed: ${Number(inv.amount_untaxed).toFixed(2)}</div>
            <div>Tax: ${Number(inv.amount_tax).toFixed(2)}</div>
            <div><strong>Total: ${Number(inv.total).toFixed(2)}</strong></div>
            <div>Paid: ${Number(inv.amount_paid).toFixed(2)}</div>
            <div><strong>Balance due: ${outstanding.toFixed(2)}</strong></div>
          </div>
        </div>
      )}

      <PageHeader title={`Invoice ${inv.number}`} subtitle={inv.customers?.name || 'Customer'}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge variant={statusBadgeClass(inv.status)}>{statusLabel(inv.status)}</Badge>
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>Back</Button>
        </div>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <Card>
          <h3 style={{ marginBottom: 12 }}>Details</h3>
          <p><strong>Customer:</strong> {inv.customers?.name}</p>
          <p><strong>Email:</strong> {inv.customers?.email}</p>
          <p><strong>Subscription:</strong> {inv.subscriptions?.number || '-'}</p>
          <p><strong>Status:</strong> {statusLabel(inv.status)}</p>
          <p><strong>Invoice date:</strong> {inv.invoice_date || '-'}</p>
          <p><strong>Due date:</strong> {inv.due_date || '-'}</p>
          <p><strong>Total:</strong> <MoneyText amount={inv.total} /></p>
          <p><strong>Paid:</strong> <MoneyText amount={inv.amount_paid} /></p>
          <p><strong>Outstanding:</strong> <MoneyText amount={outstanding} /></p>
        </Card>
        <Card>
          <h3 style={{ marginBottom: 12 }}>Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inv.status === 'draft' && <Button variant="primary" onClick={() => updateStatus('confirmed')}>Confirm</Button>}
            {inv.status === 'confirmed' && (
              <>
                <Button variant="primary" onClick={sendInvoice}>Send invoice</Button>
                <Button variant="ghost" onClick={printInvoice}>Print</Button>
                <Button variant="danger" onClick={() => updateStatus('cancelled')}>Cancel</Button>
              </>
            )}
            {inv.status === 'paid' && <Button variant="ghost" onClick={printInvoice}>Print receipt</Button>}
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ marginBottom: 12 }}>Lines</h3>
        <DataTable
          columns={[
            { key: 'description', label: 'Description' },
            { key: 'quantity', label: 'Qty' },
            { key: 'unit_price', label: 'Unit price', render: (r) => <MoneyText amount={r.unit_price} /> },
            { key: 'tax_amount', label: 'Tax', render: (r) => <MoneyText amount={r.tax_amount || 0} /> },
            { key: 'amount', label: 'Amount', render: (r) => <MoneyText amount={r.amount} /> },
          ]}
          data={lines}
          loading={loading}
        />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div>Untaxed: <MoneyText amount={inv.amount_untaxed} /></div>
          <div>Tax: <MoneyText amount={inv.amount_tax} /></div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Total: <MoneyText amount={inv.total} /></div>
          <div>Paid: <MoneyText amount={inv.amount_paid} /></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: outstanding > 0 ? 'var(--danger)' : 'var(--text)' }}>
            Outstanding: <MoneyText amount={outstanding} />
          </div>
        </div>
      </Card>
    </div>
  );
}
