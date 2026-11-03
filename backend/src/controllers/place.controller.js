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
}

export const placeController = new PlaceController();
