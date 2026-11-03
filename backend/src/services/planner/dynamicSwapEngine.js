import { placeService } from '../place.service.js';
import { scorePlaces } from './placeScorer.js';
import { logger } from '../../utils/logger.js';

/**
 * Xử lý tính năng Hoán đổi động (Dynamic Swap):
 * Tìm một địa điểm thay thế cùng Zone, vừa vặn ngân sách và sở thích
 * 
 * @param {Object} request
 * @param {number} request.currentPlaceId
 * @param {number} request.dayNumber
 * @param {number[]} request.excludedPlaceIds
 * @param {number} request.targetZoneId
 * @param {number} request.remainingBudget
 * @param {string[]} request.userPreferences
 */
export async function executeDynamicSwap(request) {
  logger.info(`[SwapEngine] Bắt đầu tìm kiếm thay thế cho placeId: ${request.currentPlaceId} tại Zone: ${request.targetZoneId}`);

  // Tìm các ứng viên chưa xuất hiện trong lịch trình và có chi phí <= ngân sách còn lại
  const candidates = await placeService.findSwapCandidates(
    request.targetZoneId,
    [...request.excludedPlaceIds, request.currentPlaceId],
    request.remainingBudget,
    request.userPreferences
  );

  if (candidates.length === 0) {
    logger.warn('[SwapEngine] Không tìm thấy địa điểm thay thế phù hợp trong cùng Zone');
    return null;
  }

  // Chấm điểm các ứng viên
  const scoredCandidates = scorePlaces(candidates, request.userPreferences);
  const bestCandidate = scoredCandidates[0]; // Lấy ứng viên có điểm cao nhất

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
    travelTimeFromPrev: 15,
    latitude: bestCandidate.latitude,
    longitude: bestCandidate.longitude,
    aiDescription: `Địa điểm thay thế lý tưởng: ${bestCandidate.name} phù hợp với ngân sách của bạn.`
  };
}
