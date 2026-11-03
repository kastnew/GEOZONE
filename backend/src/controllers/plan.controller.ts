import { Request, Response, NextFunction } from 'express';
import { UserTripRequest } from '../types/plan.types.js';
import { filterCandidatePlaces } from '../services/planner/candidateFilter.js';
import { scorePlaces } from '../services/planner/placeScorer.js';
import { groupPlacesByZone } from '../services/planner/zoneGrouper.js';
import { allocateDays } from '../services/planner/dayAllocator.js';
import { scheduleTimeSlots } from '../services/planner/timeSlotScheduler.js';
import { DirectJsonStrategy } from '../services/ai/strategies/directJsonStrategy.js';
import { RagStrategy } from '../services/ai/strategies/ragStrategy.js';
import { ENV } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

export class PlanController {
  async generateItinerary(req: Request, res: Response, next: NextFunction) {
    try {
      const tripRequest: UserTripRequest = {
        city: req.body.city || 'Da Nang',
        days: Number(req.body.days) || 2,
        totalBudget: Number(req.body.totalBudget) || 1500000,
        preferences: req.body.preferences || ['food', 'beach', 'culture'],
        startTime: req.body.startTime || '08:00',
        endTime: req.body.endTime || '21:00',
        enableRag: req.body.enableRag !== undefined ? req.body.enableRag : ENV.ENABLE_RAG
      };

      logger.info(`[PlanController] Bắt đầu lập lịch cho: ${tripRequest.city}, ${tripRequest.days} ngày, RAG: ${tripRequest.enableRag}`);

      // Bước 1: Lọc ứng viên
      const candidates = await filterCandidatePlaces(tripRequest);

      // Bước 2: Chấm điểm
      const scoredCandidates = scorePlaces(candidates, tripRequest.preferences);

      // Bước 3: Phân nhóm theo zone_id
      const zoneClusters = groupPlacesByZone(scoredCandidates);

      // Bước 4: Phân bổ các Zone vào từng ngày
      const dayBundles = allocateDays(zoneClusters, tripRequest.days, tripRequest.totalBudget);

      // Bước 5: Phân bổ khung giờ chi tiết
      const scheduledDays = scheduleTimeSlots(dayBundles, tripRequest.startTime);

      const totalActualCost = scheduledDays.reduce((acc, d) => acc + d.totalEstimatedCost, 0);

      // Bước 6: Lựa chọn chiến lược AI (Có RAG hay Không có RAG)
      const aiStrategy = tripRequest.enableRag ? new RagStrategy() : new DirectJsonStrategy();
      const finalPlan = await aiStrategy.generateNarrative(scheduledDays, tripRequest, totalActualCost);

      return res.status(200).json({
        success: true,
        data: finalPlan
      });
    } catch (error) {
      next(error);
    }
  }
}

export const planController = new PlanController();
