const DEFAULT_CITY_CENTER = { lat: 16.0544, lng: 108.2022 };

/**
 * Tính khoảng cách đường chim bay (km) giữa 2 tọa độ GPS bằng công thức Haversine
 * @param {number | null | undefined} lat1
 * @param {number | null | undefined} lng1
 * @param {number | null | undefined} lat2
 * @param {number | null | undefined} lng2
 * @returns {number} Khoảng cách tính bằng km
 */
export function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const nLat1 = Number(lat1);
  const nLng1 = Number(lng1);
  const nLat2 = Number(lat2);
  const nLng2 = Number(lng2);

  if (
    !Number.isFinite(nLat1) || !Number.isFinite(nLng1) ||
    !Number.isFinite(nLat2) || !Number.isFinite(nLng2) ||
    (nLat1 === 0 && nLng1 === 0) || (nLat2 === 0 && nLng2 === 0)
  ) {
    return 3.0; // Giá trị khoảng cách mặc định an toàn nếu thiếu tọa độ
  }

  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLng = ((nLng2 - nLng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Bước 3: Chuẩn hóa tọa độ và gom nhóm thông tin các Zone (giữ tương thích pipeline)
 * - Tính tâm tọa độ thực tế của từng Zone và bù tọa độ nếu địa điểm bị thiếu.
 * - Tính điểm đại diện Zone dựa trên Top-4 địa điểm cao nhất trong Zone.
 *
 * @param {import('../../types/plan.types.js').ScoredPlace[]} places
 * @returns {Map<number, { zoneId: number, zoneName: string, zoneCode: string, centerLat: number, centerLng: number, places: any[], averageScore: number }>}
 */
export function groupPlacesByZone(places) {
  const zoneMap = new Map();
  if (!Array.isArray(places)) return zoneMap;

  for (const place of places) {
    const zId = place.zoneId ?? 0;
    if (!zoneMap.has(zId)) {
      zoneMap.set(zId, {
        zoneId: zId,
        zoneName: place.zoneName || `Zone ${zId}`,
        zoneCode: place.zoneCode || `Z${zId}`,
        centerLat: DEFAULT_CITY_CENTER.lat,
        centerLng: DEFAULT_CITY_CENTER.lng,
        places: [],
        averageScore: 0
      });
    }

    zoneMap.get(zId).places.push(place);
  }

  for (const cluster of zoneMap.values()) {
    // 1. Tính tọa độ trung tâm thực tế của Zone từ các điểm có GPS hợp lệ
    const validGeoPlaces = cluster.places.filter(
      p => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)) && Number(p.latitude) !== 0
    );

    if (validGeoPlaces.length > 0) {
      cluster.centerLat = Number(
        (validGeoPlaces.reduce((sum, p) => sum + Number(p.latitude), 0) / validGeoPlaces.length).toFixed(6)
      );
      cluster.centerLng = Number(
        (validGeoPlaces.reduce((sum, p) => sum + Number(p.longitude), 0) / validGeoPlaces.length).toFixed(6)
      );
    }

    // 2. Bù tọa độ tâm Zone cho các địa điểm bị khuyết tọa độ
    cluster.places = cluster.places.map(p => ({
      ...p,
      latitude: Number.isFinite(Number(p.latitude)) && Number(p.latitude) !== 0 ? Number(p.latitude) : cluster.centerLat,
      longitude: Number.isFinite(Number(p.longitude)) && Number(p.longitude) !== 0 ? Number(p.longitude) : cluster.centerLng
    }));

    // 3. Tính điểm sức mạnh Zone theo Top-4 địa điểm cao nhất
    const topPlaces = [...cluster.places]
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 4);

    const sumScore = topPlaces.reduce((acc, p) => acc + (p.totalScore || 0), 0);
    cluster.averageScore = topPlaces.length > 0 ? Number((sumScore / topPlaces.length).toFixed(4)) : 0;
  }

  return zoneMap;
}
