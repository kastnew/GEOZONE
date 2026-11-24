import React, { useState } from 'react';
import { TAGS } from '../../data/mockData';
import { Search, ShieldCheck } from 'lucide-react';

export default function FilterPanel({
  searchQuery = '',
  onSearchChange = () => {},
  selectedTags = [],
  onToggleTag = () => {},
  onClearTags = () => {},
  selectedZone = '',
  onZoneChange = () => {},
  zones = [],
  selectedCost = '1e9',
  onCostChange = () => {},
  selectedSort = 'pop',
  onSortChange = () => {},
  isOpenOnly = false,
  onOpenOnlyChange = () => {},
  totalCount = 0,
  filteredCount = 0,
  tagCounts = {},
  isAdmin = false,
  onAdminAdd = () => {},
  onAdminExport = () => {},
  onAdminReset = () => {}
}) {
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const getTagSummary = () => {
    const n = selectedTags.length;
    if (n === 0) return 'Loại hình';
    if (n === 1) return TAGS[selectedTags[0]] || selectedTags[0];
    return `${n} loại hình`;
  };

  return (
    <section className="panel">
      {/* Admin Quick Bar */}
      {isAdmin && (
        <div className="adm-bar" id="admBar">
          <span><ShieldCheck size={15} strokeWidth={1.75} aria-hidden="true" /> Chế độ quản trị:</span>
          <button type="button" id="admAdd" onClick={onAdminAdd}>
            + Thêm địa điểm mới
          </button>
          <button type="button" id="admExport" onClick={onAdminExport}>
            Xuất dữ liệu JSON
          </button>
          <button type="button" id="admReset" onClick={onAdminReset}>
            Đặt lại ban đầu
          </button>
        </div>
      )}

      {/* Filter Form Controls */}
      <form className="filters" id="filters" onSubmit={(e) => e.preventDefault()}>
        <div className="row">
          <div className="search">
            <Search className="search-icon" size={16} strokeWidth={1.75} aria-hidden="true" />
            <input
              type="search"
              id="q"
              placeholder="Tìm tên, đường, thể loại…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Tag Dropdown Filter */}
          <details
            className={`tagdd ${selectedTags.length > 0 ? 'on' : ''}`}
            id="tagDd"
            open={isTagDropdownOpen}
          >
            <summary
              className="tagsum"
              aria-label="Loại hình"
              onClick={(e) => {
                e.preventDefault();
                setIsTagDropdownOpen(!isTagDropdownOpen);
              }}
            >
              <span id="tagSum">{getTagSummary()}</span>
            </summary>

            <div className="tagmenu" id="tagChips" role="group" aria-label="Loại hình">
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  className="tagclear"
                  id="tagClear"
                  onClick={onClearTags}
                >
                  Bỏ chọn tất cả ({selectedTags.length})
                </button>
              )}
              {Object.entries(TAGS).map(([key, label]) => {
                const count = tagCounts[key] || 0;
                return (
                  <label key={key} className="opt">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(key)}
                      onChange={() => onToggleTag(key)}
                    />
                    <span>{label}</span>
                    <em>{count}</em>
                  </label>
                );
              })}
            </div>
          </details>

          {/* Zone Selector */}
          <select
            id="zone"
            aria-label="Khu vực"
            value={selectedZone}
            onChange={(e) => onZoneChange(e.target.value)}
          >
            <option value="">Tất cả khu vực</option>
            {zones.map((z) => (
              <option key={z.code} value={z.code}>
                {z.name}
              </option>
            ))}
          </select>

          {/* Cost Selector */}
          <select
            id="cost"
            aria-label="Giá vé"
            value={selectedCost}
            onChange={(e) => onCostChange(e.target.value)}
          >
            <option value="1e9">Mọi mức giá</option>
            <option value="0">Miễn phí</option>
            <option value="100000">Đến 100.000đ</option>
            <option value="300000">Đến 300.000đ</option>
          </select>
        </div>

        <div className="row2">
          {/* Sorting Selector */}
          <select
            id="sort"
            aria-label="Sắp xếp"
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="pop">Nổi tiếng nhất</option>
            <option value="costAsc">Giá thấp đến cao</option>
            <option value="durAsc">Thời gian ngắn nhất</option>
            <option value="name">Tên A–Z</option>
          </select>

          {/* Open Only Checkbox */}
          <label className="check" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              id="open"
              checked={isOpenOnly}
              onChange={(e) => onOpenOnlyChange(e.target.checked)}
            />{' '}
            Đang mở cửa
          </label>
        </div>
      </form>

      {/* Filter Statistics */}
      <p className="count" id="count" aria-live="polite" style={{ padding: '8px 16px', margin: 0, fontSize: '13px', color: 'var(--gz-color-ink-muted)', borderBottom: '1px solid var(--gz-color-line)' }}>
        Hiển thị <b>{filteredCount}</b> / {totalCount} địa điểm
      </p>
    </section>
  );
}
