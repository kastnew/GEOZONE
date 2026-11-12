import { Router } from 'express';
import { planController } from '../controllers/plan.controller.js';
import { swapController } from '../controllers/swap.controller.js';
import { verifyToken, verifyActiveUser } from '../middlewares/auth.middleware.js';
import { validateUuidParam } from '../middlewares/validateUuid.js';

const router = Router();

// ==========================================
// RESTful Itineraries Management (/api/v1/plans)
// ==========================================

// POST /api/v1/plans - Tạo mới / Lưu lịch trình vào CSDL
router.post('/', verifyToken, verifyActiveUser, planController.savePlan);

// GET /api/v1/plans - Lấy danh sách lịch trình đã lưu của user hiện tại
router.get('/', verifyToken, verifyActiveUser, planController.getMyPlans);

// GET /api/v1/plans/:planId - Chi tiết một lịch trình đã lưu
router.get('/:planId', verifyToken, verifyActiveUser, validateUuidParam('planId'), planController.getPlanById);

// DELETE /api/v1/plans/:planId - Xóa lịch trình
router.delete('/:planId', verifyToken, verifyActiveUser, validateUuidParam('planId'), planController.deletePlan);

// ==========================================
// Backward Compatible Aliases
// ==========================================
router.post('/generate', planController.generateItinerary);
router.post('/swap', swapController.swapPlace);
router.post('/save', verifyToken, verifyActiveUser, planController.savePlan);
router.get('/my-plans', verifyToken, verifyActiveUser, planController.getMyPlans);

export default router;
