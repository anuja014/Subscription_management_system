// src/components/ui/FilterBar.jsx
export function FilterBar({ filters, onChange }) {
  return (
    <div className="filter-bar">
      {filters.map((f) => (
        <div key={f.key} className="input-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="form-field-label">{f.label}</label>
          <select
            className="input-field select-field"
            value={f.value ?? ''}
            onChange={(e) => onChange(f.key, e.target.value)}
          >
            <option value="">All</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
