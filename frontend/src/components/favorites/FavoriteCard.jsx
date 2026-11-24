import React from 'react';
import { MapPin } from 'lucide-react';
import { formatVND, TAGS, CITIES } from '../../data/mockData';

export default function FavoriteCard({
  place,
  onView = () => {},
  onRemove = () => {}
}) {
  if (!place) return null;
  const cityConfig = CITIES[place.city] || {};
  const accentColor = 'var(--gz-color-primary)';

  return (
    <article
      className="fcard"
      data-id={place.id}
      style={{ '--fc': accentColor }}
    >
      <div className="fc-top">
        <div>
          <h3 className="fc-name">{place.name}</h3>
          <span className="fc-city">
            {cityConfig.name || place.city} · {place.zoneName}
          </span>
        </div>
        <span className="c-pop">
          {formatVND(place.estimatedCost ?? place.cost ?? 0)}
        </span>
      </div>

      {place.tags && (
        <div className="fc-tags">
          {place.tags.map((t) => (
            <span key={t} className="tag">
              {TAGS[t] || t}
            </span>
          ))}
        </div>
      )}

      {place.address && <p className="addr">{place.address}</p>}

      <div className="fc-act">
        <button
          type="button"
          className="gz-btn ghost"
          style={{
            borderColor: 'var(--gz-color-line-strong)',
            color: 'var(--gz-color-primary-pressed)',
            padding: '5px 12px',
            fontSize: '12.5px'
          }}
          onClick={() => onView(place)}
        >
          <MapPin size={14} strokeWidth={1.75} aria-hidden="true" /> Xem trên bản đồ
        </button>
        <button
          type="button"
          className="del"
          onClick={() => onRemove(place.id)}
        >
          Xóa
        </button>
      </div>
    </article>
  );
}
