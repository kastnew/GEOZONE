import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/Navbar.css';
import { Heart, LogOut, Map, UserRound } from 'lucide-react';

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
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const activeLinkRefs = useRef({});
  const menuRef = useRef(null);
  const closeTimerRef = useRef(null);
  const initialMeasureRef = useRef(true);
  const previousFavCountRef = useRef(favCount);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFavBadgePopping, setIsFavBadgePopping] = useState(false);

  const getInitial = (name) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  const activeKey = pathname === '/' ? 'home'
    : pathname === '/about' ? 'about'
      : pathname === '/explore' ? 'explore'
        : pathname.startsWith('/my-trips') ? 'trips'
          : pathname === '/favorites' ? 'favs'
            : null;

  const measureIndicator = () => {
    const nav = navRef.current;
    const link = activeKey ? activeLinkRefs.current[activeKey] : null;
    if (!nav) return;
    if (!link) {
      setIndicator((current) => ({
        ...current,
        width: 0,
        ready: !initialMeasureRef.current
      }));
      initialMeasureRef.current = false;
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    setIndicator({
      left: linkRect.left - navRect.left,
      width: linkRect.width,
      ready: !initialMeasureRef.current
    });
    initialMeasureRef.current = false;
  };

  useLayoutEffect(() => {
    measureIndicator();
  }, [activeKey, tripCount, favCount]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    const observer = new ResizeObserver(measureIndicator);
    observer.observe(nav);
    Object.values(activeLinkRefs.current).forEach((link) => link && observer.observe(link));
    window.addEventListener('resize', measureIndicator);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureIndicator);
    };
  }, [activeKey]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (previousFavCountRef.current !== favCount) {
      setIsFavBadgePopping(true);
      const timer = window.setTimeout(() => setIsFavBadgePopping(false), 240);
      previousFavCountRef.current = favCount;
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [favCount]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isUserMenuOpen) onToggleUserMenu();
    };
    const handleOutsideClick = (event) => {
      if (isUserMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        onToggleUserMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isUserMenuOpen, onToggleUserMenu]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleMenuClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      if (isUserMenuOpen) onToggleUserMenu();
    }, 150);
  };

  return (
    <header className={`gz-nav ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="gz-wrap">
        <a
          className="gz-logo"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
        >
          <i>GZ</i>GeoZone AI
        </a>

        <nav className="gz-links" ref={navRef}>
          <span
            className={`gz-nav-indicator ${indicator.ready ? 'is-ready' : ''} ${activeKey ? 'has-active' : ''}`}
            aria-hidden="true"
            style={{
              width: `${indicator.width}px`,
              transform: `translateX(${indicator.left}px)`
            }}
          />
          <a
            href="/"
            className={activeKey === 'home' ? 'active' : ''}
            ref={(element) => { activeLinkRefs.current.home = element; }}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
          >
            Trang chủ
          </a>
          <a
            href="/about"
            className={activeKey === 'about' ? 'active' : ''}
            ref={(element) => { activeLinkRefs.current.about = element; }}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('about');
            }}
          >
            Giới thiệu
          </a>
          <a
            href="/explore"
            className={activeKey === 'explore' ? 'active' : ''}
            ref={(element) => { activeLinkRefs.current.explore = element; }}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('explore');
            }}
          >
            Khám phá
          </a>
          <a
            href="/my-trips"
            className={activeKey === 'trips' ? 'active' : ''}
            ref={(element) => { activeLinkRefs.current.trips = element; }}
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
            href="/favorites"
            className={activeKey === 'favs' ? 'active' : ''}
            ref={(element) => { activeLinkRefs.current.favs = element; }}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('favs');
            }}
          >
            Yêu thích
            <b className={`gzFavBadge ${isFavBadgePopping ? 'is-popping' : ''}`} data-n={favCount}>
              {favCount > 0 ? favCount : ''}
            </b>
          </a>
        </nav>

        {/* Mobile Quick Trigger Icon Buttons */}
        <a
          className="gz-mt"
          href="/my-trips"
          aria-label="Chuyến đi của tôi"
          title="Chuyến đi của tôi"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('trips');
          }}
        >
          <Map size={17} strokeWidth={1.75} aria-hidden="true" />
          <b className="gzTripBadge" data-n={tripCount}>
            {tripCount > 0 ? tripCount : ''}
          </b>
        </a>
        <a
          className="gz-mt gz-mt-fav"
          href="/favorites"
          aria-label="Địa điểm yêu thích"
          title="Địa điểm yêu thích"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('favs');
          }}
        >
          <Heart size={17} strokeWidth={1.75} aria-hidden="true" />
          <b className="gzFavBadge" data-n={favCount}>
            {favCount > 0 ? favCount : ''}
          </b>
        </a>

        {/* Fast CTA */}
        <a
          className="gz-btn"
          href="/explore"
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
            <div
              className="au-menu"
              ref={menuRef}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleMenuClose}
            >
              <button
                type="button"
                className="au-av"
                id="auAvBtn"
                onClick={() => {
                  clearCloseTimer();
                  onToggleUserMenu();
                }}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <i>{getInitial(user.name)}</i>
                <span>{user.name}</span>
                {user.role === 'admin' && <em className="au-role">Admin</em>}
              </button>
              <div
                className={`au-pop ${isUserMenuOpen ? 'is-open' : ''}`}
                id="auPop"
                aria-hidden={!isUserMenuOpen}
                role="menu"
              >
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
                    <UserRound size={16} strokeWidth={1.75} aria-hidden="true" /> Tài khoản của tôi
                </button>
                <button
                  type="button"
                  className="au-item"
                  onClick={() => {
                    onNavigate('trips');
                    onToggleUserMenu();
                  }}
                >
                    <Map size={16} strokeWidth={1.75} aria-hidden="true" /> Chuyến đi của tôi
                </button>
                <button
                  type="button"
                  className="au-item"
                  onClick={() => {
                    onNavigate('favs');
                    onToggleUserMenu();
                  }}
                >
                    <Heart size={16} strokeWidth={1.75} aria-hidden="true" /> Địa điểm đã lưu
                </button>
                <button
                  type="button"
                  className="au-item out"
                  onClick={() => {
                    onLogout();
                    onToggleUserMenu();
                  }}
                >
                    <LogOut size={16} strokeWidth={1.75} aria-hidden="true" /> Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
