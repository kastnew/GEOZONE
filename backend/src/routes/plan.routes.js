import { Router } from 'express';
import { planController } from '../controllers/plan.controller.js';
import { swapController } from '../controllers/swap.controller.js';

const router = Router();

// Endpoint sinh lịch trình tự động (AI Planner)
router.post('/generate', planController.generateItinerary);

// Endpoint hoán đổi địa điểm động (Dynamic Swap)
router.post('/swap', swapController.swapPlace);

export default router;
