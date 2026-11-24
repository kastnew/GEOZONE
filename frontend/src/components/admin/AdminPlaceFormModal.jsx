import React, { useEffect, useState } from 'react';
import { Image, X } from 'lucide-react';

function getInitialForm(place, zones) {
  return {
    name: place?.name || '',
    city: place?.city || 'Da Nang',
    zoneId: place?.zoneId ?? zones[0]?.id ?? '',
    address: place?.address || '',
    estimatedCost: String(place?.estimatedCost ?? 0),
    duration: String(place?.duration ?? 60),
    openingTime: place?.openingTime || '',
    closingTime: place?.closingTime || '',
    latitude: place?.latitude ?? '',
    longitude: place?.longitude ?? '',
    rating: String(place?.rating ?? 4.5),
    popularity: String(place?.popularity ?? 0.5),
    imageUrl: place?.imageUrl || '',
    shortDesc: place?.shortDesc || '',
    tags: Array.isArray(place?.tags)
      ? place.tags.map((tag) => (typeof tag === 'string' ? tag : tag?.name)).filter(Boolean)
      : []
  };
}

function optionalNumber(value) {
  return value === '' || value === null ? null : Number(value);
}

export default function AdminPlaceFormModal({
  place,
  zones,
  tags,
  cities,
  isSaving,
  onClose,
  onSave
}) {
  const isEditing = Boolean(place);
  const [form, setForm] = useState(() => getInitialForm(place, zones));
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    setForm(getInitialForm(place, zones));
    setPreviewFailed(false);
  }, [place, zones]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleTag = (tagName) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tagName)
        ? current.tags.filter((tag) => tag !== tagName)
        : [...current.tags, tagName]
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      name: form.name.trim(),
      city: form.city,
      zoneId: Number(form.zoneId),
      address: form.address.trim(),
      estimatedCost: Number(form.estimatedCost || 0),
      duration: Number(form.duration || 60),
      openingTime: form.openingTime || null,
      closingTime: form.closingTime || null,
      latitude: optionalNumber(form.latitude),
      longitude: optionalNumber(form.longitude),
      rating: optionalNumber(form.rating),
      popularity: optionalNumber(form.popularity),
      imageUrl: form.imageUrl.trim() || null,
      shortDesc: form.shortDesc.trim() || null,
      tags: form.tags
    });
  };

  return (
    <div className="gz-admin-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <section className="gz-admin-modal gz-admin-place-modal" role="dialog" aria-modal="true" aria-labelledby="gz-admin-place-title">
        <header className="gz-admin-modal-header">
          <div>
            <p className="gz-admin-eyebrow">Danh mục du lịch</p>
            <h2 id="gz-admin-place-title">{isEditing ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm'}</h2>
          </div>
          <button className="gz-admin-modal-close" type="button" onClick={onClose} disabled={isSaving} aria-label="Đóng">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="gz-admin-place-form-grid">
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-name">Tên địa điểm <span>*</span></label>
              <input id="admin-place-name" value={form.name} onChange={(event) => update('name', event.target.value)} maxLength={255} required />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-city">Thành phố <span>*</span></label>
              <select id="admin-place-city" value={form.city} onChange={(event) => update('city', event.target.value)} required>
                {[...new Set([form.city, ...cities])].filter(Boolean).map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-zone">Khu vực <span>*</span></label>
              <select id="admin-place-zone" value={form.zoneId} onChange={(event) => update('zoneId', event.target.value)} required>
                <option value="" disabled>Chọn khu vực</option>
                {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.code} · {zone.name}</option>)}
              </select>
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-address">Địa chỉ</label>
              <input id="admin-place-address" value={form.address} onChange={(event) => update('address', event.target.value)} maxLength={255} />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-cost">Chi phí dự kiến (VNĐ)</label>
              <input id="admin-place-cost" type="number" min="0" step="1000" value={form.estimatedCost} onChange={(event) => update('estimatedCost', event.target.value)} />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-duration">Thời lượng (phút)</label>
              <input id="admin-place-duration" type="number" min="1" step="5" value={form.duration} onChange={(event) => update('duration', event.target.value)} />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-opening">Giờ mở cửa</label>
              <input id="admin-place-opening" type="time" value={form.openingTime} onChange={(event) => update('openingTime', event.target.value)} />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-closing">Giờ đóng cửa</label>
              <input id="admin-place-closing" type="time" value={form.closingTime} onChange={(event) => update('closingTime', event.target.value)} />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-latitude">Vĩ độ</label>
              <input id="admin-place-latitude" type="number" step="0.0000001" min="-90" max="90" value={form.latitude} onChange={(event) => update('latitude', event.target.value)} />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-longitude">Kinh độ</label>
              <input id="admin-place-longitude" type="number" step="0.0000001" min="-180" max="180" value={form.longitude} onChange={(event) => update('longitude', event.target.value)} />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-rating">Đánh giá (0–5)</label>
              <input id="admin-place-rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => update('rating', event.target.value)} />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-place-popularity">Độ phổ biến (0–1)</label>
              <input id="admin-place-popularity" type="number" min="0" max="1" step="0.01" value={form.popularity} onChange={(event) => update('popularity', event.target.value)} />
            </div>
            <div className="gz-admin-form-field gz-admin-form-span-2">
              <label htmlFor="admin-place-image">URL hình ảnh</label>
              <input id="admin-place-image" type="text" inputMode="url" value={form.imageUrl} onChange={(event) => { update('imageUrl', event.target.value); setPreviewFailed(false); }} placeholder="https://…" />
            </div>
            {form.imageUrl && (
              <div className="gz-admin-image-preview gz-admin-form-span-2">
                {!previewFailed ? (
                  <img src={form.imageUrl} alt="Xem trước ảnh địa điểm" onError={() => setPreviewFailed(true)} />
                ) : (
                  <span><Image size={18} strokeWidth={1.75} /> Không thể tải ảnh xem trước</span>
                )}
              </div>
            )}
            <div className="gz-admin-form-field gz-admin-form-span-2">
              <label htmlFor="admin-place-description">Mô tả ngắn</label>
              <textarea id="admin-place-description" rows="3" value={form.shortDesc} onChange={(event) => update('shortDesc', event.target.value)} />
            </div>
            <fieldset className="gz-admin-tag-fieldset gz-admin-form-span-2">
              <legend>Loại hình / Tags</legend>
              {tags.length ? (
                <div className="gz-admin-tag-options">
                  {tags.map((tag) => {
                    const selected = form.tags.includes(tag.name);
                    return (
                      <button
                        key={tag.id ?? tag.name}
                        type="button"
                        className={`gz-admin-tag-option${selected ? ' is-selected' : ''}`}
                        aria-pressed={selected}
                        onClick={() => toggleTag(tag.name)}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              ) : <p className="gz-admin-empty-note">Không có tag để chọn.</p>}
            </fieldset>
          </div>

          <div className="gz-admin-modal-actions">
            <button className="gz-admin-button gz-admin-button-secondary" type="button" onClick={onClose} disabled={isSaving}>Hủy</button>
            <button className="gz-admin-button gz-admin-button-primary" type="submit" disabled={isSaving || !form.name.trim() || !form.zoneId}>
              {isSaving ? 'Đang lưu…' : (isEditing ? 'Lưu thay đổi' : 'Tạo địa điểm')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
