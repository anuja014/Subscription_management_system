// src/components/ui/EmptyState.jsx
export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="empty-state">
      <h3>{title || 'No records found'}</h3>
      {subtitle && <p className="text-muted">{subtitle}</p>}
      {action && <Button variant="primary" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
