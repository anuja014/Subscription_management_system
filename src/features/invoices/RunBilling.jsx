// src/features/invoices/RunBilling.jsx
import { useState } from 'react';
import { Button } from '../../components/ui';
import { Card } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';

export default function RunBilling() {
  const [toasts, setToasts] = useState([]);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const addToast = (msg, type = 'info') => {
    const n = Date.now();
    setToasts((t) => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n)), 4000);
  };

  const runBilling = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.rpc('run_billing', { p_run_date: new Date().toISOString().slice(0, 10) });
      if (error) throw error;
      setResult(data);
      addToast(`Billing run complete: ${data.created} created, ${data.skipped} skipped`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Run billing" subtitle="Generate invoices for all active subscriptions due today" />
      <Card>
        <p style={{ marginBottom: 16 }}>
          This creates a draft invoice for every active subscription whose next billing date is today or earlier.
          It is idempotent — running twice will not create duplicate invoices.
        </p>
        <Button variant="primary" onClick={runBilling} disabled={running}>
          {running ? 'Running billing...' : 'Run billing now'}
        </Button>
      </Card>
      {result && (
        <Card style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Result</h3>
          <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
            <div><div style={{ fontSize: 12, color: '#8A97A8' }}>Created</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{result.created}</div></div>
            <div><div style={{ fontSize: 12, color: '#8A97A8' }}>Skipped</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{result.skipped}</div></div>
            <div><div style={{ fontSize: 12, color: '#8A97A8' }}>Errors</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#F26D6D' }}>{result.errors || 0}</div></div>
          </div>
        </Card>
      )}
    </div>
  );
}
