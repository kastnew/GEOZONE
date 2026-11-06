import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Đăng ký tài khoản
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Lấy thông tin cá nhân hiện tại
router.get('/me', requireAuth, authController.getMe);

export default router;
