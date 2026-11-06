import { Router } from 'express';
import { planController } from '../controllers/plan.controller.js';
import { swapController } from '../controllers/swap.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoint sinh lịch trình tự động (AI Planner)
router.post('/generate', planController.generateItinerary);

// Endpoint hoán đổi địa điểm động (Dynamic Swap)
router.post('/swap', swapController.swapPlace);

// Endpoint lưu lịch trình vào tài khoản (cần đăng nhập)
router.post('/save', requireAuth, planController.savePlan);

// Endpoint lấy danh sách chuyến đi đã lưu của user (cần đăng nhập)
router.get('/my-plans', requireAuth, planController.getMyPlans);

// Endpoint xem chi tiết 1 lịch trình cũ (cần đăng nhập)
router.get('/:id', requireAuth, planController.getPlanById);

// Endpoint xóa 1 lịch trình đã lưu (cần đăng nhập)
router.delete('/:id', requireAuth, planController.deletePlan);

export default router;
