import { logger } from '../utils/logger.js';

export function errorHandler(err, _req, res, _next) {
  logger.error('Unhandled Exception Caught:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ (Internal Server Error)';

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
}
