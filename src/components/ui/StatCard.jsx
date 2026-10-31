// src/components/ui/StatCard.jsx
export function StatCard({ label, value, delta, deltaType }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {delta && <div className={`delta delta--${deltaType || 'up'}`}>{delta}</div>}
    </div>
  );
}
