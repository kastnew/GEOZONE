import React from 'react';
import { formatVND } from '../../data/mockData';

export default function TripCard({
  trip,
  onView = () => {},
  onDelete = () => {}
}) {
  if (!trip) return null;

  return (
    <article className="tcard" data-id={trip.id}>
      <div className="tcard-head">
        <h3>{trip.name || 'Chuyến đi không tên'}</h3>
        <span className="c-pop">
          {trip.daysCount || (trip.days ? trip.days.length : 1)} ngày
        </span>
      </div>

      <div className="tcard-meta">
        <span>📍 {trip.cityName || trip.city}</span>
        <span>💰 {formatVND(trip.totalCost || 0)}</span>
        {trip.createdAt && (
          <span>
            📅 {new Date(trip.createdAt).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>

      <div className="tcard-actions">
        <button
          type="button"
          className="gz-btn ghost"
          style={{
            borderColor: '#cbd5e1',
            color: '#2563eb',
            padding: '6px 14px',
            fontSize: '13px'
          }}
          onClick={() => onView(trip)}
        >
          👁 Xem chi tiết
        </button>
        <button
          type="button"
          className="gz-btn ghost"
          style={{
            borderColor: '#fecdd3',
            color: '#e11d48',
            padding: '6px 14px',
            fontSize: '13px',
            marginLeft: 'auto'
          }}
          onClick={() => onDelete(trip.id)}
        >
          🗑 Xóa
        </button>
      </div>
    </article>
  );
}
