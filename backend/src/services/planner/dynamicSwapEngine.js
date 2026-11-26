import { placeService } from '../place.service.js';
import { scorePlaces } from './placeScorer.js';
import { calculateDistanceKm } from './zoneGrouper.js';
import { logger } from '../../utils/logger.js';

function timeToMinutes(timeStr, fallbackMins) {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    return fallbackMins;
  }
  const [h, m] = timeStr.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallbackMins;
  return h * 60 + m;
}

/**
 * Kiểm tra địa điểm có mở cửa phù hợp với slotStartTime không
 */
function isOpenAtSlot(place, slotStartTime) {
  if (!slotStartTime) return true;
  const startMins = timeToMinutes(slotStartTime, -1);
  if (startMins < 0) return true;

  const openMins = timeToMinutes(place.openingTime, 0);
  const closeMins = timeToMinutes(place.closingTime, 24 * 60);
  const duration = Number(place.duration) || 60;

  // Phải mở cửa (cho phép sớm tối đa 30p) và đủ thời gian trải nghiệm trước khi đóng cửa
  return startMins >= openMins - 30 && startMins + Math.min(duration, 60) <= closeMins;
}

/**
 * Xử lý tính năng Hoán đổi động (Dynamic Swap):
 * - Không giới hạn cứng theo Zone.
 * - Kiểm tra chặt: Không trùng lịch trình + Chi phí <= remainingBudget + Giờ mở/đóng cửa + Thời lượng hợp lý.
 * - Ưu tiên khoảng cách GPS gần điểm cũ (<= 5 km, mở rộng <= 10 km hoặc toàn thành phố nếu thiếu).
 * - Chấm điểm bằng scorePlaces mới (Sở thích + Rating + Chi phí - Chống lặp loại) + proximityBonus.
 * - Hỗ trợ returnMultiple=true để trả về Top 8 gợi ý cho Popup Swap trên Web.
 *
 * @param {Object} request
 * @param {number} request.currentPlaceId
 * @param {string} [request.city]
 * @param {number} [request.dayNumber]
 * @param {number[]} [request.excludedPlaceIds]
 * @param {number} [request.targetZoneId]
 * @param {number} [request.remainingBudget]
 * @param {string} [request.slotStartTime]
 * @param {number} [request.maxDurationAllowed]
 * @param {string[]} [request.userPreferences]
 * @param {boolean} [request.returnMultiple]
 */
