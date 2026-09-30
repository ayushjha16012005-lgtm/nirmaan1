import { Router, Request, Response, NextFunction } from 'express';
import { locationService } from '../../services/location.service.js';

export const locationRouter = Router();

locationRouter.get('/distance', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;
    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'originLat, originLng, destLat, destLng query params required' },
        requestId: req.headers['x-request-id'],
      });
    }

    const distanceKm = locationService.calculateDistance(
      { latitude: Number(originLat), longitude: Number(originLng) },
      { latitude: Number(destLat), longitude: Number(destLng) }
    );

    res.json({ success: true, data: { distanceKm }, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

locationRouter.get('/route', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;
    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'originLat, originLng, destLat, destLng query params required' },
        requestId: req.headers['x-request-id'],
      });
    }

    const route = await locationService.getRoute(
      { latitude: Number(originLat), longitude: Number(originLng) },
      { latitude: Number(destLat), longitude: Number(destLng) }
    );

    res.json({ success: true, data: route, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});
