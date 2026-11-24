import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function AdminConfirmModal({
  title,
  message,
  confirmLabel = 'Xác nhận',
  isBusy = false,
  onCancel,
  onConfirm
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBusy, onCancel]);

  return (
    <div className="gz-admin-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isBusy) onCancel();
    }}>
      <section
        className="gz-admin-modal gz-admin-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gz-admin-confirm-title"
      >
        <button className="gz-admin-modal-close" type="button" onClick={onCancel} disabled={isBusy} aria-label="Đóng">
          <X size={18} strokeWidth={1.75} />
        </button>
        <span className="gz-admin-confirm-icon">
          <AlertTriangle size={21} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 id="gz-admin-confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="gz-admin-modal-actions">
          <button ref={cancelRef} className="gz-admin-button gz-admin-button-secondary" type="button" onClick={onCancel} disabled={isBusy}>
            Hủy
          </button>
          <button className="gz-admin-button gz-admin-button-primary" type="button" onClick={onConfirm} disabled={isBusy}>
            {isBusy ? 'Đang xử lý…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
