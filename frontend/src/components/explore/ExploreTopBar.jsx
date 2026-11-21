import React from 'react';
import { CITIES } from '../../data/mockData';

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
          Khám phá
        </button>
        <button
          type="button"
          role="tab"
          data-m="planner"
          aria-pressed={mode === 'planner'}
          onClick={() => onSelectMode('planner')}
        >
          Lập lịch
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
            Điểm đến{' '}
            <select
              id="citySel"
              value={selectedCity}
              onChange={(e) => onSelectCity(e.target.value)}
            >
              {Object.entries(CITIES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="tripbtn"
            id="tripBtn"
            onClick={onOpenCart}
          >
            Chuyến đi (<b id="tripCount">{cartCount}</b>)
          </button>
        </div>
      </div>
    </header>
  );
}
