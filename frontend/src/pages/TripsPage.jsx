import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Trips.css';
import TripCard from '../components/trips/TripCard';
import { Compass } from 'lucide-react';
import { RenamePlanDialog, SharePlanDialog } from '../components/trips/PlanManagementDialogs.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function TripsPage({
  trips = [],
  isLoading = false,
  isLoggedIn = false,
  onOpenAuth = () => {},
  onViewTrip = () => {},
  onDeleteTrip = () => {},
  onRenameTrip = async () => {},
  onToggleTripShare = async () => {},
  onClearAllTrips = () => {},
  onNavigate = () => {}
}) {
  const [tripToRename, setTripToRename] = useState(null);
  const [tripToShare, setTripToShare] = useState(null);
  const { showToast } = useToast();
  const hasTrips = trips && trips.length > 0;

  const handleRename = async (tripId, title) => {
    const updated = await onRenameTrip(tripId, title);
    showToast('Đã đổi tên chuyến đi.', 'success');
    return updated;
  };

  const handleShareToggle = async (tripId, isPublic) => {
    const updated = await onToggleTripShare(tripId, isPublic);
    setTripToShare(updated);
    return updated;
  };

  return (
    <section className="gz-view gz-trips on" data-view="trips" aria-label="Chuyến đi của tôi">
      {/* Page Header */}
      <div
        className="gz-pb"
        id="gzTripsHero"
        data-k="danang"
        style={{ '--gz-hero-image': "url('/images/heroes/danang.jpg')" }}
      >
        <div className="gz-wrap">
          <h1>Chuyến đi của tôi</h1>
          <p className="gz-crumb">
            <Link to="/">
              Trang chủ
            </Link>{' '}
            / Lịch sử chuyến đi
          </p>
        </div>
      </div>

      <div className="gz-tbody">
        <div className="gz-wrap">
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
          {isLoading ? (
            <div className="gz-tgrid" role="status" aria-live="polite" aria-label="Đang tải chuyến đi">
              {[1, 2, 3].map((item) => <div className="tcard-skeleton" key={item} />)}
            </div>
          ) : hasTrips ? (
            <div className="gz-tgrid" id="gzTgrid">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onView={onViewTrip}
                  onDelete={onDeleteTrip}
                  onRename={setTripToRename}
                  onShare={setTripToShare}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="gz-tempty" id="gzTempty">
              <div className="ic"><Compass size={32} strokeWidth={1.75} aria-hidden="true" /></div>
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
      <RenamePlanDialog
        trip={tripToRename}
        onClose={() => setTripToRename(null)}
        onSave={handleRename}
      />
      <SharePlanDialog
        trip={tripToShare}
        onClose={() => setTripToShare(null)}
        onToggle={handleShareToggle}
      />
    </section>
  );
}
