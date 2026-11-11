import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.config.js';

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, ENV.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (!err) {
        req.user = decoded;
      }
      next();
    });
  } else {
    next();
  }
};
