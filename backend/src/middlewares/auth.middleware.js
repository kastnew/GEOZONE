import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { ENV } from '../config/env.config.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không tìm thấy Token xác thực!' });
  }

  jwt.verify(token, ENV.ACCESS_TOKEN_SECRET, (err, decodedPayload) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
    req.user = decodedPayload;
    next();
  });
};

export const verifyActiveUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy thông tin xác thực!' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { is_active: true, role: true },
    });

    if (!user || !user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị vô hiệu hóa!' });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    next(error);
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user || String(req.user.role || '').toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài nguyên này!' });
  }
  next();
};
