import { Router } from 'express';
import { placeController } from '../controllers/place.controller.js';

const router = Router();

// GET /api/v1/places - Tìm kiếm và lọc danh sách địa điểm theo query params
router.get('/', placeController.searchPlaces);

// Backward compatible aliases
router.get('/search', placeController.searchPlaces);
router.get('/zones', placeController.getZones);

// GET /api/v1/places/:placeId - Chi tiết một địa điểm
router.get('/:placeId', placeController.getPlaceById);

export default router;
