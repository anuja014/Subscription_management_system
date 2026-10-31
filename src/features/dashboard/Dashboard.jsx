// src/features/dashboard/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, PageHeader, LogoSpinner } from '../../components/ui';
import { supabase } from '../../lib/supabaseClient';
import { money } from '../../lib/format';
import {
  TrendingUp, TrendingDown, AlertTriangle, ArrowRight,
  Activity, CreditCard, Users, FileText,
} from 'lucide-react';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  orange: '#FF9800', orangeL: '#FFA726', orangeD: '#F57C00',
  green: '#2E7D52', greenL: '#43A047', greenS: '#E8F5EC',
  blue: '#246B9E', blueL: '#1E88E5', blueS: '#E8F2FA',
  yellow: '#F59E0B', yellowS: '#FFF8E1',
  red: '#B3261E', redS: '#FCE8E6',
  muted: '#8A8A8A',
};

const STATUS_COLORS = {
  active: C.green, confirmed: C.blue, draft: C.muted,
  quotation: C.yellow, closed: C.red,
};
const METHOD_COLORS = [C.orange, C.green, C.blue, C.yellow, C.red];

// ── Helpers ──────────────────────────────────────────────────────────────────
function pastMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('default', { month: 'short' }),
    });
  }
  return out;
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
const MoneyTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tip">
      <p className="dash-tip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: 0 }}>
          {p.name}: <strong>{money(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

const CountTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tip">
      <p className="dash-tip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: 0 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, gradient }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color, '--kpi-grad': gradient }}>
      <div className="kpi-card-top">
        <span className="kpi-label">{label}</span>
        <div className="kpi-icon-wrap">
          <Icon size={18} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ title, action, onAction }) {
  return (
    <div className="dash-section-title">
      <h3>{title}</h3>
      {action && (
        <button className="dash-see-all" onClick={onAction}>
          {action} <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [subStatus, setSubStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const today = new Date().toISOString().slice(0, 10);
    const sixMonthAgo = (() => {
      const d = new Date(); d.setMonth(d.getMonth() - 5); d.setDate(1);
      return d.toISOString().slice(0, 10);
    })();

    const [sumR, ovdR, pmtR, invR, subR] = await Promise.all([
      supabase.rpc('dashboard_summary', { p_from: null, p_to: null }),
      supabase.from('invoices')
        .select('id, number, due_date, total, amount_paid, customers(name)')
        .eq('status', 'confirmed').lt('due_date', today)
        .order('due_date', { ascending: true }).limit(8),
      supabase.from('payments')
        .select('amount, payment_date, method')
        .gte('payment_date', sixMonthAgo)
        .order('payment_date'),
      supabase.from('invoices')
        .select('issue_date, total, amount_paid, status')
        .gte('issue_date', sixMonthAgo)
        .order('issue_date'),
      supabase.from('subscriptions').select('status'),
    ]);

    if (sumR.data) setSummary(sumR.data);
    setOverdue((ovdR.data || []).filter(r => +r.amount_paid < +r.total));
    setPayments(pmtR.data || []);
    setAllInvoices(invR.data || []);
    const sc = {};
    (subR.data || []).forEach(s => { sc[s.status] = (sc[s.status] || 0) + 1; });
    setSubStatus(Object.entries(sc).map(([name, value]) => ({ name, value })));
    setLoading(false);
  }

  // Derive charts
  const months = useMemo(() => pastMonths(6), []);

  const revenueData = useMemo(() => {
    const map = {};
    months.forEach(m => { map[m.key] = { month: m.label, collected: 0, billed: 0 }; });
    payments.forEach(p => {
      const k = p.payment_date.slice(0, 7);
      if (map[k]) map[k].collected += +p.amount;
    });
    allInvoices.forEach(i => {
      const k = (i.issue_date || '').slice(0, 7);
      if (map[k]) map[k].billed += +i.total;
    });
    return months.map(m => map[m.key]);
  }, [payments, allInvoices, months]);

  const methodData = useMemo(() => {
    const map = {};
    payments.forEach(p => { map[p.method] = (map[p.method] || 0) + +p.amount; });
    return Object.entries(map).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), value,
    }));
  }, [payments]);

  const overdueRows = overdue.filter(r => +r.amount_paid < +r.total);

  // Trend line: cumulative revenue over 6 months
  const trendData = useMemo(() => {
    let cum = 0;
    return revenueData.map(d => { cum += d.collected; return { month: d.month, cumulative: cum }; });
  }, [revenueData]);

  const fmt = money;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <LogoSpinner size="lg" label="Loading dashboard…" />
    </div>
  );

  return (
    <div className="dash-page">

      {/* ── Header ── */}
      <PageHeader
        title="Finance Overview"
        subtitle="Real-time view of revenue, subscriptions and outstanding balances"
      />

      {/* ── KPI row ── */}
      <div className="kpi-grid">
        <KpiCard
          label="Active Subscriptions"
          value={summary?.active_subscriptions ?? 0}
          icon={Users}
          color={C.green}
          gradient="linear-gradient(135deg,#2E7D52,#43A047)"
        />
        <KpiCard
          label="Revenue Collected"
          value={fmt(summary?.revenue_collected)}
          icon={TrendingUp}
          color={C.orange}
          gradient="linear-gradient(135deg,#F57C00,#FF9800)"
        />
        <KpiCard
          label="Outstanding Amount"
          sub="unpaid balance"
          value={fmt(summary?.outstanding_amount)}
          icon={CreditCard}
          color={C.blue}
          gradient="linear-gradient(135deg,#1565C0,#246B9E)"
        />
        <KpiCard
          label="Overdue Invoices"
          value={summary?.overdue_count ?? 0}
          sub={`${fmt(summary?.overdue_amount)} at risk`}
          icon={AlertTriangle}
          color={C.red}
          gradient="linear-gradient(135deg,#8F1D17,#B3261E)"
        />
      </div>

      {/* ── Row 1: Revenue Area + Trend Line ── */}
      <div className="dash-row dash-row-2">
        <Card className="dash-chart-card">
          <SectionTitle title="Revenue Collected vs Billed — 6 months" />
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.orange} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={C.orange} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gBilled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<MoneyTip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke={C.orange} strokeWidth={2.5} fill="url(#gCollected)" dot={{ r: 4, fill: C.orange, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="billed" name="Billed" stroke={C.blue} strokeWidth={2} fill="url(#gBilled)" dot={{ r: 3, fill: C.blue, strokeWidth: 0 }} activeDot={{ r: 5 }} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dash-chart-card">
          <SectionTitle title="Cumulative Revenue Trend" />
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gTrend" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C.orangeD} />
                  <stop offset="100%" stopColor={C.orangeL} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<MoneyTip />} />
              <Line
                type="monotone" dataKey="cumulative" name="Cumulative"
                stroke="url(#gTrend)" strokeWidth={3}
                dot={{ r: 5, fill: C.orange, stroke: 'var(--surface)', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: C.orange }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Row 2: Payments by Method + Subscriptions by Status + Overdue ── */}
      <div className="dash-row dash-row-3">
        {/* Bar chart — payments by method */}
        <Card className="dash-chart-card">
          <SectionTitle title="Revenue by Method" />
          {methodData.length === 0 ? <p className="dash-empty">No payment data</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={methodData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<MoneyTip />} />
                <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]}>
                  {methodData.map((_, i) => (
                    <Cell key={i} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Donut — subscriptions by status */}
        <Card className="dash-chart-card">
          <SectionTitle title="Subscriptions by Status" action="View all" onAction={() => navigate('/subscriptions')} />
          {subStatus.length === 0 ? <p className="dash-empty">No data</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={subStatus} cx="50%" cy="45%"
                  innerRadius={60} outerRadius={88}
                  paddingAngle={4} dataKey="value" nameKey="name"
                  strokeWidth={0}
                >
                  {subStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || C.muted} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n.charAt(0).toUpperCase() + n.slice(1)]} />
                <Legend
                  formatter={v => v.charAt(0).toUpperCase() + v.slice(1)}
                  iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Overdue invoices list */}
        <Card className="dash-chart-card">
          <SectionTitle title="Overdue Invoices" action="View all" onAction={() => navigate('/invoices')} />
          {overdueRows.length === 0 ? (
            <div className="dash-all-clear">
              <div className="dash-all-clear-icon">✓</div>
              <p>No overdue invoices</p>
            </div>
          ) : (
            <div className="dash-overdue-list">
              {overdueRows.map(inv => {
                const bal = +inv.total - +inv.amount_paid;
                const days = Math.floor((Date.now() - new Date(inv.due_date)) / 86400000);
                return (
                  <div key={inv.id} className="dash-overdue-row" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <div className="dash-overdue-left">
                      <span className="dash-overdue-num">{inv.number}</span>
                      <span className="dash-overdue-cust">{inv.customers?.name || '—'}</span>
                    </div>
                    <div className="dash-overdue-right">
                      <span className="dash-overdue-bal">{fmt(bal)}</span>
                      <span className="dash-overdue-days">{days}d late</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
