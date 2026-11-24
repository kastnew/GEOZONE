import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Layers,
  MapPin,
  ShieldCheck,
  Star,
  Tag,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getAdminHealthApi,
  getAdminPlacesApi,
  getAdminTagsApi,
  getAdminUsersApi,
  getAdminZonesApi
} from '../../services/api';

const initialOverview = {
  health: null,
  totalUsers: null,
  activeUsers: null,
  lockedUsers: null,
  recentUsers: null,
  places: null,
  zones: null,
  tags: null
};

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

function KpiCard({ icon: Icon, label, value, detail, tone = 'ocean' }) {
  return (
    <article className={`gz-admin-kpi gz-admin-kpi-${tone}`}>
      <div className="gz-admin-kpi-top">
        <span className="gz-admin-kpi-icon"><Icon size={19} strokeWidth={1.75} aria-hidden="true" /></span>
        <span className="gz-admin-kpi-label">{label}</span>
      </div>
      <strong className="gz-admin-kpi-value" data-numeric>{value}</strong>
      <span className="gz-admin-kpi-detail">{detail}</span>
    </article>
  );
}

function DistributionBar({ label, count, total, color, suffix = '' }) {
  const percent = total ? Math.max(0, Math.min(100, (count / total) * 100)) : 0;
  const safePercent = Number.isFinite(percent) ? percent : 0;
  return (
    <div className="gz-admin-distribution-row">
      <div className="gz-admin-distribution-copy">
        <span>{label}</span>
        <strong data-numeric>{formatNumber(count)}{suffix}</strong>
      </div>
      <div className="gz-admin-progress-track" aria-label={`Phân bổ: ${safePercent.toFixed(0)}%`}>
        <span style={{ width: `${safePercent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function placeTagNames(place) {
  if (!Array.isArray(place.tags)) return [];
  return place.tags.map((tag) => (typeof tag === 'string' ? tag : tag?.name)).filter(Boolean);
}

export default function AdminOverviewPage({ showToast }) {
  const [overview, setOverview] = useState(initialOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    Promise.all([
      getAdminHealthApi(),
      getAdminUsersApi({ page: 1, limit: 1 }),
      getAdminUsersApi({ page: 1, limit: 1, is_active: true }),
      getAdminUsersApi({ page: 1, limit: 1, is_active: false }),
      getAdminUsersApi({ page: 1, limit: 5 }),
      getAdminPlacesApi({ city: '' }),
      getAdminZonesApi(),
      getAdminTagsApi()
    ]).then(([health, allUsers, activeUsers, lockedUsers, recentUsers, places, zones, tags]) => {
      if (!active) return;
      setOverview({
        health,
        totalUsers: allUsers.pagination.total,
        activeUsers: activeUsers.pagination.total,
        lockedUsers: lockedUsers.pagination.total,
        recentUsers: recentUsers.users,
        places: Array.isArray(places) ? places : [],
        zones: Array.isArray(zones) ? zones : [],
        tags: Array.isArray(tags) ? tags : []
      });
    }).catch((error) => {
      if (!active) return;
      const message = error.message || 'Không thể tải dữ liệu tổng quan.';
      setLoadError(message);
      showToast(message, 'error');
    }).finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [showToast]);

  const hasData = Array.isArray(overview.places);
  const places = hasData ? overview.places : [];
  const zones = Array.isArray(overview.zones) ? overview.zones : [];
  const averageRating = hasData && places.length
    ? places.reduce((sum, place) => sum + (Number(place.rating) || 0), 0) / places.length
    : null;
  const averageRatingLabel = Number.isFinite(averageRating) ? averageRating.toFixed(1) : null;
  const maxZonePlaces = Math.max(1, ...zones.map((zone) => Number(zone?._count?.places) || 0));
  const tagCounts = new Map();
  places.forEach((place) => placeTagNames(place).forEach((tag) => {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }));
  const tagRows = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const priceBands = [
    { label: 'Miễn phí', min: 0, max: 0, color: 'var(--gz-color-success)' },
    { label: 'Dưới 100.000đ', min: 1, max: 99999, color: 'var(--gz-zone-z2)' },
    { label: '100.000–300.000đ', min: 100000, max: 300000, color: 'var(--gz-zone-z3)' },
    { label: 'Trên 300.000đ', min: 300001, max: Infinity, color: 'var(--gz-zone-z4)' }
  ].map((band) => ({
    ...band,
    count: places.filter((place) => {
      const cost = Number(place.estimatedCost) || 0;
      return cost >= band.min && cost <= band.max;
    }).length
  }));
  const isHealthy = ['ok', 'healthy', 'up'].includes(String(overview.health?.status || '').toLowerCase());

  return (
    <div className="gz-admin-page">
      <div className="gz-admin-page-intro">
        <div>
          <p className="gz-admin-eyebrow">GeoZone AI · Da Nang</p>
          <h2>Tình hình vận hành</h2>
          <p className="gz-admin-muted">Tổng quan được tổng hợp trực tiếp từ dữ liệu hệ thống.</p>
        </div>
        {overview.health?.timestamp && (
          <span className="gz-admin-updated">Cập nhật {formatDate(overview.health.timestamp)}</span>
        )}
      </div>

      {loadError && (
        <div className="gz-admin-inline-error" role="alert">
          <strong>Không tải được dữ liệu quản trị.</strong>
          <span>{loadError}</span>
        </div>
      )}

      <section className="gz-admin-kpi-grid" aria-label="Chỉ số hệ thống">
        {isLoading ? (
          Array.from({ length: 4 }, (_, index) => <div className="gz-admin-kpi gz-admin-skeleton" key={index} />)
        ) : (
          <>
            <KpiCard
              icon={Users}
              label="Người dùng hoạt động"
              value={overview.activeUsers === null ? '—' : `${formatNumber(overview.activeUsers)} / ${formatNumber(overview.totalUsers)}`}
              detail={overview.lockedUsers === null ? 'Không có dữ liệu người dùng' : `${formatNumber(overview.lockedUsers)} tài khoản bị khóa`}
            />
            <KpiCard
              icon={MapPin}
              label="Tổng địa điểm"
              value={hasData ? formatNumber(places.length) : '—'}
              detail={averageRatingLabel === null ? 'Chưa có dữ liệu đánh giá' : <><Star size={14} fill="currentColor" /> Trung bình {averageRatingLabel} / 5</>}
              tone="sand"
            />
            <KpiCard
              icon={Layers}
              label="Phân vùng địa lý"
              value={Array.isArray(overview.zones) ? formatNumber(overview.zones.length) : '—'}
              detail={Array.isArray(overview.tags) ? `${formatNumber(overview.tags.length)} loại hình` : 'Không có dữ liệu loại hình'}
              tone="sage"
            />
            <KpiCard
              icon={overview.health ? Activity : ShieldCheck}
              label="Trạng thái hệ thống"
              value={overview.health ? (isHealthy ? 'Ổn định' : 'Cần kiểm tra') : 'Không khả dụng'}
              detail={overview.health?.service || 'Health check API'}
              tone={overview.health && isHealthy ? 'sage' : 'neutral'}
            />
          </>
        )}
      </section>

      <section className="gz-admin-insights-grid">
        <article className="gz-admin-panel">
          <header className="gz-admin-panel-header">
            <div>
              <p className="gz-admin-eyebrow">Phân bố địa lý</p>
              <h3>Địa điểm theo Zone</h3>
            </div>
            <MapPin size={19} strokeWidth={1.75} aria-hidden="true" />
          </header>
          {isLoading ? <div className="gz-admin-panel-loading">Đang tổng hợp…</div> : loadError ? (
            <p className="gz-admin-empty-note">Không thể tải dữ liệu phân vùng.</p>
          ) : zones.length ? (
            <div className="gz-admin-distribution-list">
              {zones.map((zone, index) => {
                const zoneCode = String(zone.code || `Z${index + 1}`).toUpperCase();
                const zoneColor = `var(--gz-zone-${zoneCode.toLowerCase()}, var(--gz-color-primary))`;
                return (
                  <DistributionBar
                    key={zone.id || zoneCode}
                    label={<span className="gz-admin-zone-label"><i style={{ backgroundColor: zoneColor }} />{zoneCode} · {zone.name}</span>}
                    count={Number(zone?._count?.places) || 0}
                    total={maxZonePlaces}
                    color={zoneColor}
                  />
                );
              })}
            </div>
          ) : <p className="gz-admin-empty-note">Chưa có dữ liệu khu vực.</p>}
        </article>

        <article className="gz-admin-panel">
          <header className="gz-admin-panel-header">
            <div>
              <p className="gz-admin-eyebrow">Danh mục</p>
              <h3>Loại hình & mức giá</h3>
            </div>
            <Tag size={19} strokeWidth={1.75} aria-hidden="true" />
          </header>
          {isLoading ? <div className="gz-admin-panel-loading">Đang tổng hợp…</div> : loadError ? (
            <p className="gz-admin-empty-note">Không thể tải dữ liệu phân loại.</p>
          ) : (
            <div className="gz-admin-dual-distribution">
              <div>
                <h4>Loại hình phổ biến</h4>
                {tagRows.length ? tagRows.map(([name, count], index) => (
                  <DistributionBar
                    key={name}
                    label={name}
                    count={count}
                    total={places.length}
                    color={`var(--gz-zone-z${(index % 5) + 1})`}
                  />
                )) : <p className="gz-admin-empty-note">Chưa có dữ liệu loại hình.</p>}
              </div>
              <div>
                <h4>Mức giá</h4>
                {priceBands.map((band) => (
                  <DistributionBar
                    key={band.label}
                    label={band.label}
                    count={band.count}
                    total={places.length}
                    color={band.color}
                  />
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="gz-admin-panel gz-admin-recent-panel">
        <header className="gz-admin-panel-header">
          <div>
            <p className="gz-admin-eyebrow">Hoạt động gần đây</p>
            <h3>Người dùng mới</h3>
          </div>
          <Link to="/admin/users" className="gz-admin-text-link">
            Xem tất cả <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </header>
        {isLoading ? <div className="gz-admin-panel-loading">Đang tải người dùng…</div> : loadError ? (
          <p className="gz-admin-empty-note">Không thể tải danh sách người dùng.</p>
        ) : overview.recentUsers?.length ? (
          <div className="gz-admin-table-wrap">
            <table className="gz-admin-table gz-admin-recent-table">
              <thead>
                <tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tham gia</th></tr>
              </thead>
              <tbody>
                {overview.recentUsers.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="gz-admin-person-cell">
                        <span className="gz-admin-avatar">{(item.name || item.email || 'U').charAt(0).toUpperCase()}</span>
                        <span><strong>{item.name || 'Chưa đặt tên'}</strong><small>{item.email}</small></span>
                      </div>
                    </td>
                    <td><span className={`gz-admin-role-badge role-${String(item.role || 'USER').toLowerCase()}`}>{item.role || 'USER'}</span></td>
                    <td><span className={`gz-admin-status${item.is_active ? ' is-active' : ' is-locked'}`}><i />{item.is_active ? 'Hoạt động' : 'Bị khóa'}</span></td>
                    <td className="gz-admin-numeric">{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="gz-admin-empty-note">Chưa có người dùng để hiển thị.</p>}
      </section>
    </div>
  );
}
