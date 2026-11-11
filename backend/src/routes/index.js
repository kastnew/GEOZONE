import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import placeRoutes from './place.routes.js';
import planRoutes from './plan.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/places', placeRoutes);
apiRouter.use('/plans', planRoutes);

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'GeoZone AI Backend', timestamp: new Date().toISOString() });
});

export default apiRouter;
