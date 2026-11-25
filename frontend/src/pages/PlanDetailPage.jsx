import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, MapPin, Pencil, Share2, Trash2, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ExploreMap from '../components/explore/ExploreMap.jsx';
import { TimelineView } from '../components/timeline/TimelineView.jsx';
import AdminConfirmModal from '../components/admin/AdminConfirmModal.jsx';
import { RenamePlanDialog, SharePlanDialog } from '../components/trips/PlanManagementDialogs.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { deletePlan, getPlanById, getSharedPlan, updatePlan } from '../services/api.js';
import { CITIES, formatVND } from '../data/mockData.js';
import '../styles/Trips.css';

function makeTimelinePlan(plan) {
  const rawData = plan.planData || plan.plan_data || {};
  const days = Array.isArray(plan.days) ? plan.days : (rawData.days || []);
  const normalizedDays = days.map((day, index) => {
    const rawActivities = day.activities || day.places || [];
    const activities = rawActivities.map((activity) => ({
      ...activity,
      placeId: activity.placeId ?? activity.id,
      id: activity.placeId ?? activity.id,
      placeName: activity.placeName || activity.name || 'Địa điểm',
      name: activity.placeName || activity.name || 'Địa điểm',
      timeSlot: activity.timeSlot || activity.time || 'Chưa có khung giờ',
      estimatedCost: Number(activity.estimatedCost ?? activity.cost ?? 0)
    }));
    return {
      ...day,
      dayNumber: day.dayNumber || index + 1,
      title: day.title || `Ngày ${index + 1}`,
      totalEstimatedCost: Number(
        day.totalEstimatedCost
        ?? day.totalCost
        ?? activities.reduce((sum, item) => sum + item.estimatedCost, 0)
      ),
      activities
    };
  });

  return {
    ...rawData,
    ...plan,
    city: plan.cityName || plan.city,
    totalDays: plan.totalDays || normalizedDays.length,
    totalBudget: Number(plan.totalBudget ?? rawData.totalBudget ?? rawData.budget ?? 0),
    actualCost: Number(plan.actualCost ?? rawData.actualCost ?? plan.totalCost ?? 0),
    days: normalizedDays
  };
}

