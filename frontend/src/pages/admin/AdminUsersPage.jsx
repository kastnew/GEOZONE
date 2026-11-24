import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FilterX,
  Lock,
  Pencil,
  Search,
  Unlock
} from 'lucide-react';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal.jsx';
import AdminUserEditModal from '../../components/admin/AdminUserEditModal.jsx';
import {
  getAdminUsersApi,
  setAdminUserStatusApi,
  updateAdminUserApi
} from '../../services/api';

const initialPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

export default function AdminUsersPage({ user, showToast }) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [pendingUserEdit, setPendingUserEdit] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    const params = { page, limit, search };
    if (statusFilter !== 'all') params.is_active = statusFilter === 'active';
    if (roleFilter !== 'all') params.role = roleFilter;

    getAdminUsersApi(params).then((response) => {
      if (!active) return;
      setUsers(response.users);
      setPagination(response.pagination);
    }).catch((error) => {
      if (!active) return;
      const message = error.message || 'Không thể tải danh sách người dùng.';
      setLoadError(message);
      setUsers([]);
      setPagination(initialPagination);
      showToast(message, 'error');
    }).finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [page, limit, search, statusFilter, roleFilter, reloadKey, showToast]);

  const currentUserId = user?.id ? String(user.id) : '';
  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages;
    if (!total) return [];
    const start = Math.max(1, Math.min(page - 2, total - 4));
    return Array.from({ length: Math.min(total, 5) }, (_, index) => start + index);
  }, [page, pagination.totalPages]);
  const startRow = pagination.total ? ((page - 1) * limit) + 1 : 0;
  const endRow = Math.min(page * limit, pagination.total);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
    setLimit(10);
    setPage(1);
  };

  const handleSaveUser = (form) => {
    if (!editingUser) return;
    setPendingUserEdit(form);
  };

  const confirmSaveUser = async () => {
    if (!editingUser || !pendingUserEdit) return;
    setIsSaving(true);
    try {
      const updated = await updateAdminUserApi(editingUser.id, pendingUserEdit);
      if (Boolean(updated.is_active) !== Boolean(pendingUserEdit.is_active)) {
        await setAdminUserStatusApi(editingUser.id, pendingUserEdit.is_active);
      }
      showToast('Đã cập nhật tài khoản thành công.', 'success');
      setEditingUser(null);
      setPendingUserEdit(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      showToast(error.message || 'Không thể cập nhật tài khoản.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!pendingStatus) return;
    setIsChangingStatus(true);
    try {
      await setAdminUserStatusApi(pendingStatus.id, pendingStatus.nextActive);
      showToast(pendingStatus.nextActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.', 'success');
      setPendingStatus(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      showToast(error.message || 'Không thể thay đổi trạng thái tài khoản.', 'error');
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <div className="gz-admin-page">
      <div className="gz-admin-page-intro">
        <div>
          <p className="gz-admin-eyebrow">Tài khoản & quyền truy cập</p>
          <h2>Người dùng</h2>
          <p className="gz-admin-muted">Tìm kiếm, phân quyền và quản lý trạng thái tài khoản.</p>
        </div>
        <span className="gz-admin-total-badge" data-numeric>{loadError ? '—' : new Intl.NumberFormat('vi-VN').format(pagination.total)} người dùng</span>
      </div>

      <section className="gz-admin-panel">
        <div className="gz-admin-filter-bar">
          <label className="gz-admin-search">
            <Search size={17} strokeWidth={1.75} aria-hidden="true" />
            <input
              type="search"
              placeholder="Tìm theo tên hoặc email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Tìm người dùng"
            />
          </label>
          <select aria-label="Lọc theo trạng thái" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Bị khóa</option>
          </select>
          <select aria-label="Lọc theo vai trò" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}>
            <option value="all">Tất cả vai trò</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>
          <select aria-label="Số dòng mỗi trang" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
          <button className="gz-admin-button gz-admin-button-quiet" type="button" onClick={clearFilters}>
            <FilterX size={16} strokeWidth={1.75} aria-hidden="true" />
            Xóa bộ lọc
          </button>
        </div>

        {loadError && <p className="gz-admin-inline-error" role="alert">{loadError}</p>}

        <div className="gz-admin-table-wrap">
          <table className="gz-admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th><span className="gz-admin-sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="gz-admin-table-message" colSpan="5">Đang tải danh sách…</td></tr>
              ) : loadError ? (
                <tr><td className="gz-admin-table-message" colSpan="5">Không thể tải dữ liệu người dùng.</td></tr>
              ) : users.length ? users.map((item) => {
                const isSelf = Boolean(currentUserId) && String(item.id) === currentUserId;
                const role = String(item.role || 'USER').toUpperCase();
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="gz-admin-person-cell">
                        <span className="gz-admin-avatar">{(item.name || item.email || 'U').charAt(0).toUpperCase()}</span>
                        <span><strong>{item.name || 'Chưa đặt tên'}</strong><small>{item.email}</small></span>
                      </div>
                    </td>
                    <td><span className={`gz-admin-role-badge role-${role.toLowerCase()}`}>{role}</span></td>
                    <td><span className={`gz-admin-status${item.is_active ? ' is-active' : ' is-locked'}`}><i />{item.is_active ? 'Hoạt động' : 'Bị khóa'}</span></td>
                    <td className="gz-admin-numeric">{formatDate(item.created_at)}</td>
                    <td>
                      <div className="gz-admin-row-actions">
                        <button className="gz-admin-icon-button" type="button" onClick={() => setEditingUser(item)} aria-label={`Chỉnh sửa ${item.name || item.email}`} title="Chỉnh sửa">
                          <Pencil size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          className="gz-admin-icon-button"
                          type="button"
                          disabled={isSelf}
                          onClick={() => setPendingStatus({ id: item.id, name: item.name || item.email, nextActive: !item.is_active })}
                          aria-label={item.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          title={isSelf ? 'Không thể thay đổi trạng thái tài khoản hiện tại' : (item.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản')}
                        >
                          {item.is_active ? <Lock size={16} strokeWidth={1.75} /> : <Unlock size={16} strokeWidth={1.75} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td className="gz-admin-table-message" colSpan="5">Không tìm thấy người dùng phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="gz-admin-pagination">
          <p data-numeric>{loadError ? 'Không thể tải thông tin phân trang.' : `Hiển thị ${startRow}–${endRow} trên ${new Intl.NumberFormat('vi-VN').format(pagination.total)} người dùng`}</p>
          <div className="gz-admin-pagination-controls" aria-label="Phân trang người dùng">
            <button type="button" className="gz-admin-page-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || isLoading} aria-label="Trang trước">
              <ChevronLeft size={17} strokeWidth={1.75} />
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={`gz-admin-page-button${pageNumber === page ? ' is-current' : ''}`}
                onClick={() => setPage(pageNumber)}
                disabled={isLoading}
                aria-current={pageNumber === page ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" className="gz-admin-page-button" onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))} disabled={page >= pagination.totalPages || isLoading} aria-label="Trang sau">
              <ChevronRight size={17} strokeWidth={1.75} />
            </button>
          </div>
        </footer>
      </section>

      <AdminUserEditModal
        user={editingUser}
        isSelf={Boolean(editingUser && currentUserId && String(editingUser.id) === currentUserId)}
        isSaving={isSaving}
        onClose={() => { if (!isSaving) setEditingUser(null); }}
        onSave={handleSaveUser}
      />

      {pendingUserEdit && editingUser && (
        <AdminConfirmModal
          title="Lưu thay đổi tài khoản?"
          message={`Bạn sắp cập nhật thông tin của ${editingUser.name || editingUser.email}, bao gồm tên, vai trò hoặc trạng thái nếu có thay đổi.`}
          confirmLabel="Lưu thay đổi"
          isBusy={isSaving}
          onCancel={() => {
            if (!isSaving) setPendingUserEdit(null);
          }}
          onConfirm={confirmSaveUser}
        />
      )}

      {pendingStatus && (
        <AdminConfirmModal
          title={pendingStatus.nextActive ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
          message={pendingStatus.nextActive
            ? `Tài khoản của ${pendingStatus.name} sẽ được kích hoạt lại.`
            : `Tài khoản của ${pendingStatus.name} sẽ bị khóa và các phiên đăng nhập hiện tại bị thu hồi.`}
          confirmLabel={pendingStatus.nextActive ? 'Mở khóa' : 'Khóa tài khoản'}
          isBusy={isChangingStatus}
          onCancel={() => { if (!isChangingStatus) setPendingStatus(null); }}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  );
}
