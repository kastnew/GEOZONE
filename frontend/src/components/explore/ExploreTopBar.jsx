import React from 'react';
import { CITIES } from '../../data/mockData';
import { CalendarDays, Compass, MapPin } from 'lucide-react';

export default function ExploreTopBar({
  mode = 'explore',
  onSelectMode = () => {},
  selectedCity = 'hue',
  onSelectCity = () => {},
  cartCount = 0,
  onOpenCart = () => {}
}) {
  const currentCityConfig = CITIES[selectedCity] || CITIES.hue;

  return (
    <header className="top">
      {/* Mode Switcher */}
      <div className="modes" id="modes" role="tablist">
        <button
          type="button"
          role="tab"
          data-m="explore"
          aria-pressed={mode === 'explore'}
          onClick={() => onSelectMode('explore')}
        >
          <Compass size={17} strokeWidth={1.75} aria-hidden="true" />
          <span className="mode-copy">
            <strong>Khám phá</strong>
            <small>Tìm điểm đến</small>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          data-m="planner"
          aria-pressed={mode === 'planner'}
          onClick={() => onSelectMode('planner')}
        >
          <CalendarDays size={17} strokeWidth={1.75} aria-hidden="true" />
          <span className="mode-copy">
            <strong>Lập lịch</strong>
            <small>Tối ưu hành trình</small>
          </span>
        </button>
      </div>

      {/* Info & City Selector */}
      <div className="info">
        <div className="title">
          <h1 id="cityName">{currentCityConfig.name}</h1>
          <p id="citySub">{currentCityConfig.sub}</p>
        </div>

        <div className="infobar">
          <label className="cityfield">
            <span className="cityfield-label">
              <MapPin size={15} strokeWidth={1.75} aria-hidden="true" />
              <span>Điểm đến</span>
            </span>
            <select
              id="citySel"
              value={selectedCity}
              aria-label="Chọn thành phố"
              onChange={(e) => onSelectCity(e.target.value)}
            >
              {Object.entries(CITIES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <button
        type="button"
        className="tripbtn"
        id="tripBtn"
        onClick={onOpenCart}
      >
        Chuyến đi (<b id="tripCount">{cartCount}</b>)
      </button>
    </header>
  );
}
