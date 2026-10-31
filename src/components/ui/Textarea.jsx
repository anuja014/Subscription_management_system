// src/components/ui/Textarea.jsx
export function Textarea({ id, label, value, onChange, placeholder, rows = 4, error, hint, className }) {
  return (
    <div className={`input-group ${className || ''}`}>
      {label && <label htmlFor={id} className="form-field-label">{label}</label>}
      <textarea
        id={id}
        className="input-field"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
      {error && <span className="error">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}