export default function PlanDetailPage({
  shared = false,
  planId,
  shareToken,
  onPlanDeleted = () => {}
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setPlan(null);
    setError('');
    setIsLoading(true);
    const request = shared
      ? (shareToken ? getSharedPlan(shareToken) : Promise.reject(new Error('Liên kết chia sẻ không hợp lệ.')))
      : (planId ? getPlanById(planId) : Promise.reject(new Error('ID lịch trình không hợp lệ.')));
    request
      .then((result) => {
        if (active) setPlan(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Không thể tải lịch trình.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [planId, shareToken, shared]);

  const timelinePlan = useMemo(() => plan ? makeTimelinePlan(plan) : null, [plan]);
  const cityConfig = CITIES[plan?.city] || CITIES.danang;
  const mapPlaces = useMemo(() => (
    timelinePlan?.days.flatMap((day) => day.activities) || []
  ), [timelinePlan]);

  const handleRename = async (id, title) => {
    const updated = await updatePlan(id, { title });
    setPlan(updated);
    showToast('Đã đổi tên chuyến đi.', 'success');
    return updated;
  };

  const handleShareToggle = async (id, is_public) => {
    const updated = await updatePlan(id, { is_public });
    setPlan(updated);
    return updated;
  };

  const handleDelete = async () => {
    if (!plan) return;
    setIsDeleting(true);
    try {
      await deletePlan(plan.id);
      onPlanDeleted(plan.id);
      showToast('Đã xóa chuyến đi thành công.', 'success');
      setIsDeleteOpen(false);
      navigate('/my-trips', { replace: true });
    } catch (deleteError) {
      showToast(deleteError.message || 'Không thể xóa chuyến đi.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="gz-plan-page">
        <div className="gz-plan-detail-wrap" role="status" aria-label="Đang tải lịch trình">
          <div className="gz-plan-skeleton gz-plan-skeleton-heading" />
          <div className="gz-plan-skeleton gz-plan-skeleton-map" />
          <div className="gz-plan-skeleton gz-plan-skeleton-timeline" />
        </div>
      </section>
    );
  }

  if (error || !plan || !timelinePlan) {
    if (shared) {
      return (
        <section className="gz-plan-page">
          <section className="gz-plan-unavailable">
            <span className="gz-plan-unavailable-mark"><MapPin size={22} strokeWidth={1.75} aria-hidden="true" /></span>
            <h1>Lịch trình không khả dụng</h1>
            <p>Lịch trình này không tồn tại hoặc đã ngừng chia sẻ.</p>
            <Link className="gz-btn" to="/">Khám phá GeoZone AI</Link>
          </section>
        </section>
      );
    }
    return (
      <section className="gz-plan-page">
        <section className="gz-plan-unavailable">
          <h1>Không thể mở lịch trình</h1>
          <p>{error || 'Không tìm thấy chuyến đi này hoặc bạn không có quyền truy cập.'}</p>
          <Link className="gz-btn" to="/my-trips"><ArrowLeft size={16} strokeWidth={1.75} /> Về chuyến đi của tôi</Link>
        </section>
      </section>
    );
  }

  const authorName = plan.user?.name || plan.user?.username || 'một người dùng GeoZone';

  return (
    <section className="gz-plan-page">
      <div className="gz-plan-detail-wrap">
        <Link className="gz-plan-back-link" to={shared ? '/' : '/my-trips'}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          {shared ? 'Về trang chủ' : 'Chuyến đi của tôi'}
        </Link>

        <header className="gz-plan-detail-header">
          <div>
            <p className="gz-plan-eyebrow">{shared ? `Được chia sẻ bởi ${authorName}` : 'Lịch trình đã lưu'}</p>
            <h1>{plan.title || plan.name || 'Chuyến đi không tên'}</h1>
            <div className="gz-plan-detail-meta">
              <span><MapPin size={15} strokeWidth={1.75} aria-hidden="true" /> {plan.cityName || cityConfig.name}</span>
              <span>{plan.totalDays || timelinePlan.days.length} ngày</span>
              <span><Wallet size={15} strokeWidth={1.75} aria-hidden="true" /> {formatVND(plan.actualCost || 0)}</span>
            </div>
          </div>
          {!shared && (
            <div className="gz-plan-detail-actions">
              <button type="button" className="gz-btn ghost" onClick={() => setIsRenameOpen(true)}>
                <Pencil size={15} strokeWidth={1.75} aria-hidden="true" /> Đổi tên
              </button>
              <button type="button" className="gz-btn ghost" onClick={() => setIsShareOpen(true)}>
                <Share2 size={15} strokeWidth={1.75} aria-hidden="true" /> Chia sẻ
              </button>
              <button type="button" className="gz-btn ghost gz-plan-delete-button" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" /> Xóa
              </button>
            </div>
          )}
        </header>

        {shared && (
          <div className="gz-plan-share-banner">
            Lịch trình được chia sẻ công khai bởi <strong>{authorName}</strong>.
          </div>
        )}

        <div className="gz-plan-detail-summary">
          <div><span>Ngân sách</span><strong className="gz-numeric">{formatVND(plan.totalBudget || 0)}</strong></div>
          <div><span>Chi phí dự kiến</span><strong className="gz-numeric">{formatVND(plan.actualCost || 0)}</strong></div>
          <div><span>Điểm đến</span><strong>{plan.cityName || cityConfig.name}</strong></div>
        </div>

        <section className="gz-plan-map-section" aria-label="Bản đồ lịch trình">
          <h2>Các điểm trong hành trình</h2>
          <ExploreMap
            cityConfig={cityConfig}
            places={mapPlaces}
            readOnly
          />
        </section>

        <section className="gz-plan-timeline-section" aria-label="Lịch trình theo ngày">
          <h2>Lịch trình từng ngày</h2>
          {timelinePlan.days.length
            ? <TimelineView plan={timelinePlan} />
            : <p className="gz-plan-no-days">Lịch trình này chưa có dữ liệu các ngày tham quan.</p>}
        </section>

        {shared && (
          <div className="gz-plan-create-cta">
            <div>
              <h2>Lên kế hoạch cho chuyến đi của riêng bạn</h2>
              <p>Khám phá điểm đến và tạo lịch trình tối ưu cùng GeoZone AI.</p>
            </div>
            <Link className="gz-btn" to="/"><ArrowUpRight size={16} strokeWidth={1.75} /> Tạo lịch trình riêng</Link>
          </div>
        )}
      </div>

      {!shared && (
        <>
          <RenamePlanDialog
            trip={isRenameOpen ? plan : null}
            onClose={() => setIsRenameOpen(false)}
            onSave={handleRename}
          />
          <SharePlanDialog
            trip={isShareOpen ? plan : null}
            onClose={() => setIsShareOpen(false)}
            onToggle={handleShareToggle}
          />
          {isDeleteOpen && (
            <AdminConfirmModal
              title="Xóa chuyến đi này?"
              message={`Lịch trình "${plan.title || plan.name}" sẽ bị xóa khỏi tài khoản và không thể khôi phục.`}
              confirmLabel="Xóa chuyến đi"
              isBusy={isDeleting}
              onCancel={() => {
                if (!isDeleting) setIsDeleteOpen(false);
              }}
              onConfirm={handleDelete}
            />
          )}
        </>
      )}
    </section>
  );
}
