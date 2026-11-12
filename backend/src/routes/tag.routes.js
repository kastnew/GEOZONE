import { Router } from 'express';
import { prisma } from '../config/database.js';

const router = Router();

// GET /api/v1/tags - Lấy toàn bộ danh mục tags sở thích
router.get('/', async (_req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { id: 'asc' },
    });
    return res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