export async function executeDynamicSwap(request) {
  const excludedIds = Array.from(
    new Set([...(request.excludedPlaceIds || []).map(Number), Number(request.currentPlaceId)])
  );
  const maxCost = request.remainingBudget !== undefined ? Number(request.remainingBudget) : 500000;
  const maxDuration = request.maxDurationAllowed ? Number(request.maxDurationAllowed) : null;
  const slotStartTime = request.slotStartTime || null;
  const prefs = Array.isArray(request.userPreferences) ? request.userPreferences : [];

  logger.info(`[SwapEngine] Tìm gợi ý thay thế cho placeId=${request.currentPlaceId} (ngân sách <= ${maxCost}đ, giờ=${slotStartTime || 'bất kỳ'})`);

  const currentPlace = await placeService.getPlaceById(request.currentPlaceId);
  const city = request.city || currentPlace?.city || 'Da Nang';
  const allCityPlaces = await placeService.findCandidates(city, []);

  // 1. Lọc cứng theo điều kiện: Chưa xuất hiện trong lịch trình & Chi phí <= ngân sách cho phép
  const budgetAndUniquePool = allCityPlaces.filter(
    p => !excludedIds.includes(p.id) && (Number(p.estimatedCost) || 0) <= maxCost
  );

  if (budgetAndUniquePool.length === 0) {
    logger.warn('[SwapEngine] Không tìm thấy địa điểm nào thỏa mãn ngân sách và không trùng');
    return request.returnMultiple ? { bestMatch: null, suggestions: [] } : null;
  }

  // 2. Lọc theo Thời gian (Giờ mở/đóng cửa tại slotStartTime + Thời lượng <= maxDuration)
  let timeFilteredPool = budgetAndUniquePool.filter(p => {
    const openOk = isOpenAtSlot(p, slotStartTime);
    const durOk = maxDuration ? (Number(p.duration) || 60) <= maxDuration + 30 : true;
    return openOk && durOk;
  });

  // Fallback nhẹ nếu lọc thời gian quá chặt làm rỗng danh sách
  if (timeFilteredPool.length === 0) {
    timeFilteredPool = budgetAndUniquePool.filter(p => isOpenAtSlot(p, slotStartTime));
  }
  if (timeFilteredPool.length === 0) {
    timeFilteredPool = budgetAndUniquePool;
  }

  // 3. Ưu tiên theo khoảng cách GPS gần điểm cũ (5km -> 10km -> toàn thành phố để đủ gợi ý)
  let candidates = timeFilteredPool;
  if (currentPlace && currentPlace.latitude && currentPlace.longitude) {
    const within5Km = timeFilteredPool.filter(
      p => calculateDistanceKm(currentPlace.latitude, currentPlace.longitude, p.latitude, p.longitude) <= 5.0
    );
    if (within5Km.length >= 3 || (!request.returnMultiple && within5Km.length > 0)) {
      candidates = within5Km;
    } else {
      const within10Km = timeFilteredPool.filter(
        p => calculateDistanceKm(currentPlace.latitude, currentPlace.longitude, p.latitude, p.longitude) <= 10.0
      );
      if (within10Km.length > 0) {
        candidates = within10Km;
      }
    }
  }

  // 4. Chấm điểm bằng công thức mới (Sở thích + Rating + Chi phí - Phạt lặp loại) + Độ gần GPS
  const scoredCandidates = scorePlaces(candidates, prefs).map(p => {
    const dist =
      currentPlace && currentPlace.latitude && currentPlace.longitude
        ? calculateDistanceKm(currentPlace.latitude, currentPlace.longitude, p.latitude, p.longitude)
        : 3.0;
    const proximityBonus = dist <= 5 ? (1 - dist / 5) * 0.15 : 0;
    return {
      ...p,
      swapScore: Number((p.totalScore + proximityBonus).toFixed(4)),
      distanceKm: dist
    };
  });

  scoredCandidates.sort((a, b) => b.swapScore - a.swapScore);

  const mapToSwapItem = candidate => ({
    id: candidate.id,
    placeId: candidate.id,
    name: candidate.name,
    placeName: candidate.name,
    zoneId: candidate.zoneId,
    zoneCode: candidate.zoneCode,
    zoneName: candidate.zoneName || `Zone ${candidate.zoneId}`,
    timeSlot: 'Đã cập nhật',
    startTime: slotStartTime || '08:00',
    endTime: '09:30',
    duration: candidate.duration,
    estimatedCost: candidate.estimatedCost,
    rating: candidate.rating || 4.5,
    distanceKm: candidate.distanceKm,
    swapScore: candidate.swapScore,
    openingTime: candidate.openingTime,
    closingTime: candidate.closingTime,
    travelTimeFromPrev: Math.max(10, Math.round((candidate.distanceKm / 25) * 60) + 5),
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    tags: candidate.tags,
    aiDescription: `Địa điểm thay thế lý tưởng: ${candidate.name} (đánh giá ${candidate.rating || 4.5}★, cách điểm cũ ~${candidate.distanceKm} km).`
  });

  const mappedSuggestions = scoredCandidates.slice(0, 8).map(mapToSwapItem);
  const bestMatch = mappedSuggestions[0] || null;

  if (request.returnMultiple) {
    return {
      bestMatch,
      suggestions: mappedSuggestions
    };
  }

  return bestMatch;
}
