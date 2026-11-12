import { Router } from 'express';
import {
  getAllUsers,
  getMe,
  getUserById,
  updateMe,
  updateUser,
  toggleUserStatus,
  getMyFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/user.controller.js';
import { checkOwner } from '../middlewares/checkOwner.js';
import { verifyToken, verifyActiveUser, verifyAdmin } from '../middlewares/auth.middleware.js';
import { validateUuidParam } from '../middlewares/validateUuid.js';

const router = Router();

// Toàn bộ route người dùng yêu cầu đăng nhập và tài khoản đang hoạt động
router.use(verifyToken, verifyActiveUser);

// 1. Hồ sơ cá nhân
router.get('/me', getMe);
router.patch('/me', updateMe);

// 2. Danh mục yêu thích chuẩn RESTful (/users/me/favorites)
router.get('/me/favorites', getMyFavorites);
router.post('/me/favorites', addFavorite);
router.delete('/me/favorites/:placeId', removeFavorite);

// 3. Quản trị người dùng (Admin & Chi tiết)
router.get('/', verifyAdmin, getAllUsers);
router.get('/:userId', validateUuidParam('userId'), checkOwner, getUserById);
router.patch('/:userId', validateUuidParam('userId'), checkOwner, updateUser);
router.patch('/:userId/status', validateUuidParam('userId'), verifyAdmin, toggleUserStatus);

export default router;
