import { placeService } from '../place.service.js';
import { scorePlaces } from './placeScorer.js';
import { calculateDistanceKm } from './zoneGrouper.js';
import { logger } from '../../utils/logger.js';

/**
 * Xử lý tính năng Hoán đổi động (Dynamic Swap):
 * - Không giới hạn hay ưu tiên cứng theo Zone.
 * - Tìm địa điểm thay thế chưa có trong lịch trình, vừa ngân sách và nằm gần tọa độ điểm cũ (bán kính <= 5 km).
 * - Chấm điểm bằng scorePlaces mới (Sở thích + Rating + Chi phí - Chống lặp loại) kết hợp độ gần GPS.
 *
 * @param {Object} request
 * @param {number} request.currentPlaceId
 * @param {number} request.dayNumber
 * @param {number[]} request.excludedPlaceIds
 * @param {number} [request.targetZoneId]
 * @param {number} request.remainingBudget
 * @param {string[]} request.userPreferences
 */
export async function executeDynamicSwap(request) {
  const excludedIds = Array.from(new Set([...(request.excludedPlaceIds || []), request.currentPlaceId]));
  const maxCost = Number(request.remainingBudget) || 500000;
  const prefs = Array.isArray(request.userPreferences) ? request.userPreferences : [];

  logger.info(`[SwapEngine] Tìm điểm thay thế theo tọa độ gần cho placeId=${request.currentPlaceId}`);

  const currentPlace = await placeService.getPlaceById(request.currentPlaceId);
  const city = currentPlace?.city || 'Da Nang';
  const allCityPlaces = await placeService.findCandidates(city, []);

  // Lọc ứng viên chưa đi và vừa ngân sách
  const eligiblePlaces = allCityPlaces.filter(
    p => !excludedIds.includes(p.id) && (p.estimatedCost || 0) <= maxCost
  );

  let candidates = eligiblePlaces;

  // Nếu điểm cũ có tọa độ GPS hợp lệ, ưu tiên lọc trong bán kính <= 5 km (không phân biệt Zone)
  if (currentPlace && currentPlace.latitude && currentPlace.longitude) {
    const nearby = eligiblePlaces.filter(p => {
      const dist = calculateDistanceKm(
        currentPlace.latitude,
        currentPlace.longitude,
        p.latitude,
        p.longitude
      );
      return dist <= 5.0;
    });

    if (nearby.length > 0) {
      candidates = nearby;
    }
  }

  if (candidates.length === 0) {
    logger.warn('[SwapEngine] Không tìm thấy địa điểm thay thế phù hợp với ngân sách');
    return null;
  }

  // Chấm điểm bằng công thức mới + cộng điểm gần GPS nhẹ để ưu tiên điểm thuận đường
  const scoredCandidates = scorePlaces(candidates, prefs).map(p => {
    const dist = currentPlace
      ? calculateDistanceKm(currentPlace.latitude, currentPlace.longitude, p.latitude, p.longitude)
      : 3.0;
    const proximityBonus = dist <= 5 ? (1 - dist / 5) * 0.15 : 0;
    return {
      ...p,
      swapScore: Number((p.totalScore + proximityBonus).toFixed(4)),
      distFromOld: dist
    };
  });

  scoredCandidates.sort((a, b) => b.swapScore - a.swapScore);
  const bestCandidate = scoredCandidates[0];

  return {
    placeId: bestCandidate.id,
    placeName: bestCandidate.name,
    zoneId: bestCandidate.zoneId,
    zoneName: bestCandidate.zoneName || `Zone ${bestCandidate.zoneId}`,
    timeSlot: 'Đã cập nhật',
    startTime: '08:00',
    endTime: '09:30',
    duration: bestCandidate.duration,
    estimatedCost: bestCandidate.estimatedCost,
    travelTimeFromPrev: Math.max(10, Math.round((bestCandidate.distFromOld / 25) * 60) + 5),
    latitude: bestCandidate.latitude,
    longitude: bestCandidate.longitude,
    aiDescription: `Địa điểm thay thế lý tưởng: ${bestCandidate.name} (đánh giá ${bestCandidate.rating || 4.5}★, cách điểm cũ ~${bestCandidate.distFromOld} km).`
  };
}
