// src/components/ui/Badge.jsx
export function Badge({ children, variant = 'info', className }) {
  return (
    <span className={`badge badge--${variant} ${className || ''}`}>{children}</span>
  );
}
