import { ScoredPlace } from '../../types/plan.types.js';

export interface ZoneCluster {
  zoneId: number;
  zoneName: string;
  zoneCode: string;
  places: ScoredPlace[];
  averageScore: number;
}

/**
 * Bước 3: Gom nhóm các địa điểm theo zone_id
 */
export function groupPlacesByZone(places: ScoredPlace[]): Map<number, ZoneCluster> {
  const zoneMap = new Map<number, ZoneCluster>();

  for (const place of places) {
    if (!zoneMap.has(place.zoneId)) {
      zoneMap.set(place.zoneId, {
        zoneId: place.zoneId,
        zoneName: place.zoneName || `Zone ${place.zoneId}`,
        zoneCode: place.zoneCode || `Z${place.zoneId}`,
        places: [],
        averageScore: 0
      });
    }

    zoneMap.get(place.zoneId)!.places.push(place);
  }

  // Tính điểm trung bình của mỗi Zone để ưu tiên chọn Zone hot nhất
  for (const cluster of zoneMap.values()) {
    const sumScore = cluster.places.reduce((acc, p) => acc + p.totalScore, 0);
    cluster.averageScore = cluster.places.length > 0 ? sumScore / cluster.places.length : 0;
  }

  return zoneMap;
}
