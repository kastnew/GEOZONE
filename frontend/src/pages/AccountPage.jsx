import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Account.css';

export default function AccountPage({
  user = null,
  stats = { tripsCount: 0, favsCount: 0, joinedDate: 'Hôm nay' },
  onUpdateProfile = () => {},
  onChangePassword = () => {},
  onDeleteAccount = () => {},
  onNavigate = () => {},
  onOpenAuth = () => {}
}) {
  const getInitial = (name) => {
    if (!name) return 'GZ';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <section className="gz-view gz-account on" data-view="account" aria-label="Tài khoản">
      {/* Page Header */}
      <div
        className="gz-pb"
        id="gzAccHero"
        data-k="ninhbinh"
        style={{ '--gz-hero-image': "url('/images/heroes/ninhbinh.jpg')" }}
      >
        <div className="gz-wrap">
          <h1>Tài khoản của tôi</h1>
          <p className="gz-crumb">
            <Link to="/">
              Trang chủ
            </Link>{' '}
            / Thông tin cá nhân
          </p>
        </div>
      </div>

      <div className="ac-body">
        <div className="gz-wrap ac-grid">
          <div className="ac-main">
            {/* User Profile Card */}
            <div className="ac-card ac-me">
              <div className="ac-av" id="acAv">
                {user ? getInitial(user.name) : 'GZ'}
              </div>
              <div className="ac-info">
                <h2 id="acName">{user ? user.name : 'Chưa đăng nhập'}</h2>
                <p id="acMail">
                  {user
                    ? user.email
                    : 'Đăng nhập để xem và quản lý thông tin tài khoản của bạn'}
                </p>
                {!user && (
                  <button
                    type="button"
                    className="gz-btn"
                    style={{ marginTop: '8px' }}
                    onClick={() => onOpenAuth('login')}
                  >
                    Đăng nhập ngay
                  </button>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="ac-stats">
              <div className="st">
                <b id="acTrips">{stats.tripsCount || 0}</b>
                <span>Chuyến đi đã lưu</span>
              </div>
              <div className="st">
                <b id="acPlaces">{stats.favsCount || 0}</b>
                <span>Địa điểm yêu thích</span>
              </div>
              <div className="st">
                <b id="acJoined">{stats.joinedDate || 'Hôm nay'}</b>
                <span>Tham gia</span>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="ac-card ac-danger">
              <h3>Vùng nguy hiểm</h3>
              <p>
                Xóa toàn bộ dữ liệu lưu trữ cục bộ trên trình duyệt này hoặc xóa
                tài khoản vĩnh viễn. Hành động này không thể hoàn tác.
              </p>
              <button type="button" id="acDel" onClick={onDeleteAccount}>
                Xóa dữ liệu &amp; Tài khoản
              </button>
            </div>
          </div>

          {/* Right Column: Profile & Password Forms */}
          <div className="ac-col">
            <div className="ac-card au-slot" id="acProf">
              <h3>Cập nhật thông tin</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  onUpdateProfile({
                    name: form.name.value,
                    email: form.email.value
                  });
                }}
              >
                <div style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '13px' }}>
                    Họ và tên
                    <input
                      name="name"
                      defaultValue={user ? user.name : ''}
                      placeholder="Nhập họ tên mới"
                      className="au-in"
                      required
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '13px' }}>
                    Email
                    <input
                      name="email"
                      type="email"
                      defaultValue={user ? user.email : ''}
                      placeholder="email@example.com"
                      className="au-in"
                      required
                    />
                  </label>
                  <button type="submit" className="gz-btn" style={{ marginTop: '8px' }}>
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>

            <div className="ac-card au-slot" id="acPass">
              <h3>Đổi mật khẩu</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  onChangePassword({
                    oldPassword: form.oldPassword.value,
                    newPassword: form.newPassword.value
                  });
                  form.reset();
                }}
              >
                <div style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '13px' }}>
                    Mật khẩu hiện tại
                    <input
                      name="oldPassword"
                      type="password"
                      placeholder="••••••••"
                      className="au-in"
                      required
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '13px' }}>
                    Mật khẩu mới
                    <input
                      name="newPassword"
                      type="password"
                      placeholder="••••••••"
                      className="au-in"
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    className="gz-btn ghost"
                    style={{
                      borderColor: 'var(--gz-color-line-strong)',
                      color: 'var(--gz-color-ink)',
                      marginTop: '8px'
                    }}
                  >
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
