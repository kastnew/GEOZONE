import React from 'react';
import '../styles/Trips.css';
import TripCard from '../components/trips/TripCard';

export default function TripsPage({
  trips = [],
  isLoggedIn = false,
  onOpenAuth = () => {},
  onViewTrip = () => {},
  onDeleteTrip = () => {},
  onClearAllTrips = () => {},
  onNavigate = () => {}
}) {
  const hasTrips = trips && trips.length > 0;

  return (
    <section className="gz-view gz-trips on" data-view="trips" aria-label="Chuyến đi của tôi">
      {/* Page Header */}
      <div
        className="gz-pb"
        id="gzTripsHero"
        data-k="danang"
        style={{ backgroundImage: "url('/images/heroes/danang.jpg')" }}
      >
        <div className="gz-wrap">
          <h1>Chuyến đi của tôi</h1>
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
            / Lịch sử chuyến đi
          </p>
        </div>
      </div>

      <div className="gz-tbody">
        <div className="gz-wrap">
          {/* Guest Sync Banner */}
          {!isLoggedIn && (
            <div className="gz-gnote" id="gzGuestNote">
              <p>Bạn chưa đăng nhập, nên chuyến đi chỉ lưu trên trình duyệt này.</p>
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
                Đăng nhập để đồng bộ lên máy chủ
              </button>
            </div>
          )}

          {/* Action Toolbar */}
          {hasTrips && (
            <div className="gz-tbar" id="gzTbar">
              <p id="gzTcount">
                Bạn đã lưu <b>{trips.length}</b> chuyến đi
              </p>
              <button
                type="button"
                className="gz-link"
                id="gzTclear"
                onClick={onClearAllTrips}
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Trips Grid */}
          {hasTrips ? (
            <div className="gz-tgrid" id="gzTgrid">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onView={onViewTrip}
                  onDelete={onDeleteTrip}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="gz-tempty" id="gzTempty">
              <div className="ic">🧭</div>
              <h3>Chưa có chuyến đi nào được lưu</h3>
              <p>
                Sau khi lập kế hoạch ở mục Khám phá, hãy bấm <b>Lưu lịch trình</b>{' '}
                để chuyến đi xuất hiện ở đây.
              </p>
              <a
                className="gz-btn"
                href="#kham-pha"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('explore', { mode: 'plan' });
                }}
              >
                Tạo chuyến đi đầu tiên
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
