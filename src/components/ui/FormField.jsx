// src/components/ui/FormField.jsx
export function FormField({ label, error, hint, children, className }) {
  return (
    <div className={`form-field ${className || ''}`}>
      {label && <label className="form-field-label">{label}</label>}
      {children}
      {error && <span className="error">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}
