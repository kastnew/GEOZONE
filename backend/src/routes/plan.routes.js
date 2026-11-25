import { Router } from 'express';
import { planController } from '../controllers/plan.controller.js';
import { verifyToken, verifyActiveUser } from '../middlewares/auth.middleware.js';
import { checkOwner } from '../middlewares/checkOwner.js';
import { validateUuidParam } from '../middlewares/validateUuid.js';

const router = Router();

// ==========================================
// RESTful Itineraries Management (/api/v1/plans)
// ==========================================

// POST /api/v1/plans - Tạo mới / Lưu lịch trình vào CSDL
router.post('/', verifyToken, verifyActiveUser, planController.savePlan);

// GET /api/v1/plans - Lấy danh sách lịch trình đã lưu của user hiện tại
router.get('/', verifyToken, verifyActiveUser, planController.getMyPlans);

// GET /api/v1/plans/share/:shareToken - Xem lịch trình chia sẻ công khai (Không yêu cầu đăng nhập)
router.get('/share/:shareToken', planController.getPublicPlanByShareToken);

// ==========================================
// Specific Plan Operations (Protected with checkOwner)
// ==========================================
// GET /api/v1/plans/:planId - Chi tiết một lịch trình đã lưu
router.get('/:planId', verifyToken, verifyActiveUser, validateUuidParam('planId'), checkOwner, planController.getPlanById);

// PATCH /api/v1/plans/:planId - Cập nhật thông tin lịch trình (đổi tên, trạng thái, chia sẻ)
router.patch('/:planId', verifyToken, verifyActiveUser, validateUuidParam('planId'), checkOwner, planController.updatePlan);

// DELETE /api/v1/plans/:planId - Xóa lịch trình
router.delete('/:planId', verifyToken, verifyActiveUser, validateUuidParam('planId'), checkOwner, planController.deletePlan);

export default router;
