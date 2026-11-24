import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal.jsx';
import AdminPlaceFormModal from '../../components/admin/AdminPlaceFormModal.jsx';
import {
  adminCreatePlaceApi,
  adminDeletePlaceApi,
  adminUpdatePlaceApi,
  getAdminPlacesApi,
  getAdminTagsApi,
  getAdminZonesApi
} from '../../services/api';

const cityLabels = {
  'Da Nang': 'Đà Nẵng',
  'Hue': 'Huế',
  'Ha Noi': 'Hà Nội',
  'Ha Long': 'Hạ Long',
  'Ninh Binh': 'Ninh Bình'
};

const priceBands = [
  { value: 'all', label: 'Mọi mức giá' },
  { value: 'free', label: 'Miễn phí' },
  { value: 'under-100', label: 'Dưới 100.000đ' },
  { value: '100-300', label: '100.000–300.000đ' },
  { value: 'over-300', label: 'Trên 300.000đ' }
];

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
}

function formatCost(value) {
  return `${formatNumber(value)}đ`;
}

function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

function tagNames(place) {
  if (!Array.isArray(place.tags)) return [];
  return place.tags.map((tag) => (typeof tag === 'string' ? tag : tag?.name)).filter(Boolean);
}

function placeCostMatches(cost, filter) {
  if (filter === 'free') return cost === 0;
  if (filter === 'under-100') return cost > 0 && cost < 100000;
  if (filter === '100-300') return cost >= 100000 && cost <= 300000;
  if (filter === 'over-300') return cost > 300000;
  return true;
}

function ZonePill({ place }) {
  const code = String(place.zoneCode || '').toLowerCase();
  return <span className={`gz-admin-zone-pill ${code}`}>{place.zoneCode || `Z${place.zoneId}`}</span>;
}

function PlaceThumbnail({ place }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [place.imageUrl]);

  return (
    <span className="gz-admin-place-thumbnail">
      {place.imageUrl && !failed
        ? <img src={place.imageUrl} alt="" onError={() => setFailed(true)} />
        : <MapPin size={18} strokeWidth={1.75} aria-hidden="true" />}
    </span>
  );
}

