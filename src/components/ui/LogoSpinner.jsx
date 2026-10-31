// src/components/ui/LogoSpinner.jsx
import logoImg from '../../logo/amber_fly.png';
import '../../styles/LogoSpinner.css';

const sizes = {
  sm: { ring: 48, logo: 28, label: 12 },
  md: { ring: 72, logo: 42, label: 13 },
  lg: { ring: 96, logo: 56, label: 14 },
};

export function LogoSpinner({ size = 'md', label = 'Loading…' }) {
  const s = sizes[size] || sizes.md;

  return (
    <div className="logo-spinner-wrap" role="status" aria-label={label}>
      <div
        className="logo-spinner-ring"
        style={{ width: s.ring, height: s.ring }}
      >
        <img
          src={logoImg}
          alt="Loading"
          className="logo-spinner-img"
          style={{ width: s.logo, height: Math.round(s.logo * 0.68) }}
        />
      </div>
      {label && (
        <span className="logo-spinner-label" style={{ fontSize: s.label }}>
          {label}
        </span>
      )}
    </div>
  );
}
