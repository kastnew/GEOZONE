import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, changePassword, refreshToken, logout } from '../controllers/auth.controller.js';
import { verifyToken, verifyActiveUser } from '../middlewares/auth.middleware.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Tối đa 30 requests trong 15 phút
  standardHeaders: true,
  message: { success: false, message: 'Quá nhiều yêu cầu xác thực từ IP này, vui lòng thử lại sau.' },
});

// Nâng limit lên 300 (theo khuyến nghị của báo cáo kiểm toán Velora) để không chặn nhầm người dùng chung IP
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300,
  standardHeaders: true,
  message: { success: false, message: 'Quá nhiều yêu cầu làm mới token từ IP này, vui lòng thử lại sau.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.patch('/change-password', authLimiter, verifyToken, verifyActiveUser, changePassword);
router.post('/refresh-token', refreshLimiter, refreshToken);
router.post('/logout', logout);

export default router;
