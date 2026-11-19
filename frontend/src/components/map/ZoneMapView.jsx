import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix lỗi icon mặc định của Leaflet trên React
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const DAY_COLORS = [
  '#2563eb', // Ngày 1 - xanh dương
  '#16a34a', // Ngày 2 - xanh lá
  '#dc2626', // Ngày 3 - đỏ
  '#9333ea', // Ngày 4 - tím
  '#ea580c', // Ngày 5 - cam
  '#0891b2', // Ngày 6 - xanh ngọc
  '#db2777', // Ngày 7 - hồng
];

const getDayColor = (dayNumber) => {
  const index = Math.max(0, (Number(dayNumber) || 1) - 1) % DAY_COLORS.length;
  return DAY_COLORS[index];
};

const dayIconCache = {};
const getDayMarkerIcon = (dayNumber) => {
  const color = getDayColor(dayNumber);
  if (!dayIconCache[color]) {
    dayIconCache[color] = L.divIcon({
      className: 'custom-day-marker',
      html: `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }
  return dayIconCache[color];
};

L.Marker.prototype.options.icon = DefaultIcon;

const fallbackCenter = [16.0544, 108.2022];

const getDayItems = (day) => {
  const list = day?.activities ?? [];
  return Array.isArray(list) ? list : [];
};

const MapController = ({ points, isAllMode, fallbackCenter, zoom = 13 }) => {
  const map = useMap();

  useEffect(() => {
    const validCoords = points
      .map(({ item }) => {
        const lat = item.latitude;
        const lng = item.longitude;
        return lat != null && lng != null ? [Number(lat), Number(lng)] : null;
      })
      .filter(Boolean);

    if (validCoords.length === 0) {
      map.setView(fallbackCenter, zoom, { animate: true });
      return;
    }

    if (isAllMode && validCoords.length > 1) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [24, 24], animate: true });
    } else {
      map.setView(validCoords[0], zoom, { animate: true });
    }
  }, [points, isAllMode, fallbackCenter, zoom, map]);

  return null;
};

export const ZoneMapView = ({ plan }) => {
	const [selectedDay, setSelectedDay] = useState('Tất cả');
  if (!plan || !plan.days) return null;
	
	const visibleEntries =
	selectedDay === 'Tất cả'
	? plan.days.flatMap((day) =>
			getDayItems(day).map((item, idx) => ({ item, day, idx }))
		)
	: (() => {
			const targetDay = plan.days.find((d) => d.dayNumber === selectedDay) || plan.days[0];
			return getDayItems(targetDay).map((item, idx) => ({ item, day: targetDay, idx }));
		})();
  
  const activeDay = plan.days.find((d) => d.dayNumber === selectedDay) || plan.days[0];
  const dayItems = visibleEntries;
  
  const firstActiveItem = dayItems.find(
		({item}) => item.latitude && item.longitude
  );

  const firstDayItems = plan.days[0]?.activities;
  const firstPlanItem = firstDayItems.find(
    (item) => item.latitude && item.longitude
  );


	const mapCenter = firstActiveItem
		? [Number(firstActiveItem.item.latitude), Number(firstActiveItem.item.longitude)]
		: firstPlanItem
		? [Number(firstPlanItem.latitude), Number(firstPlanItem.longitude)]
		: fallbackCenter;

  return (
    <div className="w-full min-w-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Bản đồ Phân cụm Zone
        </h3>
        <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
          {plan.days.length} Cụm khu vực
        </span>
      </div>

      {/* Bản đồ Leaflet */}
      <div className="h-[420px] rounded-xl overflow-hidden border border-slate-200 z-0">
        <MapContainer
		  center={mapCenter}
		  zoom={13}
		  style={{ height: '100%', width: '100%' }}
		  scrollWheelZoom={true}
		>
		  <MapController
				points={visibleEntries}
				isAllMode={selectedDay === 'Tất cả'}
				fallbackCenter={fallbackCenter}
				zoom={13}
			/>

		  <TileLayer
			attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
		  />

		  {visibleEntries.map(({ item, day, idx }) => {
				const lat = Number(item?.latitude);
				const lng = Number(item?.longitude);
			if (!lat || !lng) return null;

			return (
			  <Marker
					key={item.id || `${day.dayNumber}-${idx}`}
					position={[lat, lng]}
					icon={getDayMarkerIcon(day.dayNumber)}
				>
				<Popup>
				  <div className="text-xs space-y-1">
					<span className="font-bold text-blue-600">
					  Ngày {day.dayNumber} ({day.zoneName})
					</span>
					<p className="font-semibold text-slate-800">{item.placeName}</p>
					{item.startTime && <p className="text-slate-500">Giờ: {item.startTime}</p>}
				  </div>
				</Popup>
			  </Marker>
			);
		  })}
		</MapContainer>
      </div>

    <div className="space-y-3">
        <span className="text-xs font-semibold text-slate-700 block">Danh sách Zone theo ngày:</span>
        <div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setSelectedDay('Tất cả')}
						className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
						selectedDay === 'Tất cả'
							? 'bg-blue-600 text-white border-blue-600'
							: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
						}`}
					>
						Tất cả ({plan.days.length} ngày)
					</button>
          {plan.days.length > 1 &&
						plan.days.map((d) => {
            const isActive = selectedDay !== 'Tất cả' && d.dayNumber === activeDay.dayNumber;
            return (
							<button
								key={d.dayNumber}
								type="button"
								onClick={() => setSelectedDay(d.dayNumber)}
								className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
									isActive
										? 'bg-blue-600 text-white border-blue-600'
										: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
								}`}
							>
								Ngày {d.dayNumber}: {d.zoneName}
							</button>
            );
          })}
        </div>
      </div>
    </div>
  );
};