export default function AdminPlacesPage({ showToast }) {
  const [places, setPlaces] = useState([]);
  const [zones, setZones] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [editingPlace, setEditingPlace] = useState(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    Promise.all([
      getAdminPlacesApi({ city: '' }),
      getAdminZonesApi(),
      getAdminTagsApi()
    ]).then(([placeList, zoneList, tagList]) => {
      if (!active) return;
      setPlaces(Array.isArray(placeList) ? placeList : []);
      setZones(Array.isArray(zoneList) ? zoneList : []);
      setTags(Array.isArray(tagList) ? tagList : []);
    }).catch((error) => {
      if (!active) return;
      const message = error.message || 'Không thể tải danh mục địa điểm.';
      setLoadError(message);
      setPlaces([]);
      setZones([]);
      setTags([]);
      showToast(message, 'error');
    }).finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [reloadKey, showToast]);

  const cities = useMemo(() => [...new Set(places.map((place) => place.city).filter(Boolean))].sort(), [places]);
  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matching = places.filter((place) => {
      const cost = Number(place.estimatedCost) || 0;
      const matchesSearch = !query || `${place.name || ''} ${place.address || ''}`.toLocaleLowerCase().includes(query);
      const matchesCity = cityFilter === 'all' || place.city === cityFilter;
      const matchesZone = zoneFilter === 'all' || String(place.zoneId) === zoneFilter;
      const matchesTag = tagFilter === 'all' || tagNames(place).some((tag) => tag.toLocaleLowerCase() === tagFilter.toLocaleLowerCase());
      const matchesRating = ratingFilter === 'all' || (Number(place.rating) || 0) >= Number(ratingFilter);
      return matchesSearch && matchesCity && matchesZone && matchesTag && matchesRating && placeCostMatches(cost, priceFilter);
    });

    if (sortBy === 'rating') matching.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    if (sortBy === 'popularity') matching.sort((a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0));
    if (sortBy === 'cost-asc') matching.sort((a, b) => (Number(a.estimatedCost) || 0) - (Number(b.estimatedCost) || 0));
    if (sortBy === 'cost-desc') matching.sort((a, b) => (Number(b.estimatedCost) || 0) - (Number(a.estimatedCost) || 0));
    return matching;
  }, [places, search, cityFilter, zoneFilter, tagFilter, priceFilter, ratingFilter, sortBy]);

  const totalPages = Math.ceil(filteredPlaces.length / limit);
  const visiblePlaces = filteredPlaces.slice((page - 1) * limit, page * limit);
  const startRow = filteredPlaces.length ? ((page - 1) * limit) + 1 : 0;
  const endRow = Math.min(page * limit, filteredPlaces.length);

  const clearFilters = () => {
    setSearch('');
    setCityFilter('all');
    setZoneFilter('all');
    setTagFilter('all');
    setPriceFilter('all');
    setRatingFilter('all');
    setSortBy('default');
    setLimit(10);
    setPage(1);
  };

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editingPlace) {
        await adminUpdatePlaceApi(editingPlace.id, payload);
        showToast('Đã cập nhật địa điểm thành công.', 'success');
      } else {
        await adminCreatePlaceApi(payload);
        showToast('Đã thêm địa điểm thành công.', 'success');
      }
      setEditingPlace(undefined);
      setReloadKey((value) => value + 1);
    } catch (error) {
      showToast(error.message || 'Không thể lưu địa điểm.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await adminDeletePlaceApi(pendingDelete.id);
      showToast('Đã xóa địa điểm thành công.', 'success');
      setPendingDelete(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      showToast(error.message || 'Không thể xóa địa điểm.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="gz-admin-page">
      <div className="gz-admin-page-intro">
        <div>
          <p className="gz-admin-eyebrow">Danh mục du lịch</p>
          <h2>Địa điểm</h2>
          <p className="gz-admin-muted">Quản lý nội dung, thông tin địa lý và phân loại địa điểm.</p>
        </div>
        <button className="gz-admin-button gz-admin-button-primary" type="button" onClick={() => setEditingPlace(null)} disabled={!zones.length}>
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          Thêm địa điểm
        </button>
      </div>

      <section className="gz-admin-panel">
        <div className="gz-admin-filter-bar gz-admin-place-filters">
          <label className="gz-admin-search">
            <Search size={17} strokeWidth={1.75} aria-hidden="true" />
            <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm tên hoặc địa chỉ" aria-label="Tìm địa điểm" />
          </label>
          <select aria-label="Lọc theo thành phố" value={cityFilter} onChange={(event) => { setCityFilter(event.target.value); setPage(1); }}>
            <option value="all">Mọi thành phố</option>
            {cities.map((city) => <option key={city} value={city}>{cityLabels[city] || city}</option>)}
          </select>
          <select aria-label="Lọc theo khu vực" value={zoneFilter} onChange={(event) => { setZoneFilter(event.target.value); setPage(1); }}>
            <option value="all">Mọi khu vực</option>
            {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.code} · {zone.name}</option>)}
          </select>
          <select aria-label="Lọc theo loại hình" value={tagFilter} onChange={(event) => { setTagFilter(event.target.value); setPage(1); }}>
            <option value="all">Mọi loại hình</option>
            {tags.map((tag) => <option key={tag.id ?? tag.name} value={tag.name}>{tag.name}</option>)}
          </select>
          <select aria-label="Lọc theo mức giá" value={priceFilter} onChange={(event) => { setPriceFilter(event.target.value); setPage(1); }}>
            {priceBands.map((band) => <option key={band.value} value={band.value}>{band.label}</option>)}
          </select>
          <select aria-label="Lọc theo đánh giá" value={ratingFilter} onChange={(event) => { setRatingFilter(event.target.value); setPage(1); }}>
            <option value="all">Mọi đánh giá</option>
            <option value="4.5">Từ 4,5 sao</option>
            <option value="4">Từ 4 sao</option>
            <option value="3">Từ 3 sao</option>
          </select>
          <select aria-label="Sắp xếp địa điểm" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
            <option value="default">Mặc định</option>
            <option value="rating">Đánh giá cao</option>
            <option value="popularity">Phổ biến nhất</option>
            <option value="cost-asc">Giá tăng dần</option>
            <option value="cost-desc">Giá giảm dần</option>
          </select>
          <select aria-label="Số dòng mỗi trang" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
          <button className="gz-admin-button gz-admin-button-quiet" type="button" onClick={clearFilters}>Xóa bộ lọc</button>
        </div>

        {loadError && <p className="gz-admin-inline-error" role="alert">{loadError}</p>}
        <div className="gz-admin-table-wrap">
          <table className="gz-admin-table gz-admin-places-table">
            <thead>
              <tr>
                <th>Địa điểm</th>
                <th>Thành phố / Zone</th>
                <th>Chi phí</th>
                <th>Thời lượng / Giờ</th>
                <th>Đánh giá / Phổ biến</th>
                <th>Loại hình</th>
                <th><span className="gz-admin-sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="gz-admin-table-message" colSpan="7">Đang tải địa điểm…</td></tr>
              ) : loadError ? (
                <tr><td className="gz-admin-table-message" colSpan="7">Không thể tải dữ liệu địa điểm.</td></tr>
              ) : visiblePlaces.length ? visiblePlaces.map((place) => (
                <tr key={place.id}>
                  <td>
                    <div className="gz-admin-place-cell">
                      <PlaceThumbnail place={place} />
                      <span className="gz-admin-place-copy">
                        <strong>{place.name}</strong>
                        <small>{place.address || 'Chưa có địa chỉ'}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="gz-admin-city-name">{cityLabels[place.city] || place.city || '—'}</span>
                    <div className="gz-admin-place-zone"><ZonePill place={place} /><span>{place.zoneName}</span></div>
                  </td>
                  <td className="gz-admin-numeric">{formatCost(place.estimatedCost)}</td>
                  <td>
                    <span className="gz-admin-numeric">{formatNumber(place.duration)} phút</span>
                    <small className="gz-admin-table-subline">{formatTime(place.openingTime)}–{formatTime(place.closingTime)}</small>
                  </td>
                  <td>
                    <span className="gz-admin-rating"><Star size={13} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />{Number(place.rating || 0).toFixed(1)}</span>
                    <small className="gz-admin-table-subline">Phổ biến {Math.round((Number(place.popularity) || 0) * 100)}%</small>
                  </td>
                  <td>
                    <div className="gz-admin-place-tags">
                      {tagNames(place).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                      {tagNames(place).length > 3 && <small>+{tagNames(place).length - 3}</small>}
                      {!tagNames(place).length && <small>—</small>}
                    </div>
                  </td>
                  <td>
                    <div className="gz-admin-row-actions">
                      <button className="gz-admin-icon-button" type="button" onClick={() => setEditingPlace(place)} aria-label={`Sửa ${place.name}`} title="Sửa">
                        <Pencil size={16} strokeWidth={1.75} />
                      </button>
                      <button className="gz-admin-icon-button gz-admin-danger-action" type="button" onClick={() => setPendingDelete(place)} aria-label={`Xóa ${place.name}`} title="Xóa">
                        <Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              )              ) : <tr><td className="gz-admin-table-message" colSpan="7">Không tìm thấy địa điểm phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>

        <footer className="gz-admin-pagination">
          <p data-numeric>{loadError ? 'Không thể tải thông tin phân trang.' : `Hiển thị ${startRow}–${endRow} trên ${formatNumber(filteredPlaces.length)} địa điểm`}</p>
          <div className="gz-admin-pagination-controls" aria-label="Phân trang địa điểm">
            <button type="button" className="gz-admin-page-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || isLoading} aria-label="Trang trước">
              <ChevronLeft size={17} strokeWidth={1.75} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNumber = start + index;
              return (
                <button key={pageNumber} type="button" className={`gz-admin-page-button${pageNumber === page ? ' is-current' : ''}`} onClick={() => setPage(pageNumber)} disabled={isLoading} aria-current={pageNumber === page ? 'page' : undefined}>
                  {pageNumber}
                </button>
              );
            })}
            <button type="button" className="gz-admin-page-button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || isLoading} aria-label="Trang sau">
              <ChevronRight size={17} strokeWidth={1.75} />
            </button>
          </div>
        </footer>
      </section>

      {editingPlace !== undefined && (
        <AdminPlaceFormModal
          place={editingPlace}
          zones={zones}
          tags={tags}
          cities={cities}
          isSaving={isSaving}
          onClose={() => { if (!isSaving) setEditingPlace(undefined); }}
          onSave={handleSave}
        />
      )}

      {pendingDelete && (
        <AdminConfirmModal
          title="Xóa địa điểm?"
          message={`Địa điểm “${pendingDelete.name}” sẽ bị xóa khỏi danh mục.`}
          confirmLabel="Xóa địa điểm"
          isBusy={isDeleting}
          onCancel={() => { if (!isDeleting) setPendingDelete(null); }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
