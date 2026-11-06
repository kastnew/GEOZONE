import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.config.js';
import { prisma } from '../config/database.js';

/**
 * Middleware bắt buộc phải đăng nhập (yêu cầu Bearer JWT token)
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'Vui lòng đăng nhập để thực hiện chức năng này' }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tài khoản không tồn tại hoặc đã bị khóa' }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' }
    });
  }
}

/**
 * Middleware tùy chọn: Nếu có token thì giải mã lấy thông tin user, không có thì bỏ qua
 */
export async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true, avatar: true }
      });
      if (user) req.user = user;
    } catch {
      // Bỏ qua nếu token không hợp lệ
    }
  }
  next();
}
