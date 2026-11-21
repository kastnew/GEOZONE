import React from 'react';
import '../../styles/Navbar.css';

export default function Navbar({
  currentView = 'home',
  onNavigate = () => {},
  tripCount = 0,
  favCount = 0,
  user = null,
  isUserMenuOpen = false,
  onToggleUserMenu = () => {},
  onOpenAuth = () => {},
  onLogout = () => {}
}) {
  const getInitial = (name) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <header className="gz-nav">
      <div className="gz-wrap">
        <a
          className="gz-logo"
          href="#trang-chu"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
        >
          <i>GZ</i>GeoZone AI
        </a>

        <nav className="gz-links">
          <a
            href="#trang-chu"
            className={currentView === 'home' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
          >
            Trang chủ
          </a>
          <a
            href="#gioi-thieu"
            className={currentView === 'about' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('about');
            }}
          >
            Giới thiệu
          </a>
          <a
            href="#kham-pha"
            className={currentView === 'explore' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('explore');
            }}
          >
            Khám phá
          </a>
          <a
            href="#chuyen-di"
            className={currentView === 'trips' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('trips');
            }}
          >
            Chuyến đi của tôi
            <b className="gzTripBadge" data-n={tripCount}>
              {tripCount > 0 ? tripCount : ''}
            </b>
          </a>
          <a
            href="#yeu-thich"
            className={currentView === 'favs' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('favs');
            }}
          >
            Yêu thích
            <b className="gzFavBadge" data-n={favCount}>
              {favCount > 0 ? favCount : ''}
            </b>
          </a>
        </nav>

        {/* Mobile Quick Trigger Icon Buttons */}
        <a
          className="gz-mt"
          href="#chuyen-di"
          aria-label="Chuyến đi của tôi"
          title="Chuyến đi của tôi"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('trips');
          }}
        >
          🧳
          <b className="gzTripBadge" data-n={tripCount}>
            {tripCount > 0 ? tripCount : ''}
          </b>
        </a>
        <a
          className="gz-mt gz-mt-fav"
          href="#yeu-thich"
          aria-label="Địa điểm yêu thích"
          title="Địa điểm yêu thích"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('favs');
          }}
        >
          ♡
          <b className="gzFavBadge" data-n={favCount}>
            {favCount > 0 ? favCount : ''}
          </b>
        </a>

        {/* Fast CTA */}
        <a
          className="gz-btn"
          href="#kham-pha"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('explore', { mode: 'plan' });
          }}
        >
          Lập lịch trình
        </a>

        {/* Authentication Navigation Buttons */}
        <div className="gz-auth" id="gzAuth">
          {!user ? (
            <>
              <button
                type="button"
                className="au-link"
                onClick={() => onOpenAuth('login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="au-pill"
                onClick={() => onOpenAuth('reg')}
              >
                Đăng ký
              </button>
            </>
          ) : (
            <div className="au-menu">
              <button
                type="button"
                className="au-av"
                id="auAvBtn"
                onClick={onToggleUserMenu}
              >
                <i>{getInitial(user.name)}</i>
                <span>{user.name}</span>
                {user.role === 'admin' && <em className="au-role">Admin</em>}
              </button>
              <div className="au-pop" id="auPop" hidden={!isUserMenuOpen}>
                <div className="au-who">
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </div>
                <button
                  type="button"
                  className="au-item"
                  onClick={() => {
                    onNavigate('account');
                    onToggleUserMenu();
                  }}
                >
                  👤 Tài khoản của tôi
                </button>
                <button
                  type="button"
                  className="au-item"
                  onClick={() => {
                    onNavigate('trips');
                    onToggleUserMenu();
                  }}
                >
                  🧳 Chuyến đi của tôi
                </button>
                <button
                  type="button"
                  className="au-item"
                  onClick={() => {
                    onNavigate('favs');
                    onToggleUserMenu();
                  }}
                >
                  ♡ Địa điểm đã lưu
                </button>
                <button
                  type="button"
                  className="au-item out"
                  onClick={() => {
                    onLogout();
                    onToggleUserMenu();
                  }}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
