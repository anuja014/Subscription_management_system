// src/features/auth/Team.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Select } from '../../components/ui';
import { Card } from '../../components/ui';
import { DataTable } from '../../components/ui';
import { Badge } from '../../components/ui';
import { PageHeader } from '../../components/ui';
import { Toast, ToastContainer } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';

export default function Team() {
  const { profile, createStaff, isAdmin } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ email: '', full_name: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    setLoading(true);
    try {
      const { data } = await supabaseQuery('profiles', { select: '*', order: { column: 'created_at', ascending: false } });
      setStaff(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function supabaseQuery(table, opts) {
    let q = supabase.from(table).select(opts.select || '*');
    if (opts.order) q = q.order(opts.order.column, { ascending: opts.order.ascending });
    return q;
  }

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await createStaff({ email: form.email, full_name: form.full_name, password: form.password });
    if (error) addToast(error.message, 'error');
    else {
      addToast('Staff member created', 'success');
      setForm({ email: '', full_name: '', password: '' });
      loadStaff();
    }
    setSubmitting(false);
  };

  if (!isAdmin) return <div style={{ padding: 40, textAlign: 'center' }}>Admin only</div>;

  return (
    <div style={{ padding: 24 }}>
      <ToastContainer />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
      ))}
      <PageHeader title="Team" subtitle="Manage staff accounts" />
      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24 }}>
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ flex: 1 }} />
          <Input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={{ flex: 1 }} />
          <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ flex: 1 }} />
          <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Creating...' : 'Add staff'}</Button>
        </form>
      </Card>
      <Card>
        <DataTable
          columns={[
            { key: 'full_name', label: 'Name', render: (r) => r.full_name || r.email },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role', render: (r) => <Badge variant="info">{r.role}</Badge> },
            { key: 'created_at', label: 'Joined', render: (r) => new Date(r.created_at).toLocaleDateString() },
          ]}
          data={staff}
          loading={loading}
        />
      </Card>
    </div>
  );
}
