// src/components/ui/Card.jsx
export function Card({ children, className, header, footer, style }) {
  return (
    <div className={`card ${className || ''}`} style={style}>
      {header && <div className="card-header">{header}</div>}
      {children}
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
