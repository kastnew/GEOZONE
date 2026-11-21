import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import '../../styles/leaflet.css';
import { formatVND } from '../../data/mockData';

export default function ExploreMap({
  cityConfig,
  places = [],
  selectedPlace = null,
  onSelectPlace = () => {},
  onToggleCart = () => {},
  cartItems = []
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // 1. Initialize Map instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const center = cityConfig?.center || [16.4637, 107.5909];
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 12,
      zoomControl: true
    });

    // OpenStreetMap Tile Layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Vietnamese Island Sovereignty Markers (Hoàng Sa / Trường Sa)
    const hsIcon = L.divIcon({
      className: 'sea-lbl',
      html: 'Quần đảo Hoàng Sa<small>(Đà Nẵng, Việt Nam)</small>',
      iconSize: [160, 36],
      iconAnchor: [80, 18]
    });
    L.marker([16.5333, 111.6833], { icon: hsIcon }).addTo(map);

    const tsIcon = L.divIcon({
      className: 'sea-lbl',
      html: 'Quần đảo Trường Sa<small>(Khánh Hòa, Việt Nam)</small>',
      iconSize: [160, 36],
      iconAnchor: [80, 18]
    });
    L.marker([10.1500, 114.3500], { icon: tsIcon }).addTo(map);

    // Layer group for dynamic place markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Fly to city when cityConfig changes
  useEffect(() => {
    if (!mapInstanceRef.current || !cityConfig?.center) return;
    mapInstanceRef.current.flyTo(cityConfig.center, 12, { duration: 1.2 });
  }, [cityConfig]);

  // 3. Render Place Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const accentColor = cityConfig?.accent || '#6a4a9c';

    places.forEach((place) => {
      if (!place.latitude || !place.longitude) return;

      const isSelected = selectedPlace && selectedPlace.id === place.id;
      const inCart = cartItems.some((c) => c.id === place.id);

      // Custom SVG Pin Icon
      const pinColor = isSelected ? '#e11d48' : inCart ? '#2563eb' : accentColor;
      const pinHtml = `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          background: ${pinColor};
          transform: rotate(-45deg);
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <span style="
            transform: rotate(45deg);
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
          ">
            ${inCart ? '✓' : '★'}
          </span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'gz-pin-icon',
        html: pinHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });

      const marker = L.marker([place.latitude, place.longitude], {
        icon: customIcon
      });

      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = 'system-ui, sans-serif';
      popupContent.style.padding = '4px';
      popupContent.innerHTML = `
        <strong style="font-size:14px; color:#0f172a; display:block; margin-bottom:4px;">${place.name}</strong>
        <div style="font-size:12px; color:#64748b; margin-bottom:4px;">${place.zoneName || ''}</div>
        <div style="font-size:12px; font-weight:600; color:#16a34a; margin-bottom:8px;">${formatVND(place.estimatedCost ?? place.cost ?? 0)}</div>
        <button id="pop-add-${place.id}" style="
          background:#2563eb; color:#fff; border:0; border-radius:6px; padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer; width:100%;
        ">
          ${inCart ? 'Bỏ chọn khỏi lịch trình' : '+ Thêm vào lịch trình'}
        </button>
      `;

      // Attach button click event
      const addBtn = popupContent.querySelector(`#pop-add-${place.id}`);
      if (addBtn) {
        addBtn.onclick = (e) => {
          e.stopPropagation();
          onToggleCart(place);
        };
      }

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectPlace(place);
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [places, selectedPlace, cartItems, cityConfig, onSelectPlace, onToggleCart]);

  // 4. Focus on selected place
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlace?.latitude || !selectedPlace?.longitude) return;
    mapInstanceRef.current.setView([selectedPlace.latitude, selectedPlace.longitude], 14, { animate: true });
  }, [selectedPlace]);

  return (
    <section className="mapwrap" aria-label="Bản đồ tương tác">
      <div
        id="map"
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', minHeight: '380px' }}
      />
    </section>
  );
}
