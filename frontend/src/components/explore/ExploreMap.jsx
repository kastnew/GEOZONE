import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import '../../styles/leaflet.css';
import { formatVND } from '../../data/mockData';

const hasCoordinates = (place) => (
  place.latitude !== null
  && place.latitude !== undefined
  && place.latitude !== ''
  && place.longitude !== null
  && place.longitude !== undefined
  && place.longitude !== ''
  && Number.isFinite(Number(place.latitude))
  && Number.isFinite(Number(place.longitude))
);

export default function ExploreMap({
  cityConfig,
  places = [],
  selectedPlace = null,
  onSelectPlace = () => {},
  onToggleCart = () => {},
  cartItems = [],
  readOnly = false
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // 1. Initialize Map instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const center = cityConfig?.center
      || (cityConfig?.key === 'danang' ? [16.0544, 108.2022] : [16.4637, 107.5909]);
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 12,
      zoomControl: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false
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
      map.stop();
      map.remove();
      if (mapInstanceRef.current === map) {
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // 2. Fly to city when cityConfig changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const center = cityConfig?.center
      || (cityConfig?.key === 'danang' ? [16.0544, 108.2022] : [16.4637, 107.5909]);
    mapInstanceRef.current.setView(center, 12, { animate: false });
  }, [cityConfig]);

  // 3. Render Place Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const rootStyles = getComputedStyle(document.documentElement);
    const accentColor = rootStyles.getPropertyValue('--gz-color-primary').trim() || '#0b6e8e';
    const selectedColor = rootStyles.getPropertyValue('--gz-color-primary-pressed').trim() || accentColor;

    places.forEach((place) => {
      if (!hasCoordinates(place)) return;

      const isSelected = selectedPlace && selectedPlace.id === place.id;
      const inCart = cartItems.some((c) => c.id === place.id);

      // Custom SVG Pin Icon
      const pinColor = isSelected ? selectedColor : accentColor;
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
      popupContent.style.fontFamily = getComputedStyle(document.body).fontFamily;
      popupContent.style.padding = '4px';
      popupContent.innerHTML = `
        <strong style="font-size:14px; color:#0f172a; display:block; margin-bottom:4px;">${place.name}</strong>
        <div style="font-size:12px; color:#64748b; margin-bottom:4px;">${place.zoneName || ''}</div>
        <div style="font-size:12px; font-weight:600; color:${accentColor}; margin-bottom:${readOnly ? '0' : '8px'};">${formatVND(place.estimatedCost ?? place.cost ?? 0)}</div>
        ${readOnly ? '' : `<button id="pop-add-${place.id}" style="
          background:${accentColor}; color:#fff; border:0; border-radius:6px; padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer; width:100%;
        ">
          ${inCart ? 'Bỏ chọn khỏi lịch trình' : '+ Thêm vào lịch trình'}
        </button>`}
      `;

      // Attach button click event
      const addBtn = readOnly ? null : popupContent.querySelector(`#pop-add-${place.id}`);
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
  }, [places, selectedPlace, cartItems, cityConfig, onSelectPlace, onToggleCart, readOnly]);

  // Keep the viewport centered on the current city and visible filtered places.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const coordinates = places
      .filter(hasCoordinates)
      .map((place) => [Number(place.latitude), Number(place.longitude)]);

    if (coordinates.length > 1) {
      map.fitBounds(L.latLngBounds(coordinates), {
        padding: [28, 28],
        maxZoom: 14,
        animate: false
      });
    } else if (coordinates.length === 1) {
      map.setView(coordinates[0], 14, { animate: false });
    } else {
      const center = cityConfig?.center
        || (cityConfig?.key === 'danang' ? [16.0544, 108.2022] : [16.4637, 107.5909]);
      map.setView(center, 12, { animate: false });
    }
  }, [places, cityConfig]);

  // 4. Focus on selected place
  useEffect(() => {
    if (
      !mapInstanceRef.current
      || !selectedPlace
      || !places.some((place) => place.id === selectedPlace.id)
      || !hasCoordinates(selectedPlace)
    ) return;
    mapInstanceRef.current.setView([selectedPlace.latitude, selectedPlace.longitude], 14, { animate: false });
  }, [selectedPlace, places]);

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
