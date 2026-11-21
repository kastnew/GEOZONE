import React from 'react';
import '../styles/Favorites.css';
import FavoriteCard from '../components/favorites/FavoriteCard';
import { CITIES } from '../data/mockData';

export default function FavoritesPage({
  favorites = [],
  isLoggedIn = false,
  selectedCity = 'all',
  onSelectCity = () => {},
  onOpenAuth = () => {},
  onViewPlace = () => {},
  onRemoveFavorite = () => {},
  onClearAllFavorites = () => {},
  onNavigate = () => {}
}) {
  const filteredFavorites =
    selectedCity === 'all'
      ? favorites
      : favorites.filter((f) => f.city === selectedCity);

  const hasFavorites = favorites && favorites.length > 0;

  // Compute counts per city for chips
  const cityKeys = Object.keys(CITIES);
  const cityCounts = {
    all: favorites.length
  };
  cityKeys.forEach((k) => {
    cityCounts[k] = favorites.filter((f) => f.city === k).length;
  });

  return (
    <section className="gz-view gz-favs on" data-view="favs" aria-label="Địa điểm yêu thích">
      {/* Page Header */}
      <div
        className="gz-pb"
        id="gzFavHero"
        data-k="hue"
        style={{ backgroundImage: "url('/images/heroes/hue.jpg')" }}
      >
        <div className="gz-wrap">
          <h1>Địa điểm đã lưu</h1>
          <p className="gz-crumb">
            <a
              href="#trang-chu"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
              }}
            >
              Trang chủ
            </a>{' '}
            / Danh sách yêu thích
          </p>
        </div>
      </div>

      <div className="gz-tbody">
        <div className="gz-wrap">
          {/* Guest Sync Banner */}
          {!isLoggedIn && (
            <div className="gz-gnote" id="fvGuest">
              <p>Bạn chưa đăng nhập, nên danh sách yêu thích chỉ lưu trên trình duyệt này.</p>
              <button
                type="button"
                className="gz-btn ghost"
                style={{
                  borderColor: '#93c5fd',
                  color: '#1e40af',
                  padding: '6px 12px',
                  fontSize: '13px',
                  marginTop: '6px'
                }}
                onClick={() => onOpenAuth('login')}
              >
                Đăng nhập để đồng bộ
              </button>
            </div>
          )}

          {/* Action Toolbar */}
          {hasFavorites && (
            <div className="gz-tbar" id="fvBar">
              <p id="fvCount">
                Bạn đã lưu <b>{favorites.length}</b> địa điểm yêu thích
              </p>
              <button
                type="button"
                className="gz-link"
                id="fvClear"
                onClick={onClearAllFavorites}
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* City Filter Chips */}
          {hasFavorites && (
            <div className="fv-chips" id="fvChips">
              <button
                type="button"
                className={selectedCity === 'all' ? 'active' : ''}
                onClick={() => onSelectCity('all')}
              >
                Tất cả ({cityCounts.all})
              </button>
              {cityKeys.map((k) => {
                const count = cityCounts[k];
                if (count === 0) return null;
                return (
                  <button
                    key={k}
                    type="button"
                    className={selectedCity === k ? 'active' : ''}
                    onClick={() => onSelectCity(k)}
                  >
                    {CITIES[k].name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Favorites Grid */}
          {filteredFavorites.length > 0 ? (
            <div className="gz-tgrid" id="fvGrid">
              {filteredFavorites.map((place) => (
                <FavoriteCard
                  key={place.id}
                  place={place}
                  onView={onViewPlace}
                  onRemove={onRemoveFavorite}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="gz-tempty" id="fvEmpty">
              <div className="ic">♡</div>
              <h3>Chưa có địa điểm yêu thích</h3>
              <p>
                Bấm biểu tượng <b>♡</b> trên các thẻ địa điểm ở mục Khám phá để
                lưu lại và xem nhanh tại đây.
              </p>
              <a
                className="gz-btn"
                href="#kham-pha"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('explore');
                }}
              >
                Khám phá ngay
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
