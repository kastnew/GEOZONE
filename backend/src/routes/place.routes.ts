import { Router } from 'express';
import { placeController } from '../controllers/place.controller.js';

const router = Router();

// Lấy danh sách các zones
router.get('/zones', placeController.getZones);

// Tìm kiếm danh sách địa điểm lọc theo city / tags
router.get('/search', placeController.searchPlaces);

export default router;
