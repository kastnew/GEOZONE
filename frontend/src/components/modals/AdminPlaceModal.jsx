import React, { useState, useEffect } from 'react';
import '../../styles/AdminModal.css';
import { TAGS } from '../../data/mockData';
import { X } from 'lucide-react';

export default function AdminPlaceModal({
  isOpen = false,
  onClose = () => {},
  place = null,
  isNew = false,
  zones = [],
  onSave = () => {},
  onRevert = () => {},
  onDelete = () => {},
  errorMsg = ''
}) {
  const [formState, setFormState] = useState({
    name: '',
    address: '',
    score: 8.0,
    cost: 0,
    duration: 60,
    zoneCode: '',
    open: '08:00',
    close: '17:00',
    lat: 16.4637,
    lng: 107.5909,
    tags: []
  });

  useEffect(() => {
    if (place) {
      setFormState({
        name: place.name || '',
        address: place.address || '',
        score: place.popularity ? Math.round(place.popularity * 10 * 10) / 10 : 8.0,
        cost: place.estimatedCost ?? place.cost ?? 0,
        duration: place.duration || 60,
        zoneCode: place.zoneCode || (zones[0] ? zones[0].code : ''),
        open: place.openingTime || '08:00',
        close: place.closingTime || '17:00',
        lat: place.latitude || 16.0,
        lng: place.longitude || 108.0,
        tags: place.tags ? [...place.tags] : []
      });
    } else {
      setFormState({
        name: '',
        address: '',
        score: 8.0,
        cost: 0,
        duration: 60,
        zoneCode: zones[0] ? zones[0].code : '',
        open: '08:00',
        close: '17:00',
        lat: 16.0,
        lng: 108.0,
        tags: []
      });
    }
  }, [place, zones]);

  if (!isOpen) return null;

  const handleTagToggle = (tagKey) => {
    const currentTags = formState.tags || [];
    if (currentTags.includes(tagKey)) {
      setFormState({
        ...formState,
        tags: currentTags.filter((t) => t !== tagKey)
      });
    } else {
      setFormState({
        ...formState,
        tags: [...currentTags, tagKey]
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formState,
      id: place ? place.id : undefined,
      popularity: formState.score / 10,
      latitude: parseFloat(formState.lat),
      longitude: parseFloat(formState.lng),
      estimatedCost: parseInt(formState.cost, 10),
      duration: parseInt(formState.duration, 10)
    });
  };

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
        id="admDlg"
        open
        style={{ position: 'relative', margin: 0 }}
        aria-labelledby="admTitle"
      >
        <div className="dhead">
          <h2 id="admTitle">
            {isNew ? 'Thêm địa điểm mới' : `Sửa địa điểm: ${place?.name || ''}`}
          </h2>
          <button
            type="button"
            id="admX"
            className="ghost"
            aria-label="Đóng"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <form id="admForm" onSubmit={handleSubmit} noValidate>
          <div className="adm-grid">
            <label className="span-2">
              Tên địa điểm
              <input
                name="name"
                maxLength="120"
                value={formState.name}
                onChange={(e) =>
                  setFormState({ ...formState, name: e.target.value })
                }
                required
              />
            </label>

            <label className="span-2">
              Địa chỉ
              <input
                name="address"
                maxLength="200"
                value={formState.address}
                onChange={(e) =>
                  setFormState({ ...formState, address: e.target.value })
                }
                required
              />
            </label>

            <label>
              Điểm nổi tiếng (0–10)
              <input
                name="score"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formState.score}
                onChange={(e) =>
                  setFormState({ ...formState, score: parseFloat(e.target.value) })
                }
              />
            </label>

            <label>
              Giá vé (đ, 0 = miễn phí)
              <input
                name="cost"
                type="number"
                min="0"
                max="100000000"
                step="1000"
                value={formState.cost}
                onChange={(e) =>
                  setFormState({ ...formState, cost: parseInt(e.target.value, 10) })
                }
              />
            </label>

            <label>
              Thời gian tham quan (phút)
              <input
                name="duration"
                type="number"
                min="5"
                max="1440"
                step="5"
                value={formState.duration}
                onChange={(e) =>
                  setFormState({ ...formState, duration: parseInt(e.target.value, 10) })
                }
              />
            </label>

            <label>
              Khu vực
              <select
                name="zone"
                value={formState.zoneCode}
                onChange={(e) =>
                  setFormState({ ...formState, zoneCode: e.target.value })
                }
              >
                {zones.map((z) => (
                  <option key={z.code} value={z.code}>
                    {z.code}: {z.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Giờ mở cửa
              <input
                name="open"
                type="time"
                value={formState.open}
                onChange={(e) =>
                  setFormState({ ...formState, open: e.target.value })
                }
              />
            </label>

            <label>
              Giờ đóng cửa
              <input
                name="close"
                type="time"
                value={formState.close}
                onChange={(e) =>
                  setFormState({ ...formState, close: e.target.value })
                }
              />
            </label>

            <label>
              Vĩ độ (Latitude)
              <input
                name="lat"
                type="number"
                step="0.00001"
                value={formState.lat}
                onChange={(e) =>
                  setFormState({ ...formState, lat: parseFloat(e.target.value) })
                }
              />
            </label>

            <label>
              Kinh độ (Longitude)
              <input
                name="lng"
                type="number"
                step="0.00001"
                value={formState.lng}
                onChange={(e) =>
                  setFormState({ ...formState, lng: parseFloat(e.target.value) })
                }
              />
            </label>

            <fieldset className="span-2" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
              <legend style={{ fontSize: '12px', fontWeight: '600', color: '#475569', padding: '0 4px' }}>
                Loại hình (Tags)
              </legend>
              <div id="admTags">
                {Object.entries(TAGS).map(([key, label]) => (
                  <label key={key} className="adm-chip">
                    <input
                      type="checkbox"
                      checked={formState.tags.includes(key)}
                      onChange={() => handleTagToggle(key)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {errorMsg && (
            <p className="adm-err" id="admErr" role="alert" style={{ color: '#e11d48', padding: '0 20px', margin: '4px 0' }}>
              {errorMsg}
            </p>
          )}

          <p className="adm-hint" style={{ fontSize: '12px', color: '#64748b', padding: '0 20px', margin: '8px 0 12px' }}>
            Mẹo: ngoài nhập tọa độ, bạn có thể kéo thả ghim của địa điểm trực tiếp trên bản đồ để dời vị trí.
          </p>

          <div className="adm-foot">
            {!isNew && (
              <button
                type="button"
                id="admDelete"
                className="adm-btn delete"
                onClick={() => onDelete(place.id)}
              >
                Xóa địa điểm
              </button>
            )}
            {!isNew && (
              <button
                type="button"
                id="admRevert"
                className="gz-btn ghost"
                style={{ borderColor: '#cbd5e1', color: '#475569' }}
                onClick={() => onRevert(place.id)}
              >
                Khôi phục bản gốc
              </button>
            )}
            <button type="submit" id="admSave" className="adm-btn save">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
