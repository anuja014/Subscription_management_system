// src/components/ui/ConfirmDialog.jsx
export function ConfirmDialog({ isOpen, onConfirm, onCancel, title = 'Confirm action', message = 'Are you sure?', confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop open">
      <div className="modal confirm-dialog" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <p>{message}</p>
        <div className="btn-group">
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
