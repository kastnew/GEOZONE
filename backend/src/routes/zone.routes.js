import { Router } from 'express';
import { placeController } from '../controllers/place.controller.js';

const router = Router();

// GET /api/v1/zones - Lấy danh sách toàn bộ phân vùng (Zones)
router.get('/', placeController.getZones);

export default router;
