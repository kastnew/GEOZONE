import { placeService } from '../place.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Bước 1: Lọc danh sách địa điểm ứng viên với đa ràng buộc:
 * - Khớp sở thích (preferences/tags)
 * - Trần ngân sách đơn lẻ (bảo vệ các địa điểm miễn phí 0đ)
 * - Đảm bảo tính đa dạng phân vùng (Zone Diversity) theo số ngày đi
 * - Ngưỡng chất lượng tối thiểu (Rating >= 3.0, Duration <= 360 phút)
 * - Fallback bù đắp thông minh theo các Zone còn thiếu
 * 
 * @param {import('../../types/plan.types.js').UserTripRequest} request
 * @returns {Promise<any[]>} Danh sách địa điểm ứng viên đã lọc
 */
export async function filterCandidatePlaces(request) {
  const city = request?.city || 'Da Nang';
  const days = Number(request?.days) || 2;
  const totalBudget = Number(request?.totalBudget) || 1500000;
  const preferences = Array.isArray(request?.preferences) ? request.preferences : [];

  logger.info(`[Planner] Lọc địa điểm ứng viên cho thành phố: ${city} (${days} ngày, ngân sách: ${totalBudget.toLocaleString('vi-VN')}đ)`);

  // 1. Tính toán các ngưỡng giới hạn
  // Một địa điểm đơn lẻ không nên vượt quá 65% tổng ngân sách chuyến đi (tối thiểu giữ trần 300.000đ)
  const maxSinglePlaceCost = Math.max(totalBudget * 0.65, 300000);
  const minRequiredCandidates = Math.max(days * 4, 8);

  // 2. Lấy danh sách thô từ Database theo tags sở thích
  let initialPlaces = await placeService.findCandidates(city, preferences);

  // 3. RÀNG BUỘC 1: Lọc theo ngân sách, rating và thời lượng tham quan khả thi
  let filteredPlaces = initialPlaces.filter(place => {
    const cost = place.estimatedCost || 0;
    const rating = place.rating || 4.0;
    const duration = place.duration || 60;

    // Giữ lại tất cả địa điểm miễn phí (0đ) vì là điểm cân bằng ngân sách xuất sắc
    if (cost === 0) return true;

    // Loại bỏ địa điểm vượt quá trần chi phí cho phép
    if (cost > maxSinglePlaceCost) {
      logger.debug(`[Planner] Bỏ qua ${place.name} do chi phí vượt trần (${cost.toLocaleString()}đ > ${maxSinglePlaceCost.toLocaleString()}đ)`);
      return false;
    }

    // Loại bỏ địa điểm rating quá thấp hoặc thời lượng quá dài (> 6 tiếng)
    if (rating < 3.0 || duration > 360) return false;

    return true;
  });

  // 4. RÀNG BUỘC 2: Kiểm tra Đa dạng Phân vùng (Zone Diversity)
  const presentZoneIds = new Set(filteredPlaces.map(p => p.zoneId));
  const existingPlaceIds = new Set(filteredPlaces.map(p => p.id));

  const isZoneDeficient = presentZoneIds.size < Math.min(days, 3);
  const isQuantityDeficient = filteredPlaces.length < minRequiredCandidates;

  // 5. Fallback thông minh: Nếu thiếu Zone hoặc thiếu số lượng địa điểm
  if (isZoneDeficient || isQuantityDeficient) {
    logger.warn(`[Planner] Cần bổ sung ứng viên: Hiện có ${filteredPlaces.length} điểm, ${presentZoneIds.size} Zones (Kỳ vọng: tối thiểu ${minRequiredCandidates} điểm, ${days} Zones)`);

    // Lấy toàn bộ địa điểm của thành phố để dự phòng
    const fallbackPlaces = await placeService.findCandidates(city, []);

    // Sắp xếp các điểm dự phòng theo độ phổ biến & rating cao nhất
    const sortedFallback = fallbackPlaces
      .filter(p => !existingPlaceIds.has(p.id))
      .filter(p => (p.estimatedCost || 0) <= maxSinglePlaceCost)
      .sort((a, b) => (b.popularity || 0) * (b.rating || 4) - (a.popularity || 0) * (a.rating || 4));

    // Ưu tiên 1: Bổ sung các địa điểm thuộc Zone chưa xuất hiện trong danh sách
    for (const place of sortedFallback) {
      if (!presentZoneIds.has(place.zoneId)) {
        filteredPlaces.push(place);
        existingPlaceIds.add(place.id);
        presentZoneIds.add(place.zoneId);
      }
      if (filteredPlaces.length >= minRequiredCandidates && presentZoneIds.size >= days) {
        break;
      }
    }

    // Ưu tiên 2: Nếu vẫn chưa đủ số lượng tối thiểu, nạp tiếp các điểm phổ biến còn lại
    if (filteredPlaces.length < minRequiredCandidates) {
      for (const place of sortedFallback) {
        if (!existingPlaceIds.has(place.id)) {
          filteredPlaces.push(place);
          existingPlaceIds.add(place.id);
        }
        if (filteredPlaces.length >= minRequiredCandidates) {
          break;
        }
      }
    }
  }

  logger.info(`[Planner] Hoàn tất lọc ứng viên: ${filteredPlaces.length} địa điểm trên ${presentZoneIds.size} Zones`);
  return filteredPlaces;
}
