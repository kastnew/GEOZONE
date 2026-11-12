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
      const currentUserId = req.user?.sub || req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập!' });
      }

      const {
        title,
        planTitle,
        city,
        total_days,
        totalDays,
        total_budget,
        totalBudget,
        actual_cost,
        actualCost,
        strategy_used,
        strategyUsed,
        plan_data,
        planData
      } = req.body;

      const rawPlanData = plan_data || planData;
      if (!rawPlanData) {
        return res.status(400).json({
          success: false,
          error: { message: 'Dữ liệu lịch trình (planData) không được để trống' }
        });
      }

      const defaultTitle = (title || planTitle)?.trim() || `Chuyến du lịch ${city || 'Đà Nẵng'} ${total_days || totalDays || 2} ngày`;

      const saved = await prisma.savedPlan.create({
        data: {
          user_id: currentUserId,
          title: defaultTitle,
          city: city || 'Da Nang',
          total_days: Number(total_days || totalDays) || 2,
          total_budget: Number(total_budget || totalBudget) || 0,
          actual_cost: Number(actual_cost || actualCost) || 0,
          status: 'COMPLETED',
          strategy_used: strategy_used || strategyUsed || 'DIRECT_JSON',
          plan_data: rawPlanData
        }
      });

      logger.info(`[PlanController] Người dùng ${currentUserId} đã lưu lịch trình #${saved.id}: ${saved.title}`);

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
      const currentUserId = req.user?.sub || req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập!' });
      }

      const plans = await prisma.savedPlan.findMany({
        where: { user_id: currentUserId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          city: true,
          total_days: true,
          total_budget: true,
          actual_cost: true,
          status: true,
          strategy_used: true,
          is_public: true,
          created_at: true,
          updated_at: true
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
   * Xem lại chi tiết 1 lịch trình cũ theo ID (UUID)
   */
  async getPlanById(req, res, next) {
    try {
      const planId = String(req.params.planId || req.params.id);
      const currentUserId = req.user?.sub || req.user?.id;

      if (!planId) {
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
      if (plan.user_id !== currentUserId && req.user?.role !== 'ADMIN') {
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
   * Xóa một lịch trình đã lưu (UUID)
   */
  async deletePlan(req, res, next) {
    try {
      const planId = String(req.params.planId || req.params.id);
      const currentUserId = req.user?.sub || req.user?.id;

      if (!planId) {
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

      if (plan.user_id !== currentUserId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: { message: 'Bạn không có quyền xóa lịch trình này' }
        });
      }

      await prisma.savedPlan.delete({
        where: { id: planId }
      });

      logger.info(`[PlanController] Đã xóa lịch trình #${planId} của user ${currentUserId}`);

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
