import React from 'react';
import '../../styles/Trips.css';
import { formatVND, formatDuration } from '../../data/mockData';
import { Copy, Trash2, X } from 'lucide-react';

export default function TripCartModal({
  isOpen = false,
  onClose = () => {},
  cartItems = [],
  onRemoveItem = () => {},
  onSaveTrip = () => {},
  onCopyTrip = () => {},
  onClearTrip = () => {}
}) {
  if (!isOpen) return null;

  const totalCost = cartItems.reduce((acc, p) => acc + (p.estimatedCost || p.cost || 0), 0);
  const totalDuration = cartItems.reduce((acc, p) => acc + (p.duration || 60), 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 4000,
        display: 'grid',
        placeItems: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <dialog
        id="tripDlg"
        open
        style={{ position: 'relative', margin: 0 }}
      >
        <div className="dhead">
          <h2 id="tripTitle">Lịch trình đã chọn ({cartItems.length})</h2>
          <button
            type="button"
            id="tripClose"
            aria-label="Đóng"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {cartItems.length > 0 ? (
          <ol
            id="tripList"
            style={{
              maxHeight: '50vh',
              overflowY: 'auto',
              padding: '16px 20px 16px 40px',
              margin: 0,
              display: 'grid',
              gap: '12px'
            }}
          >
            {cartItems.map((item, idx) => (
              <li key={item.id || idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatVND(item.estimatedCost || item.cost || 0)} · {formatDuration(item.duration || 60)}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      border: '0',
                      background: 'transparent',
                      color: '#e11d48',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onClick={() => onRemoveItem(item.id)}
                  >
                    Bỏ chọn
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p id="tripEmpty" className="empty" style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b' }}>
            Chưa có địa điểm nào được chọn. Hãy bấm <b>“+ Thêm”</b> trên các thẻ địa điểm ở chế độ Khám phá.
          </p>
        )}

        {cartItems.length > 0 && (
          <div className="totals" id="tripTotals">
            <span>
              Tổng thời gian: <b>{formatDuration(totalDuration)}</b>
            </span>
            <span>
              Tổng chi phí vé: <b>{formatVND(totalCost)}</b>
            </span>
          </div>
        )}

        <div className="dfoot">
          <button
            type="button"
            id="tripClear"
            className="ghost"
            style={{ marginRight: 'auto', color: '#e11d48' }}
            onClick={onClearTrip}
            disabled={cartItems.length === 0}
          >
            <><Trash2 size={14} strokeWidth={1.75} aria-hidden="true" /> Xóa tất cả</>
          </button>
          <button
            type="button"
            id="tripCopy"
            className="ghost"
            onClick={onCopyTrip}
            disabled={cartItems.length === 0}
          >
            <><Copy size={14} strokeWidth={1.75} aria-hidden="true" /> Sao chép</>
          </button>
          <button
            type="button"
            id="tripSave"
            className="gz-btn"
            onClick={onSaveTrip}
            disabled={cartItems.length === 0}
          >
            Lưu vào Chuyến đi
          </button>
        </div>
      </dialog>
    </div>
  );
}
