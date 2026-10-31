// src/components/ui/Toast.jsx
import { useEffect } from 'react';

export function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      {message}
      {onClose && <button className="btn--ghost btn--sm" onClick={onClose} style={{ marginLeft: 'auto', padding: 2 }}>✕</button>}
    </div>
  );
}

export function ToastContainer() {
  return <div className="toast-container" />;
}
