import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

export default function Toast({
  message = '',
  type = 'info',
  action = null,
  isVisible = false,
  onDismiss = () => {}
}) {
  const Icon = ICONS[type] || ICONS.info;

  return (
    <div
      className={`gz-toast gz-toast-${type} ${isVisible ? 'show' : ''}`}
      id="gzToast"
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
      <span>{message}</span>
      {action && (
        <button
          type="button"
          className="gz-toast-action"
          onClick={() => {
            action.onClick?.();
            onDismiss();
          }}
        >
          {action.label}
        </button>
      )}
      <button type="button" className="gz-toast-close" aria-label="Đóng thông báo" onClick={onDismiss}>
        <X size={15} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
