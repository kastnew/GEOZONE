import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import prisma from '../utils/prisma.js';
import { generateTokens, generateAccessToken } from '../utils/token.js';
import { ENV } from '../config/env.config.js';

// Dummy hash dùng để chống Timing Attack khi người dùng nhập sai email
const DUMMY_HASH = bcrypt.hashSync('dummy_password_for_timing_protection', 10);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc!' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ!' });
    }

    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Mật khẩu phải có độ dài từ ${MIN_PASSWORD_LENGTH} đến ${MAX_PASSWORD_LENGTH} ký tự!`,
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng!' });
    }

    const defaultName = name ? String(name).trim() : (normalizedEmail.includes('@') ? normalizedEmail.split('@')[0] : normalizedEmail);
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: defaultName,
        password_hash: passwordHash,
        role: 'USER',
        is_active: true,
        is_verified: false,
        verification_token: verificationToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar_url: true,
        is_active: true,
        created_at: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    // 1. Trích xuất cookie refreshToken cũ (nếu có)
    const oldRefreshToken = req.cookies?.refreshToken;

    // 2. Thu hồi token cũ (Silent Cleanup) để tránh orphaned tokens trong DB
    if (oldRefreshToken && typeof oldRefreshToken === 'string') {
      try {
        const oldTokenHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
        await prisma.refreshToken.updateMany({
          where: {
            token_hash: oldTokenHash,
            revoked: false,
          },
          data: {
            revoked: true,
          },
        });
      } catch (cleanupError) {
        // Dọn dẹp âm thầm (silent cleanup) - không ném lỗi làm gián đoạn luồng đăng nhập
        console.warn('Silent cleanup of old refresh token failed:', cleanupError.message);
      }
    }

    // 3. Xác thực thông tin đăng nhập mới (Validate New Credentials)
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || !EMAIL_REGEX.test(normalizedEmail) || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không hợp lệ!' });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Chống Timing Attack: dù user không tồn tại, vẫn chạy bcrypt.compare với DUMMY_HASH
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị vô hiệu hóa!' });
    }

    // 4. Tạo cặp Token mới (Generate New Tokens)
    const { accessToken, refreshToken } = generateTokens(user);

    // 5. Băm SHA-256 và lưu New Refresh Token vào Database (Save New Token)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 86400000), // 7 ngày
      },
    });

    // 6. Ghi đè HttpOnly Cookie và trả về phản hồi JSON (Return Response)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const rawName = user.name ? String(user.name).trim() : '';
    const cleanName = rawName || (user.email ? user.email.split('@')[0] : 'User');

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: cleanName,
        avatar_url: user.avatar_url,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc!' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại!' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị vô hiệu hóa!' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Mật khẩu mới phải có độ dài từ ${MIN_PASSWORD_LENGTH} đến ${MAX_PASSWORD_LENGTH} ký tự!`,
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Chạy transaction: cập nhật mật khẩu + thu hồi toàn bộ Refresh Token của user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password_hash: passwordHash },
      }),
      prisma.refreshToken.updateMany({
        where: { user_id: user.id, revoked: false },
        data: { revoked: true },
      }),
    ]);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: ENV.NODE_ENV === 'production',
    });

    return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const refreshTokenValue = req.cookies?.refreshToken;

    if (!refreshTokenValue) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy phiên đăng nhập trong Cookie!' });
    }

    const cookieOptions = {
      httpOnly: true,
      sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: ENV.NODE_ENV === 'production',
    };

    // 1. Kiểm tra chữ ký và thời hạn JWT
    try {
      jwt.verify(refreshTokenValue, ENV.REFRESH_TOKEN_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
        res.clearCookie('refreshToken', cookieOptions);
        return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ!' });
      }
      throw err;
    }

    // 2. Băm SHA-256 và đối chiếu DB
    const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
    const storedToken = await prisma.refreshToken.findFirst({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    // 3. Kiểm tra tính hợp lệ & cờ thu hồi
    if (!storedToken || storedToken.revoked) {
      res.clearCookie('refreshToken', cookieOptions);
      return res.status(403).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã bị thu hồi!' });
    }

    if (!storedToken.user || !storedToken.user.is_active) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
      res.clearCookie('refreshToken', cookieOptions);
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị vô hiệu hóa!' });
    }

    // 4. Cấp Access Token mới
    const newAccessToken = generateAccessToken(storedToken.user);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshTokenValue = req.cookies?.refreshToken;
    if (refreshTokenValue) {
      const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
      await prisma.refreshToken.deleteMany({
        where: { token_hash: tokenHash },
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: ENV.NODE_ENV === 'production',
    });

    return res.status(200).json({ success: true, message: 'Đăng xuất thành công!' });
  } catch (error) {
    next(error);
  }
};
