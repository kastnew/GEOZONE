import { executeDynamicSwap } from '../services/planner/dynamicSwapEngine.js';

export class SwapController {
  async swapPlace(req, res, next) {
    try {
      const swapReq = {
        currentPlaceId: Number(req.body.currentPlaceId),
        dayNumber: Number(req.body.dayNumber),
        excludedPlaceIds: req.body.excludedPlaceIds || [],
        targetZoneId: Number(req.body.targetZoneId),
        remainingBudget: Number(req.body.remainingBudget) || 500000,
        userPreferences: req.body.userPreferences || []
      };

      const swappedActivity = await executeDynamicSwap(swapReq);

      if (!swappedActivity) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy địa điểm thay thế khả dĩ trong cùng Zone.'
        });
      }

      return res.status(200).json({
        success: true,
        data: swappedActivity
      });
    } catch (error) {
      next(error);
    }
  }
}

export const swapController = new SwapController();
