import React, { useState } from 'react';
import { CITIES, TAGS, formatVND } from '../../data/mockData';

export default function PlannerSidebar({
  selectedCity = 'hue',
  onCityChange = () => {},
  daysCount = 2,
  onDaysChange = () => {},
  budget = 1000000,
  onBudgetChange = () => {},
  selectedPreferences = [],
  onTogglePreference = () => {},
  onClearPreferences = () => {},
  onSubmit = () => {},
  isLoading = false,
  pinnedCount = 0
}) {
  const [validationError, setValidationError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const submitPlanner = () => {
    if (daysCount < 1 || budget < 100000) {
      setValidationError('Vui lòng chọn số ngày và ngân sách hợp lệ.');
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 320);
      return;
    }
    setValidationError('');
    onSubmit();
  };

  return (
    <aside className={`pform ${isShaking ? 'is-shaking' : ''}`}>
      <h2>Thiết lập chuyến đi</h2>

      <label>
        Điểm đến
        <select
          id="pCity"
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
        >
          {Object.entries(CITIES).map(([key, config]) => (
            <option key={key} value={key}>
              {config.name}
            </option>
          ))}
        </select>
      </label>

      <div className="gz-quick-presets" aria-label="Thiết lập nhanh">
        <div>
          <span className="gz-preset-label">Ngân sách nhanh</span>
          <div className="gz-preset-list">
            {[1500000, 3000000, 5000000].map((value) => (
              <button
                type="button"
                key={value}
                className={budget === value ? 'is-active' : ''}
                aria-pressed={budget === value}
                onClick={() => onBudgetChange(value)}
              >
                {formatVND(value)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="gz-preset-label">Thời lượng nhanh</span>
          <div className="gz-preset-list">
            {[2, 3, 4].map((value) => (
              <button
                type="button"
                key={value}
                className={daysCount === value ? 'is-active' : ''}
                aria-pressed={daysCount === value}
                onClick={() => onDaysChange(value)}
              >
                {value} ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      <label>
        Số ngày
        <select
          id="pDays"
          value={daysCount}
          onChange={(e) => onDaysChange(parseInt(e.target.value, 10))}
        >
          <option value="1">1 ngày</option>
          <option value="2">2 ngày</option>
          <option value="3">3 ngày</option>
          <option value="4">4 ngày</option>
        </select>
      </label>

      <label>
        Ngân sách vé tham quan: <b id="pBudgetV">{formatVND(budget)}</b>
        <input
          type="range"
          id="pBudget"
          min="100000"
          max="5000000"
          step="50000"
          value={budget}
          onChange={(e) => onBudgetChange(parseInt(e.target.value, 10))}
        />
      </label>

      <div style={{ display: 'grid', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gz-color-ink-muted)' }}>
          Sở thích hoạt động
        </span>
        <div className="chips" id="pTags" role="group" aria-label="Sở thích">
          {Object.entries(TAGS).map(([key, label]) => {
            const isPressed = selectedPreferences.includes(key);
            return (
              <button
                key={key}
                type="button"
                data-t={key}
                aria-pressed={isPressed}
                onClick={() => onTogglePreference(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
        {selectedPreferences.length > 0 && (
          <button type="button" className="gz-clear-tags" onClick={onClearPreferences}>
            Bỏ chọn tất cả
          </button>
        )}
      </div>

      {pinnedCount > 0 && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '12.5px',
            fontWeight: 600
          }}
        >
          📌 Đang ưu tiên <b>{pinnedCount} địa điểm</b> bạn đã chọn trong Chuyến đi
        </div>
      )}

      <button
        type="button"
        id="pGo"
        className="go"
        disabled={isLoading}
        onClick={submitPlanner}
      >
        {isLoading ? 'Đang tối ưu lịch trình…' : 'Tạo lịch trình'}
      </button>
      {validationError && <p className="gz-inline-error" role="alert">{validationError}</p>}
    </aside>
  );
}
