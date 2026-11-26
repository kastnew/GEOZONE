import crypto from 'node:crypto';
import { filterCandidatePlaces } from '../services/planner/candidateFilter.js';
import { scorePlaces } from '../services/planner/placeScorer.js';
import { groupPlacesByZone } from '../services/planner/zoneGrouper.js';
import { allocateDays } from '../services/planner/dayAllocator.js';
import { scheduleTimeSlots } from '../services/planner/timeSlotScheduler.js';
import { getWeatherForecast } from '../services/planner/weatherService.js';
import { DirectJsonStrategy } from '../services/ai/strategies/directJsonStrategy.js';
import { RagStrategy } from '../services/ai/strategies/ragStrategy.js';
import { prisma } from '../config/database.js';
import { ENV } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

const PLAN_STATUSES = new Set(['DRAFT', 'VALIDATING', 'COMPLETED', 'FAILED']);

function badRequest(res, message) {
  return res.status(400).json({
    success: false,
    message,
    error: { message }
  });
}

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
        enableRag: req.body.enableRag !== undefined ? req.body.enableRag : ENV.ENABLE_RAG,
        skipAi: req.body.skipAi === true,
        mustVisitIds: Array.isArray(req.body.mustVisitIds) ? req.body.mustVisitIds.map(Number).filter(Number.isFinite) : []
      };

      logger.info(`[PlanController] Bắt đầu lập lịch cho: ${tripRequest.city}, ${tripRequest.days} ngày, RAG: ${tripRequest.enableRag}`);

      // Bước 0: Lấy dự báo thời tiết theo số ngày đi (có fallback an toàn nếu mất mạng)
      const dailyWeather = await getWeatherForecast(tripRequest.city, tripRequest.days);

      // Bước 1: Lọc ứng viên
      const candidates = await filterCandidatePlaces(tripRequest);

      // Bước 2: Chấm điểm (Sở thích + Rating + Chi phí thích ứng ngân sách - Phạt trùng loại + Must-Visit)
      const scoredCandidates = scorePlaces(
        candidates,
        tripRequest.preferences,
        undefined,
        {
          dailyBudget: tripRequest.totalBudget / Math.max(tripRequest.days, 1),
          mustVisitIds: tripRequest.mustVisitIds
        }
      );

      // Bước 3: Chuẩn hóa tọa độ và phân nhóm Zone
      const zoneClusters = groupPlacesByZone(scoredCandidates);

      // Bước 4: Phân bổ điểm theo Cụm tọa độ, Thời tiết từng ngày & Ngân sách cân bằng
      const dayBundles = allocateDays(
        zoneClusters,
        tripRequest.days,
        tripRequest.totalBudget,
        8,
        dailyWeather,
        tripRequest.startTime,
        tripRequest.endTime
      );

      // Bước 5: Tối ưu lộ trình (Sinh hoán vị) & Phân bổ khung giờ chi tiết
      const scheduledDays = scheduleTimeSlots(dayBundles, tripRequest.startTime, tripRequest.endTime);

      const totalActualCost = scheduledDays.reduce((acc, d) => acc + d.totalEstimatedCost, 0);

      // Chế độ chạy thuần Thuật toán Planner (không qua LLM AI để tiết kiệm thời gian & test lộ trình trực tiếp)
      if (tripRequest.skipAi) {
        return res.status(200).json({
          success: true,
          data: {
            planId: `plan_${Date.now()}`,
            city: tripRequest.city,
            totalDays: tripRequest.days,
            totalBudget: tripRequest.totalBudget,
            actualCost: totalActualCost,
            strategyUsed: 'PLANNER_ONLY',
            weatherForecast: dailyWeather,
            overallSummary: `Lịch trình ${tripRequest.city} ${tripRequest.days} ngày được tối ưu trực tiếp từ thuật toán Planner (Thời tiết + GPS + Ngân sách).`,
            days: scheduledDays
          }
        });
      }

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

      const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};
      const rawPlanData = body.planData !== undefined ? body.planData : body.plan_data;
      if (
        !rawPlanData
        || typeof rawPlanData !== 'object'
        || Array.isArray(rawPlanData)
        || Object.keys(rawPlanData).length === 0
        || !Array.isArray(rawPlanData.days)
        || rawPlanData.days.length === 0
      ) {
        return badRequest(res, 'Dữ liệu lịch trình phải là object có danh sách days không được để trống.');
      }

      const rawTitle = body.title !== undefined ? body.title : body.planTitle;
      if (
        rawTitle !== undefined
        && (typeof rawTitle !== 'string' || rawTitle.trim().length === 0 || rawTitle.trim().length > 200)
      ) {
        return badRequest(res, 'Tiêu đề phải là chuỗi không được để trống và tối đa 200 ký tự.');
      }

      const rawTotalDays = body.totalDays !== undefined ? body.totalDays : body.total_days;
      const totalDays = rawTotalDays === undefined ? 2 : rawTotalDays;
      if (!Number.isInteger(totalDays) || totalDays < 1 || totalDays > 30) {
        return badRequest(res, 'Số ngày phải là số nguyên từ 1 đến 30.');
      }

      const rawTotalBudget = body.totalBudget !== undefined ? body.totalBudget : body.total_budget;
      const totalBudget = rawTotalBudget === undefined ? 0 : rawTotalBudget;
      if (typeof totalBudget !== 'number' || !Number.isFinite(totalBudget) || totalBudget < 0) {
        return badRequest(res, 'Ngân sách phải là số hữu hạn lớn hơn hoặc bằng 0.');
      }

      const rawActualCost = body.actualCost !== undefined ? body.actualCost : body.actual_cost;
      const actualCost = rawActualCost === undefined ? 0 : rawActualCost;
      if (typeof actualCost !== 'number' || !Number.isFinite(actualCost) || actualCost < 0) {
        return badRequest(res, 'Chi phí thực tế phải là số hữu hạn lớn hơn hoặc bằng 0.');
      }

      const rawIsPublic = body.is_public !== undefined ? body.is_public : body.isPublic;
      if (rawIsPublic !== undefined && typeof rawIsPublic !== 'boolean') {
        return badRequest(res, 'Trường is_public phải là kiểu boolean (true/false)');
      }
      const isPublic = rawIsPublic ?? false;

      const status = body.status === undefined ? 'COMPLETED' : body.status;
      if (!PLAN_STATUSES.has(status)) {
        return badRequest(res, 'Trạng thái lịch trình không hợp lệ.');
      }

      const city = body.city || 'Da Nang';
      const title = rawTitle === undefined
        ? `Chuyến du lịch ${city} ${totalDays} ngày`
        : rawTitle.trim();
      const strategyUsed = body.strategyUsed || body.strategy_used || 'DIRECT_JSON';
      const shareToken = isPublic ? crypto.randomBytes(16).toString('hex') : null;

      const saved = await prisma.savedPlan.create({
        data: {
          user_id: currentUserId,
          title,
          city,
          total_days: totalDays,
          total_budget: totalBudget,
          actual_cost: actualCost,
          status,
          strategy_used: strategyUsed,
          plan_data: rawPlanData,
          is_public: isPublic,
          share_token: shareToken
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
   * Lấy danh sách các chuyến đi đã lưu của user hiện tại (mới nhất xếp trước)
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
          share_token: true,
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
      // Ưu tiên bản ghi đã được checkOwner nạp sẵn
      let plan = req.plan;
      if (!plan) {
        const planId = String(req.params.planId || req.params.id);
        const currentUserId = req.user?.sub || req.user?.id;

        if (!planId) {
          return res.status(400).json({
            success: false,
            message: 'ID lịch trình không hợp lệ',
            error: { message: 'ID lịch trình không hợp lệ' }
          });
        }

        plan = await prisma.savedPlan.findUnique({
          where: { id: planId }
        });

        if (!plan) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy lịch trình này',
            error: { message: 'Không tìm thấy lịch trình này' }
          });
        }

        // Kiểm tra quyền sở hữu
        if (plan.user_id !== currentUserId && req.user?.role !== 'ADMIN') {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập lịch trình này',
            error: { message: 'Bạn không có quyền truy cập lịch trình này' }
          });
        }
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

      let plan = req.plan;
      if (!plan) {
        if (!planId) {
          return res.status(400).json({
            success: false,
            message: 'ID lịch trình không hợp lệ',
            error: { message: 'ID lịch trình không hợp lệ' }
          });
        }

        plan = await prisma.savedPlan.findUnique({
          where: { id: planId }
        });

        if (!plan) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy lịch trình để xóa',
            error: { message: 'Không tìm thấy lịch trình để xóa' }
          });
        }

        if (plan.user_id !== currentUserId && req.user?.role !== 'ADMIN') {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xóa lịch trình này',
            error: { message: 'Bạn không có quyền xóa lịch trình này' }
          });
        }
      }

      await prisma.savedPlan.delete({
        where: { id: plan.id }
      });

      logger.info(`[PlanController] Đã xóa lịch trình #${plan.id} của user ${currentUserId}`);

      return res.status(200).json({
        success: true,
        message: 'Đã xóa lịch trình thành công'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật thông tin lịch trình (đổi tên, trạng thái, bật/tắt chia sẻ)
   */
  async updatePlan(req, res, next) {
    try {
      const planId = String(req.params.planId || req.params.id);
      const currentUserId = req.user?.sub || req.user?.id;

      let plan = req.plan;
      if (!plan) {
        plan = await prisma.savedPlan.findUnique({ where: { id: planId } });
        if (!plan) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình này' });
        }
        if (plan.user_id !== currentUserId && req.user?.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa lịch trình này' });
        }
      }

      const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};
      const updateData = {};

      if (body.title !== undefined) {
        if (typeof body.title !== 'string' || body.title.trim().length === 0 || body.title.trim().length > 200) {
          return badRequest(res, 'Tiêu đề phải là chuỗi không được để trống và tối đa 200 ký tự.');
        }
        updateData.title = body.title.trim();
      }

      if (body.status !== undefined) {
        if (!PLAN_STATUSES.has(body.status)) {
          return badRequest(res, 'Trạng thái lịch trình không hợp lệ.');
        }
        updateData.status = body.status;
      }

      if (body.is_public !== undefined && body.isPublic !== undefined && body.is_public !== body.isPublic) {
        return badRequest(res, 'Giá trị is_public không hợp lệ.');
      }
      const rawIsPublic = body.is_public !== undefined ? body.is_public : body.isPublic;
      if (rawIsPublic !== undefined) {
        if (typeof rawIsPublic !== 'boolean') {
          return badRequest(res, 'Trường is_public phải là kiểu boolean (true/false)');
        }
        updateData.is_public = rawIsPublic;
        if (rawIsPublic && (!plan.share_token || !plan.share_token.trim())) {
          updateData.share_token = crypto.randomBytes(16).toString('hex');
        }
      }

      if (Object.keys(updateData).length === 0) {
        return badRequest(res, 'Không có dữ liệu hợp lệ để cập nhật');
      }

      const updated = await prisma.savedPlan.update({
        where: { id: plan.id },
        data: updateData
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật lịch trình thành công!',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * API công khai xem lịch trình chia sẻ qua shareToken
   */
  async getPublicPlanByShareToken(req, res, next) {
    try {
      const { shareToken } = req.params;
      if (!shareToken) {
        return res.status(400).json({
          success: false,
          message: 'Mã chia sẻ không hợp lệ'
        });
      }

      const plan = await prisma.savedPlan.findFirst({
        where: {
          share_token: shareToken,
          is_public: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar_url: true
            }
          }
        }
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Lịch trình không tồn tại hoặc chưa được chia sẻ công khai!'
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
}

export const planController = new PlanController();
