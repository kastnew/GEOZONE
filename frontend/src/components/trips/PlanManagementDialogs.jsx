import React, { useEffect, useState } from 'react';
import { Check, Copy, Link2, Pencil, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import '../../styles/Trips.css';

function DialogFrame({ title, icon: Icon, onClose, children }) {
  return (
    <div
      className="gz-plan-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="gz-plan-modal gz-plan-management-dialog" role="dialog" aria-modal="true" aria-labelledby="gz-plan-dialog-title">
        <button className="gz-plan-modal-close" type="button" onClick={onClose} aria-label="Đóng">
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <div className="gz-plan-modal-heading">
          <span className="gz-plan-modal-icon"><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
          <div>
            <h2 id="gz-plan-dialog-title">{title}</h2>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}

export function RenamePlanDialog({ trip, onClose, onSave }) {
  const [title, setTitle] = useState(trip?.title || trip?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(trip?.title || trip?.name || '');
  }, [trip]);

  if (!trip) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await onSave(trip.id, title.trim());
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Không thể đổi tên chuyến đi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogFrame title="Đổi tên chuyến đi" icon={Pencil} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="gz-plan-field">
          <span>Tên mới</span>
          <input
            type="text"
            autoFocus
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        {error && <p className="gz-plan-modal-error" role="alert">{error}</p>}
        <div className="gz-plan-modal-actions">
          <button type="button" className="gz-btn ghost" onClick={onClose} disabled={isSaving}>Hủy</button>
          <button type="submit" className="gz-btn" disabled={isSaving || !title.trim()}>
            {isSaving ? 'Đang cập nhật…' : 'Lưu tên mới'}
          </button>
        </div>
      </form>
    </DialogFrame>
  );
}

export function SharePlanDialog({ trip, onClose, onToggle }) {
  const [isPublic, setIsPublic] = useState(Boolean(trip?.isPublic));
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const shareUrl = trip?.shareToken
    ? `${window.location.origin}/share/${encodeURIComponent(trip.shareToken)}`
    : '';

  useEffect(() => {
    setIsPublic(Boolean(trip?.isPublic));
    setError('');
  }, [trip]);

  useEffect(() => {
    if (!isCopied) return undefined;
    const timerId = window.setTimeout(() => setIsCopied(false), 2000);
    return () => window.clearTimeout(timerId);
  }, [isCopied]);

  if (!trip) return null;

  const handleToggle = async (event) => {
    const nextIsPublic = event.target.checked;
    setIsSaving(true);
    setError('');
    try {
      const updated = await onToggle(trip.id, nextIsPublic);
      setIsPublic(Boolean(updated?.isPublic ?? nextIsPublic));
      showToast(nextIsPublic ? 'Đã bật chia sẻ công khai.' : 'Đã tắt chia sẻ công khai.', 'success');
    } catch (toggleError) {
      setError(toggleError.message || 'Không thể cập nhật quyền chia sẻ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      if (!shareUrl || !navigator.clipboard?.writeText) throw new Error('Trình duyệt không hỗ trợ sao chép liên kết.');
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      showToast('Đã sao chép liên kết chia sẻ!', 'success');
    } catch (copyError) {
      showToast(copyError.message || 'Không thể sao chép liên kết.', 'error');
    }
  };

  return (
    <DialogFrame title="Chia sẻ chuyến đi" icon={Link2} onClose={onClose}>
      <p className="gz-plan-dialog-description">
        Chỉ người có liên kết mới xem được lịch trình công khai này.
      </p>
      <label className="gz-plan-share-toggle">
        <span>
          <strong>{isPublic ? 'Đang công khai' : 'Đang riêng tư'}</strong>
          <small>{isPublic ? 'Liên kết hiện có thể truy cập.' : 'Chỉ bạn xem được lịch trình.'}</small>
        </span>
        <input type="checkbox" checked={isPublic} onChange={handleToggle} disabled={isSaving} />
        <span className="gz-plan-switch" aria-hidden="true" />
      </label>
      {isPublic && shareUrl && (
        <div className="gz-plan-share-link">
          <span title={shareUrl}>{shareUrl}</span>
          <button type="button" className="gz-btn ghost" onClick={handleCopy}>
            {isCopied ? <Check size={16} strokeWidth={1.75} /> : <Copy size={16} strokeWidth={1.75} />}
            {isCopied ? 'Đã sao chép' : 'Sao chép link'}
          </button>
        </div>
      )}
      {isPublic && !shareUrl && (
        <p className="gz-plan-modal-error" role="alert">Máy chủ chưa trả về liên kết chia sẻ. Hãy tải lại chuyến đi.</p>
      )}
      {error && <p className="gz-plan-modal-error" role="alert">{error}</p>}
      <div className="gz-plan-modal-actions">
        <button type="button" className="gz-btn" onClick={onClose}>Đóng</button>
      </div>
    </DialogFrame>
  );
}
