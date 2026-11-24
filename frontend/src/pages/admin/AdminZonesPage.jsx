import React, { useEffect, useState } from 'react';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal.jsx';
import AdminZoneFormModal from '../../components/admin/AdminZoneFormModal.jsx';
import {
  adminCreateZoneApi,
  adminDeleteZoneApi,
  adminUpdateZoneApi,
  getAdminZonesApi
} from '../../services/api';

function formatCoordinate(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(5) : '—';
}

export default function AdminZonesPage({ showToast }) {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editingZone, setEditingZone] = useState(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    getAdminZonesApi().then((items) => {
      if (active) setZones(Array.isArray(items) ? items : []);
    }).catch((error) => {
      if (!active) return;
      const message = error.message || 'Không thể tải danh sách khu vực.';
      setLoadError(message);
      setZones([]);
      showToast(message, 'error');
    }).finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [reloadKey, showToast]);

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editingZone) {
        await adminUpdateZoneApi(editingZone.id, payload);
        showToast('Đã cập nhật khu vực thành công.', 'success');
      } else {
        await adminCreateZoneApi(payload);
        showToast('Đã thêm khu vực thành công.', 'success');
      }
      setEditingZone(undefined);
      setReloadKey((value) => value + 1);
    } catch (error) {
      showToast(error.message || 'Không thể lưu khu vực.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await adminDeleteZoneApi(pendingDelete.id);
      showToast(`Đã xóa khu vực ${pendingDelete.code}.`, 'success');
      setPendingDelete(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      showToast(error.message || 'Không thể xóa khu vực.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="gz-admin-page">
      <div className="gz-admin-page-intro">
        <div>
          <p className="gz-admin-eyebrow">Cụm địa lý & hành trình</p>
          <h2>Khu vực / Zones</h2>
          <p className="gz-admin-muted">Quản lý các vùng địa lý dùng để nhóm điểm đến và tối ưu lịch trình.</p>
        </div>
        <button className="gz-admin-button gz-admin-button-primary" type="button" onClick={() => setEditingZone(null)}>
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          Thêm khu vực
        </button>
      </div>

      <section className="gz-admin-panel">
        {loadError && <p className="gz-admin-inline-error" role="alert">{loadError}</p>}
        <div className="gz-admin-table-wrap">
          <table className="gz-admin-table gz-admin-zones-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khu vực</th>
                <th>Tâm tọa độ</th>
                <th>Địa điểm</th>
                <th><span className="gz-admin-sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="gz-admin-table-message" colSpan="5">Đang tải khu vực…</td></tr>
              ) : loadError ? (
                <tr><td className="gz-admin-table-message" colSpan="5">Không thể tải dữ liệu khu vực.</td></tr>
              ) : zones.length ? zones.map((zone) => (
                <tr key={zone.id}>
                  <td><span className={`gz-admin-zone-pill ${String(zone.code || '').toLowerCase()}`}>{zone.code}</span></td>
                  <td>
                    <div className="gz-admin-zone-name">
                      <strong>{zone.name}</strong>
                      <small>{zone.description || 'Chưa có mô tả'}</small>
                    </div>
                  </td>
                  <td className="gz-admin-numeric">
                    <span>{formatCoordinate(zone.centerLat)}, {formatCoordinate(zone.centerLng)}</span>
                  </td>
                  <td><span className="gz-admin-place-count"><Layers size={14} strokeWidth={1.75} aria-hidden="true" />{Number(zone?._count?.places) || 0}</span></td>
                  <td>
                    <div className="gz-admin-row-actions">
                      <button className="gz-admin-icon-button" type="button" onClick={() => setEditingZone(zone)} aria-label={`Sửa khu vực ${zone.name}`} title="Sửa">
                        <Pencil size={16} strokeWidth={1.75} />
                      </button>
                      <button className="gz-admin-icon-button gz-admin-danger-action" type="button" onClick={() => setPendingDelete(zone)} aria-label={`Xóa khu vực ${zone.name}`} title="Xóa">
                        <Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="gz-admin-table-message" colSpan="5">Chưa có khu vực nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingZone !== undefined && (
        <AdminZoneFormModal
          zone={editingZone}
          isSaving={isSaving}
          onClose={() => { if (!isSaving) setEditingZone(undefined); }}
          onSave={handleSave}
        />
      )}

      {pendingDelete && (
        <AdminConfirmModal
          title="Xóa khu vực?"
          message={Number(pendingDelete?._count?.places) > 0
            ? `${pendingDelete.code} hiện có ${pendingDelete._count.places} địa điểm. Backend sẽ từ chối thao tác nếu khu vực chưa trống.`
            : `Khu vực ${pendingDelete.code} · ${pendingDelete.name} sẽ bị xóa.`}
          confirmLabel="Xóa khu vực"
          isBusy={isDeleting}
          onCancel={() => { if (!isDeleting) setPendingDelete(null); }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
