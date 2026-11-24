import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const roles = ['USER', 'ADMIN', 'CUSTOMER'];

export default function AdminUserEditModal({ user, isSelf, isSaving, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', role: 'USER', is_active: true });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      role: String(user.role || 'USER').toUpperCase(),
      is_active: Boolean(user.is_active)
    });
  }, [user]);

  if (!user) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({ ...form, name: form.name.trim() });
  };

  return (
    <div className="gz-admin-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <section className="gz-admin-modal" role="dialog" aria-modal="true" aria-labelledby="gz-admin-edit-title">
        <header className="gz-admin-modal-header">
          <div>
            <p className="gz-admin-eyebrow">Hồ sơ người dùng</p>
            <h2 id="gz-admin-edit-title">Chỉnh sửa tài khoản</h2>
          </div>
          <button className="gz-admin-modal-close" type="button" onClick={onClose} disabled={isSaving} aria-label="Đóng">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="gz-admin-form-field">
            <label htmlFor="admin-user-email">Email</label>
            <input id="admin-user-email" value={user.email || ''} disabled />
          </div>
          <div className="gz-admin-form-field">
            <label htmlFor="admin-user-name">Họ và tên</label>
            <input
              id="admin-user-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              maxLength={120}
              required
            />
          </div>
          <div className="gz-admin-form-field">
            <label htmlFor="admin-user-role">Vai trò</label>
            <select
              id="admin-user-role"
              value={form.role}
              disabled={isSelf}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            >
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <label className={`gz-admin-switch-row${isSelf ? ' is-disabled' : ''}`}>
            <span>
              <strong>Trạng thái tài khoản</strong>
              <small>{form.is_active ? 'Đang hoạt động' : 'Đang bị khóa'}</small>
            </span>
            <input
              type="checkbox"
              checked={form.is_active}
              disabled={isSelf}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
          </label>
          {isSelf && (
            <p className="gz-admin-inline-note">
              Không thể thay đổi vai trò hoặc trạng thái của tài khoản quản trị đang đăng nhập.
            </p>
          )}
          <div className="gz-admin-modal-actions">
            <button className="gz-admin-button gz-admin-button-secondary" type="button" onClick={onClose} disabled={isSaving}>
              Hủy
            </button>
            <button className="gz-admin-button gz-admin-button-primary" type="submit" disabled={isSaving || !form.name.trim()}>
              {isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
