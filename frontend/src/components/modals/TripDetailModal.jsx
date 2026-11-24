import React from 'react';
import '../../styles/Trips.css';
import { formatVND, formatDuration } from '../../data/mockData';
import { CalendarDays, Copy, MapPin, X } from 'lucide-react';

export default function TripDetailModal({
  isOpen = false,
  onClose = () => {},
  trip = null,
  onCopyShareLink = () => {},
  onDeleteTrip = () => {}
}) {
  if (!isOpen || !trip) return null;

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
        id="tripView"
        open
        style={{ position: 'relative', margin: 0, width: 'min(640px, calc(100vw - 32px))' }}
      >
        <div className="dhead">
          <h2 id="tvName">{trip.name || 'Chi tiết chuyến đi'}</h2>
          <button
            type="button"
            id="tvClose"
            aria-label="Đóng"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div id="tvBody">
          <div
            id="tvMeta"
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '13.5px',
              color: '#64748b',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            <span><MapPin size={14} strokeWidth={1.75} aria-hidden="true" /> Điểm đến: <b>{trip.cityName || trip.city}</b></span>
            <span><CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" /> Số ngày: <b>{trip.daysCount || (trip.days ? trip.days.length : 1)} ngày</b></span>
            <span> Tổng vé: <b>{formatVND(trip.totalCost || 0)}</b></span>
          </div>

          <div id="tvDays" style={{ display: 'grid', gap: '16px' }}>
            {trip.days && trip.days.length > 0 ? (
              trip.days.map((d, dIdx) => (
                <div
                  key={dIdx}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    borderLeft: '4px solid var(--gz-color-primary)'
                  }}
                >
                  <h4 style={{ margin: '0 0 10px', fontSize: '15px', color: '#0f172a' }}>
                    Ngày {d.dayNumber || dIdx + 1}: {d.title || `Khám phá ${trip.cityName || ''}`}
                  </h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {(d.places || []).map((p, pIdx) => (
                      <div
                        key={p.id || pIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          borderTop: '1px solid #e2e8f0',
                          paddingTop: '6px'
                        }}
                      >
                        <span>
                          <b>{pIdx + 1}. {p.name}</b>
                          {p.time && <small style={{ color: '#64748b', marginLeft: '6px' }}>({p.time})</small>}
                        </span>
                        <span>{formatVND(p.cost || p.estimatedCost || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Lịch trình này không có dữ liệu ngày chi tiết.
              </p>
            )}
          </div>
        </div>

        <div className="dfoot">
          <button
            type="button"
            id="tvDel"
            className="gz-btn ghost"
            style={{
              borderColor: '#fecdd3',
              color: '#e11d48',
              marginRight: 'auto'
            }}
            onClick={() => {
              onDeleteTrip(trip.id);
              onClose();
            }}
          >
            Xóa chuyến đi
          </button>
          <button
            type="button"
            id="tvCopy"
            className="gz-btn ghost"
            style={{ borderColor: 'var(--gz-color-line-strong)', color: 'var(--gz-color-primary)' }}
            onClick={() => onCopyShareLink(trip)}
          >
            <Copy size={15} strokeWidth={1.75} aria-hidden="true" /> Sao chép liên kết chia sẻ
          </button>
          <button type="button" className="gz-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </dialog>
    </div>
  );
}
