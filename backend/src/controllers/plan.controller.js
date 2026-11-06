import { filterCandidatePlaces } from '../services/planner/candidateFilter.js';
import { scorePlaces } from '../services/planner/placeScorer.js';
import { groupPlacesByZone } from '../services/planner/zoneGrouper.js';
import { allocateDays } from '../services/planner/dayAllocator.js';
import { scheduleTimeSlots } from '../services/planner/timeSlotScheduler.js';
import { DirectJsonStrategy } from '../services/ai/strategies/directJsonStrategy.js';
import { RagStrategy } from '../services/ai/strategies/ragStrategy.js';
import { prisma } from '../config/database.js';
import { ENV } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

export class PlanController {
  /**
   * Sinh lịch trình tự động (AI Planner)
   */
  async generateItinerary(req, res, next) {
    try {
      const tripRequest = {
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

  /**
   * Lưu lịch trình vừa tạo vào tài khoản người dùng
   */
  async savePlan(req, res, next) {
    try {
      const { planTitle, city, totalDays, totalBudget, actualCost, strategyUsed, planData } = req.body;

      if (!planData) {
        return res.status(400).json({
          success: false,
          error: { message: 'Dữ liệu lịch trình (planData) không được để trống' }
        });
      }

      const defaultTitle = planTitle?.trim() || `Chuyến du lịch ${city || 'Đà Nẵng'} ${totalDays || 2} ngày`;

      const saved = await prisma.savedPlan.create({
        data: {
          userId: req.user.id,
          planTitle: defaultTitle,
          city: city || 'Da Nang',
          totalDays: Number(totalDays) || 2,
          totalBudget: Number(totalBudget) || 0,
          actualCost: Number(actualCost) || 0,
          strategyUsed: strategyUsed || 'DIRECT_JSON',
          planData: planData
        }
      });

      logger.info(`[PlanController] Người dùng ${req.user.id} đã lưu lịch trình #${saved.id}: ${saved.planTitle}`);

      return res.status(201).json({
        success: true,
        message: 'Lưu lịch trình thành công!',
        data: saved
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách các chuyến đi đã lưu của user hiện tại
   */
  async getMyPlans(req, res, next) {
    try {
      const plans = await prisma.savedPlan.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          planTitle: true,
          city: true,
          totalDays: true,
          totalBudget: true,
          actualCost: true,
          strategyUsed: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(200).json({
        success: true,
        data: plans
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xem lại chi tiết 1 lịch trình cũ theo ID
   */
  async getPlanById(req, res, next) {
    try {
      const planId = parseInt(req.params.id, 10);
      if (isNaN(planId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'ID lịch trình không hợp lệ' }
        });
      }

      const plan = await prisma.savedPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy lịch trình này' }
        });
      }

      // Kiểm tra quyền sở hữu
      if (plan.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: { message: 'Bạn không có quyền truy cập lịch trình này' }
        });
      }

      return res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa một lịch trình đã lưu
   */
  async deletePlan(req, res, next) {
    try {
      const planId = parseInt(req.params.id, 10);
      if (isNaN(planId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'ID lịch trình không hợp lệ' }
        });
      }

      const plan = await prisma.savedPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy lịch trình để xóa' }
        });
      }

      if (plan.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: { message: 'Bạn không có quyền xóa lịch trình này' }
        });
      }

      await prisma.savedPlan.delete({
        where: { id: planId }
      });

      logger.info(`[PlanController] Đã xóa lịch trình #${planId} của user ${req.user.id}`);

      return res.status(200).json({
        success: true,
        message: 'Đã xóa lịch trình thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const planController = new PlanController();
