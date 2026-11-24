import React from 'react';
import { ArrowLeft, Layers, LayoutDashboard, LogOut, Map, ShieldCheck, Users } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import '../../styles/Admin.css';

const navigation = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/places', label: 'Địa điểm', icon: Map },
  { to: '/admin/zones', label: 'Khu vực', icon: Layers }
];

const routeTitles = {
  '/admin': 'Tổng quan',
  '/admin/users': 'Quản lý người dùng',
  '/admin/places': 'Quản lý địa điểm',
  '/admin/zones': 'Quản lý khu vực'
};

export default function AdminLayout({ user, onLogout, children }) {
  const { pathname } = useLocation();

  return (
    <div className="gz-admin-shell">
      <aside className="gz-admin-sidebar">
        <NavLink className="gz-admin-brand" to="/admin" aria-label="GeoZone Admin">
          <span className="gz-admin-brand-mark">GZ</span>
          <span className="gz-admin-brand-copy">
            <strong>GeoZone</strong>
            <span>Travel workspace</span>
          </span>
          <span className="gz-admin-pill">Admin</span>
        </NavLink>

        <nav className="gz-admin-nav" aria-label="Điều hướng quản trị">
          <p className="gz-admin-nav-label">Không gian quản trị</p>
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `gz-admin-nav-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="gz-admin-sidebar-bottom">
          <NavLink className="gz-admin-back-link" to="/">
            <ArrowLeft size={17} strokeWidth={1.75} aria-hidden="true" />
            <span>Quay lại trang web</span>
          </NavLink>
          <div className="gz-admin-user">
            <span className="gz-admin-user-avatar">
              {(user?.name || user?.email || 'A').trim().charAt(0).toUpperCase()}
            </span>
            <span className="gz-admin-user-copy">
              <strong>{user?.name || 'Quản trị viên'}</strong>
              <span>{user?.email}</span>
            </span>
            <button
              className="gz-admin-logout"
              type="button"
              onClick={onLogout}
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut size={17} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="gz-admin-main">
        <header className="gz-admin-header">
          <div className="gz-admin-header-title">
            <span className="gz-admin-eyebrow">
              <ShieldCheck size={15} strokeWidth={1.75} aria-hidden="true" />
              Quản trị hệ thống
            </span>
            <h1>{routeTitles[pathname] || 'Quản trị hệ thống'}</h1>
          </div>
          <div className="gz-admin-header-user">
            <span className="gz-admin-live-dot" />
            <span>Phiên quản trị</span>
          </div>
        </header>
        <div className="gz-admin-content">{children}</div>
      </div>
    </div>
  );
}
