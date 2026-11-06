import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { ENV } from '../config/env.config.js';

export class AuthController {
  /**
   * Đăng ký tài khoản người dùng mới
   */
  async register(req, res, next) {
    try {
      const { email, password, name, avatar } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: { message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên' }
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Định dạng email không hợp lệ' }
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: { message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự' }
        });
      }

      // Kiểm tra email đã tồn tại hay chưa
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email này đã được đăng ký trong hệ thống' }
        });
      }

      // Băm mật khẩu với bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Tạo avatar mặc định nếu không truyền
      const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

      // Lưu người dùng vào CSDL
      const newUser = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          avatar: defaultAvatar,
          role: 'USER'
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true
        }
      });

      // Tạo JWT token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: {
          user: newUser,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đăng nhập người dùng
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Vui lòng nhập email và mật khẩu' }
        });
      }

      // Tìm user theo email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Email hoặc mật khẩu không chính xác' }
        });
      }

      // So khớp mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: { message: 'Email hoặc mật khẩu không chính xác' }
        });
      }

      // Tạo JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN }
      );

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            createdAt: user.createdAt
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin người dùng hiện tại (profile)
   */
  async getMe(req, res, next) {
    try {
      return res.status(200).json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
