import React from 'react';
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
  onSubmit = () => {},
  isLoading = false
}) {
  return (
    <aside className="pform">
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
          max="3000000"
          step="50000"
          value={budget}
          onChange={(e) => onBudgetChange(parseInt(e.target.value, 10))}
        />
      </label>

      <div style={{ display: 'grid', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>
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
      </div>

      <button
        type="button"
        id="pGo"
        className="go"
        disabled={isLoading}
        onClick={onSubmit}
      >
        {isLoading ? 'Đang tối ưu lịch trình…' : 'Tạo lịch trình'}
      </button>
    </aside>
  );
}
