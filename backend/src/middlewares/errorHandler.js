import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  logger.error(`[${req.method} ${req.originalUrl}] Exception:`, err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ (Internal Server Error)';

  // Ánh xạ lỗi Prisma sang mã HTTP và thông báo thân thiện chuẩn Velora
  if (err.code === 'P2002') {
    statusCode = 409;
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
    message = target
      ? `Dữ liệu '${target}' đã tồn tại trong hệ thống.`
      : 'Dữ liệu đã tồn tại trong hệ thống (trùng lặp giá trị duy nhất).';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Không tìm thấy dữ liệu yêu cầu hoặc bản ghi đã bị xóa.';
  } else if (
    err.code === 'P2023' ||
    (typeof err.message === 'string' && err.message.includes('invalid input syntax for type uuid'))
  ) {
    statusCode = 400;
    message = 'Định dạng ID không hợp lệ (yêu cầu UUID).';
  }

  const friendlyMessage = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Hệ thống đang gặp sự cố, vui lòng thử lại sau.'
    : message;

  return res.status(statusCode).json({
    success: false,
    message: friendlyMessage,
    error: {
      message: friendlyMessage,
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
}
