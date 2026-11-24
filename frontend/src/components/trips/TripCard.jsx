import React from 'react';
import { CalendarDays, Eye, MapPin, Trash2, Wallet } from 'lucide-react';
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
        <span><MapPin size={14} strokeWidth={1.75} aria-hidden="true" /> {trip.cityName || trip.city}</span>
        <span><Wallet size={14} strokeWidth={1.75} aria-hidden="true" /> {formatVND(trip.totalCost || 0)}</span>
        {trip.createdAt && (
          <span>
            <CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />
            {new Date(trip.createdAt).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>

      <div className="tcard-actions">
        <button
          type="button"
          className="gz-btn ghost trip-card-view"
          onClick={() => onView(trip)}
        >
          <Eye size={14} strokeWidth={1.75} aria-hidden="true" /> Xem chi tiết
        </button>
        <button
          type="button"
          className="gz-btn ghost trip-card-delete"
          onClick={() => onDelete(trip.id)}
        >
          <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" /> Xóa
        </button>
      </div>
    </article>
  );
}
