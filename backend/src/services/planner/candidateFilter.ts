import { PlaceEntity, UserTripRequest } from '../../types/plan.types.js';
import { placeService } from '../place.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Bước 1: Lọc danh sách địa điểm ứng viên dựa trên thành phố và sở thích tags
 */
export async function filterCandidatePlaces(
  request: UserTripRequest
): Promise<PlaceEntity[]> {
  logger.info(`[Planner] Lọc địa điểm ứng viên cho thành phố: ${request.city}`);

  let candidates = await placeService.findCandidates(request.city, request.preferences);

  // Fallback: nếu lọc nghiêm ngặt theo tags mà quá ít địa điểm, nới lỏng lấy thêm các địa điểm phổ biến
  if (candidates.length < request.days * 3) {
    logger.warn('[Planner] Số lượng địa điểm theo tags không đủ, bổ sung thêm địa điểm phổ biến');
    const fallbackPlaces = await placeService.findCandidates(request.city, []);
    const existingIds = new Set(candidates.map(c => c.id));
    for (const place of fallbackPlaces) {
      if (!existingIds.has(place.id)) {
        candidates.push(place);
      }
    }
  }

  return candidates;
}
