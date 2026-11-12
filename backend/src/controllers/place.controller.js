import { placeService } from '../services/place.service.js';

export class PlaceController {
  async getZones(_req, res, next) {
    try {
      const zones = await placeService.getAllZones();
      return res.json({ success: true, data: zones });
    } catch (error) {
      next(error);
    }
  }

  async searchPlaces(req, res, next) {
    try {
      const city = req.query.city || 'Da Nang';
      const tags = req.query.tags ? req.query.tags.split(',') : [];
      const places = await placeService.findCandidates(city, tags);
      return res.json({ success: true, data: places });
    } catch (error) {
      next(error);
    }
  }

  async getPlaceById(req, res, next) {
    try {
      const place = await placeService.getPlaceById(req.params.placeId);
      if (!place) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm!' });
      }
      return res.json({ success: true, data: place });
    } catch (error) {
      next(error);
    }
  }
}

export const placeController = new PlaceController();
