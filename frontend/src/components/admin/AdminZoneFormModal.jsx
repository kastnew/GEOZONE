import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

function getForm(zone) {
  return {
    code: zone?.code || '',
    name: zone?.name || '',
    description: zone?.description || '',
    centerLat: zone?.centerLat ?? '',
    centerLng: zone?.centerLng ?? ''
  };
}

export default function AdminZoneFormModal({ zone, isSaving, onClose, onSave }) {
  const isEditing = Boolean(zone);
  const [form, setForm] = useState(() => getForm(zone));

  useEffect(() => {
    setForm(getForm(zone));
  }, [zone]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      centerLat: form.centerLat === '' ? null : Number(form.centerLat),
      centerLng: form.centerLng === '' ? null : Number(form.centerLng)
    });
  };

  return (
    <div className="gz-admin-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <section className="gz-admin-modal" role="dialog" aria-modal="true" aria-labelledby="gz-admin-zone-title">
        <header className="gz-admin-modal-header">
          <div>
            <p className="gz-admin-eyebrow">Phân vùng địa lý</p>
            <h2 id="gz-admin-zone-title">{isEditing ? 'Chỉnh sửa khu vực' : 'Thêm khu vực'}</h2>
          </div>
          <button className="gz-admin-modal-close" type="button" onClick={onClose} disabled={isSaving} aria-label="Đóng">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="gz-admin-form-field">
            <label htmlFor="admin-zone-code">Mã khu vực <span>*</span></label>
            <input id="admin-zone-code" value={form.code} onChange={(event) => update('code', event.target.value)} maxLength={20} required />
          </div>
          <div className="gz-admin-form-field">
            <label htmlFor="admin-zone-name">Tên khu vực <span>*</span></label>
            <input id="admin-zone-name" value={form.name} onChange={(event) => update('name', event.target.value)} maxLength={150} required />
          </div>
          <div className="gz-admin-form-field">
            <label htmlFor="admin-zone-description">Mô tả</label>
            <textarea id="admin-zone-description" rows="3" value={form.description} onChange={(event) => update('description', event.target.value)} />
          </div>
          <div className="gz-admin-form-grid">
            <div className="gz-admin-form-field">
              <label htmlFor="admin-zone-lat">Tâm khu vực · Vĩ độ</label>
              <input id="admin-zone-lat" type="number" step="0.0000001" min="-90" max="90" value={form.centerLat} onChange={(event) => update('centerLat', event.target.value)} />
            </div>
            <div className="gz-admin-form-field">
              <label htmlFor="admin-zone-lng">Tâm khu vực · Kinh độ</label>
              <input id="admin-zone-lng" type="number" step="0.0000001" min="-180" max="180" value={form.centerLng} onChange={(event) => update('centerLng', event.target.value)} />
            </div>
          </div>
          <div className="gz-admin-modal-actions">
            <button className="gz-admin-button gz-admin-button-secondary" type="button" onClick={onClose} disabled={isSaving}>Hủy</button>
            <button className="gz-admin-button gz-admin-button-primary" type="submit" disabled={isSaving || !form.code.trim() || !form.name.trim()}>
              {isSaving ? 'Đang lưu…' : (isEditing ? 'Lưu thay đổi' : 'Tạo khu vực')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
