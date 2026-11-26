import { executeDynamicSwap } from '../services/planner/dynamicSwapEngine.js';

export class SwapController {
  async swapPlace(req, res, next) {
    try {
      const swapReq = {
        currentPlaceId: Number(req.body.currentPlaceId),
        city: req.body.city,
        dayNumber: Number(req.body.dayNumber) || 1,
        excludedPlaceIds: req.body.excludedPlaceIds || [],
        targetZoneId: req.body.targetZoneId ? Number(req.body.targetZoneId) : undefined,
        remainingBudget: req.body.remainingBudget !== undefined ? Number(req.body.remainingBudget) : 500000,
        slotStartTime: req.body.slotStartTime || undefined,
        maxDurationAllowed: req.body.maxDurationAllowed ? Number(req.body.maxDurationAllowed) : undefined,
        userPreferences: req.body.userPreferences || [],
        returnMultiple: req.body.returnMultiple === true
      };

      const result = await executeDynamicSwap(swapReq);

      if (!result || (swapReq.returnMultiple && result.suggestions.length === 0)) {
        return res.status(swapReq.returnMultiple ? 200 : 404).json({
          success: swapReq.returnMultiple,
          data: swapReq.returnMultiple ? { bestMatch: null, suggestions: [] } : undefined,
          message: 'Không tìm thấy địa điểm thay thế phù hợp với ngân sách và khung giờ.'
        });
      }

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const swapController = new SwapController();
