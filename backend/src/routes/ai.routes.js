import { Router } from 'express';
import { planController } from '../controllers/plan.controller.js';
import { swapController } from '../controllers/swap.controller.js';

const router = Router();

// POST /api/v1/ai/generate-plan - Sinh lịch trình tự động bằng AI Planner + RAG
router.post('/generate-plan', planController.generateItinerary);

// POST /api/v1/ai/swap-place - Hoán đổi động địa điểm trong lịch trình nháp
router.post('/swap-place', swapController.swapPlace);

export default router;
