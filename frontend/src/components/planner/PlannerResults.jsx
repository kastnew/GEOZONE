import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import '../../styles/leaflet.css';
import { formatVND, formatDuration } from '../../data/mockData';
import { ArrowRightLeft, Save } from 'lucide-react';

export default function PlannerResults({
  plan = null,
  isLoading = false,
  onSavePlan = () => { },
  onOpenSwap = () => { },
  onSelectPlace = () => { }
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);

  const DAY_COLORS = [
    'var(--gz-zone-z1)',
    'var(--gz-zone-z2)',
    'var(--gz-zone-z3)',
    'var(--gz-zone-z4)',
    'var(--gz-zone-z5)'
  ];

  // Initialize Route Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !plan) return;

    const map = L.map(mapContainerRef.current, {
      center: [16.4637, 107.5909],
      zoom: 12
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    routeLayerRef.current = routeLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [plan]);

  // Update Route Polyline and Markers when plan changes
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current || !plan?.days) return;

    routeLayerRef.current.clearLayers();
    const bounds = L.latLngBounds([]);

    plan.days.forEach((day, dIdx) => {
      const dayColor = DAY_COLORS[dIdx % DAY_COLORS.length];
      const latlngs = [];

      (day.places || []).forEach((place, pIdx) => {
        if (!place.latitude || !place.longitude) return;

        const latlng = [place.latitude, place.longitude];
        latlngs.push(latlng);
        bounds.extend(latlng);

        // Day Activity Pin Icon
        const markerIcon = L.divIcon({
          className: 'day-pin',
          html: `
            <div style="
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: ${dayColor};
              color: #ffffff;
              font-size: 12px;
              font-weight: 700;
              display: grid;
              place-items: center;
              border: 2px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              ${pIdx + 1}
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker(latlng, { icon: markerIcon });
        marker.bindPopup(`
          <div style="font-family:system-ui, sans-serif; padding:4px;">
            <b style="color:${dayColor}">Ngày ${day.dayNumber || dIdx + 1} · Điểm ${pIdx + 1}</b>
            <div style="font-size:14px; font-weight:700; color:#0f172a; margin-top:2px;">${place.name}</div>
            <div style="font-size:12px; color:#64748b;">${place.zoneName || ''}</div>
            ${travelInfo}
    <div style="font-size:12px; color:var(--gz-color-primary); font-weight:600; margin-top:4px;">${formatVND(place.estimatedCost ?? place.cost ?? 0)}</div>
          </div>
        `);
        routeLayerRef.current.addLayer(marker);
      });

      // Draw polyline connecting day places
      if (latlngs.length > 1) {
        const polyline = L.polyline(latlngs, {
          color: dayColor,
          weight: 4,
          opacity: 0.8,
          dashArray: '6, 8'
        });
        routeLayerRef.current.addLayer(polyline);
      }
    });

    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [plan]);

  if (isLoading) {
    const progressSteps = [
      'Lọc địa điểm',
      'Phân cụm Zone',
      'Tối ưu ngân sách',
      'Hoàn thiện lịch trình'
    ];

    return (
      <section className="pres" id="pRes">
        <div className="planner-loading" role="status" aria-live="polite">
          <div className="planner-skeleton planner-skeleton-title" />
          <div className="planner-skeleton planner-skeleton-line" />
          <ol className="planner-progress">
            {progressSteps.map((step, index) => (
              <li key={step} className={index === 0 ? 'is-active' : ''}>
                <span>{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="empty">Đang tối ưu lịch trình với AI và thuật toán phân vùng…</p>
        </div>
      </section>
    );
  }

  if (!plan || !plan.days || plan.days.length === 0) {
    return (
      <section className="pres" id="pRes">
        <p className="empty">
          Chọn điểm đến, ngân sách, sở thích rồi bấm <b>“Tạo lịch trình”</b>.
        </p>
      </section>
    );
  }

  return (
    <section className="pres" id="pRes">
      {/* Plan Summary Banner */}
      <div className="banner">
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>
            {plan.name || 'Lịch trình du lịch đề xuất'}
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', opacity: 0.9 }}>
            {plan.days.length} ngày · Tổng vé: <b>{formatVND(plan.totalCost || 0)}</b>
          </p>
        </div>

        <button
          type="button"
          className="gz-save"
          id="pSave"
          onClick={onSavePlan}
        >
          <Save size={15} strokeWidth={1.75} aria-hidden="true" /> Lưu chuyến đi này
        </button>
      </div>

      <div className="pgrid">
        {/* Left Column: Timeline Days */}
        <div>
          {plan.days.map((day, dIdx) => {
            const dayColor = DAY_COLORS[dIdx % DAY_COLORS.length];
            return (
              <div
                key={day.dayNumber || dIdx}
                className="day"
                style={{ '--dc': dayColor }}
              >
                <h3>
                  <span>Ngày {day.dayNumber || dIdx + 1}: {day.title || ''}</span>
                  <small>{formatVND(day.totalCost || 0)}</small>
                </h3>

                <div>
                  {(day.places || []).map((place, pIdx) => (
                    <div
                      key={place.id || pIdx}
                      className="act"
                      onClick={() => onSelectPlace(place)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="n">{pIdx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{place.name}</strong>
                          <span style={{ fontSize: '12.5px', color: 'var(--gz-color-success)', fontWeight: 600 }}>
                            {formatVND(place.estimatedCost ?? place.cost ?? 0)}
                          </span>
                        </div>
                        <small>
                          {place.zoneName} · {formatDuration(place.duration || 60)}
                          {place.time && ` (${place.time})`}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="gz-btn ghost"
                        style={{
                          borderColor: '#e2e8f0',
                          color: '#64748b',
                          fontSize: '11.5px',
                          padding: '4px 8px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSwap(dIdx, pIdx, place);
                        }}
                        title="Đổi địa điểm khác"
                      >
                        <ArrowRightLeft size={14} strokeWidth={1.75} aria-hidden="true" /> Đổi
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Planner Map Preview */}
        <aside className="zmap">
          <div className="zh">
            <span>Bản đồ lộ trình</span>
            <small style={{ color: 'var(--gz-color-ink-muted)' }}>Tối ưu khoảng cách di chuyển</small>
          </div>
          <div
            id="pMap"
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '360px',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          />
        </aside>
      </div>
    </section>
  );
}
