// src/components/ui/Input.jsx
export function Input({ id, label, type = 'text', value, onChange, placeholder, required, error, hint, className }) {
  return (
    <div className={`input-group ${className || ''}`}>
      {label && <label htmlFor={id} className="form-field-label">{label}</label>}
      <input
        id={id}
        type={type}
        className={`input-field ${error ? '' : ''}`}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      {error && <span className="error">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}
