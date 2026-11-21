import React from 'react';
import { formatVND, TAGS } from '../../data/mockData';

export default function PlaceCard({
  place,
  isSelected = false,
  isInCart = false,
  isFavorite = false,
  isAdmin = false,
  onSelect = () => {},
  onToggleCart = () => {},
  onToggleFavorite = () => {},
  onEdit = () => {}
}) {
  if (!place) return null;

  // Check if place is currently open
  const checkIsOpen = () => {
    if (!place.openingTime || !place.closingTime) return true;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = place.openingTime.split(':').map(Number);
    const [closeH, closeM] = place.closingTime.split(':').map(Number);
    const openMins = openH * 60 + openM;
    const closeMins = closeH * 60 + closeM;
    return currentMins >= openMins && currentMins <= closeMins;
  };

  const isOpen = checkIsOpen();
  const score = place.popularity ? Math.round(place.popularity * 10 * 10) / 10 : 8.0;

  return (
    <article
      className={`c-card ${isSelected ? 'sel' : ''}`}
      data-id={place.id}
      onClick={() => onSelect(place)}
    >
      <div className="c-head">
        <h3 className="c-name">{place.name}</h3>
        <span className="c-pop">★ {score}</span>
      </div>

      <div className="c-sub">
        <span>{place.zoneName}</span> ·{' '}
        <span style={{ color: isOpen ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
          {isOpen ? 'Đang mở cửa' : 'Đã đóng'}
        </span>
        <span> · {formatVND(place.estimatedCost ?? place.cost ?? 0)}</span>
      </div>

      <div className="c-tags">
        {(place.tags || []).map((t) => (
          <span key={t} className="tag">
            {TAGS[t] || t}
          </span>
        ))}
      </div>

      {place.address && <p className="addr">{place.address}</p>}

      <div className="cact" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="add"
          onClick={() => onToggleCart(place)}
        >
          {isInCart ? '✓ Đã thêm' : '+ Thêm vào lịch trình'}
        </button>

        <button
          type="button"
          className="fav-b"
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(place)}
          title={isFavorite ? 'Bỏ thích' : 'Yêu thích'}
        >
          {isFavorite ? '♥ Đã thích' : '♡'}
        </button>

        {isAdmin && (
          <button
            type="button"
            className="adm-b"
            onClick={() => onEdit(place)}
          >
            ✏ Sửa
          </button>
        )}
      </div>
    </article>
  );
}
