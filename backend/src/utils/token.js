import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { ENV } from '../config/env.config.js';

export const generateTokens = (user) => {
  const payload = {
    sub: user.id,
    role: String(user.role || 'USER').toUpperCase(),
  };

  const accessToken = jwt.sign(payload, ENV.ACCESS_TOKEN_SECRET, {
    expiresIn: ENV.ACCESS_TOKEN_EXPIRES_IN || '15m',
    jwtid: crypto.randomUUID(),
  });
  const refreshToken = jwt.sign(payload, ENV.REFRESH_TOKEN_SECRET, {
    expiresIn: ENV.REFRESH_TOKEN_EXPIRES_IN || '7d',
    jwtid: crypto.randomUUID(),
  });

  return { accessToken, refreshToken };
};

export const generateAccessToken = (user) => {
  const payload = {
    sub: user.id,
    role: String(user.role || 'USER').toUpperCase(),
  };

  return jwt.sign(payload, ENV.ACCESS_TOKEN_SECRET, {
    expiresIn: ENV.ACCESS_TOKEN_EXPIRES_IN || '15m',
    jwtid: crypto.randomUUID(),
  });
};
