// src/features/customers/Customers.jsx
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';

export default function Customers() {
  const [toasts, setToasts] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => { load(); }, []);

  const addToast = (msg, type = 'info') => {
    const n = Date.now();
    setToasts((t) => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n)), 4000);
  };

  async function load() {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) addToast(error.message, 'error');
    else setCustomers(data || []);
  }

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Customers" subtitle="Customer billing records" />
      <Card>
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'company', label: 'Company' },
            { key: 'tax_id', label: 'Tax ID' },
          ]}
          data={customers}
        />
      </Card>
    </div>
  );
}
