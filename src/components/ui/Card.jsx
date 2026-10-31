// src/components/ui/Card.jsx
export function Card({ children, className, header, footer }) {
  return (
    <div className={`card ${className || ''}`}>
      {header && <div className="card-header">{header}</div>}
      {children}
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
