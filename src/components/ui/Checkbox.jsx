// src/components/ui/Checkbox.jsx
export function Checkbox({ id, label, value, onChange, error, hint, className }) {
  return (
    <label className={`checkbox-field ${className || ''}`}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} id={id} />
      <span>{label}</span>
      {error && <span className="error" style={{ marginLeft: 'auto' }}>{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </label>
  );
}
