import { Request, Response, NextFunction } from 'express';
import { placeService } from '../services/place.service.js';

export class PlaceController {
  async getZones(_req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await placeService.getAllZones();
      return res.json({ success: true, data: zones });
    } catch (error) {
      next(error);
    }
  }

  async searchPlaces(req: Request, res: Response, next: NextFunction) {
    try {
      const city = (req.query.city as string) || 'Da Nang';
      const tags = req.query.tags ? (req.query.tags as string).split(',') : [];
      const places = await placeService.findCandidates(city, tags);
      return res.json({ success: true, data: places });
    } catch (error) {
      next(error);
    }
  }
}

export const placeController = new PlaceController();
