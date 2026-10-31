// src/features/dashboard/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, StatCard, Badge, PageHeader, LogoSpinner } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { money, statusBadgeClass, dateShort } from '../../lib/format';
import { AlertTriangle, ArrowRight } from 'lucide-react';

// ── Brand palette ────────────────────────────────────────────────────────────
const BRAND = '#FF9800';
const SUCCESS = '#2E7D52';
const INFO = '#246B9E';
const WARNING = '#9A6100';
const DANGER = '#B3261E';
const MUTED = '#8A8A8A';

const SUB_STATUS_COLORS = {
  active: SUCCESS,
  confirmed: INFO,
  draft: MUTED,
  quotation: WARNING,
  closed: DANGER,
};

const METHOD_COLORS = ['#FF9800', '#2E7D52', '#246B9E', '#9A6100', '#B3261E'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function pastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    months.push({ key, label });
  }
  return months;
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {money(p.value)}
        </div>
      ))}
    </div>
  );
}

function CountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subsByStatus, setSubsByStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const sixMonthsAgo = new Date(
      new Date().setMonth(new Date().getMonth() - 5)
    ).toISOString().slice(0, 10).slice(0, 7) + '-01';

    const [sumRes, ovdRes, pmtRes, subRes] = await Promise.all([
      // Summary KPIs
      supabase.rpc('dashboard_summary', { p_from: null, p_to: null }),
      // Overdue invoices: confirmed, past due, still has balance
      supabase
        .from('invoices')
        .select('id, number, due_date, total, amount_paid, customers(name)')
        .eq('status', 'confirmed')
        .lt('due_date', today)
        .filter('amount_paid', 'lt', 'total')
        .order('due_date', { ascending: true })
        .limit(15),
      // Payments for last 6 months (revenue by month + method breakdown)
      supabase
        .from('payments')
        .select('amount, payment_date, method')
        .gte('payment_date', sixMonthsAgo)
        .order('payment_date', { ascending: true }),
      // Subscriptions by status
      supabase
        .from('subscriptions')
        .select('status'),
    ]);

    if (sumRes.error) { setError(sumRes.error.message); setLoading(false); return; }
    setSummary(sumRes.data);

    // Overdue — filter client-side to be safe (RLS may return nulls for amount_paid < total)
    const ovdRaw = ovdRes.data || [];
    setOverdue(ovdRaw.filter(row => Number(row.amount_paid) < Number(row.total)));

    // Payments
    setPayments(pmtRes.data || []);

    // Subscriptions by status
    const statusCount = {};
    (subRes.data || []).forEach(s => {
      statusCount[s.status] = (statusCount[s.status] || 0) + 1;
    });
    setSubsByStatus(
      Object.entries(statusCount).map(([name, value]) => ({ name, value }))
    );

    setLoading(false);
  }

  // ── Chart derivations ────────────────────────────────────────────────────
  const revenueByMonth = useMemo(() => {
    const months = pastNMonths(6);
    const map = {};
    months.forEach(m => { map[m.key] = { month: m.label, revenue: 0 }; });
    payments.forEach(p => {
      const k = monthKey(p.payment_date);
      if (map[k]) map[k].revenue += Number(p.amount);
    });
    return months.map(m => map[m.key]);
  }, [payments]);

  const paymentsByMethod = useMemo(() => {
    const map = {};
    payments.forEach(p => {
      map[p.method] = (map[p.method] || 0) + Number(p.amount);
    });
    return Object.entries(map).map(([method, total]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: total,
    }));
  }, [payments]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <LogoSpinner size="lg" label="Loading dashboard…" />
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, color: 'var(--danger)' }}>
      ⚠ {error}
    </div>
  );

  const fmt = (v) => money(v);

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Finance dashboard"
        subtitle="Active subscriptions, revenue, outstanding and overdue"
      />

      {/* ── KPI row ── */}
      <div className="dash-kpi-grid">
        <StatCard label="Active subscriptions" value={summary?.active_subscriptions ?? 0} />
        <StatCard label="Revenue collected" value={fmt(summary?.revenue_collected)} />
        <StatCard label="Outstanding amount" value={fmt(summary?.outstanding_amount)} delta="unpaid" deltaType="down" />
        <StatCard label="Overdue invoices" value={summary?.overdue_count ?? 0} delta={fmt(summary?.overdue_amount)} deltaType="down" />
      </div>

      {/* ── Revenue chart + Overdue list row ── */}
      <div className="dash-main-grid">

        {/* Revenue by month area chart */}
        <Card className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Revenue collected — last 6 months</h3>
          </div>
          {revenueByMonth.every(d => d.revenue === 0) ? (
            <div className="dash-empty">No payment data for the period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<MoneyTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={BRAND} strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: BRAND }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Overdue invoices list */}
        <Card className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <AlertTriangle size={15} style={{ color: 'var(--danger)', marginRight: 6, flexShrink: 0 }} />
              Overdue invoices
            </h3>
            <button className="dash-link-btn" onClick={() => navigate('/invoices')}>
              View all <ArrowRight size={12} />
            </button>
          </div>

          {overdue.length === 0 ? (
            <div className="dash-empty" style={{ color: 'var(--success)' }}>
              ✓ No overdue invoices
            </div>
          ) : (
            <div className="dash-overdue-list">
              {overdue.map(inv => {
                const outstanding = Number(inv.total) - Number(inv.amount_paid);
                const daysOverdue = Math.floor(
                  (Date.now() - new Date(inv.due_date).getTime()) / 86400000
                );
                return (
                  <div
                    key={inv.id}
                    className="dash-overdue-row"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <div className="dash-overdue-left">
                      <span className="dash-overdue-number mono">{inv.number}</span>
                      <span className="dash-overdue-customer">{inv.customers?.name || '—'}</span>
                    </div>
                    <div className="dash-overdue-right">
                      <span className="dash-overdue-amount">{fmt(outstanding)}</span>
                      <Badge variant="danger" style={{ fontSize: 10 }}>
                        {daysOverdue}d overdue
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Charts row ── */}
      <div className="dash-charts-grid">

        {/* Payments by method bar chart */}
        <Card className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Revenue by payment method</h3>
          </div>
          {paymentsByMethod.length === 0 ? (
            <div className="dash-empty">No payment data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentsByMethod} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="value" name="Collected" radius={[4, 4, 0, 0]}>
                  {paymentsByMethod.map((_, i) => (
                    <Cell key={i} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Subscriptions by status pie */}
        <Card className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Subscriptions by status</h3>
          </div>
          {subsByStatus.length === 0 ? (
            <div className="dash-empty">No subscription data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={subsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {subsByStatus.map((entry, i) => (
                    <Cell key={i} fill={SUB_STATUS_COLORS[entry.name] || MUTED} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Legend
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Recent payments feed */}
        <Card className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Recent payments</h3>
            <button className="dash-link-btn" onClick={() => navigate('/payments')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          {payments.length === 0 ? (
            <div className="dash-empty">No recent payments</div>
          ) : (
            <div className="dash-activity-list">
              {payments.slice(0, 8).map((p, i) => (
                <div key={i} className="dash-activity-row">
                  <div className="dash-activity-dot" style={{ background: METHOD_COLORS[['card', 'bank transfer', 'upi', 'cash', 'cheque'].indexOf(p.method)] || BRAND }} />
                  <div className="dash-activity-info">
                    <span className="dash-activity-method">{p.method}</span>
                    <span className="dash-activity-date">{dateShort(p.payment_date)}</span>
                  </div>
                  <span className="dash-activity-amount">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
