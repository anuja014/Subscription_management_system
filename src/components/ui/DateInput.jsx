// src/components/ui/DateInput.jsx
export function DateInput({ id, label, value, onChange, error, hint, className }) {
  return (
    <div className={`input-group ${className || ''}`}>
      {label && <label htmlFor={id} className="form-field-label">{label}</label>}
      <input
        id={id}
        type="date"
        className="input-field date-field"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="error">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}
