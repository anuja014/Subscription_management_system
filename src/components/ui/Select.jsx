// src/components/ui/Select.jsx
export function Select({ id, label, value, onChange, options, placeholder, required, error, hint, className }) {
  return (
    <div className={`input-group ${className || ''}`}>
      {label && <label htmlFor={id} className="form-field-label">{label}</label>}
      <select
        id={id}
        className="input-field select-field"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="error">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}
