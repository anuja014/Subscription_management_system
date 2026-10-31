// src/components/ui/Button.jsx
import './../../styles/components.css';

export function Button({ children, variant = 'primary', size = 'md', disabled, onClick, type = 'button', className, ...props }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn--${variant} btn--${size} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
