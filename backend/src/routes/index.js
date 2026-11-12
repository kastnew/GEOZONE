import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import zoneRoutes from './zone.routes.js';
import placeRoutes from './place.routes.js';
import tagRoutes from './tag.routes.js';
import aiRoutes from './ai.routes.js';
import planRoutes from './plan.routes.js';

const apiRouter = Router();

// ==========================================
// RESTful Official API Endpoints (/api/v1)
// ==========================================
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/zones', zoneRoutes);
apiRouter.use('/places', placeRoutes);
apiRouter.use('/tags', tagRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/plans', planRoutes);

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'GeoZone AI Backend', timestamp: new Date().toISOString() });
});

export default apiRouter;
