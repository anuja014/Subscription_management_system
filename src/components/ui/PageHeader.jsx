// src/components/ui/PageHeader.jsx
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header row--between">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      <div className="page-actions">{actions}</div>
    </div>
  );
}
