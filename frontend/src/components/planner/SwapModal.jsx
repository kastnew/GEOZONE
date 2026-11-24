import React, { useState, useEffect } from 'react';
import { formatVND, formatDuration, TAGS } from '../../data/mockData';
import { X } from 'lucide-react';

export default function SwapModal({
  isOpen = false,
  onClose = () => {},
  currentPlace = null,
  dayNumber = 1,
  availableAlternatives = [],
  onConfirmSwap = () => {},
  isLoading = false
}) {
  const [selectedAlternative, setSelectedAlternative] = useState(null);

  if (!isOpen || !currentPlace) return null;

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
        open
        style={{
          position: 'relative',
          margin: 0,
          width: 'min(560px, calc(100vw - 32px))',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: 0,
          background: '#fff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div className="dhead" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            ⇄ Đổi địa điểm (Ngày {dayNumber})
          </h3>
          <button
            type="button"
            style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ background: 'var(--gz-color-surface-subtle)', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', borderLeft: '4px solid var(--gz-color-primary)' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Địa điểm hiện tại:</span>
            <strong style={{ fontSize: '15px', color: '#0f172a' }}>{currentPlace.name}</strong>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              {currentPlace.zoneName} · {formatVND(currentPlace.estimatedCost ?? currentPlace.cost ?? 0)}
            </div>
          </div>

          <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#334155' }}>
            Gợi ý địa điểm thay thế cùng phân vùng:
          </h4>

          {availableAlternatives.length > 0 ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              {availableAlternatives.map((alt) => {
                const isSelected = selectedAlternative && selectedAlternative.id === alt.id;
                return (
                  <div
                    key={alt.id}
                    onClick={() => setSelectedAlternative(alt)}
                    style={{
                      border: `1.5px solid ${isSelected ? 'var(--gz-color-primary)' : 'var(--gz-color-line)'}`,
                      background: isSelected ? 'var(--gz-color-primary-soft)' : 'var(--gz-color-surface)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all .15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{alt.name}</strong>
                      <span style={{ fontSize: '12.5px', color: 'var(--gz-color-primary)', fontWeight: 600 }}>
                        {formatVND(alt.estimatedCost ?? alt.cost ?? 0)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {alt.zoneName} · {formatDuration(alt.duration || 60)} · ★ {(alt.popularity ? Math.round(alt.popularity * 100) / 10 : 8.0)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '13.5px', textAlign: 'center', padding: '24px 0' }}>
              Không có địa điểm thay thế nào khác trong khu vực này.
            </p>
          )}
        </div>

        <div className="dfoot" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="gz-btn ghost"
            style={{ borderColor: '#cbd5e1', color: '#475569' }}
            onClick={onClose}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            className="gz-btn"
            disabled={!selectedAlternative || isLoading}
            onClick={() => onConfirmSwap(selectedAlternative)}
          >
            {isLoading ? 'Đang cập nhật…' : 'Xác nhận đổi địa điểm'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
